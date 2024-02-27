/* eslint-disable @typescript-eslint/no-explicit-any */
import { EVENT_NAMES } from '@/api/events/event-types';
import {
  GetLegendsPayload,
  PayloadBaseClass,
  payloadIsLegendInfo,
  TypeLegendResultSet,
  TypeResultSet,
  LayerSetPayload,
  payloadIsLayerSetChangeLayerStatus,
  payloadIsLayerSetUpdated,
} from '@/api/events/payloads';
import { api } from '@/app';
import { LayerSet } from './layer-set';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

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
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   */
  private constructor(mapId: string) {
    super(mapId, `${mapId}/LegendsLayerSet`, {});
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

  /** ***************************************************************************************************************************
   * The listener that will handle the CHANGE_LAYER_STATUS event triggered on the map. This method is called by the parent class
   * LayerSet via the listener created by the setChangeLayerStatusListenerFunctions method.
   *
   * @param {PayloadBaseClass} payload The payload to process.
   */
  protected changeLayerStatusListenerFunctions(payload: PayloadBaseClass) {
    if (payloadIsLayerSetChangeLayerStatus(payload)) {
      // Log
      logger.logTraceCoreAPIEvent('LEGEND-LAYER-SET on LAYER_SET.CHANGE_LAYER_STATUS', this.mapId, payload);

      const { layerPath, layerStatus } = payload;
      const layerExists = !!this.resultSet?.[layerPath];
      const statusHasChanged = this.resultSet?.[layerPath]?.layerStatus !== layerStatus;
      super.changeLayerStatusListenerFunctions(payload);
      if (statusHasChanged) {
        if (layerExists && ['processed', 'loaded'].includes(layerStatus) && this.resultSet?.[layerPath]?.querySent === false) {
          api.event.emit(GetLegendsPayload.createQueryLegendPayload(`${this.mapId}/${layerPath}`, layerPath));
          this.resultSet[layerPath].querySent = true;
        }
        if (layerExists || layerStatus === 'loaded')
          LegendEventProcessor.propagateLegendToStore(this.mapId, layerPath, this.resultSet[layerPath]);
      }
    }
  }

  /** ***************************************************************************************************************************
   * Set the listener function that will monitor events that returns the legend information returned by the layer's getLegend
   * call and store it in the resultSet. Every time a registered layer changes, a LEGEND_LAYERSET_UPDATED event is triggered.
   */
  private setLayerInfoListener() {
    api.event.on(
      EVENT_NAMES.GET_LEGENDS.LEGEND_INFO,
      (payload) => {
        // Log
        logger.logTraceCoreAPIEvent('legends-layer-set - GET_LEGENDS.LEGEND_INFO', this.mapId, payload);

        if (payloadIsLegendInfo(payload)) {
          const { layerPath, legendInfo } = payload;
          if (layerPath in this.resultSet) {
            this.resultSet[layerPath].data = legendInfo;
            LegendEventProcessor.propagateLegendToStore(this.mapId, layerPath, this.resultSet[layerPath]);
            api.event.emit(
              LayerSetPayload.createLayerSetUpdatedPayload(`${this.mapId}/LegendsLayerSet`, this.resultSet as TypeResultSet, layerPath)
            );
          }
        }
      },
      this.mapId
    );
  }

  /** ***************************************************************************************************************************
   * Set the listener function that will monitor events triggered when a layer is updated.
   */
  private setLayerSetUpdatedListener() {
    api.event.on(
      EVENT_NAMES.LAYER_SET.UPDATED,
      (payload) => {
        // Log
        logger.logTraceCoreAPIEvent('legends-layer-set - LAYER_SET.UPDATED', this.mapId, payload);

        if (payloadIsLayerSetUpdated(payload)) {
          const { layerPath } = payload;
          if (MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, layerPath) === -1) {
            const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
            if (layerConfig.parentLayerConfig) {
              const parentLayerPathArray = layerPath.split('/');
              parentLayerPathArray.pop();
              const parentLayerPath = parentLayerPathArray.join('/');
              const parentLayerIndex = MapEventProcessor.getMapIndexFromOrderedLayerInfo(this.mapId, parentLayerPath);
              const numberOfLayers = MapEventProcessor.getMapOrderedLayerInfo(this.mapId).filter((layerInfo) =>
                layerInfo.layerPath.startsWith(parentLayerPath)
              ).length;
              if (parentLayerIndex !== -1)
                MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig, parentLayerIndex + numberOfLayers);
              else MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig.parentLayerConfig);
            } else MapEventProcessor.addOrderedLayerInfo(this.mapId, layerConfig);
          }
        }
      },
      this.layerSetId
    );
  }

  /**
   * Helper function used to instanciate a LegendsLayerSet object. This function
   * avoids the "new LegendsLayerSet" syntax.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   * @returns {LegendsLayerSet} the LegendsLayerSet object created
   */
  static get(mapId: string): LegendsLayerSet {
    if (!LegendsLayerSet.legendsLayerSetInstance[mapId]) LegendsLayerSet.legendsLayerSetInstance[mapId] = new LegendsLayerSet(mapId);
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
