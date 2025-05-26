import { Coordinate } from 'ol/coordinate';
import { logger } from '@/core/utils/logger';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { AbstractLayerSet, PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { LayerApi } from '@/geo/layer/layer';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeHoverResultSet, TypeHoverResultSetEntry } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';

/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user hovers on the map) with a store
 * for UI updates.
 * @class HoverFeatureInfoLayerSet
 */
export class HoverFeatureInfoLayerSet extends AbstractLayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeHoverFeatureInfoResultSet */
  declare resultSet: TypeHoverResultSet;

  // Keep all abort controllers per layer path
  #abortControllers: { [layerPath: string]: AbortController } = {};

  /**
   * The class constructor that instanciate a set of layer.
   * @param {LayerApi} layerApi - The layer Api to work with.
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);

    // Register a handler when the map pointer moves
    layerApi.mapViewer.onMapPointerMove(() => {
      // This will execute immediately on every pointer move to clear the HoverFeatureInfo
      MapEventProcessor.setMapHoverFeatureInfo(this.getMapId(), null);
    });

    // Register a handler when the map pointer stops
    layerApi.mapViewer.onMapPointerStop((mapViewer, payload) => {
      // Query
      this.queryLayers(payload.pixel);
    });
  }

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractBaseLayer} layer - The layer
   * @returns {boolean} True when the layer should be registered to this hover-feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseLayer): boolean {
    // Return if the layer is of queryable type and source is queryable
    return (
      super.onRegisterLayerCheck(layer) &&
      AbstractLayerSet.isQueryableType(layer) &&
      !(layer instanceof GVWMS) &&
      AbstractLayerSet.isSourceQueryable(layer)
    );
  }

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractBaseLayer} layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // Update the resultSet data
    const layerPath = layer.getLayerPath();
    this.resultSet[layerPath].eventListenerEnabled = layer.getLayerConfig().initialSettings.states?.hoverable ?? true;
    this.resultSet[layerPath].queryStatus = 'processed';
    this.resultSet[layerPath].feature = undefined;
  }

  /**
   * Overrides the behavior to apply when propagating to the store
   * @param {TypeHoverResultSetEntry} resultSetEntry - The result set entry to propagate to the store
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onPropagateToStore(resultSetEntry: TypeHoverResultSetEntry, type: PropagationType): void {
    // Nothing to do here, hover's store only needs updating when a query happens
  }

  /**
   * Overrides the behavior to apply when deleting from the store
   * @param {string} layerPath - The layer path to delete from the store
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onDeleteFromStore(layerPath: string): void {
    // Nothing to do here, hover's store only needs updating when a query happens
  }

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   * @param {Coordinate} pixelCoordinate - The pixel coordinate where to query the features
   */
  queryLayers(pixelCoordinate: Coordinate): void {
    // FIXME: Watch out for code reentrancy between queries!
    // Query types of what we're doing
    const queryType = 'at_pixel';

    // Get the layer visible in order and filter orderedLayerPaths to only include paths that exist in resultSet
    const orderedLayerPaths = this.#getOrderedLayerPaths();
    const layersToQuery = orderedLayerPaths.filter((path) => path in this.resultSet);

    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet were there is a layer to query
    layersToQuery.forEach((layerPath) => {
      // If event listener is disabled
      if (!this.resultSet[layerPath].eventListenerEnabled) return;

      // Get the layer config and layer associated with the layer path
      const layer = this.layerApi.getGeoviewLayer(layerPath);

      // Flag processing
      this.resultSet[layerPath].feature = undefined;
      this.resultSet[layerPath].queryStatus = 'error';

      // If layer was found
      if (layer && layer instanceof AbstractGVLayer) {
        // Flag processing
        this.resultSet[layerPath].queryStatus = 'init';

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
          pixelCoordinate,
          false,
          this.#abortControllers[layerPath]
        );

        // When the promise is done, propagate to store
        promiseResult
          .then((arrayOfRecords) => {
            if (arrayOfRecords.length) {
              const nameField = arrayOfRecords![0].nameField || (Object.entries(arrayOfRecords![0].fieldInfo)[0] as unknown as string);
              const fieldInfo = arrayOfRecords![0].fieldInfo[nameField as string];

              this.resultSet[layerPath].feature = {
                featureIcon: arrayOfRecords![0].featureIcon,
                fieldInfo,
                geoviewLayerType: arrayOfRecords![0].geoviewLayerType,
                nameField,
              };
              this.resultSet[layerPath].queryStatus = 'processed';
            } else {
              this.resultSet[layerPath].feature = undefined;
            }

            // Check if this layer should update the store
            const shouldUpdate = orderedLayerPaths.slice(0, orderedLayerPaths.indexOf(layerPath)).every((higherLayerPath) => {
              const higherLayer = this.resultSet[higherLayerPath];
              // Allow update if higher layer:
              // - hasn't been processed yet (will overwrite later if needed)
              // - OR is processed but has no feature
              return (
                higherLayer.queryStatus === 'init' ||
                (higherLayer.queryStatus === 'processed' && !higherLayer.feature) ||
                higherLayer.queryStatus === 'error'
              );
            });

            // If it should update and there is a feature to propagate
            if (shouldUpdate && this.resultSet[layerPath].queryStatus === 'processed' && this.resultSet[layerPath].feature) {
              MapEventProcessor.setMapHoverFeatureInfo(this.getMapId(), this.resultSet[layerPath].feature);
            }
          })
          .catch((error: unknown) => {
            // If aborted
            if (error instanceof RequestAbortedError) {
              // Log
              logger.logDebug('Query aborted and replaced by another one.. keep spinning..');
            } else {
              // If there's a resultSet for the layer path
              if (this.resultSet[layerPath]) {
                // Error
                this.resultSet[layerPath].queryStatus = 'error';
                this.resultSet[layerPath].feature = undefined;
              }

              // Log
              logger.logPromiseFailed('queryLayerFeatures in queryLayers in hoverFeatureInfoLayerSet', error);
            }
          });
      }
    });
  }

  /**
   * Function used to enable listening of hover events. When a layer path is not provided,
   * hover events listening is enabled for all layers.
   * @param {string} layerPath - Optional parameter used to enable only one layer
   */
  enableHoverListener(layerPath?: string): void {
    if (layerPath) this.resultSet[layerPath].eventListenerEnabled = true;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of hover events. When a layer path is not provided,
   * hover events listening is disable for all layers.
   * @param {string} layerPath - Optional parameter used to disable only one layer
   */
  disableHoverListener(layerPath?: string): void {
    if (layerPath) this.resultSet[layerPath].eventListenerEnabled = false;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].eventListenerEnabled = false;
      });
  }

  /**
   * Function used to determine whether hover events are disabled for a layer. When a layer path is not provided,
   * the value returned is undefined if the map flags are a mixture of true and false values.
   * @param {string} layerPath - Optional parameter used to get the flag value of a layer.
   * @returns {boolean | undefined} The flag value for the map or layer.
   */
  isHoverListenerEnabled(layerPath?: string): boolean | undefined {
    if (layerPath) return !!this.resultSet?.[layerPath]?.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultSet[key].eventListenerEnabled;
      if (returnValue !== this.resultSet[key].eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }

  /**
   * Get the ordered layer paths to query
   * @returns {string[]} The ordered layer paths to query
   */
  #getOrderedLayerPaths(): string[] {
    // Get the map layer order
    const mapLayerOrder = this.layerApi.mapViewer.getMapLayerOrderInfo().filter((layer) => layer.inVisibleRange);
    const resultSetLayers = new Set(Object.keys(this.resultSet));

    // Filter and order the layers that are in our resultSet
    return mapLayerOrder
      .map((layer) => layer.layerPath)
      .filter((layerPath) => resultSetLayers.has(layerPath) && this.resultSet[layerPath].eventListenerEnabled);
  }
}
