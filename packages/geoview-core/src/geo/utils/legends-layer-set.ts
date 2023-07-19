/* eslint-disable @typescript-eslint/no-explicit-any */
import { EVENT_NAMES } from '../../api/events/event-types';
import {
  GetLegendsPayload,
  payloadIsLegendInfo,
  payloadIsTriggerLegend,
  TypeLegendResultSets,
} from '../../api/events/payloads/get-legends-payload';
import { payloadIsLayerSetUpdated } from '../../api/events/payloads/layer-set-payload';
import { api } from '../../app';
import { LayerSet } from './layer-set';

/** *****************************************************************************************************************************
 * A class to hold a set of layers associated with an array of TypeLegend. When this class is instantiated, all layers already
 * loaded on the specified map will be added to the set. Layers added afterwards will be added to the set and deleted layers
 * will be removed from the set.
 *
 * @class LegendsLayerSet
 */
export class LegendsLayerSet {
  /** Private static variable to keep the single instance that can be created by this class for a mapIId (see singleton design pattern) */
  private static legendsLayerSetInstance: Record<string, LegendsLayerSet> = {};

  /** The map identifier the layer set belongs to. */
  mapId: string;

  /** The layer set object. */
  layerSet: LayerSet;

  /** An object containing the result sets indexed using the layer path */
  resultSets: TypeLegendResultSets = {};

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   */
  private constructor(mapId: string) {
    const registrationConditionFunction = (layerPath: string): boolean => {
      const layerEntryConfig = api.map(this.mapId).layer.registeredLayers[layerPath];
      return layerEntryConfig.geoviewRootLayer?.geoviewLayerType !== 'xyzTiles';
    };
    this.mapId = mapId;
    this.layerSet = new LayerSet(mapId, `${mapId}/$LegendsLayerSet$`, this.resultSets, registrationConditionFunction);

    // This listener receives the legend information returned by the a layer's getLegend call and store it in the resultSets
    // if all the registered layers has received their legend information, an EVENT_NAMES.GET_LEGENDS.LEGENDS_LAYERSET_UPDATED event
    // is triggered.
    api.event.on(
      EVENT_NAMES.GET_LEGENDS.LEGEND_INFO,
      (payload) => {
        if (payloadIsLegendInfo(payload)) {
          const { layerPath, legendInfo } = payload;
          if (layerPath in this.resultSets) {
            this.resultSets[layerPath].data = legendInfo;
            api.event.emit(GetLegendsPayload.createLegendsLayersetUpdatedPayload(`${this.mapId}/$LegendsLayerSet$`, this.resultSets));
          }
        }
      },
      this.mapId
    );

    // This listener reacts to EVENT_NAMES.GET_LEGENDS.TRIGGER events. It first queries the legend of all known layers.
    // Then, it activates a listener to query the layers added afterwards or to delete the legends of the deleted layers.
    api.event.once(
      EVENT_NAMES.GET_LEGENDS.TRIGGER,
      (payload) => {
        if (payloadIsTriggerLegend(payload)) {
          const queryUndefinedLegend = () => {
            Object.keys(this.resultSets).forEach((layerPath) => {
              if (this.resultSets[layerPath]?.layerStatus === 'loaded' && this.resultSets[layerPath].data === undefined)
                api.event.emit(GetLegendsPayload.createQueryLegendPayload(`${this.mapId}/${layerPath}`, layerPath));
            });
          };

          api.event.on(
            EVENT_NAMES.LAYER_SET.UPDATED,
            (layerUpdatedPayload) => {
              if (payloadIsLayerSetUpdated(layerUpdatedPayload)) {
                queryUndefinedLegend();
                api.event.emit(GetLegendsPayload.createLegendsLayersetUpdatedPayload(`${this.mapId}/$LegendsLayerSet$`, this.resultSets));
              }
            },
            `${mapId}/$LegendsLayerSet$`
          );

          queryUndefinedLegend();
        }
      },
      `${mapId}/$LegendsLayerSet$`
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
}
