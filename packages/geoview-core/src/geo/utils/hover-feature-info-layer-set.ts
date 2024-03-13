import debounce from 'lodash/debounce';

import Feature from 'ol/Feature';
import { Coordinate } from 'ol/coordinate';
import { EVENT_NAMES } from '@/api/events/event-types';
import { PayloadBaseClass, payloadIsLayerSetChangeLayerStatus, payloadIsAMapMouseEvent } from '@/api/events/payloads';
import { api, LayerApi } from '@/app';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { logger } from '@/core/utils/logger';
import { getLocalizedValue } from '@/core/utils/utilities';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

import { LayerSet, TypeFieldEntry, TypeGeometry, TypeQueryStatus } from './layer-set';

export type TypeHoverFeatureInfo =
  | {
      geoviewLayerType: TypeGeoviewLayerType;
      featureIcon: HTMLCanvasElement;
      geometry: TypeGeometry | Feature | null;
      fieldInfo: Partial<Record<string, TypeFieldEntry>>;
      nameField: string | null;
    }
  | undefined
  | null;

export type TypeHoverLayerData = {
  layerPath: string;
  layerName: string;
  layerStatus: TypeLayerStatus;
  eventListenerEnabled: boolean;
  // When property features is undefined, we are waiting for the query result.
  // when Array.isArray(features) is true, the features property contains the query result.
  // when property features is null, the query ended with an error.
  queryStatus: TypeQueryStatus;
  feature: TypeHoverFeatureInfo;
};
export type TypeHoverFeatureInfoResultSetEntry = {
  layerName?: string;
  layerStatus: TypeLayerStatus;
  data: TypeHoverLayerData;
};

export type TypeHoverFeatureInfoResultSet = {
  [layerPath: string]: TypeHoverFeatureInfoResultSetEntry;
};

type TypeFeatureInfoLayerSetInstance = { [mapId: string]: HoverFeatureInfoLayerSet };

/** ***************************************************************************************************************************
 * A class containing a set of layers associated with a TypeLayerData object, which will receive the result of a
 * "get feature info" request made on the map layers when the user hovers over a position in a stationary way.
 *
 * @class HoverFeatureInfoLayerSet
 */
export class HoverFeatureInfoLayerSet extends LayerSet {
  /** Private static variable to keep the single instance that can be created by this class for a mapId (see singleton design pattern) */
  private static featureInfoLayerSetInstance: TypeFeatureInfoLayerSetInstance = {};

  /** An object containing the result sets indexed using the layer path */
  declare resultSet: TypeHoverFeatureInfoResultSet;

  /** ***************************************************************************************************************************
   * The class constructor that instanciate a set of layer.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   */
  private constructor(layerApi: LayerApi, mapId: string) {
    super(layerApi, mapId, `${mapId}/hover/FeatureInfoLayerSet`, {});
    this.setRegistrationConditionFunction();
    this.setUserRegistrationInitFunction();
    this.setMapHoverListener();
  }

  /* **************************************************************************************************************************
   * This function determines whether a layer can be registered or not.
   */
  setRegistrationConditionFunction() {
    this.registrationConditionFunction = (layerPath: string): boolean => {
      // Log
      logger.logTraceCore('HOVER-FEATURE-INFO-LAYER-SET setRegistrationConditionFunction', layerPath, Object.keys(this.resultSet));

      const layerConfig = this.layerApi.registeredLayers[layerPath];
      const queryable = layerConfig?.source?.featureInfo?.queryable;
      return !!queryable;
    };
  }

  /** ***************************************************************************************************************************
   * Define the initialization function that the registration process will use to create a new entry in the layer set for a
   * specific layer path.
   */
  setUserRegistrationInitFunction() {
    this.registrationUserInitialisation = (layerPath: string) => {
      // Log
      logger.logTraceCore('HOVER-FEATURE-INFO-LAYER-SET setUserRegistrationInitFunction', layerPath, Object.keys(this.resultSet));

      const layerConfig = this.layerApi.registeredLayers[layerPath];
      this.resultSet[layerPath] = {
        layerName: getLocalizedValue(layerConfig.layerName, this.mapId) ?? '',
        layerStatus: layerConfig.layerStatus!,
        data: {
          layerName: getLocalizedValue(layerConfig.layerName, this.mapId) ?? '',
          layerStatus: layerConfig.layerStatus!,
          eventListenerEnabled: true,
          queryStatus: 'processed',
          feature: undefined,
          layerPath,
        },
      };
      FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, 'hover', this.resultSet);
    };
  }

  /** ***************************************************************************************************************************
   * The listener that will handle the CHANGE_LAYER_STATUS event triggered on the map.This method is called by the parent class
   * LayerSet via the listener created by the setChangeLayerStatusListenerFunctions method.
   *
   * @param {PayloadBaseClass} payload The payload to process.
   */
  protected changeLayerStatusListenerFunctions(payload: PayloadBaseClass) {
    if (payloadIsLayerSetChangeLayerStatus(payload)) {
      // Log
      logger.logTraceCoreAPIEvent('HOVER-FEATURE-INFO-LAYER-SET on EVENT_NAMES.LAYER_SET.CHANGE_LAYER_STATUS', this.mapId, payload);

      const { layerPath, layerStatus } = payload;
      // if layer's status flag exists and is different than the new one
      if (this.resultSet?.[layerPath]?.layerStatus && this.resultSet?.[layerPath]?.layerStatus !== layerStatus) {
        if (layerStatus === 'error') delete this.resultSet[layerPath];
        else {
          const layerConfig = this.layerApi.registeredLayers[layerPath];
          super.changeLayerStatusListenerFunctions(payload);
          if (this?.resultSet?.[layerPath]?.data) {
            this.resultSet[layerPath].data.layerStatus = layerStatus;
            FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, 'hover', this.resultSet);
          }
        }
      }
    }
  }

  /* **************************************************************************************************************************
   * Private method used to emit a query layer event for all layers in the result set that are loaded. Layers that has an error
   * are set with an null features array and a queryStatus equal to 'error'.
   *
   * @param {Coordinate} coordinate The coordinate of the event
   */
  private createQueryLayerPayload = (coordinate: Coordinate): void => {
    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet
    Object.keys(this.resultSet).forEach((layerPath) => {
      const layerConfig = this.layerApi.registeredLayers[layerPath];
      const { data } = this.resultSet[layerPath];
      if (!data.eventListenerEnabled) return;
      if (layerConfig.layerStatus === 'loaded') {
        data.feature = undefined;
        data.queryStatus = 'init';

        // Query and event types of what we're doing
        const queryType = 'at_pixel';
        const eventType = 'hover';

        // Process query on results data
        this.processQueryResultSetData(data, layerConfig, layerPath, queryType, coordinate).then((arrayOfRecords) => {
          if (arrayOfRecords === null) {
            this.resultSet[layerPath].data.queryStatus = 'error';
            this.resultSet[layerPath].data.layerStatus = layerConfig.layerStatus!;
            this.resultSet[layerPath].data.feature = null;
          } else {
            if (arrayOfRecords?.length) {
              data.feature = {
                featureIcon: arrayOfRecords![0].featureIcon,
                fieldInfo: arrayOfRecords![0].fieldInfo,
                geometry: arrayOfRecords![0].geometry,
                geoviewLayerType: arrayOfRecords![0].geoviewLayerType,
                nameField: arrayOfRecords![0].nameField,
              };
            } else {
              data.feature = undefined;
            }
            data.layerStatus = layerConfig.layerStatus!;
            data.queryStatus = 'processed';
          }

          // Propagate to the store
          FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, eventType, this.resultSet);
        });
      } else {
        data.feature = null;
        data.queryStatus = 'error';
      }
    });
  };

  /** ***************************************************************************************************************************
   * Listen to "map hover" and send a query layers event to queryable layers. These layers will return a result set of features.
   */
  setMapHoverListener() {
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE,
      debounce((payload) => {
        // Log
        logger.logTraceCoreAPIEvent('HOVER-FEATURE-INFO-LAYER-SET on EVENT_NAMES.MAP.EVENT_MAP_POINTER_MOVE', this.mapId, payload);

        if (payloadIsAMapMouseEvent(payload)) {
          this.createQueryLayerPayload(payload.coordinates.pixel);
        }
      }, 750),
      this.mapId
    );
  }

  /**
   * Function used to enable listening of hover events. When a layer path is not provided,
   * hover events listening is enabled for all layers
   *
   * @param {string} layerPath Optional parameter used to enable only one layer
   */
  enableHoverListener(layerPath?: string) {
    if (layerPath) this.resultSet[layerPath].data.eventListenerEnabled = true;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of hover events. When a layer path is not provided,
   * hover events listening is disable for all layers
   *
   * @param {string} layerPath Optional parameter used to disable only one layer
   */
  disableHoverListener(layerPath?: string) {
    if (layerPath) this.resultSet[layerPath].data.eventListenerEnabled = false;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.eventListenerEnabled = false;
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
    if (layerPath) return !!this.resultSet?.[layerPath]?.data?.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultSet[key].data.eventListenerEnabled;
      if (returnValue !== this.resultSet[key].data.eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }

  /**
   * Helper function used to instanciate a FeatureInfoLayerSet object. This function
   * must be used in place of the "new FeatureInfoLayerSet" syntax.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   * @param {string} mapId The map identifier the layer set belongs to.
   *
   * @returns {FeatureInfoLayerSet} the FeatureInfoLayerSet object created
   */
  static get(layerApi: LayerApi, mapId: string): HoverFeatureInfoLayerSet {
    if (!HoverFeatureInfoLayerSet.featureInfoLayerSetInstance[mapId])
      HoverFeatureInfoLayerSet.featureInfoLayerSetInstance[mapId] = new HoverFeatureInfoLayerSet(layerApi, mapId);
    return HoverFeatureInfoLayerSet.featureInfoLayerSetInstance[mapId];
  }

  /**
   * Function used to delete a FeatureInfoLayerSet object associated to a mapId.
   *
   * @param {string} mapId The map identifier the layer set belongs to.
   */
  static delete(mapId: string) {
    if (HoverFeatureInfoLayerSet.featureInfoLayerSetInstance[mapId]) delete HoverFeatureInfoLayerSet.featureInfoLayerSetInstance[mapId];
  }
}
