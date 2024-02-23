/* eslint-disable @typescript-eslint/no-explicit-any */
import debounce from 'lodash/debounce';

import { EVENT_NAMES } from '@/api/events/event-types';
import {
  GetFeatureInfoPayload,
  payloadIsQueryResult,
  TypeFeatureInfoResultsSet,
  payloadIsAMapMouseEvent,
  payloadIsALngLat,
  ArrayOfEventTypes,
  TypeLayerData,
  EventType,
  QueryType,
} from '@/api/events/payloads';
import { api } from '@/app';
import { LayerSet } from './layer-set';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { logger } from '@/core/utils/logger';
import { getLocalizedValue } from '@/core/utils/utilities';
import { Coordinate, TypeQueryStatus, payloadIsFeatureInfoLayersetUpdated, payloadIsGetAllLayerFeatures } from '@/core/types/cgpv-types';

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
  private static featureInfoLayerSetInstance: {
    [mapId: string]: FeatureInfoLayerSet;
  } = {};

  /** The map identifier the layer set belongs to. */
  private mapId: string;

  /** The layer set object. */
  private layerSet: LayerSet;

  /** Flag used to disable hover event for the entire layerSet */
  private disableHover = false;

  /** An object containing the result sets indexed using the layer path */
  resultsSet: TypeFeatureInfoResultsSet = {};

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   */
  private constructor(mapId: string) {
    /* *********************************************************************************************************************** */
    // This function determines whether a layer can be registered.
    const registrationConditionFunction = (layerPath: string): boolean => {
      // Log
      logger.logTraceCore('FEATURE-INFO-LAYER-SET - registration condition...', layerPath, Object.keys(this.resultsSet));

      const layerConfig = api.maps[mapId].layer.registeredLayers[layerPath];
      const queryable = layerConfig?.source?.featureInfo?.queryable;
      return !!queryable;
    };

    /* *********************************************************************************************************************** */
    // Still in the constructor
    // This function is used to initialise the layer path entries of the layer set.
    const registrationUserInitialisation = (layerPath: string) => {
      // Log
      logger.logTraceCore('FEATURE-INFO-LAYER-SET - initializing...', layerPath, Object.keys(this.resultsSet));

      const layerConfig = api.maps[mapId].layer.registeredLayers[layerPath];
      this.resultsSet[layerPath] = {
        layerStatus: layerConfig.layerStatus!,
        layerPhase: layerConfig.layerPhase!,
        data: {},
        layerName: getLocalizedValue(layerConfig.layerName, mapId) ?? '',
      };

      ArrayOfEventTypes.forEach((eventType) => {
        this.resultsSet[layerPath].data[eventType] = {
          layerName: getLocalizedValue(layerConfig.layerName, mapId) ?? '',
          layerStatus: layerConfig.layerStatus!,
          eventListenerEnabled: true,
          queryStatus: 'processed',
          features: [],
          layerPath,
        };
        FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, layerPath, eventType, this.resultsSet);
      });

      api.event.on(
        EVENT_NAMES.GET_FEATURE_INFO.GET_ALL_LAYER_FEATURES,
        (payload) => {
          // Log
          logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET - GET_ALL_LAYER_FEATURES', this.mapId, payload);

          if (payloadIsGetAllLayerFeatures(payload)) {
            if (!this.resultsSet[layerPath].data['all-features']!.eventListenerEnabled) return;
            const dataForEventType = this.resultsSet[layerPath].data['all-features'] as TypeLayerData;
            if (layerConfig.layerStatus === 'loaded') {
              dataForEventType.features = undefined;
              dataForEventType.queryStatus = 'processing';
            } else {
              dataForEventType.features = null;
              dataForEventType.queryStatus = 'error';
              FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, layerPath, 'all-features', this.resultsSet);
              return;
            }

            api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(`${this.mapId}/${layerPath}`, 'all', layerPath));
            FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, layerPath, 'all-features', this.resultsSet);
          }
        },
        `${mapId}/${layerPath}`
      );
      FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, layerPath, 'click', this.resultsSet);
    };

    /* *********************************************************************************************************************** */
    // Still in the constructor - initialize other properties.
    this.mapId = mapId;
    this.layerSet = new LayerSet(
      mapId,
      `${mapId}/FeatureInfoLayerSet`,
      this.resultsSet,
      registrationConditionFunction,
      registrationUserInitialisation
    );

    /* *********************************************************************************************************************** */
    // Still in the constructor
    // Listen to "map click" and send a query layers event to queryable layers. These layers will return a result set
    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.FEATURE_INFO_LAYERSET_UPDATED,
      (payload) => {
        // Log
        logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET - FEATURE_INFO_LAYERSET_UPDATED', this.mapId, payload);

        if (payloadIsFeatureInfoLayersetUpdated(payload)) {
          const { layerPath, resultsSet, layerStatus } = payload;
          if (layerStatus === 'error') delete resultsSet[layerPath];
        }
      },
      `${mapId}/FeatureInfoLayerSet`
    );

    /* *********************************************************************************************************************** */
    // Still in the constructor
    // Listen to "map click" and send a query layers event to queryable layers. These layers will return a result set
    // of features.
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        // Log
        logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET - EVENT_MAP_SINGLE_CLICK', this.mapId, payload);

        if (payloadIsAMapMouseEvent(payload)) {
          this.createQueryLayerPayload('click', 'at_long_lat', payload.coordinates.lnglat);
        }
      },
      this.mapId
    );

    /* *********************************************************************************************************************** */
    // Still in the constructor
    // ! Do we want to keep this type of event? I think we already said that we want to remove it.
    // TODO: Refactor - This doesn't seem to be used at all indeed?
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENTER,
      (payload) => {
        // Log
        logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET - EVENT_MAP_CROSSHAIR_ENTER', this.mapId, payload);

        if (payloadIsALngLat(payload)) {
          this.createQueryLayerPayload('crosshaire-enter', 'at_long_lat', payload.lnglat);
        }
      },
      this.mapId
    );

    /* *********************************************************************************************************************** */
    // Still in the constructor
    // Listen to "hover" events and send a query layers event to queryable layers. These layers will return a result
    // set of features.
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE,
      debounce((payload) => {
        // Log
        logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET - EVENT_MAP_POINTER_MOVE', this.mapId, payload);

        if (payloadIsAMapMouseEvent(payload)) {
          this.createQueryLayerPayload('hover', 'at_pixel', payload.coordinates.pixel);
        }
      }, 750),
      this.mapId
    );

    /* *********************************************************************************************************************** */
    // Still in the constructor
    // Listen to "query result" events and send a all query done event when all the layers have returned their result
    // set of features.
    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
      (payload) => {
        // Log
        logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET - QUERY_RESULT', this.mapId, payload);

        if (payloadIsQueryResult(payload)) {
          const { layerPath, queryType, arrayOfRecords, eventType } = payload;
          const layerConfig = api.maps[mapId].layer.registeredLayers[layerPath];
          if (this.resultsSet?.[layerPath]?.data) {
            const dataForEventType = this.resultsSet[layerPath].data[eventType] as TypeLayerData;
            dataForEventType.features = arrayOfRecords;
            dataForEventType.layerStatus = layerConfig.layerStatus!;
            // When property features is undefined, we are waiting for the query result.
            // when Array.isArray(features) is true, the features property contains the query result.
            // when property features is null, the query ended with an error.
            dataForEventType.queryStatus = arrayOfRecords === null ? 'error' : 'processed';
            FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, layerPath, eventType, this.resultsSet);
          }

          const allDone = Object.keys(this.resultsSet).reduce((doneFlag, layerPathToTest) => {
            return doneFlag && this.resultsSet[layerPathToTest].data[eventType]?.features !== undefined;
          }, true);

          if (allDone) {
            api.event.emit(
              GetFeatureInfoPayload.createAllQueriesDonePayload(
                this.layerSet.layerSetId,
                eventType,
                layerPath,
                queryType,
                this.layerSet.layerSetId,
                this.resultsSet
              )
            );
          }
        }
      },
      this.mapId
    );
  } // constructor ends here

  /* **************************************************************************************************************************
   * Still in the constructor
   * @param {EventType} eventType The event type (ex.: "click" | "hover" | "crosshaire-enter" | "all-features")
   * @param {QueryType} queryType The query type (ex.: "all" | "at_pixel" | "at_coordinate" | "at_long_lat", ...)
   * @param {Coordinate} coordinate The coordinate of the event
   */
  createQueryLayerPayload = (eventType: EventType, queryType: QueryType, coordinate: Coordinate): void => {
    // Reinitialize the resultsSet
    // Loop on each layer path in the resultsSet
    Object.keys(this.resultsSet).forEach((layerPath) => {
      const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
      const dataForEventType = this.resultsSet[layerPath].data[eventType] as TypeLayerData;
      if (!dataForEventType.eventListenerEnabled) return;
      if (layerConfig.layerStatus === 'loaded') {
        dataForEventType.features = undefined;
        dataForEventType.queryStatus = 'processing';
      } else {
        dataForEventType.features = null;
        dataForEventType.queryStatus = 'error';
      }

      if (dataForEventType.eventListenerEnabled && dataForEventType.queryStatus !== ('error' as TypeQueryStatus)) {
        api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(`${this.mapId}/${layerPath}`, queryType, coordinate, eventType));
      }
    });
  };

  /**
   * Helper function used to launch the query on a layer to get all of its feature information
   *
   * @param {string} layerPath The layerPath that will be queried.
   * @param {QueryType} queryType the query's type to perform
   */
  // TODO: (futur development) The queryType is a door opened to allow the triggering using a bounding box or a polygon.
  triggerGetAllFeatureInfo(layerPath: string, queryType: QueryType = 'all') {
    if (this.resultsSet[layerPath]) {
      api.event.emit(GetFeatureInfoPayload.createGetAllLayerFeaturesPayload(`${this.mapId}/${layerPath}`, queryType));
    } else {
      logger.logError(`The triggerGetAllFeatureInfo method cannot be used on an inexistant layer path (${layerPath})`);
    }
  }

  /**
   * Function used to enable listening of click events. When a layer path is not provided,
   * click events listening is enabled for all layers
   *
   * @param {string} layerPath Optional parameter used to enable only one layer
   */
  enableClickListener(layerPath?: string) {
    if (layerPath) this.resultsSet[layerPath].data.click!.eventListenerEnabled = true;
    else
      Object.keys(this.resultsSet).forEach((key: string) => {
        this.resultsSet[key].data.click!.eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of click events. When a layer path is not provided,
   * click events listening is disable for all layers
   *
   * @param {string} layerPath Optional parameter used to disable only one layer
   */
  disableClickListener(layerPath?: string) {
    if (layerPath) this.resultsSet[layerPath].data.click!.eventListenerEnabled = false;
    else
      Object.keys(this.resultsSet).forEach((key: string) => {
        this.resultsSet[key].data.click!.eventListenerEnabled = false;
      });
  }

  /**
   * Function used to determine whether click events are disabled for a layer. When a layer path is not provided,
   * the value returned is undefined if the map flags are a mixture of true and false values.
   *
   * @param {string} layerPath Optional parameter used to get the flag value of a layer.
   *
   * @returns {boolean | undefined} The flag value for the map or layer.
   */
  isClickListenerEnabled(layerPath?: string): boolean | undefined {
    if (layerPath) return this.resultsSet[layerPath].data.click!.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultsSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultsSet[key].data.click!.eventListenerEnabled;
      if (returnValue !== this.resultsSet[key].data.click!.eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }

  /**
   * Function used to enable listening of hover events. When a layer path is not provided,
   * hover events listening is enabled for all layers
   *
   * @param {string} layerPath Optional parameter used to enable only one layer
   */
  enableHoverListener(layerPath?: string) {
    if (layerPath) this.resultsSet[layerPath].data.hover!.eventListenerEnabled = true;
    else
      Object.keys(this.resultsSet).forEach((key: string) => {
        this.resultsSet[key].data.hover!.eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of hover events. When a layer path is not provided,
   * hover events listening is disable for all layers
   *
   * @param {string} layerPath Optional parameter used to disable only one layer
   */
  disableHoverListener(layerPath?: string) {
    if (layerPath) this.resultsSet[layerPath].data.hover!.eventListenerEnabled = false;
    else
      Object.keys(this.resultsSet).forEach((key: string) => {
        this.resultsSet[key].data.hover!.eventListenerEnabled = false;
      });
  }

  /**
   * Function used to determine whether hover events are disabled for a layer. When a layer path is not provided,
   * the value returned is undefined if the map flags are a mixture of true and false values.
   *
   * @param {string} layerPath Optional parameter used to get the flag value of a layer.
   *
   * @returns {boolean | undefined} The flag value for the map or layer.
   */
  isHoverListenerEnabled(layerPath?: string): boolean | undefined {
    if (layerPath) return this.resultsSet[layerPath].data.hover!.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultsSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultsSet[key].data.hover!.eventListenerEnabled;
      if (returnValue !== this.resultsSet[key].data.hover!.eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }

  /**
   * Helper function used to instanciate a FeatureInfoLayerSet object. This function
   * must be used in place of the "new FeatureInfoLayerSet" syntax.
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
