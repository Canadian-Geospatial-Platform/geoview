/* eslint-disable @typescript-eslint/no-explicit-any */
import { EVENT_NAMES } from '../../api/events/event-types';
import { GetFeatureInfoPayload, payloadIsQueryResult, TypeFeatureInfoResultSets } from '../../api/events/payloads/get-feature-info-payload';
import { payloadIsAMapSingleClick } from '../../api/events/payloads/map-slingle-click-payload';
import { payloadIsALngLat } from '../../api/events/payloads/lng-lat-payload';
import { api } from '../../app';
import { LayerSet } from './layer-set';

/** ***************************************************************************************************************************
 * A class to hold a set of layers associated with an array of TypeArrayOfFeatureInfoEntries. When this class is instantiated,
 * all layers already loaded on the specified map that are queryable will be added to the set. Layers added afterwards will be
 * added to the set if they are queryable. Deleted layers will be removed from the set. If you click on the map, all queryable
 * layers will execute a query and return their result set.
 *
 * @class FeatureInfoLayerSet
 */
export class FeatureInfoLayerSet {
  /** The map identifier the layer set belongs to. */
  mapId: string;

  /** The layer set object. */
  layerSet: LayerSet;

  /** An object containing the result sets indexed using the layer path */
  resultSets: TypeFeatureInfoResultSets = {};

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   * @param {string} layerSetId The layer set identifier.
   *
   */
  constructor(mapId: string, layerSetId: string) {
    const registrationConditionFunction = (layerPath: string): boolean => {
      const layerEntryConfig = api.map(this.mapId).layer.registeredLayers[layerPath];
      if (layerEntryConfig.source) {
        return 'featureInfo' in layerEntryConfig.source! && !!layerEntryConfig.source.featureInfo?.queryable;
      }
      return false;
    };
    this.mapId = mapId;
    this.layerSet = new LayerSet(mapId, layerSetId, this.resultSets, registrationConditionFunction);

    // Listen to "map click"-"crosshair enter" and send a query layers event to queryable layers. These layers will return a result set if features
    // are found.
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapSingleClick(payload)) {
          Object.keys(this.resultSets).forEach((layerPath) => {
            this.resultSets[layerPath] = undefined;
          });
          api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(this.mapId, 'at long lat', payload.coordinates.lnglat));
        }
      },
      this.mapId
    );
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENTER,
      (payload) => {
        if (payloadIsALngLat(payload)) {
          Object.keys(this.resultSets).forEach((layerPath) => {
            this.resultSets[layerPath] = undefined;
          });
          api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(this.mapId, 'at long lat', payload.lnglat));
        }
      },
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
      (payload) => {
        if (payloadIsQueryResult(payload)) {
          const { layerPath, arrayOfRecords } = payload;
          if (layerPath in this.resultSets) {
            this.resultSets[layerPath] = arrayOfRecords;
          }
          const allDone = Object.keys(this.resultSets).reduce((doneFlag, layerPathToTest) => {
            return doneFlag && this.resultSets[layerPathToTest] !== undefined;
          }, true);
          if (allDone)
            api.event.emit(
              GetFeatureInfoPayload.createAllQueriesDonePayload(
                `${this.mapId}/${this.layerSet.layerSetId}`,
                this.layerSet.layerSetId,
                this.resultSets
              )
            );
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
