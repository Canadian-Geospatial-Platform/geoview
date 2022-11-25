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

    // This listener receives the legend information returned by the a layer's getLegend call and store it in the resultSets
    // if all the registered layers has received their legend information, a EVENT_NAMES.GET_LEGENDS.ALL_LEGENDS_DONE event
    // is triggered.
    api.event.on(
      EVENT_NAMES.GET_LEGENDS.LEGEND_INFO,
      (payload) => {
        if (payloadIsLegendInfo(payload)) {
          const { layerPath, legendInfo } = payload;
          if (layerPath in this.resultSets) this.resultSets[layerPath] = legendInfo;
          if (isAllDone()) api.event.emit(GetLegendsPayload.createAllQueriesDonePayload(this.mapId, this.resultSets), layerSetId);
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
              if (this.resultSets[layerPath] === undefined)
                api.event.emit(GetLegendsPayload.createQueryLegendPayload(this.mapId, layerPath), layerPath);
            });
          };

          queryUndefinedLegend();

          api.event.on(
            EVENT_NAMES.LAYER_SET.UPDATED,
            (layerUpdatedPayload) => {
              if (payloadIsLayerSetUpdated(layerUpdatedPayload)) {
                if (layerUpdatedPayload.layerSetId === layerSetId) {
                  if (isAllDone()) api.event.emit(GetLegendsPayload.createAllQueriesDonePayload(this.mapId, this.resultSets), layerSetId);
                  else queryUndefinedLegend();
                }
              }
            },
            mapId
          );
        }
      },
      mapId,
      layerSetId
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
