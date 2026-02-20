import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import type {
  ConfigBaseClass,
  LayerStatusChangedDelegate,
  LayerStatusChangedEvent,
} from '@/api/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import type { TypeLayerStatus } from '@/api/types/layer-schema-types';
import type { PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type {
  TypeLegend,
  TypeLegendResultSet,
  TypeLegendResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { StyleChangedDelegate, StyleChangedEvent } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { StyleAppliedDelegate, StyleAppliedEvent } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GVEsriFeature } from '@/geo/layer/gv-layers/vector/gv-esri-feature';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import type { LayerApi } from '@/geo/layer/layer';
import { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';

/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the layers are going through the layer statuses and legend querying) with a store
 * for UI updates.
 * @class LegendsLayerSet
 */
export class LegendsLayerSet extends AbstractLayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeLegendResultSet */
  declare resultSet: TypeLegendResultSet;

  // Keep a bounded reference to the handle layer status changed
  #boundedHandleLayerStatusChanged: LayerStatusChangedDelegate;

  // Keep a bounded reference to the handle layer status changed
  #boundedHandleLayerStyleChanged: StyleChangedDelegate;

  // Keep a bounded reference to the handle layer style applied
  #boundedHandleLayerStyleApplied: StyleAppliedDelegate;

  /**
   * Constructs a Legends LayerSet to manage layers legends.
   * @param {LayerApi} layerApi - The layer api
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);
    this.#boundedHandleLayerStatusChanged = this.#handleLayerStatusChanged.bind(this);
    this.#boundedHandleLayerStyleChanged = this.#handleLayerStyleChanged.bind(this);
    this.#boundedHandleLayerStyleApplied = this.#handleStyleApplied.bind(this);
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param layerConfig - The layer config
   * @returns True when the layer should be registered to this legends-layer-set
   */
  protected override onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean {
    // Always register layer configs for the legends-layer-set, because we want 'the box' in the UI to show
    // the layer status progression, unless it's a basemap layer.
    return layerConfig.getGeoviewLayerConfig().useAsBasemap !== true;
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param layer - The layer
   * @returns True when the layer should be registered to this legends-layer-set
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
    // Always register layers for the legends-layer-set, because we want 'the box' in the UI to show
    // the layer status progression, unless it's a basemap layer.
    return layer.getLayerConfig().getGeoviewLayerConfig().useAsBasemap !== true;
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @returns {void}
   * @override
   * @protected
   */
  protected override onRegisterLayerConfig(layerConfig: ConfigBaseClass): void {
    // Call parent
    super.onRegisterLayerConfig(layerConfig);

    // Register the layer status changed handler
    layerConfig.onLayerStatusChanged(this.#boundedHandleLayerStatusChanged);

    // Keep track if the legend has been init
    this.resultSet[layerConfig.layerPath].legendQueryStatus = 'init';
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to unregister a layer in its set.
   * @param {ConfigBaseClass | undefined} layerConfig - The layer config
   * @returns {void}
   * @protected
   */
  protected override onUnregisterLayerConfig(layerConfig: ConfigBaseClass | undefined): void {
    // Unregister the layer status changed handler
    layerConfig?.offLayerStatusChanged(this.#boundedHandleLayerStatusChanged);
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
   * @param {AbstractBaseGVLayer} layer - The layer
   * @returns {void}
   * @override
   * @protected
   */
  protected override onRegisterLayer(layer: AbstractBaseGVLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // If regular layer
    if (layer instanceof AbstractGVLayer) {
      // If Vector layer
      if (layer instanceof AbstractGVVector) {
        // Register handler when the style has been applied
        layer.onStyleApplied(this.#boundedHandleLayerStyleApplied);
      }

      // Register handler on layer style change
      layer.onLayerStyleChanged(this.#boundedHandleLayerStyleChanged);
    }
  }

  /**
   * Processes action when the layer status changes.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {TypeLayerStatus} layerStatus - The new layer status
   * @returns {void}
   * @override
   * @protected
   */
  protected processLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void {
    // Change the layer status!
    this.resultSet[layerConfig.layerPath].layerStatus = layerStatus;

    // Check if ready to query legend
    this.#checkQueryLegend(layerConfig, false);
  }

  /**
   * Overrides the behavior to apply when propagating to the store
   * @param {TypeLegendResultSetEntry} resultSetEntry - The result set entry to propagate
   * @param {PropagationType} type - The propagation type
   * @returns {void}
   * @override
   * @protected
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onPropagateToStore(resultSetEntry: TypeLegendResultSetEntry, type: PropagationType): void {
    // Redirect - Add layer to the list after registration
    this.#propagateToStore(resultSetEntry);
  }

  /**
   * Overrides the behavior to apply when deleting from the store
   * @param {string} layerPath - The layer path to delete form the store
   * @returns {void}
   * @override
   * @protected
   */
  protected override onDeleteFromStore(layerPath: string): void {
    // Delete from store
    LegendEventProcessor.deleteLayerFromLegendLayers(this.getMapId(), layerPath);
  }

  /**
   * Queries the legend for the given layer path.
   * @param {string} layerPath - The layer path to query the legend for
   * @param {boolean} [forced=false] - Whether to force the query even if already queried
   * @returns {void}
   */
  queryLegend(layerPath: string, forced: boolean = false): void {
    // Get the layer config
    const layerConfig = this.layerApi.getLayerEntryConfigIfExists(layerPath);
    if (!layerConfig) return;

    // Trigger the check/query process
    this.#checkQueryLegend(layerConfig, forced);
  }

  /**
   * Checks if the layer config has reached the 'processed' status or greater and if so queries the legend.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {boolean} forced - Indicates if the legend query should be forced to happen (example when refreshing the legend)
   * @private
   */
  #checkQueryLegend(layerConfig: ConfigBaseClass, forced: boolean): void {
    // Get the layer path
    const { layerPath } = layerConfig;

    // Get the layer, skip when not found
    const layer = this.layerApi.getGeoviewLayerIfExists(layerPath);
    if (!layer) return; // Skip when no layer found

    // If the layer legend should be queried (and not already querying).
    // GV Gotta make sure that we're not already querying, because EsriImage layers, for example, adjust the
    // GV style on the fly when querying legend. So, be careful not to loop!
    const styleLoopingLayerTypes = [GVEsriDynamic, GVEsriFeature, GVEsriImage];
    if (styleLoopingLayerTypes.some((type) => layer instanceof type) && this.resultSet[layerPath].legendQueryStatus === 'querying') {
      return;
    }

    // If the legend should be queried
    if (this.#legendShouldBeQueried(layer, layerConfig, forced)) {
      // Flag
      this.resultSet[layerPath].data = undefined;
      this.resultSet[layerPath].legendQueryStatus = 'querying';

      // Propagate to the store about the querying happening
      this.#propagateToStoreLegendQueryStatus(layerPath, this.resultSet[layerPath]);

      // Query the legend
      const legendPromise = layer.queryLegend();

      // Whenever the legend response comes in
      legendPromise
        ?.then((legend: TypeLegend | null | undefined) => {
          // If legend received
          if (legend) {
            // Check for possible number of icons and set icon cache size
            this.layerApi.mapViewer.updateIconImageCache(legend);

            // Flag
            this.resultSet[layerPath].legendQueryStatus = 'queried';

            // Query completed, keep it
            this.resultSet[layerPath].data = legend ?? undefined;

            // Propagate to the store once the legend is received
            this.#propagateToStoreLegendQueryStatus(layerPath, this.resultSet[layerPath]);

            // Inform that the layer set has been updated by calling parent to emit event
            this.onLayerSetUpdatedProcess(layerPath);
          }
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('legendPromise in #checkQueryLegend in LegendsLayerSet', error);
        });
    }
  }

  /**
   * Propagates the resultSetEntry to the store
   * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate to the store
   */
  #propagateToStore(resultSetEntry: TypeLegendResultSetEntry): void {
    // Propagate
    LegendEventProcessor.propagateLegendToStore(this.getMapId(), resultSetEntry);
  }

  /**
   * Propagates the legend query status to the store
   */
  #propagateToStoreLegendQueryStatus(layerPath: string, resultSetEntry: TypeLegendResultSetEntry): void {
    // Propagate
    LegendEventProcessor.setLegendQueryStatusInStore(this.getMapId(), layerPath, resultSetEntry.legendQueryStatus, resultSetEntry.data);
  }

  /**
   * Checks if the legend should be queried as part of the regular layer status progression and legend fetching.
   * Also performs a Type guard on the 'layer' parameter that must be AbstractGVLayer.
   * @param {AbstractBaseGVLayer} layer - The layer
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {boolean} forced - Flag to force a query to happen, even if the legendQueryStatus isn't 'init' or style isn't applied.
   * @private
   */
  #legendShouldBeQueried(layer: AbstractBaseGVLayer, layerConfig: ConfigBaseClass, forced: boolean): layer is AbstractGVLayer {
    // A legend is ready to be queried if its status is > processed
    let shouldQueryLegend = layer instanceof AbstractGVLayer && !!layerConfig?.isGreaterThanOrEqualTo('processed');

    // If should query thus far
    if (shouldQueryLegend) {
      // If forced
      if (forced) return true;

      // If legend never queried so far
      shouldQueryLegend = this.resultSet[layerConfig.layerPath].legendQueryStatus === 'init';

      // If should query thus far
      if (shouldQueryLegend) {
        // If an AbstractGVVector
        if (layer instanceof AbstractGVVector && layerConfig instanceof VectorLayerEntryConfig) {
          // If there's no determined layer style in the layer config
          if (!layerConfig.getLayerStyle()) {
            // If the layer visible state is invisible upon load or the style has been applied, we should query legend
            shouldQueryLegend = !layerConfig.getInitialSettings()?.states?.visible || layer.styleApplied;
          }
        }
      }
    }

    // Return if legend should be queried
    return shouldQueryLegend;
  }

  /**
   * Handles when a layer status changed on a layer config.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {LayerStatusChangedEvent} layerStatusEvent - The new layer status
   */
  #handleLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatusEvent: LayerStatusChangedEvent): void {
    try {
      // Call the overridable function to process a layer status is changing
      this.processLayerStatusChanged(layerConfig, layerStatusEvent.layerStatus);

      // If still existing (it's possible a layer set might want to unregister a layer config depending on its status, so we check)
      if (this.resultSet[layerConfig.layerPath]) {
        // Propagate the status to the store so that the UI gets updated
        this.#propagateToStore(this.resultSet[layerConfig.layerPath]);
      }

      // Emit the layer set updated changed event
      this.onLayerSetUpdatedProcess(layerConfig.layerPath);
    } catch (error: unknown) {
      // Log
      logger.logError('CAUGHT in handleLayerStatusChanged', layerConfig.layerPath, error);
    }
  }

  /**
   * Handles when a layer style changes on a registered layer
   * @param {AbstractGVLayer} layer - The layer which changed its styles
   * @param {StyleChangedEvent} event - The layer style changed event
   * @private
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleLayerStyleChanged(layer: AbstractGVLayer, event: StyleChangedEvent): void {
    // Force query the legend as we have a new style
    this.#checkQueryLegend(layer.getLayerConfig(), true);
  }

  /**
   * Handles when a layer style has been applied on a registered AbstractGVVector layer
   * @param {AbstractGVVector} layer - The layer which got its style applied
   * @param {StyleAppliedEvent} event - The StyleAppliedEvent
   * @private
   */
  #handleStyleApplied(layer: AbstractGVVector, event: StyleAppliedEvent): void {
    // If the style has been applied
    if (event.styleApplied) {
      // Force query the legend as we have a new style
      this.#checkQueryLegend(layer.getLayerConfig(), true);
    }
  }
}
