import debounce from 'lodash/debounce';

import { Coordinate } from 'ol/coordinate';
import { logger } from '@/core/utils/logger';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLayerEntryConfig, TypeLayerStatus } from '@/geo/map/map-schema-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { LayerSet, TypeFieldEntry, TypeQueryStatus } from './layer-set';
import { LayerApi } from '@/geo/layer/layer';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

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
   * @param {LayerApi} layerApi - The layer Api to work with.
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);

    // Register a handler on the map pointer move
    layerApi.mapViewer.onMapPointerMove(
      debounce((mapViewer, payload) => {
        // Query all layers which can be queried
        this.queryLayers(payload.pixel);
      }, 750).bind(this)
    );
  }

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractGeoViewLayer} geoviewLayer - The geoview layer being registered
   * @param {TypeLayerEntryConfig} layerConfig - The layer config
   * @returns {boolean} True when the layer should be registered to this hover-feature-info-layer-set.
   */
  protected onRegisterLayerCheck(geoviewLayer: AbstractGeoViewLayer, layerConfig: TypeLayerEntryConfig): boolean {
    // Log
    logger.logTraceCore('HOVER-FEATURE-INFO-LAYER-SET - onRegisterLayerCheck', layerConfig.layerPath, Object.keys(this.resultSet));

    // TODO: refactor layer - get flag from layer itself, not config
    // TD.CONT: we should use the layerPath associated to thelayer we register and do not use layerPath parameter
    const queryable = layerConfig.schemaTag === CONST_LAYER_TYPES.WMS ? false : layerConfig?.source?.featureInfo?.queryable;
    return !!queryable;
  }

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractGeoViewLayer} geoviewLayer - The geoview layer being registered
   * @param {TypeLayerEntryConfig} layerConfig - The layer config
   */
  protected onRegisterLayer(geoviewLayer: AbstractGeoViewLayer, layerConfig: TypeLayerEntryConfig): void {
    // Log
    logger.logTraceCore('HOVER-FEATURE-INFO-LAYER-SET - onRegisterLayer', layerConfig.layerPath, Object.keys(this.resultSet));

    // Call parent
    super.onRegisterLayer(geoviewLayer, layerConfig);

    // TODO: refactor layer - we should use the layerPath associated to the layer we register and do not use layerPath parameter
    this.resultSet[layerConfig.layerPath] = {
      layerStatus: layerConfig.layerStatus!,
      data: {
        layerStatus: layerConfig.layerStatus!,
        eventListenerEnabled: true,
        queryStatus: 'processed',
        feature: undefined,
      },
    };
  }

  /**
   * Overrides the behavior to apply when a layer status changed for a hover-feature-info-layer-set.
   * @param {ConfigBaseClass} config - The layer config class
   * @param {string} layerPath - The layer path being affected
   * @param {string} layerStatus - The new layer status
   */
  protected onProcessLayerStatusChanged(config: ConfigBaseClass, layerPath: string, layerStatus: TypeLayerStatus): void {
    // TODO: layer api should manage the add and remove from layer related to the layer status
    // if layer's status flag exists and is different than the new one
    if (this.resultSet?.[layerPath]?.layerStatus && this.resultSet?.[layerPath]?.layerStatus !== layerStatus) {
      if (layerStatus === 'error') delete this.resultSet[layerPath];
      else {
        // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
        super.onProcessLayerStatusChanged(config, layerPath, layerStatus);

        if (this?.resultSet?.[layerPath]?.data) {
          this.resultSet[layerPath].data.layerStatus = layerStatus;
        }
      }
    }
  }

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   * @param {Coordinate} pixelCoordinate - The pixel coordinate where to query the features
   */
  queryLayers(pixelCoordinate: Coordinate): void {
    // Query types of what we're doing
    const queryType = 'at_pixel';

    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet
    Object.keys(this.resultSet).forEach((layerPath) => {
      const layerConfig = this.layerApi.registeredLayers[layerPath];
      const { data } = this.resultSet[layerPath];
      if (!data.eventListenerEnabled) return;
      if (layerConfig.layerStatus === 'loaded') {
        data.feature = undefined;
        data.queryStatus = 'init';

        // Process query on results data
        this.queryLayerFeatures(data, layerConfig, layerPath, queryType, pixelCoordinate)
          .then((arrayOfRecords) => {
            if (arrayOfRecords === null) {
              this.resultSet[layerPath].data.queryStatus = 'error';
              this.resultSet[layerPath].data.layerStatus = layerConfig.layerStatus!;
              this.resultSet[layerPath].data.feature = null;
            } else {
              if (arrayOfRecords?.length) {
                const nameField = arrayOfRecords![0].nameField || (Object.entries(arrayOfRecords![0].fieldInfo)[0] as unknown as string);
                const fieldInfo = arrayOfRecords![0].fieldInfo[nameField as string];

                data.feature = {
                  featureIcon: arrayOfRecords![0].featureIcon,
                  fieldInfo,
                  geoviewLayerType: arrayOfRecords![0].geoviewLayerType,
                  nameField,
                };
              } else {
                data.feature = undefined;
              }
              data.layerStatus = layerConfig.layerStatus!;
              data.queryStatus = 'processed';
            }

            // Propagate to the store
            MapEventProcessor.setMapHoverFeatureInfo(this.mapId, this.resultSet[layerPath].data.feature);
          })
          .catch((error) => {
            // Log
            logger.logPromiseFailed('queryLayerFeatures in queryLayers in hoverFeatureInfoLayerSet', error);
          });
      } else {
        data.feature = null;
        data.queryStatus = 'error';
      }
    });
  }

  /**
   * Function used to enable listening of hover events. When a layer path is not provided,
   * hover events listening is enabled for all layers.
   * @param {string} layerPath - Optional parameter used to enable only one layer
   */
  enableHoverListener(layerPath?: string): void {
    if (layerPath) this.resultSet[layerPath].data.eventListenerEnabled = true;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of hover events. When a layer path is not provided,
   * hover events listening is disable for all layers.
   * @param {string} layerPath - Optional parameter used to disable only one layer
   */
  disableHoverListener(layerPath?: string): void {
    if (layerPath) this.resultSet[layerPath].data.eventListenerEnabled = false;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.eventListenerEnabled = false;
      });
  }

  /**
   * Function used to determine whether hover events are disabled for a layer. When a layer path is not provided,
   * the value returned is undefined if the map flags are a mixture of true and false values.
   * @param {string} layerPath - Optional parameter used to get the flag value of a layer.
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
      fieldInfo: TypeFieldEntry | undefined;
      nameField: string | null;
    }
  | undefined
  | null;

export type TypeHoverLayerData = {
  layerStatus: TypeLayerStatus;
  eventListenerEnabled: boolean;
  queryStatus: TypeQueryStatus;
  feature: TypeHoverFeatureInfo;
};

export type TypeHoverFeatureInfoResultSetEntry = {
  layerStatus: TypeLayerStatus;
  data: TypeHoverLayerData;
};

export type TypeHoverFeatureInfoResultSet = {
  [layerPath: string]: TypeHoverFeatureInfoResultSetEntry;
};
