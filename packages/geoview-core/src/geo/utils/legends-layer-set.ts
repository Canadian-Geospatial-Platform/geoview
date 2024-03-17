import { LayerSet } from '@/geo/utils/layer-set';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { api, LayerApi, TypeLayerEntryConfig, TypeLegend } from '@/core/types/cgpv-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { logger } from '@/core/utils/logger';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

/**
 * A class to hold a set of layers associated with an array of TypeLegend. When this class is instantiated, all layers already
 * loaded on the specified map will be added to the set. Layers added afterwards will be added to the set and deleted layers
 * will be removed from the set.
 *
 * @class LegendsLayerSet
 */
export class LegendsLayerSet extends LayerSet {
  /** Private static variable to keep the single instance that can be created by this class for a mapIId (see singleton design pattern) */
  private static legendsLayerSetInstance: TypeLegendsLayerSetInstance = {};

  /** The resultSet object as existing in the base class, retyped here as a TypeLegendResultSet */
  declare resultSet: TypeLegendResultSet;

  /**
   * The class constructor that instanciate a set of layer.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   */
  private constructor(layerApi: LayerApi, mapId: string) {
    super(layerApi, mapId, `${mapId}/LegendsLayerSet`);

    // Wire layer set updated event
    this.setLayerSetUpdatedListener();
  }

  /**
   * Overrides the behavior to apply when a legends-layer-set wants to register a layer in its set.
   * @param {AbstractGeoViewLayer} geoviewLayer The geoview layer being registered
   * @param {string} layerPath The layer path
   */
  onRegisterLayer = (geoviewLayer: AbstractGeoViewLayer, layerPath: string): void => {
    // Log
    logger.logTraceCore('LEGENDS-LAYER-SET - onRegisterLayer', layerPath, Object.keys(this.resultSet));

    this.resultSet[layerPath].querySent = false;
    this.resultSet[layerPath].data = undefined;

    // When registering a layer in the legends layer set, we're interested to know its legend, attach to the querying/queried legend events.
    geoviewLayer.onLegendQuerying((sender, layerQueryEvent) => {
      // Query was sent
      this.resultSet[layerQueryEvent.layerPath].querySent = true;
    });

    // Attach to queried
    geoviewLayer.onLegendQueried((sender, layerQueryEvent) => {
      // Query completed
      this.resultSet[layerQueryEvent.layerPath].data = layerQueryEvent.legend;

      // Propagate to store
      LegendEventProcessor.propagateLegendToStore(this.mapId, layerPath, this.resultSet[layerPath]);

      // Emit layer set updated
      api.event.emitLayerSetUpdated(this.layerSetId, layerPath, this.resultSet);
    });
  };

  /**
   * Overrides the behavior to apply when a layer status changed for a legends-layer-set.
   * @param {ConfigBaseClass} config The layer config class
   * @param {string} layerPath The layer path being affected
   * @param {string} layerStatus The new layer status
   */
  protected onProcessLayerStatusChanged(config: ConfigBaseClass, layerPath: string, layerStatus: TypeLayerStatus): void {
    // Check some variables as received
    const layerExists = !!this.resultSet?.[layerPath];
    const statusHasChanged = this.resultSet?.[layerPath]?.layerStatus !== layerStatus;

    // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
    super.onProcessLayerStatusChanged(config, layerPath, layerStatus);

    if (statusHasChanged) {
      // Get the config from the registered layers
      const layerConfig = this.layerApi.registeredLayers[layerPath];

      if (layerExists && ['processed', 'loaded'].includes(layerStatus) && this.resultSet?.[layerPath]?.querySent === false) {
        // Query for the legend
        this.layerApi.geoviewLayer(layerPath).queryLegend(layerPath);

        // config file could not determine if the layer is queryable, can it be done using the metadata? let's try
        // ? Trying to comment this line to see if it's good, don't understand the comment line just above this line
        // layerConfig.geoviewLayerInstance?.registerToLayerSets(layerConfig as AbstractBaseLayerEntryConfig);
      }

      if (layerExists || layerStatus === 'loaded') {
        // TODO: Check - I'm not sure where the logic to set layer status for the parent to loaded when a child is loaded/error is, but
        // TO.DOCONT: I had to add this as part of the refactor to make it work
        // Possibly update the layer status(es) of the parent(s)
        this.changeLayerStatusOfParentsRecursive(layerConfig, layerStatus);

        // Propagate to store
        LegendEventProcessor.propagateLegendToStore(this.mapId, layerPath, this.resultSet[layerPath]);
      }
    }
  }

  /**
   * Recursively tries to set the layer status on the parent group layer(s), depending if the layer entry has a parent and
   * if the current layer status is loaded or error.
   *
   * @param {TypeLayerEntryConfig} currentLayerConfig The current layer config being checked
   * @param {TypeLayerStatus} currentLayerStatus The layer status that triggered the check on the parent(s)
   */
  private changeLayerStatusOfParentsRecursive(currentLayerConfig: TypeLayerEntryConfig, currentLayerStatus: TypeLayerStatus): void {
    // If layer has a parent
    if (currentLayerConfig.parentLayerConfig) {
      // If the current status to set is at least loaded (or error), make the parent loaded
      if (['loaded', 'error'].includes(currentLayerStatus)) {
        // Get the parent config
        const parentGroupLayer = currentLayerConfig.parentLayerConfig as GroupLayerEntryConfig;

        // Update the status on the parent
        parentGroupLayer.layerStatus = 'loaded';

        // If has another parent, go recursive
        if (parentGroupLayer.parentLayerConfig) {
          // Going recursive
          this.changeLayerStatusOfParentsRecursive(parentGroupLayer, currentLayerStatus);
        }
      }
    }
  }

  /** ***************************************************************************************************************************
   * Set the listener function that will monitor events triggered when a layer is updated.
   */
  private setLayerSetUpdatedListener() {
    // Wire a layer set updated listener
    api.event.onLayerSetUpdated(this.layerSetId, (payload) => {
      const { layerPath } = payload;
      if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, layerPath) === -1) {
        const layerConfig = this.layerApi.registeredLayers[layerPath];
        if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, layerPath.split('.')[1]) !== -1) {
          MapEventProcessor.replaceOrderedLayerInfo(this.mapId, layerConfig, layerPath.split('.')[1]);
        } else if (layerConfig.parentLayerConfig) {
          const parentLayerPathArray = layerPath.split('/');
          parentLayerPathArray.pop();
          const parentLayerPath = parentLayerPathArray.join('/');
          const parentLayerIndex = MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, parentLayerPath);
          const numberOfLayers = MapEventProcessor.getMapOrderedLayerInfo(this.mapId).filter((layerInfo) =>
            layerInfo.layerPath.startsWith(parentLayerPath)
          ).length;
          if (parentLayerIndex !== -1) MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig, parentLayerIndex + numberOfLayers);
          else MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig.parentLayerConfig!);
        } else MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig);
      }
    });
  }

  /**
   * Helper function used to instanciate a LegendsLayerSet object. This function
   * avoids the "new LegendsLayerSet" syntax.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   * @returns {LegendsLayerSet} the LegendsLayerSet object created
   */
  static get(layerApi: LayerApi, mapId: string): LegendsLayerSet {
    if (!LegendsLayerSet.legendsLayerSetInstance[mapId])
      LegendsLayerSet.legendsLayerSetInstance[mapId] = new LegendsLayerSet(layerApi, mapId);
    return LegendsLayerSet.legendsLayerSetInstance[mapId];
  }

  /**
   * Function used to delete a LegendsLayerSet object associated to a mapId.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   */
  static delete(mapId: string) {
    if (LegendsLayerSet.legendsLayerSetInstance[mapId]) delete LegendsLayerSet.legendsLayerSetInstance[mapId];
  }
}

type TypeLegendsLayerSetInstance = { [mapId: string]: LegendsLayerSet };

export type TypeLegendResultSetEntry = {
  layerName?: string;
  layerStatus: TypeLayerStatus;
  data: TypeLegend | undefined | null;
  querySent: boolean;
};

/** The legend resultset type associate a layer path to a legend object. The undefined value indicate that the get legend query
 * hasn't been run and the null value indicate that there was a get legend error.
 */
export type TypeLegendResultSet = {
  [layerPath: string]: TypeLegendResultSetEntry;
};
