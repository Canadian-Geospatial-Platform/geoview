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
} from '@/api/events/payloads';
import { api } from '@/app';
import { LayerSet } from './layer-set';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { logger } from '@/core/utils/logger';

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
    super(mapId, `${mapId}/LegendsLayerSet`, {} as TypeResultSet);
    this.setUserRegistrationInitFunction();
    this.setLayerInfoListener();
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
   * The listener that will handle the CHANGE_LAYER_STATUS event triggered on the map.
   *
   * @param {PayloadBaseClass} payload The payload to process.
   */
  protected changeLayerStatusListenerFunctions(payload: PayloadBaseClass) {
    if (payloadIsLayerSetChangeLayerStatus(payload)) {
      // Log
      logger.logTraceDetailed('legend-layer-set on EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS', this.mapId, payload);

      const { layerPath, layerStatus } = payload;
      const layerExists = !!this.resultSet?.[layerPath];
      const statusHasChanged = this.resultSet?.[layerPath]?.layerStatus !== layerStatus;
      super.changeLayerStatusListenerFunctions(payload);
      if (layerExists && statusHasChanged) {
        if (layerStatus === 'processed' && this.resultSet?.[layerPath]?.querySent === false) {
          api.event.emit(GetLegendsPayload.createQueryLegendPayload(`${this.mapId}/${layerPath}`, layerPath));
          this.resultSet[layerPath].querySent = true;
        }
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
        logger.logTraceCoreAPIEvent('LEGENDS-LAYER-SET - LEGEND_INFO', this.mapId, payload);

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
