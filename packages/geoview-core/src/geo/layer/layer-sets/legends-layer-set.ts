import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import { TypeLayerStatus } from '@/api/config/types/map-schema-types';
import { AbstractLayerSet, PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { TypeLegend, TypeLegendResultSet, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { AbstractGVLayer, LayerStyleChangedEvent } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';
import { GVEsriFeature } from '@/geo/layer/gv-layers/vector/gv-esri-feature';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { LayerApi } from '@/geo/layer/layer';

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
  #boundHandleLayerStyleChanged: (layer: AbstractGVLayer, layerStyleEvent: LayerStyleChangedEvent) => void;

  /**
   * Constructs a Legends LayerSet to manage layers legends.
   * @param {LayerApi} layerApi - The layer api
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);
    this.#boundHandleLayerStyleChanged = this.#handleLayerStyleChanged.bind(this);
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

    // Check if ready to query legend
    this.#checkQueryLegend(layerConfig.layerPath, false);
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
      // Register handler on layer style change
      layer.onLayerStyleChanged(this.#boundHandleLayerStyleChanged);
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
    this.#checkQueryLegend(layerConfig.layerPath, false);
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
   * Propagates the resultSetEntry to the store
   * @param {TypeFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate to the store
   * @private
   */
  #propagateToStore(resultSetEntry: TypeLegendResultSetEntry): void {
    // Propagate
    LegendEventProcessor.propagateLegendToStore(this.getMapId(), resultSetEntry);
  }

  /**
   * Overrides the behavior to apply when deleting from the store
   * @param {string} layerPath - The layer path to delete form the store
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onDeleteFromStore(layerPath: string): void {
    // Delete from store
    LegendEventProcessor.deleteLayerFromLegendLayers(this.getMapId(), layerPath);
  }

  /**
   * Checks if the layer config has reached the 'processed' status or greater and if so queries the legend.
   * @param {string} layerPath - The layer path
   * @param {boolean} forced - Indicates if the legend query should be forced to happen (example when refreshing the legend)
   */
  #checkQueryLegend(layerPath: string, forced: boolean): void {
    // Get the layer
    const layer = this.layerApi.getGeoviewLayer(layerPath);
    const layerConfig = layer?.getLayerConfig();

    // If the layer legend should be queried (and not already querying).
    // GV Gotta make sure that we're not already querying, because EsriImage layers, for example, adjust the
    // GV style on the fly when querying legend. So, be careful not to loop!
    const styleLoopingLayerTypes = [GVEsriDynamic, GVEsriFeature, GVEsriImage];
    if (styleLoopingLayerTypes.some((type) => layer instanceof type) && this.resultSet[layerPath].legendQueryStatus === 'querying') {
      return;
    }

    if (layer && layerConfig && layer instanceof AbstractGVLayer && (this.#legendShouldBeQueried(layerConfig) || forced)) {
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
        .catch((error) => {
          // Log
          logger.logPromiseFailed('legendPromise in #checkQueryLegend in LegendsLayerSet', error);
        });
    }
  }

  /**
   * Checks if the legend should be queried as part of the regular layer status progression and legend fetching
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  #legendShouldBeQueried(layerConfig: ConfigBaseClass): boolean {
    // A legend is ready to be queried if its status is > processed and legendQueryStatus is 'init' (not already queried)
    return !!layerConfig?.isGreaterThanOrEqualTo('processed') && this.resultSet[layerConfig.layerPath].legendQueryStatus === 'init';
  }

  /**
   * Handles when a layer style changes on a registered layer
   * @param {AbstractGVLayer} layer - The layer which changed its styles
   * @param {LayerStyleChangedEvent} event - The layer style changed event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleLayerStyleChanged(layer: AbstractGVLayer, event: LayerStyleChangedEvent): void {
    // Force query the legend as we have a new style
    this.#checkQueryLegend(layer.getLayerPath(), true);
  }
}
