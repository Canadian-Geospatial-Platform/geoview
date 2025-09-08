import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import { TypeLayerStatus } from '@/api/config/types/layer-schema-types';
import { AbstractLayerSet, PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { TypeLegend, TypeLegendResultSet, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractGVLayer, StyleChangedDelegate, StyleChangedEvent } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractGVVector, StyleAppliedDelegate, StyleAppliedEvent } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GVEsriFeature } from '@/geo/layer/gv-layers/vector/gv-esri-feature';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { LayerApi } from '@/geo/layer/layer';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';

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
  #boundedHandleLayerStyleChanged: StyleChangedDelegate;

  // Keep a bounded reference to the handle layer style applied
  #boundedHandleLayerStyleApplied: StyleAppliedDelegate;

  /**
   * Constructs a Legends LayerSet to manage layers legends.
   * @param {LayerApi} layerApi - The layer api
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);
    this.#boundedHandleLayerStyleChanged = this.#handleLayerStyleChanged.bind(this);
    this.#boundedHandleLayerStyleApplied = this.#handleStyleApplied.bind(this);
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @returns {boolean} True when the layer should be registered to this legends-layer-set
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onRegisterLayerConfigCheck(layerConfig: ConfigBaseClass): boolean {
    // Always register layer configs for the legends-layer-set, because we want 'the box' in the UI to show the layer status progression
    return true;
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractBaseLayer} layer - The layer
   * @param {string} layerPath - The layer path
   * @returns {boolean} True when the layer should be registered to this legends-layer-set
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onRegisterLayerCheck(layer: AbstractBaseLayer): boolean {
    // Always register layers for the legends-layer-set, because we want 'the box' in the UI to show the layer status progression
    return true;
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  protected override onRegisterLayerConfig(layerConfig: ConfigBaseClass): void {
    // Call parent
    super.onRegisterLayerConfig(layerConfig);

    // Keep track if the legend has been queried
    this.resultSet[layerConfig.layerPath].legendQueryStatus = 'init';
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
   * @param {AbstractBaseLayer} layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseLayer): void {
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
   * Overrides the behavior to apply when a layer status changed for a legends-layer-set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {TypeLayerStatus} layerStatus - The new layer status
   */
  protected override onProcessLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void {
    // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
    super.onProcessLayerStatusChanged(layerConfig, layerStatus);

    // Check if ready to query legend
    this.#checkQueryLegend(layerConfig, false);
  }

  /**
   * Overrides the behavior to apply when propagating to the store
   * @param {TypeLegendResultSetEntry} resultSetEntry - The result set entry to propagate
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onPropagateToStore(resultSetEntry: TypeLegendResultSetEntry, type: PropagationType): void {
    // Redirect
    this.#propagateToStore(resultSetEntry);
  }

  /**
   * Overrides the behavior to apply when deleting from the store
   * @param {string} layerPath - The layer path to delete form the store
   */
  protected override onDeleteFromStore(layerPath: string): void {
    // Delete from store
    LegendEventProcessor.deleteLayerFromLegendLayers(this.getMapId(), layerPath);
  }

  /**
   * Checks if the layer config has reached the 'processed' status or greater and if so queries the legend.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {boolean} forced - Indicates if the legend query should be forced to happen (example when refreshing the legend)
   */
  #checkQueryLegend(layerConfig: ConfigBaseClass, forced: boolean): void {
    // Get the layer path
    const { layerPath } = layerConfig;

    // Get the layer, skip when not found
    const layer = this.layerApi.getGeoviewLayer(layerPath);
    if (!layer) return; // Skip when no layer found
    // TODO: Check - Is this check necessary or are we always supposed to have a layer

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
      this.resultSet[layerPath].legendQueryStatus = 'querying';

      // Propagate to the store about the querying happening
      this.#propagateToStore(this.resultSet[layerPath]);

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
            this.resultSet[layerPath].data = legend;

            // Propagate to the store once the legend is received
            this.#propagateToStore(this.resultSet[layerPath]);

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
   * @private
   */
  #propagateToStore(resultSetEntry: TypeLegendResultSetEntry): void {
    // Propagate
    LegendEventProcessor.propagateLegendToStore(this.getMapId(), resultSetEntry);
  }

  /**
   * Checks if the legend should be queried as part of the regular layer status progression and legend fetching.
   * Also performs a Type guard on the 'layer' parameter that must be AbstractGVLayer.
   * @param {AbstractBaseLayer} layer - The layer
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {boolean} forced - Flag to force a query to happen, even if the legendQueryStatus isn't 'init' or style isn't applied.
   */
  #legendShouldBeQueried(layer: AbstractBaseLayer, layerConfig: ConfigBaseClass, forced: boolean): layer is AbstractGVLayer {
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
            shouldQueryLegend = !layerConfig.initialSettings?.states?.visible || layer.styleApplied;
          }
        }
      }
    }

    // Return if legend should be queried
    return shouldQueryLegend;
  }

  /**
   * Handles when a layer style changes on a registered layer
   * @param {AbstractGVLayer} layer - The layer which changed its styles
   * @param {StyleChangedEvent} event - The layer style changed event
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
   */
  #handleStyleApplied(layer: AbstractGVVector, event: StyleAppliedEvent): void {
    // If the style has been applied
    if (event.styleApplied) {
      // Force query the legend as we have a new style
      this.#checkQueryLegend(layer.getLayerConfig(), true);
    }
  }
}
