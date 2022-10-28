/* eslint-disable @typescript-eslint/no-explicit-any */
import { EVENT_NAMES } from '../../api/events/event-types';
import {
  GetFeatureInfoPayload,
  payloadIsQueryResult,
  payloadIsLayerRegistration,
  TypeResultSets,
} from '../../api/events/payloads/get-feature-info-payload';
import { payloadIsAMapSingleClick } from '../../api/events/payloads/map-slingle-click-payload';
import { api } from '../../app';

/** ***************************************************************************************************************************
 * A class to hold a set of layers associated with an array of TypeArrayOfRecords. When this class is instantiated, all layers
 * already loaded on the specified map that are queryable will be added to the set. Layers added afterwards will be added to
 * the set if they are queryable. Deleted layers will be removed from the set. If you click on the map, all queryable layers
 * will execute a query and return their result set.
 *
 * @class FeatureInfoLayerSet
 */
export class FeatureInfoLayerSet {
  /** The map identifier the layer set belongs to. */
  mapId: string;

  /** The layer set identifier. */
  layerSetId: string;

  /** An object containing the result sets indexed using the layer path */
  resultSets: TypeResultSets = {};

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   * @param {string} layerSetId The layer set identifier.
   * data.
   */
  constructor(mapId: string, layerSetId: string) {
    this.mapId = mapId;
    this.layerSetId = layerSetId;

    // Register layers to the layer set or unregister layers that are deleted from the map.
    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.LAYER_REGISTRATION,
      (payload) => {
        if (payloadIsLayerRegistration(payload)) {
          const { action, layerPath } = payload;
          if (action === 'add') this.resultSets[layerPath] = null;
          else delete this.resultSets[layerPath];
        }
      },
      this.mapId
    );

    // Send a request layer inventory signal to all existing layers of the map. These layers will return a layer registration event.
    api.event.emit(GetFeatureInfoPayload.createRequestLayerInventoryPayload(this.mapId, this.layerSetId));

    // Listen to map click and send a query layers event to queryable layers. These layers will return a result set if features
    // are found.
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapSingleClick(payload)) {
          Object.keys(this.resultSets).forEach((layerPath) => {
            this.resultSets[layerPath] = null;
          });
          api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(this.mapId, 'at long lat', payload.coordinates.lnglat));
        }
      },
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
      (payload) => {
        if (payloadIsQueryResult(payload)) {
          const { layerPath, arrayOfRecords } = payload;
          if (layerPath in this.resultSets) this.resultSets[layerPath] = arrayOfRecords;
          const allDone = Object.keys(this.resultSets).reduce((doneFlag, layerPathToTest) => {
            return doneFlag && this.resultSets[layerPathToTest] !== null;
          }, true);
          if (allDone) api.event.emit(GetFeatureInfoPayload.createAllQueriesDonePayload(this.mapId, this.layerSetId, this.resultSets));
        }
      },
      this.mapId
    );
  }

  /**
   * Helper function used to instanciate a FeatureInfoLayerSet object. This function
   * avoids the "new FeatureInfoLayerSet" syntax.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   * @param {string} layerSetId The layer set identifier.
   *
   * @returns {FeatureInfoLayerSet} the FeatureInfoLayerSet object created
   */
  static create(mapId: string, layerSetId: string): FeatureInfoLayerSet {
    return new FeatureInfoLayerSet(mapId, layerSetId);
  }
}
