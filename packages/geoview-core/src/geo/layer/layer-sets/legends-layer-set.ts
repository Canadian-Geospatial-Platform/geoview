import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { TypeLegend } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

/**
 * A class to hold a set of layers associated with an array of TypeLegend. When this class is instantiated, all layers already
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
   * @param {string} layerPath - Layer path to propagate
   * @private
   */
  #propagateToStore(layerPath: string): void {
    LegendEventProcessor.propagateLegendToStore(this.mapId, layerPath, this.resultSet[layerPath]);
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  protected override onRegisterLayer(layerConfig: ConfigBaseClass): void {
    // Log
    logger.logTraceCore('LEGENDS-LAYER-SET - onRegisterLayer', layerConfig.layerPath, Object.keys(this.resultSet));

    // Call parent
    super.onRegisterLayer(layerConfig);

    // Keep track if the legend has been queried
    this.resultSet[layerConfig.layerPath].legendQueryStatus = 'init';

    // Check if ready to query legend
    this.#checkQueryLegend(layerConfig);

    // Propagate to the store on registration
    this.#propagateToStore(layerConfig.layerPath);
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
    this.#propagateToStore(layerConfig.layerPath);
  }

  /**
   * Checks if the layer config has reached the 'processed' status or greater and if so queries the legend.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  #checkQueryLegend(layerConfig: ConfigBaseClass): void {
    // Check some variables as received
    const layerExists = !!this.resultSet?.[layerConfig.layerPath];

    // If the layer has been at least processed, we know its metadata has been processed and legend is ready to be queried (logic to move?)
    if (layerExists && layerConfig.isGreaterThanOrEqualTo('processed') && this.#layerPathShouldBeQueried(layerConfig.layerPath)) {
      // Flag
      this.resultSet[layerConfig.layerPath].legendQueryStatus = 'querying';

      // Query the legend
      const legendPromise = this.layerApi.getGeoviewLayerHybrid(layerConfig.layerPath)?.queryLegend(layerConfig.layerPath);

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
            this.#propagateToStore(layerConfig.layerPath);

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
  #layerPathShouldBeQueried(layerPath: string): boolean {
    return this.resultSet[layerPath].legendQueryStatus === 'init';
  }
}

export type TypeLegendResultSetEntry = {
  layerName?: string;
  layerStatus: TypeLayerStatus;
  legendQueryStatus: LegendQueryStatus;
  data: TypeLegend | undefined | null;
};

/** The legend resultset type associate a layer path to a legend object. The undefined value indicate that the get legend query
 * hasn't been run and the null value indicate that there was a get legend error.
 */
export type TypeLegendResultSet = {
  [layerPath: string]: TypeLegendResultSetEntry;
};

export type LegendQueryStatus = 'init' | 'querying' | 'queried';
