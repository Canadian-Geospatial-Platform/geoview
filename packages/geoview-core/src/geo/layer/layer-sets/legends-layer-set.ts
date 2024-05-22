import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';
import { TypeLayerEntryConfig, TypeLayerStatus } from '@/geo/map/map-schema-types';
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
   * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
   * @param {TypeLayerEntryConfig} layerConfig - The layer config
   */
  protected override onRegisterLayer(layerConfig: TypeLayerEntryConfig): void {
    // Log
    logger.logTraceCore('LEGENDS-LAYER-SET - onRegisterLayer', layerConfig.layerPath, Object.keys(this.resultSet));

    // Call parent
    super.onRegisterLayer(layerConfig);

    // Leaving this here for now, likely can be refactored later
    this.resultSet[layerConfig.layerPath].data = undefined;
  }

  /**
   * Overrides the behavior to apply when a layer status changed for a legends-layer-set.
   * @param {ConfigBaseClass} config - The layer config class
   * @param {string} layerPath - The layer path being affected
   * @param {string} layerStatus - The new layer status
   */
  protected override onProcessLayerStatusChanged(config: ConfigBaseClass, layerPath: string, layerStatus: TypeLayerStatus): void {
    // Check some variables as received
    const layerExists = !!this.resultSet?.[layerPath];
    const statusHasChanged = this.resultSet?.[layerPath]?.layerStatus !== layerStatus;

    // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
    super.onProcessLayerStatusChanged(config, layerPath, layerStatus);

    if (statusHasChanged) {
      // If the layer has been at least processed, we know its metadata has been processed and legend is ready to be queried (logic to move?)
      if (layerExists && ['processed', 'loaded'].includes(layerStatus)) {
        // Query for the legend
        const legendPromise = this.layerApi.getGeoviewLayer(layerPath)!.queryLegend(layerPath);

        // Whenever the legend response comes in
        legendPromise
          .then((legend: TypeLegend | null | undefined) => {
            // If legend received
            if (legend) {
              // Query completed keep it
              this.resultSet[layerPath].data = legend;

              // Propagate to store
              LegendEventProcessor.propagateLegendToStore(this.mapId, layerPath, this.resultSet[layerPath]);

              // Inform that the layer set has been updated by triggering an event down the road
              this.onLayerSetUpdatedProcess(layerPath);
            }
          })
          .catch((error) => {
            // Log
            logger.logPromiseFailed('legendPromise in onProcessLayerStatusChanged in legendsLayerSet', error);
          });
      }

      if (layerExists || layerStatus === 'loaded') {
        // Get the config from the registered layers
        const layerConfig = this.layerApi.getLayerEntryConfig(layerPath)!;

        // TODO: Check - I'm not sure where the logic to set layer status for the parent to loaded when a child is loaded/error is, but
        // TO.DOCONT: I had to add this as part of the refactor to make it work
        // Possibly update the layer status(es) of the parent(s)
        this.#changeLayerStatusOfParentsRecursive(layerConfig, layerStatus);

        // Propagate to store
        LegendEventProcessor.propagateLegendToStore(this.mapId, layerPath, this.resultSet[layerPath]);
      }
    }
  }

  /**
   * Recursively tries to set the layer status on the parent group layer(s), depending if the layer entry has a parent and
   * if the current layer status is loaded or error.
   * @param {TypeLayerEntryConfig} currentLayerConfig - The current layer config being checked
   * @param {TypeLayerStatus} currentLayerStatus - The layer status that triggered the check on the parent(s)
   * @private
   */
  #changeLayerStatusOfParentsRecursive(currentLayerConfig: TypeLayerEntryConfig, currentLayerStatus: TypeLayerStatus): void {
    // If layer has a parent
    if (currentLayerConfig.parentLayerConfig) {
      // If the current status to set is at least loaded (or error), make the parent loaded
      if (['loaded', 'error'].includes(currentLayerStatus)) {
        // Get the parent config
        const parentGroupLayer = currentLayerConfig.parentLayerConfig;

        // Update the status on the parent
        parentGroupLayer.layerStatus = 'loaded';

        // If has another parent, go recursive
        if (parentGroupLayer.parentLayerConfig) {
          // Going recursive
          this.#changeLayerStatusOfParentsRecursive(parentGroupLayer, currentLayerStatus);
        }
      }
    }
  }

  /**
   * Overrides behaviour when layer name is changed.
   * @param {string} layerPath - The layer path being affected
   * @param {string} name - The new layer name
   */
  protected override onProcessNameChanged(layerPath: string, name: string): void {
    if (this.resultSet?.[layerPath]) {
      // Call parent
      super.onProcessNameChanged(layerPath, name);

      // Propagate to store
      LegendEventProcessor.propagateLegendToStore(this.mapId, layerPath, this.resultSet[layerPath]);
    }
  }
}

export type TypeLegendResultSetEntry = {
  layerName?: string;
  layerStatus: TypeLayerStatus;
  data: TypeLegend | undefined | null;
};

/** The legend resultset type associate a layer path to a legend object. The undefined value indicate that the get legend query
 * hasn't been run and the null value indicate that there was a get legend error.
 */
export type TypeLegendResultSet = {
  [layerPath: string]: TypeLegendResultSetEntry;
};
