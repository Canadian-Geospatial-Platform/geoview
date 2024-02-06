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
  payloadIsQueryLayer,
} from '@/api/events/payloads';
import { Coordinate, api, getLocalizedValue } from '@/app';
import { LayerSet } from './layer-set';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { logger } from '@/core/utils/logger';

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

  /** Private variable that keeps the click disable flags associated to the layerPath  * /
  private disableClickOnLayer: {
    [layerPath: string]: boolean;
  } = {};

  /** Private variable that keeps the hover disable flags associated to the layerPath  * /
  private disableHoverOverLayer: {
    [layerPath: string]: boolean;
  } = {};

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
    // This function determines whether a layer can be registered.
    const registrationConditionFunction = (layerPath: string): boolean => {
      // Log
      logger.logTraceCore('FeatureInfoLayerSet registration condition...', layerPath, Object.keys(this.resultsSet));

      const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath];
      const queryable = layerConfig?.source?.featureInfo?.queryable;
      return !!queryable;
    };

    // This function is used to initialise the data property of the layer path entry.
    const registrationUserDataInitialisation = (layerPath: string) => {
      // Log
      logger.logTraceCore('FeatureInfoLayerSet initializing...', layerPath, Object.keys(this.resultsSet));

      this.resultsSet[layerPath] = {
        layerStatus: api.maps[this.mapId].layer.registeredLayers[layerPath].layerStatus!,
        layerPhase: api.maps[this.mapId].layer.registeredLayers[layerPath].layerPhase!,
        data: {},
        layerName: getLocalizedValue(api.maps[mapId].layer.registeredLayers[layerPath].layerName, mapId) ?? '',
      };
      ArrayOfEventTypes.forEach((eventType) => {
        this.resultsSet[layerPath].data[eventType] = {
          layerName: getLocalizedValue(api.maps[mapId].layer.registeredLayers[layerPath].layerName, mapId) ?? '',
          layerStatus: api.maps[this.mapId].layer.registeredLayers[layerPath].layerStatus!,
          eventListenerEnabled: true,
          queryStatus: 'processed',
          features: [],
          layerPath,
        };
      });

      // Propagate feature info to the store, now that the this.resultsSet is more representative of the reality
      FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, layerPath, 'click', this.resultsSet);
    };

    this.mapId = mapId;
    this.layerSet = new LayerSet(
      mapId,
      `${mapId}/FeatureInfoLayerSet`,
      this.resultsSet,
      registrationConditionFunction,
      registrationUserDataInitialisation
    );

    /*
     * @param {EventType} eventType The event type (ex.: "click" | "hover" | "crosshaire-enter" | "all-features")
     * @param {QueryType} queryType The query type (ex.: "all" | "at_pixel" | "at_coordinate" | "at_long_lat", ...)
     * @param {Coordinate} coordinate The coordinate of the event
     */
    const createQueryLayerPayload = (eventType: EventType, queryType: QueryType, coordinate: Coordinate): void => {
      // Reinitialize the resultsSet
      Object.keys(this.resultsSet).forEach((layerPath) => {
        if (!this.resultsSet[layerPath].data[eventType]!.eventListenerEnabled) return;
        const dataForEventType = this.resultsSet[layerPath].data[eventType] as TypeLayerData;
        dataForEventType.queryStatus = 'init';
        dataForEventType.features = undefined;
        // TODO: Check if the above is enough for basically resetting the queryStatus to 'init'
      });

      // Propagate initialization to the store
      FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, 'unused_var', eventType, this.resultsSet);

      // Loop on each layer path in the resultsSet
      Object.keys(this.resultsSet).forEach((layerPath) => {
        if (!this.resultsSet[layerPath].data[eventType]!.eventListenerEnabled) return;
        const dataForEventType = this.resultsSet[layerPath].data[eventType] as TypeLayerData;
        if (api.maps[this.mapId].layer.registeredLayers[layerPath].layerStatus === 'loaded') {
          dataForEventType.features = dataForEventType.eventListenerEnabled ? undefined : [];
          dataForEventType.queryStatus = dataForEventType.eventListenerEnabled ? 'processing' : 'processed';
          dataForEventType.layerName = getLocalizedValue(api.maps[mapId].layer.registeredLayers[layerPath].layerName, mapId) ?? '';
        } else {
          dataForEventType.features = [];
          dataForEventType.queryStatus = 'error';
          dataForEventType.layerName = getLocalizedValue(api.maps[mapId].layer.registeredLayers[layerPath].layerName, mapId) ?? '';
        }

        if (dataForEventType.eventListenerEnabled && dataForEventType.queryStatus !== 'error') {
          api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(`${this.mapId}/${layerPath}`, queryType, coordinate, eventType));
        }

        // Propagate feature info to the store for each layer path of the results set
        FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, layerPath, eventType, this.resultsSet);
      });
    };

    // Listen to "map click"-"crosshair enter" and send a query layers event to queryable layers. These layers will return a result set of features.
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        if (payloadIsAMapMouseEvent(payload)) {
          // Log
          logger.logTraceDetailed('feature-info-layer-set on EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK', this.mapId, payload);

          createQueryLayerPayload('click', 'at_long_lat', payload.coordinates.lnglat);
        }
      },
      this.mapId
    );

    // ! Do we want to keep this type of event? I think we already said that we want to remove it.
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENTER,
      (payload) => {
        if (payloadIsALngLat(payload)) {
          // Log
          logger.logTraceDetailed('feature-info-layer-set on EVENT_NAMES.MAP.EVENT_MAP_CROSSHAIR_ENTER', this.mapId, payload);

          createQueryLayerPayload('crosshaire-enter', 'at_long_lat', payload.lnglat);
        }
      },
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE,
      debounce((payload) => {
        if (payloadIsAMapMouseEvent(payload)) {
          // Log
          logger.logTraceDetailed('feature-info-layer-set on EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE', this.mapId, payload);

          createQueryLayerPayload('hover', 'at_pixel', payload.coordinates.pixel);
        }
      }, 750),
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.GET_ALL_LAYER_FEATURES,
      (payload) => {
        if (payloadIsQueryLayer(payload)) {
          // Log
          logger.logTraceDetailed('feature-info-layer-set on EVENT_NAMES.GET_FEATURE_INFO.GET_ALL_LAYER_FEATURES', this.mapId);

          const layerPath = payload.location as string;
          if (!this.resultsSet[layerPath].data['all-features']!.eventListenerEnabled) return;
          const dataForEventType = this.resultsSet[layerPath].data['all-features'] as TypeLayerData;
          if (api.maps[this.mapId].layer.registeredLayers[layerPath].layerStatus === 'loaded') {
            dataForEventType.features = undefined;
            dataForEventType.queryStatus = 'processing';
            dataForEventType.layerName = getLocalizedValue(api.maps[mapId].layer.registeredLayers[layerPath].layerName, mapId) ?? '';
          } else {
            dataForEventType.features = [];
            dataForEventType.queryStatus = 'error';
            dataForEventType.layerName = getLocalizedValue(api.maps[mapId].layer.registeredLayers[layerPath].layerName, mapId) ?? '';
          }

          if (dataForEventType.eventListenerEnabled && dataForEventType.queryStatus !== 'error') {
            api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(`${this.mapId}/${layerPath}`, 'all', layerPath));
          }
          // Propagate feature info to the store, now that the this.resultsSet is more representative of the reality
          FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, layerPath, 'all-features', this.resultsSet);
        }
      },
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT,
      (payload) => {
        if (payloadIsQueryResult(payload)) {
          // Log
          logger.logTraceDetailed('feature-info-layer-set on EVENT_NAMES.GET_FEATURE_INFO.QUERY_RESULT', this.mapId, payload);

          const { layerPath, queryType, arrayOfRecords, eventType } = payload;
          if (this.resultsSet?.[layerPath]?.data) {
            const dataForEventType = this.resultsSet[layerPath].data[eventType] as TypeLayerData;
            dataForEventType.features = arrayOfRecords;
            dataForEventType.layerStatus = api.maps[this.mapId].layer.registeredLayers[layerPath].layerStatus!;
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
}
