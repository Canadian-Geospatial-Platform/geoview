import debounce from 'lodash/debounce';

import Feature from 'ol/Feature';
import { Coordinate } from 'ol/coordinate';
import { EVENT_NAMES } from '@/api/events/event-types';
import { payloadIsAMapMouseEvent } from '@/api/events/payloads';
import { api, LayerApi } from '@/app';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { logger } from '@/core/utils/logger';
import { getLocalizedValue } from '@/core/utils/utilities';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { AbstractGeoViewLayer, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

import { LayerSet, TypeFieldEntry, TypeGeometry, TypeQueryStatus } from './layer-set';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

/**
 * A class containing a set of layers associated with a TypeLayerData object, which will receive the result of a
 * "get feature info" request made on the map layers when the user hovers over a position in a stationary way.
 *
 * @class HoverFeatureInfoLayerSet
 */
export class HoverFeatureInfoLayerSet extends LayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeHoverFeatureInfoResultSet */
  declare resultSet: TypeHoverFeatureInfoResultSet;

  /**
   * The class constructor that instanciate a set of layer.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   *
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);

    // Wire a listener on the map hover
    // TODO: Refactor - Revise this when revisiting the hover query process
    this.setMapHoverListener();
  }

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractGeoViewLayer} geoviewLayer The geoview layer being registered
   * @param {string} layerPath The layer path
   */
  protected onRegisterLayerCheck = (geoviewLayer: AbstractGeoViewLayer, layerPath: string): boolean => {
    // Log
    logger.logTraceCore('HOVER-FEATURE-INFO-LAYER-SET - onRegisterLayerCheck', layerPath, Object.keys(this.resultSet));

    const layerConfig = this.layerApi.registeredLayers[layerPath];
    const queryable = (layerConfig as AbstractBaseLayerEntryConfig)?.source?.featureInfo?.queryable;
    return !!queryable;
  };

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractGeoViewLayer} geoviewLayer The geoview layer being registered
   * @param {string} layerPath The layer path
   */
  protected onRegisterLayer = (geoviewLayer: AbstractGeoViewLayer, layerPath: string): void => {
    // Log
    logger.logTraceCore('HOVER-FEATURE-INFO-LAYER-SET - onRegisterLayer', layerPath, Object.keys(this.resultSet));

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

  /**
   * Overrides the behavior to apply when a layer status changed for a hover-feature-info-layer-set.
   * @param {ConfigBaseClass} config The layer config class
   * @param {string} layerPath The layer path being affected
   * @param {string} layerStatus The new layer status
   */
  protected onProcessLayerStatusChanged(config: ConfigBaseClass, layerPath: string, layerStatus: TypeLayerStatus): void {
    // if layer's status flag exists and is different than the new one
    if (this.resultSet?.[layerPath]?.layerStatus && this.resultSet?.[layerPath]?.layerStatus !== layerStatus) {
      if (layerStatus === 'error') delete this.resultSet[layerPath];
      else {
        // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
        super.onProcessLayerStatusChanged(config, layerPath, layerStatus);

        const layerConfig = this.layerApi.registeredLayers[layerPath];
        if (this?.resultSet?.[layerPath]?.data) {
          this.resultSet[layerPath].data.layerStatus = layerStatus;
          FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, 'hover', this.resultSet);
        }
      }
    }
  }

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   *
   * @param {Coordinate} pixelCoordinate The pixel coordinate where to query the features
   */
  queryLayers = (pixelCoordinate: Coordinate): void => {
    // Query and event types of what we're doing
    const queryType = 'at_pixel';
    const eventType = 'hover';

    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet
    Object.keys(this.resultSet).forEach((layerPath) => {
      const layerConfig = this.layerApi.registeredLayers[layerPath] as AbstractBaseLayerEntryConfig;
      const { data } = this.resultSet[layerPath];
      if (!data.eventListenerEnabled) return;
      if (layerConfig.layerStatus === 'loaded') {
        data.feature = undefined;
        data.queryStatus = 'init';

        // Process query on results data
        this.queryLayerFeatures(data, layerConfig, layerPath, queryType, pixelCoordinate).then((arrayOfRecords) => {
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
          // Query all layers which can be queried
          this.queryLayers(payload.coordinates.pixel);
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
}

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
