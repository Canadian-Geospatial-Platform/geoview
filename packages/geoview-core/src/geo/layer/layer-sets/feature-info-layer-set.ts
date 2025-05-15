import { Coordinate } from 'ol/coordinate';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { TypeFeatureInfoEntry, TypeFeatureInfoLayerConfig, TypeLayerEntryConfig, TypeResultSet } from '@/api/config/types/map-schema-types';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { EventType, AbstractLayerSet, PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { LayerApi } from '@/geo/layer/layer';
import {
  TypeFeatureInfoResultSet,
  TypeFeatureInfoResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';
import { logger } from '@/core/utils/logger';

/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user click a location on the map) with a store
 * for UI updates.
 * @class FeatureInfoLayerSet
 */
export class FeatureInfoLayerSet extends AbstractLayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeFeatureInfoResultSet */
  declare resultSet: TypeFeatureInfoResultSet;

  // Keep all callback delegate references
  #onQueryEndedHandlers: QueryEndedDelegate[] = [];

  // Keep all abort controllers per layer path
  #abortControllers: { [layerPath: string]: AbortController } = {};

  /**
   * The class constructor that instanciate a set of layer.
   * @param {LayerApi} layerApi - The layer Api to work with.
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);

    // Register a handler on the map click
    this.layerApi.mapViewer.onMapSingleClick((mapViewer, payload) => {
      // Query all layers which can be queried
      this.queryLayers(payload.lnglat).catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('queryLayers in onMapSingleClick in FeatureInfoLayerSet', error);
      });
    });
  }

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractBaseLayer} layer - The layer
   * @returns {boolean} True when the layer should be registered to this feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseLayer): boolean {
    // Return if the layer is of queryable type and source is queryable
    return super.onRegisterLayerCheck(layer) && AbstractLayerSet.isQueryableType(layer) && AbstractLayerSet.isSourceQueryable(layer);
  }

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractBaseLayer} layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // Update the resultSet data
    const layerPath = layer.getLayerPath();
    this.resultSet[layerPath].eventListenerEnabled = layer.getLayerConfig().initialSettings.states?.queryable ?? true;
    this.resultSet[layerPath].queryStatus = 'processed';
    this.resultSet[layerPath].features = [];
  }

  /**
   * Overrides the behavior to apply when propagating to the store
   * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate
   */
  protected override onPropagateToStore(resultSetEntry: TypeFeatureInfoResultSetEntry, type: PropagationType): void {
    // Redirect - Add layer to the list after registration
    this.#propagateToStore(resultSetEntry, type === 'layer-registration' ? 'name' : 'click');
  }

  /**
   * Propagates the resultSetEntry to the store
   * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate to the store
   * @private
   */
  #propagateToStore(resultSetEntry: TypeFeatureInfoResultSetEntry, eventType: EventType = 'click'): void {
    // Propagate
    FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.getMapId(), eventType, resultSetEntry).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('FeatureInfoEventProcessor.propagateToStore in FeatureInfoLayerSet', error);
    });
  }

  /**
   * Overrides the behavior to apply when deleting from the store
   * @param {string} layerPath - The layer path to delete from the store
   */
  protected override onDeleteFromStore(layerPath: string): void {
    // Remove it from feature info array (propagating to the store)
    FeatureInfoEventProcessor.deleteFeatureInfo(this.getMapId(), layerPath);
  }

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   * @param {Coordinate} longLatCoordinate - The longitude/latitude coordinate where to query the features
   * @returns {Promise<TypeFeatureInfoResultSet>} A promise which will hold the result of the query
   */
  async queryLayers(longLatCoordinate: Coordinate): Promise<TypeFeatureInfoResultSet> {
    // FIXME: Watch out for code reentrancy between queries!
    // FIX.MECONT: Consider using a LIFO pattern, per layer path, as the race condition resolution
    // GV Each query should be distinct as far as the resultSet goes! The 'reinitialization' below isn't sufficient.
    // GV As it is (and was like this before events refactor), the this.resultSet is mutating between async calls.

    // Prepare to hold all promises of features in the loop below
    const allPromises: Promise<TypeFeatureInfoEntry[] | undefined | null>[] = [];

    // Query and event types of what we're doing
    const queryType = 'at_long_lat';

    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet
    Object.keys(this.resultSet).forEach((layerPath) => {
      // If event listener is disabled
      if (!this.resultSet[layerPath].eventListenerEnabled) return;

      // Get the layer config and layer associated with the layer path
      const layer = this.layerApi.getGeoviewLayer(layerPath);

      // If layer was found
      if (layer && layer instanceof AbstractGVLayer) {
        // If state is not in visible range
        if (!AbstractLayerSet.isInVisibleRange(layer, this.layerApi.mapViewer.getView().getZoom())) return;

        // Flag processing
        this.resultSet[layerPath].features = undefined;
        this.resultSet[layerPath].queryStatus = 'processing';

        // Propagate to store
        this.#propagateToStore(this.resultSet[layerPath]);

        // If the layer path has an abort controller
        if (Object.keys(this.#abortControllers).includes(layerPath)) {
          // Abort it
          this.#abortControllers[layerPath].abort();
        }

        // Create an AbortController for the query
        this.#abortControllers[layerPath] = new AbortController();

        // Process query on results data
        const promiseResult = AbstractLayerSet.queryLayerFeatures(
          this.layerApi.mapViewer.map,
          layer,
          queryType,
          longLatCoordinate,
          true,
          this.#abortControllers[layerPath]
        );

        // Add the promise
        allPromises.push(promiseResult);

        // When the promise is done, propagate to store
        promiseResult
          .then((arrayOfRecords) => {
            // Use the response to align arrayOfRecords fields with layerConfig fields
            if (arrayOfRecords.length) {
              AbstractLayerSet.alignRecordsWithOutFields(
                this.layerApi.getLayerEntryConfig(layerPath) as TypeLayerEntryConfig,
                arrayOfRecords
              );
            }

            // Use the response to possibly patch the layer config metadata
            if (arrayOfRecords.length) this.#patchMissingMetadataIfNecessary(layerPath, arrayOfRecords[0]);

            // Filter out unsymbolized features if the showUnsymbolizedFeatures config is false
            if (!AppEventProcessor.getShowUnsymbolizedFeatures(this.getMapId())) {
              // eslint-disable-next-line no-param-reassign
              arrayOfRecords = arrayOfRecords.filter((record) => record.featureIcon);
            }

            // Keep the features retrieved
            this.resultSet[layerPath].features = arrayOfRecords;

            // Query was processed
            this.resultSet[layerPath].queryStatus = 'processed';
          })
          .catch((error: unknown) => {
            // If aborted
            if (error instanceof RequestAbortedError) {
              // Log
              logger.logDebug('Query aborted and replaced by another one.. keep spinning..');
            } else {
              // Error in the query
              this.resultSet[layerPath].queryStatus = 'error';

              // Log
              logger.logPromiseFailed('queryLayerFeatures in queryLayers in FeatureInfoLayerSet', error);
            }
          })
          .finally(() => {
            // Propagate to store
            this.#propagateToStore(this.resultSet[layerPath]);
          });
      } else {
        // Error
        this.resultSet[layerPath].features = null;
        this.resultSet[layerPath].queryStatus = 'error';

        // Propagate to store
        this.#propagateToStore(this.resultSet[layerPath]);
      }
    });

    // Await for the promises to settle
    await Promise.allSettled(allPromises);

    // Emit the query layers has ended
    this.#emitQueryEnded({ coordinate: longLatCoordinate, resultSet: this.resultSet, eventType: 'click' });

    // Return the results
    return this.resultSet;
  }

  /**
   * Apply status to item in results set reference by the layer path and propagate to store
   * @param {string} layerPath - The layer path
   * @param {boolean} isEnable - Status to apply
   * @private
   */
  #processListenerStatusChanged(layerPath: string, isEnable: boolean): void {
    // Edit the result set
    this.resultSet[layerPath].eventListenerEnabled = isEnable;
    this.resultSet[layerPath].features = [];

    // Propagate to store
    this.#propagateToStore(this.resultSet[layerPath], 'name');
  }

  /**
   * Function used to enable listening of click events. When a layer path is not provided,
   * click events listening is enabled for all layers
   * @param {string} layerPath - Optional parameter used to enable only one layer
   */
  enableClickListener(layerPath?: string): void {
    if (layerPath) this.#processListenerStatusChanged(layerPath, true);
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.#processListenerStatusChanged(key, true);
      });
  }

  /**
   * Function used to disable listening of click events. When a layer path is not provided,
   * click events listening is disable for all layers
   * @param {string} layerPath - Optional parameter used to disable only one layer
   */
  disableClickListener(layerPath?: string): void {
    if (layerPath) this.#processListenerStatusChanged(layerPath, false);
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.#processListenerStatusChanged(key, false);
      });
  }

  /**
   * Function used to determine whether click events are disabled for a layer. When a layer path is not provided,
   * the value returned is undefined if the map flags are a mixture of true and false values.
   * @param {string} layerPath - Optional parameter used to get the flag value of a layer.
   * @returns {boolean | undefined} The flag value for the map or layer.
   */
  isClickListenerEnabled(layerPath?: string): boolean | undefined {
    if (layerPath) return !!this.resultSet?.[layerPath]?.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultSet[key].eventListenerEnabled;
      if (returnValue !== this.resultSet[key].eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }

  /**
   * Updates outfields, aliases and data types from query result if not provided in metadata
   * @param {string} layerPath - Path of the layer to update.
   * @param {TypeFeatureInfoEntry} record - Feature info to parse.
   * @private
   */
  #patchMissingMetadataIfNecessary(layerPath: string, record: TypeFeatureInfoEntry): void {
    // Set up feature info for layers that did not include it in the metadata
    const layerEntryConfig = this.layerApi.getLayerEntryConfig(layerPath) as TypeLayerEntryConfig;

    if (!layerEntryConfig.source) layerEntryConfig.source = {};

    if (!layerEntryConfig.source.featureInfo) {
      layerEntryConfig.source.featureInfo = { queryable: true };
    }

    const sourceFeatureInfo = layerEntryConfig.source!.featureInfo as TypeFeatureInfoLayerConfig;
    if (!sourceFeatureInfo.outfields) {
      sourceFeatureInfo.outfields = [];

      Object.keys(record.fieldInfo).forEach((fieldName) => {
        const newOutfield = {
          name: fieldName,
          alias: record.fieldInfo[fieldName]?.alias || fieldName,
          type: record.fieldInfo[fieldName]?.dataType || 'string',
          domain: null,
        };

        sourceFeatureInfo.outfields!.push(newOutfield);
      });
    }

    if (!sourceFeatureInfo.nameField) sourceFeatureInfo.nameField = sourceFeatureInfo.outfields[0].name;
  }

  /**
   * Emits a query ended event to all handlers.
   * @param {QueryEndedEvent} event - The event to emit
   * @private
   */
  #emitQueryEnded(event: QueryEndedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onQueryEndedHandlers, event);
  }

  /**
   * Registers a query ended event handler.
   * @param {QueryEndedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onQueryEnded(callback: QueryEndedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onQueryEndedHandlers, callback);
  }

  /**
   * Unregisters a query ended event handler.
   * @param {QueryEndedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offQueryEnded(callback: QueryEndedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onQueryEndedHandlers, callback);
  }
}

/**
 * Define a delegate for the event handler function signature
 */
type QueryEndedDelegate = EventDelegateBase<FeatureInfoLayerSet, QueryEndedEvent, void>;

/**
 * Define an event for the delegate
 */
export type QueryEndedEvent = {
  coordinate: Coordinate;
  resultSet: TypeResultSet;
  eventType: EventType;
};
