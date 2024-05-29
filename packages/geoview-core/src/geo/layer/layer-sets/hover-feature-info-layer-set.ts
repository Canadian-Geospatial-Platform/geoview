import debounce from 'lodash/debounce';

import { Coordinate } from 'ol/coordinate';
import { logger } from '@/core/utils/logger';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractLayerSet } from './abstract-layer-set';
import { LayerApi } from '@/geo/layer/layer';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeHoverResultSet } from '@/core/stores/store-interface-and-intial-values/feature-info-state';

/**
 * A class containing a set of layers associated with a TypeHoverResultSetEntry object, which will receive the result of a
 * "get feature info" request made on the map layers when the user hovers over a position in a stationary way.
 *
 * @class HoverFeatureInfoLayerSet
 */
export class HoverFeatureInfoLayerSet extends AbstractLayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeHoverFeatureInfoResultSet */
  declare resultSet: TypeHoverResultSet;

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
    logger.logTraceCore('HOVER-FEATURE-INFO-LAYER-SET - onRegisterLayerCheck', layerConfig.layerPath);

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
    logger.logTraceCore('HOVER-FEATURE-INFO-LAYER-SET - onRegisterLayer', layerConfig.layerPath);

    // Call parent
    super.onRegisterLayer(layerConfig);

    // Update the resultSet data
    this.resultSet[layerConfig.layerPath].eventListenerEnabled = true;
    this.resultSet[layerConfig.layerPath].queryStatus = 'processed';
    this.resultSet[layerConfig.layerPath].feature = undefined;
  }

  /**
   * Overrides the behavior to apply when a layer status changed for a hover-feature-info-layer-set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {string} layerStatus - The new layer status
   */
  protected override onProcessLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void {
    // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
    super.onProcessLayerStatusChanged(layerConfig, layerStatus);

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
      const layer = this.layerApi.getGeoviewLayerHybrid(layerPath)!;
      const layerConfig = layer.getLayerConfig(layerPath)!;

      if (!this.resultSet[layerPath].eventListenerEnabled) return;

      if (layerConfig.layerStatus === 'loaded' && layer) {
        this.resultSet[layerPath].feature = undefined;
        this.resultSet[layerPath].queryStatus = 'init';

        // Propagate to the store
        MapEventProcessor.setMapHoverFeatureInfo(this.mapId, this.resultSet[layerPath].feature);

        // Process query on results data
        AbstractLayerSet.queryLayerFeatures(this.resultSet[layerPath], layerConfig, layer, queryType, pixelCoordinate)
          .then((arrayOfRecords) => {
            if (arrayOfRecords === null) {
              this.resultSet[layerPath].queryStatus = 'error';
              this.resultSet[layerPath].feature = null;
            } else {
              if (arrayOfRecords?.length) {
                const nameField = arrayOfRecords![0].nameField || (Object.entries(arrayOfRecords![0].fieldInfo)[0] as unknown as string);
                const fieldInfo = arrayOfRecords![0].fieldInfo[nameField as string];

                this.resultSet[layerPath].feature = {
                  featureIcon: arrayOfRecords![0].featureIcon,
                  fieldInfo,
                  geoviewLayerType: arrayOfRecords![0].geoviewLayerType,
                  nameField,
                };
              } else {
                this.resultSet[layerPath].feature = undefined;
              }
              this.resultSet[layerPath].queryStatus = 'processed';
            }

            // Propagate to the store
            MapEventProcessor.setMapHoverFeatureInfo(this.mapId, this.resultSet[layerPath].feature);
          })
          .catch((error) => {
            // Log
            logger.logPromiseFailed('queryLayerFeatures in queryLayers in hoverFeatureInfoLayerSet', error);
          });
      } else {
        this.resultSet[layerPath].feature = null;
        this.resultSet[layerPath].queryStatus = 'error';
      }
    });
  }

  /**
   * Function used to enable listening of hover events. When a layer path is not provided,
   * hover events listening is enabled for all layers.
   * @param {string} layerPath - Optional parameter used to enable only one layer
   */
  enableHoverListener(layerPath?: string): void {
    if (layerPath) this.resultSet[layerPath].eventListenerEnabled = true;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of hover events. When a layer path is not provided,
   * hover events listening is disable for all layers.
   * @param {string} layerPath - Optional parameter used to disable only one layer
   */
  disableHoverListener(layerPath?: string): void {
    if (layerPath) this.resultSet[layerPath].eventListenerEnabled = false;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].eventListenerEnabled = false;
      });
  }

  /**
   * Function used to determine whether hover events are disabled for a layer. When a layer path is not provided,
   * the value returned is undefined if the map flags are a mixture of true and false values.
   * @param {string} layerPath - Optional parameter used to get the flag value of a layer.
   * @returns {boolean | undefined} The flag value for the map or layer.
   */
  isHoverListenerEnabled(layerPath?: string): boolean | undefined {
    if (layerPath) return !!this.resultSet?.[layerPath]?.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultSet[key].eventListenerEnabled;
      if (returnValue !== this.resultSet[key].eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }
}
