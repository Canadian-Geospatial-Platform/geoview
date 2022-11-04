/* eslint-disable @typescript-eslint/no-explicit-any */
import { EVENT_NAMES } from '../../api/events/event-types';
import {
  GetLegendsPayload,
  payloadIsLegendInfo,
  payloadIsTriggerLegend,
  TypeLegendResultSets,
} from '../../api/events/payloads/get-legends-payload';
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
   * @param {string} layerSetId The layer set identifier.
   *
   */
  constructor(mapId: string, layerSetId: string) {
    const isAllDone = (): boolean => {
      return Object.keys(this.resultSets).reduce((doneFlag, layerPathToTest) => {
        return doneFlag && this.resultSets[layerPathToTest] !== undefined;
      }, true);
    };

    const registrationConditionFunction = (layerPath: string): boolean => {
      const layerEntryConfig = api.map(this.mapId).layer.registeredLayers[layerPath];
      return layerEntryConfig.geoviewRootLayer?.geoviewLayerType !== 'xyzTiles';
    };
    this.mapId = mapId;
    this.layerSet = new LayerSet(mapId, layerSetId, this.resultSets, registrationConditionFunction);

    api.event.on(
      EVENT_NAMES.GET_LEGENDS.LEGEND_INFO,
      (payload) => {
        if (payloadIsLegendInfo(payload)) {
          const { layerPath, legendInfo } = payload;
          if (layerPath in this.resultSets) this.resultSets[layerPath] = legendInfo;
          if (isAllDone())
            api.event.emit(GetLegendsPayload.createAllQueriesDonePayload(this.mapId, this.layerSet.layerSetId, this.resultSets));
        }
      },
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.GET_LEGENDS.TRIGGER,
      (payload) => {
        if (payloadIsTriggerLegend(payload)) {
          if (payload.layerSetId === this.layerSet.layerSetId) {
            if (isAllDone())
              api.event.emit(GetLegendsPayload.createAllQueriesDonePayload(this.mapId, this.layerSet.layerSetId, this.resultSets));
            else
              Object.keys(this.resultSets).forEach((layerPath) => {
                if (this.resultSets[layerPath] === undefined)
                  api.event.emit(GetLegendsPayload.createQueryLegendPayload(this.mapId, layerPath));
              });
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
   * @param {string} layerSetId The layer set identifier.
   *
   * @returns {LegendsLayerSet} the LegendsLayerSet object created
   */
  static create(mapId: string, layerSetId: string): LegendsLayerSet {
    return new LegendsLayerSet(mapId, layerSetId);
  }
}
