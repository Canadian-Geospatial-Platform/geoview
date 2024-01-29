/* eslint-disable @typescript-eslint/no-explicit-any */
import debounce from 'lodash/debounce';

import { EVENT_NAMES } from '@/api/events/event-types';
import {
  GetFeatureInfoPayload,
  payloadIsQueryResult,
  TypeFeatureInfoResultSets,
  payloadIsAMapMouseEvent,
  payloadIsALngLat,
  ArrayOfEventTypes,
} from '@/api/events/payloads';
import { TypeLayerEntryConfig, api, getLocalizedValue } from '@/app';
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

  /** Private variable that keeps the click disable flags associated to the layerPath  */
  private disableClickOnLayer: {
    [layerPath: string]: boolean;
  } = {};

  /** Private variable that keeps the hover disable flags associated to the layerPath  */
  private disableHoverOverLayer: {
    [layerPath: string]: boolean;
  } = {};

  /** Flag used to disable hover event for the entire layerSet */
  private disableHover = false;

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
      // Log
      logger.logTraceCore('FeatureInfoLayerSet registration condition...', layerPath, Object.keys(this.resultSets));

      const layerConfig = api.maps[this.mapId].layer.registeredLayers[layerPath] as TypeLayerEntryConfig;
      const queryable = layerConfig?.source?.featureInfo?.queryable;
      return !!queryable;
    };

    // This function is used to initialise the data property of the layer path entry.
    const registrationUserDataInitialisation = (layerPath: string) => {
      // Log
      logger.logTraceCore('FeatureInfoLayerSet initializing...', layerPath, Object.keys(this.resultSets));

      this.disableClickOnLayer[layerPath] = false;
      this.disableHoverOverLayer[layerPath] = false;
      this.resultSets[layerPath].data = {};
      ArrayOfEventTypes.forEach((eventType) => {
        this.resultSets[layerPath].data[eventType] = {
          features: [],
          layerPath,
          layerName: getLocalizedValue((api.maps[mapId].layer.registeredLayers[layerPath] as TypeLayerEntryConfig).layerName, mapId) ?? '',
          layerStatus: api.maps[this.mapId].layer.registeredLayers[layerPath].layerStatus!,
        };
        this.resultSets[layerPath].data[eventType] = undefined;
      });

      // Propagate feature info to the store, now that the this.resultSets is more representative of the reality
      FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, layerPath, 'click', this.resultSets);
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
          // Log
          logger.logTraceDetailed('feature-info-layer-set on EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK', this.mapId, payload);

          Object.keys(this.resultSets).forEach((layerPath) => {
            if (this.disableClickOnLayer[layerPath]) return;
            this.resultSets[layerPath].data.click = {
              features: undefined,
              layerPath,
              layerName:
                getLocalizedValue((api.maps[mapId].layer.registeredLayers[layerPath] as TypeLayerEntryConfig).layerName, mapId) ?? '',
              layerStatus: api.maps[this.mapId].layer.registeredLayers[layerPath].layerStatus!,
            };
          });
          // When property features is undefined, we are waiting for the query result.
          // when Array.isArray(features) is true, the features property contains the query result.
          // when property features is null, the query ended with an error.
          api.event.emit(
            GetFeatureInfoPayload.createQueryLayerPayload(
              this.mapId,
              'at_long_lat',
              this.disableClickOnLayer,
              payload.coordinates.lnglat,
              'click'
            )
          );
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

          Object.keys(this.resultSets).forEach((layerPath) => {
            this.resultSets[layerPath].data['crosshaire-enter'] = undefined;
          });
          api.event.emit(
            GetFeatureInfoPayload.createQueryLayerPayload(
              this.mapId,
              'at_long_lat',
              this.disableClickOnLayer,
              payload.lnglat,
              'crosshaire-enter'
            )
          );
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

          Object.keys(this.resultSets).forEach((layerPath) => {
            if (this.disableHoverOverLayer[layerPath]) return;
            this.resultSets[layerPath].data.hover = {
              features: undefined,
              layerPath,
              layerName:
                getLocalizedValue((api.maps[mapId].layer.registeredLayers[layerPath] as TypeLayerEntryConfig).layerName, mapId) ?? '',
              layerStatus: api.maps[this.mapId].layer.registeredLayers[layerPath].layerStatus!,
            };
          });
          api.event.emit(
            GetFeatureInfoPayload.createQueryLayerPayload(
              this.mapId,
              'at_pixel',
              this.disableHoverOverLayer,
              payload.coordinates.pixel,
              'hover'
            )
          );
        }
      }, 750),
      this.mapId
    );

    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_GET_ALL_FEATURES,
      () => {
        // Log
        logger.logTraceDetailed('feature-info-layer-set on EVENT_NAMES.MAP.EVENT_MAP_GET_ALL_FEATURES', this.mapId);

        Object.keys(this.resultSets).forEach((layerPath) => {
          if (this.disableClickOnLayer[layerPath]) return;
          this.resultSets[layerPath].data['all-features'] = {
            features: undefined,
            layerPath,
            layerName:
              getLocalizedValue((api.maps[mapId].layer.registeredLayers[layerPath] as TypeLayerEntryConfig).layerName, mapId) ?? '',
            layerStatus: api.maps[this.mapId].layer.registeredLayers[layerPath].layerStatus!,
          };
        });
        api.event.emit(GetFeatureInfoPayload.createQueryLayerPayload(this.mapId, 'all', this.disableClickOnLayer));
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
          if (this.resultSets?.[layerPath]?.data) {
            this.resultSets[layerPath].data[eventType] = {
              features: arrayOfRecords,
              layerPath,
              layerName:
                getLocalizedValue((api.maps[mapId].layer.registeredLayers[layerPath] as TypeLayerEntryConfig).layerName, mapId) ?? '',
              layerStatus: api.maps[this.mapId].layer.registeredLayers[layerPath].layerStatus!,
            };
            FeatureInfoEventProcessor.propagateFeatureInfoToStore(mapId, layerPath, eventType, this.resultSets);
          }

          const allDone = Object.keys(this.resultSets).reduce((doneFlag, layerPathToTest) => {
            return doneFlag && this.resultSets[layerPathToTest].data[eventType]?.features !== undefined;
          }, true);

          if (allDone) {
            api.event.emit(
              GetFeatureInfoPayload.createAllQueriesDonePayload(
                this.layerSet.layerSetId,
                eventType,
                layerPath,
                queryType,
                this.layerSet.layerSetId,
                this.resultSets
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
    if (layerPath) this.disableClickOnLayer[layerPath] = false;
    else
      Object.keys(this.disableClickOnLayer).forEach((key: string) => {
        this.disableClickOnLayer[key] = false;
      });
  }

  /**
   * Function used to disable listening of click events. When a layer path is not provided,
   * click events listening is disable for all layers
   *
   * @param {string} layerPath Optional parameter used to disable only one layer
   */
  disableClickListener(layerPath?: string) {
    if (layerPath) this.disableClickOnLayer[layerPath] = true;
    else
      Object.keys(this.disableClickOnLayer).forEach((key: string) => {
        this.disableClickOnLayer[key] = true;
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
  isClickListenerdisabled(layerPath?: string): boolean | undefined {
    if (layerPath) return this.disableClickOnLayer[layerPath];

    let returnValue: boolean | undefined;
    Object.keys(this.disableClickOnLayer).forEach((key: string, i) => {
      if (i === 0) returnValue = this.disableClickOnLayer[key];
      if (returnValue !== this.disableClickOnLayer[key]) returnValue = undefined;
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
    if (layerPath) this.disableHoverOverLayer[layerPath] = false;
    else
      Object.keys(this.disableHoverOverLayer).forEach((key: string) => {
        this.disableHoverOverLayer[key] = false;
      });
  }

  /**
   * Function used to disable listening of hover events. When a layer path is not provided,
   * hover events listening is disable for all layers
   *
   * @param {string} layerPath Optional parameter used to disable only one layer
   */
  disableHoverListener(layerPath?: string) {
    if (layerPath) this.disableHoverOverLayer[layerPath] = true;
    else
      Object.keys(this.disableHoverOverLayer).forEach((key: string) => {
        this.disableHoverOverLayer[key] = true;
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
  isHoverListenerdisabled(layerPath?: string): boolean | undefined {
    if (layerPath) return this.disableHoverOverLayer[layerPath];

    let returnValue: boolean | undefined;
    Object.keys(this.disableHoverOverLayer).forEach((key: string, i) => {
      if (i === 0) returnValue = this.disableHoverOverLayer[key];
      if (returnValue !== this.disableHoverOverLayer[key]) returnValue = undefined;
    });
    return returnValue;
  }
}
