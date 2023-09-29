/* eslint-disable @typescript-eslint/no-explicit-any */
import debounce from 'lodash/debounce';

import { EVENT_NAMES } from '@/api/events/event-types';
import {
  GetFeatureInfoPayload,
  payloadIsQueryResult,
  TypeFeatureInfoResultSets,
  payloadIsAMapMouseEvent,
  payloadIsALngLat,
  ArrayOfQueryTypes,
} from '@/api/events/payloads';
import { api } from '@/app';
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
  /** Private static variable to keep the single instance that can be created by this class for a mapId (see singleton design pattern) */
  private static featureInfoLayerSetInstance: Record<string, FeatureInfoLayerSet> = {};

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
   *
   */
  private constructor(mapId: string) {
    // This function determines whether a layer can be registered.
    const registrationConditionFunction = (layerPath: string): boolean => {
      const layerEntryConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
      if (layerEntryConfig?.source) {
        return 'featureInfo' in layerEntryConfig.source! && !!layerEntryConfig.source.featureInfo?.queryable;
      }
      return false;
    };

    // This function is used to initialise the date property of the layer path entry.
    const registrationUserDataInitialisation = (layerPath: string) => {
      this.resultSets[layerPath].data = {};
      ArrayOfQueryTypes.forEach((property) => {
        this.resultSets[layerPath].data[property] = undefined;
      });
    };

    this.mapId = mapId;
    this.layerSet = new LayerSet(
      mapId,
      `${mapId}/FeatureInfoLayerSet`,
      this.resultSets,
      registrationConditionFunction,
      registrationUserDataInitialisation
    );

    // Listen to "map click"-"crosshair enter" and send a query layers event to queryable layers. These layers will return a result set of features.
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapMouseEvent(payload)) {
          Object.keys(this.resultSets).forEach((layerPath) => {
            this.resultSets[layerPath].data.at_long_lat = undefined;
          });
          api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(this.mapId, 'at_long_lat', payload.coordinates.lnglat, false));
        }
      },
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENTER,
      (payload) => {
        if (payloadIsALngLat(payload)) {
          Object.keys(this.resultSets).forEach((layerPath) => {
            this.resultSets[layerPath].data.at_long_lat = undefined;
          });
          api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(this.mapId, 'at_long_lat', payload.lnglat, false));
        }
      },
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE,
      debounce((payload) => {
        if (payloadIsAMapMouseEvent(payload)) {
          Object.keys(this.resultSets).forEach((layerPath) => {
            this.resultSets[layerPath].data.at_pixel = undefined;
          });
          api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(this.mapId, 'at_pixel', payload.coordinates.pixel, true));
        }
      }, 750),
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_GET_ALL_FEATURES,
      () => {
        Object.keys(this.resultSets).forEach((layerPath) => {
          this.resultSets[layerPath].data.all = undefined;
        });
        api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(this.mapId, 'all'));
      },
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
      (payload) => {
        if (payloadIsQueryResult(payload)) {
          const { layerPath, queryType, arrayOfRecords, isHover } = payload;
          if (layerPath in this.resultSets) {
            this.resultSets[layerPath].data[queryType] = arrayOfRecords;
          }

          const allDone = Object.keys(this.resultSets).reduce((doneFlag, layerPathToTest) => {
            return doneFlag && this.resultSets[layerPathToTest].data[queryType] !== undefined;
          }, true);

          if (allDone && !isHover) {
            api.event.emit(
              GetFeatureInfoPayload.createAllQueriesDonePayload(
                `${this.layerSet.layerSetId}`,
                queryType,
                this.layerSet.layerSetId,
                this.resultSets
              )
            );
          } else if (allDone && isHover) {
            api.event.emit(
              GetFeatureInfoPayload.createHoverQueryDonePayload(`${this.layerSet.layerSetId}`, this.layerSet.layerSetId, this.resultSets)
            );
          }
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
   *
   * @returns {FeatureInfoLayerSet} the FeatureInfoLayerSet object created
   */
  static get(mapId: string): FeatureInfoLayerSet {
    if (!FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId])
      FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId] = new FeatureInfoLayerSet(mapId);
    return FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId];
  }

  /**
   * Function used to delete a FeatureInfoLayerSet object associated to a mapId.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   */
  static delete(mapId: string) {
    if (FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId]) delete FeatureInfoLayerSet.featureInfoLayerSetInstance[mapId];
  }
}
