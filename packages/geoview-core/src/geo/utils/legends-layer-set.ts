import { TypeLegendResultSet } from '@/api/events/payloads';
import { LayerSet } from '@/geo/utils/layer-set';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { api, LayerApi, TypeLayerEntryConfig } from '@/core/types/cgpv-types';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';

type TypeLegendsLayerSetInstance = { [mapId: string]: LegendsLayerSet };

/** *****************************************************************************************************************************
 * A class to hold a set of layers associated with an array of TypeLegend. When this class is instantiated, all layers already
 * loaded on the specified map will be added to the set. Layers added afterwards will be added to the set and deleted layers
 * will be removed from the set.
 *
 * @class LegendsLayerSet
 */
export class LegendsLayerSet extends LayerSet {
  /** Private static variable to keep the single instance that can be created by this class for a mapIId (see singleton design pattern) */
  private static legendsLayerSetInstance: TypeLegendsLayerSetInstance = {};

  /** An object containing the result sets indexed using the layer path */
  declare resultSet: TypeLegendResultSet;

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   */
  private constructor(layerApi: LayerApi, mapId: string) {
    super(layerApi, mapId, `${mapId}/LegendsLayerSet`, {});
    this.setUserRegistrationInitFunction();
    this.setLayerInfoListener();
    this.setLayerSetUpdatedListener();
  }

  /** ***************************************************************************************************************************
   * Define the initialization function that the registration process will use to create a new entry in the layer set for a
   * specific layer path.
   */
  setUserRegistrationInitFunction() {
    this.registrationUserInitialisation = (layerPath: string) => {
      this.resultSet[layerPath].querySent = false;
      this.resultSet[layerPath].data = undefined;
    };
  }

  /**
   * The listener that will handle the CHANGE_LAYER_STATUS event triggered on the map. This method is called by the parent class
   * LayerSet via the listener created by the processLayerStatusChanged method.
   *
   * @param {string} layerPath The layer path being affected
   * @param {string} layerStatus The new layer status
   */
  protected changeLayerStatusListenerFunctions(layerPath: string, layerStatus: TypeLayerStatus): void {
    // Check some variables as received
    const layerExists = !!this.resultSet?.[layerPath];
    const statusHasChanged = this.resultSet?.[layerPath]?.layerStatus !== layerStatus;

    // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
    super.changeLayerStatusListenerFunctions(layerPath, layerStatus);

    if (statusHasChanged) {
      // Get the config from the registered layers
      const layerConfig = this.layerApi.registeredLayers[layerPath];

      if (layerExists && ['processed', 'loaded'].includes(layerStatus) && this.resultSet?.[layerPath]?.querySent === false) {
        // Emit that we're looking for the legend for this layer
        api.event.emitLayerLegendQuery(this.mapId, layerPath);

        // Indicate the query legend was sent
        this.resultSet[layerPath].querySent = true;

        // config file could not determine if the layer is queryable, can it be done using the metadata? let's try
        layerConfig.geoviewLayerInstance?.registerToLayerSets(layerConfig as AbstractBaseLayerEntryConfig);
      }

      if (layerExists || layerStatus === 'loaded') {
        // Possibly update the layer status(es) of the parent(s)
        // TODO: Check - I'm not sure where the logic to set layer status for the parent to loaded when a child is loaded/error, but
        // TO.DOCONT: I had to add this as part of the refactor to make it work
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
   * Set the listener function that will monitor events that returns the legend information returned by the layer's getLegend
   * call and store it in the resultSet. Every time a registered layer changes, a LEGEND_LAYERSET_UPDATED event is triggered.
   */
  private setLayerInfoListener() {
    api.event.onLayerLegendInfo(this.mapId, (payload) => {
      const { layerPath, legendInfo } = payload;
      if (layerPath in this.resultSet) {
        this.resultSet[layerPath].data = legendInfo;

        // Propagate to store
        LegendEventProcessor.propagateLegendToStore(this.mapId, layerPath, this.resultSet[layerPath]);

        // Emit layer set updated
        api.event.emitLayerSetUpdated(this.layerSetId, layerPath, this.resultSet);
      }
    });
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
