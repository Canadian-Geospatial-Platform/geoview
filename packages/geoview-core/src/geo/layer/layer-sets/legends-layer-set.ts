import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import { TypeLayerStatus, layerEntryIsGroupLayer } from '@/geo/map/map-schema-types';
import { AbstractLayerSet } from './abstract-layer-set';
import { TypeLegend, TypeLegendResultSet, TypeLegendResultSetEntry } from '@/core/stores/store-interface-and-intial-values/layer-state';

/**
 * A class to hold a set of layers associated with an array of TypeLegendResultSetEntry. When this class is instantiated, all layers already
 * loaded on the specified map will be added to the set. Layers added afterwards will be added to the set and deleted layers
 * will be removed from the set.
 *
 * @class LegendsLayerSet
 */
export class LegendsLayerSet extends AbstractLayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeLegendResultSet */
  declare resultSet: TypeLegendResultSet;

  /**
   * Propagate to store
   * @param {TypeLegendResultSetEntry} resultSetEntry - The result entry to propagate
   * @private
   */
  #propagateToStore(resultSetEntry: TypeLegendResultSetEntry): void {
    LegendEventProcessor.propagateLegendToStore(this.getMapId(), resultSetEntry);
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  protected override onRegisterLayer(layerConfig: ConfigBaseClass): void {
    // Log
    logger.logTraceCore('LEGENDS-LAYER-SET - onRegisterLayer', layerConfig.layerPath);

    // Call parent
    super.onRegisterLayer(layerConfig);

    // Keep track if the legend has been queried
    this.resultSet[layerConfig.layerPath].legendQueryStatus = 'init';

    // Check if ready to query legend
    this.#checkQueryLegend(layerConfig);

    // Propagate to the store on registration
    this.#propagateToStore(this.resultSet[layerConfig.layerPath]);
  }

  /**
   * Overrides the behavior to apply when unregistering a layer from the feature-info-layer-set.
   * @param {TypeLayerEntryConfig} layerConfig - The layer config
   */
  protected override onUnregisterLayer(layerConfig: ConfigBaseClass): void {
    // Log
    logger.logTraceCore('LEGENDS-LAYER-SET - onUnregisterLayer', layerConfig.layerPath, Object.keys(this.resultSet));

    // Call parent
    super.onUnregisterLayer(layerConfig);

    // Delete from store
    LegendEventProcessor.deleteLayerFromLegendLayers(this.getMapId(), layerConfig.layerPath);
  }

  /**
   * Registers or Unregisters the layer in the layer-set, making sure the layer-set is aware of the layer.
   * @param {TypeLayerEntryConfig} layerConfig - The layer config
   * @param {'add' | 'remove'} action - The action to perform: 'add' to register or 'remove' to unregister
   */
  override registerOrUnregisterLayer(layerConfig: ConfigBaseClass, action: 'add' | 'remove'): void {
    // Group layers do not have an entry in this layer set, but need to be removed from legend layers
    if (action === 'remove' && layerEntryIsGroupLayer(layerConfig)) {
      // Delete from store
      LegendEventProcessor.deleteLayerFromLegendLayers(this.getMapId(), layerConfig.layerPath);
    }
    super.registerOrUnregisterLayer(layerConfig, action);
  }

  /**
   * Overrides the behavior to apply when a layer status changed for a legends-layer-set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {string} layerStatus - The new layer status
   */
  protected override onProcessLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void {
    // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
    super.onProcessLayerStatusChanged(layerConfig, layerStatus);

    // Check if ready to query legend
    this.#checkQueryLegend(layerConfig);

    // Propagate to the store on layer status changed
    this.#propagateToStore(this.resultSet[layerConfig.layerPath]);
  }

  /**
   * Checks if the layer config has reached the 'processed' status or greater and if so queries the legend.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  #checkQueryLegend(layerConfig: ConfigBaseClass): void {
    // Get the layer
    const layer = this.layerApi.getGeoviewLayerHybrid(layerConfig.layerPath);

    // If the layer legend should be queried
    if (layer && this.#legendShouldBeQueried(layerConfig)) {
      // Flag
      this.resultSet[layerConfig.layerPath].legendQueryStatus = 'querying';

      // Query the legend
      const legendPromise = layer.queryLegend(layerConfig.layerPath);

      // Whenever the legend response comes in
      legendPromise
        ?.then((legend: TypeLegend | null | undefined) => {
          // If legend received
          if (legend) {
            // Flag
            this.resultSet[layerConfig.layerPath].legendQueryStatus = 'queried';

            // Query completed, keep it
            this.resultSet[layerConfig.layerPath].data = legend;

            // Propagate to the store once the legend is received
            this.#propagateToStore(this.resultSet[layerConfig.layerPath]);

            // Inform that the layer set has been updated by calling parent to emit event
            this.onLayerSetUpdatedProcess(layerConfig);
          }
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('legendPromise in #checkQueryLegend in LegendsLayerSet', error);
        });
    }
  }

  /**
   * Indicates if the layer path should be queried
   */
  #legendShouldBeQueried(layerConfig: ConfigBaseClass | undefined): boolean {
    // A legend is ready to be queried when its status is > processed and legendQueryStatus is 'init' (not already queried)
    return !!layerConfig?.isGreaterThanOrEqualTo('processed') && this.resultSet[layerConfig.layerPath].legendQueryStatus === 'init';
  }

  /**
   * Overrides behaviour when layer name is changed.
   * @param {string} name - The new layer name
   * @param {string} layerPath - The layer path being affected
   */
  protected override onProcessNameChanged(name: string, layerPath: string): void {
    if (this.resultSet?.[layerPath]) {
      // Update name
      this.resultSet[layerPath].layerName = name;

      // Call parent
      super.onProcessNameChanged(name, layerPath);

      // Propagate to store
      LegendEventProcessor.propagateLegendToStore(this.getMapId(), this.resultSet[layerPath]);
    }
  }
}
