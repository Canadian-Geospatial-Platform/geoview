import debounce from 'lodash/debounce';

import { Coordinate } from 'ol/coordinate';
import { logger } from '@/core/utils/logger';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractLayerSet, TypeFieldEntry, TypeQueryStatus } from './abstract-layer-set';
import { LayerApi } from '@/geo/layer/layer';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

/**
 * A class containing a set of layers associated with a TypeLayerData object, which will receive the result of a
 * "get feature info" request made on the map layers when the user hovers over a position in a stationary way.
 *
 * @class HoverFeatureInfoLayerSet
 */
export class HoverFeatureInfoLayerSet extends AbstractLayerSet {
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
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @returns {boolean} True when the layer should be registered to this hover-feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layerConfig: ConfigBaseClass): boolean {
    // Log
    logger.logTraceCore('HOVER-FEATURE-INFO-LAYER-SET - onRegisterLayerCheck', layerConfig.layerPath, Object.keys(this.resultSet));

    const queryable =
      layerConfig.schemaTag === CONST_LAYER_TYPES.WMS
        ? false
        : (layerConfig as AbstractBaseLayerEntryConfig)?.source?.featureInfo?.queryable;
    return !!queryable;
  }

  /**
   * Overrides the behavior to apply when a hover-feature-info-layer-set wants to register a layer in its set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  protected override onRegisterLayer(layerConfig: ConfigBaseClass): void {
    // Log
    logger.logTraceCore('HOVER-FEATURE-INFO-LAYER-SET - onRegisterLayer', layerConfig.layerPath, Object.keys(this.resultSet));

    // Call parent
    super.onRegisterLayer(layerConfig);

    // TODO: Check - Why are we updating the layer status in 'data' when it's also in this.resultSet[layerConfig.layerPath]?
    // Update the resultSet data
    this.resultSet[layerConfig.layerPath].data = {
      layerStatus: layerConfig.layerStatus!,
      eventListenerEnabled: true,
      queryStatus: 'processed',
      feature: undefined,
    };
  }

  /**
   * Overrides the behavior to apply when a layer status changed for a hover-feature-info-layer-set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {string} layerStatus - The new layer status
   */
  protected override onProcessLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void {
    // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
    super.onProcessLayerStatusChanged(layerConfig, layerStatus);

    // TODO: Check - Why are we updating the layer status in 'data' when it's also in this.resultSet[layerConfig.layerPath]?
    // Update the layer status
    this.resultSet[layerConfig.layerPath].data.layerStatus = layerStatus;

    // If the layer status isn't an error
    if (layerStatus !== 'error') {
      // Propagate to store
      // Nothing to propagate when the layer status changes..
    } else {
      // Layer is in error, unregister it immediately
      this.onUnregisterLayer(layerConfig);
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
      const layerConfig = this.layerApi.getLayerEntryConfig(layerPath)!;
      const layer = this.layerApi.getGeoviewLayerHybrid(layerPath);

      const { data } = this.resultSet[layerPath];
      if (!data.eventListenerEnabled) return;

      if (layerConfig.layerStatus === 'loaded' && layer) {
        data.feature = undefined;
        data.queryStatus = 'init';

        // Process query on results data
        AbstractLayerSet.queryLayerFeatures(data, layerConfig, layer, queryType, pixelCoordinate)
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
