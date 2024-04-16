import { logger } from 'geoview-core/src/core/utils/logger';
import { CV_CONST_LAYER_TYPES } from '../../../config-constants';
import { AbstractGeoviewLayerConfig } from '../abstract-geoview-layer-config';
import { EsriDynamicLayerEntryConfig } from '../../sub-layer-config/raster-leaf/esri-dynamic-layer-entry-config';
import { ConfigBaseClass } from '../../sub-layer-config/config-base-class';
import { GroupLayerEntryConfig } from '../../sub-layer-config/group-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '../../sub-layer-config/abstract-base-layer-entry-config';
import { TypeJsonObject, toJsonObject } from '../../../config-types';
import { TypeLayerInitialSettings } from '../../../map-schema-types';
import { MapFeaturesConfig } from '../../map-features-config';

export type TypeEsriDynamicLayerNode =
  | (ConfigBaseClass & GroupLayerEntryConfig)
  | (ConfigBaseClass & AbstractBaseLayerEntryConfig & EsriDynamicLayerEntryConfig);

export class EsriDynamicLayerConfig extends AbstractGeoviewLayerConfig {
  /** Type of GeoView layer. */
  geoviewLayerType = CV_CONST_LAYER_TYPES.ESRI_DYNAMIC;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: TypeEsriDynamicLayerNode[];

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   */
  constructor(layerConfig: TypeJsonObject, mapFeaturesConfig?: MapFeaturesConfig) {
    super(layerConfig, mapFeaturesConfig);
    this.validate(toJsonObject(this));
  }

  /**
   * @protected validate
   * Validate the object properties.
   *
   * @param {TypeJsonObject} layerConfig The layer configuration to validate.
   */
  validate(layerConfig: TypeJsonObject): void {
    super.validate(layerConfig);
    if (!this.metadataAccessPath)
      logger.logError(
        `Property metadataAccessPath is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`
      );
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class
   * based on the sub layer type needed.
   *
   * @param {TypeJsonObject} layerConfig The sub layer configuration.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {AbstractGeoviewLayerConfig} geoviewInstance The GeoView instance that owns the sub layer.
   *
   * @returns {ConfigBaseClass | undefined} The sub layer instance or undefined if there is an error.
   */
  createLeafNode(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    geoviewConfig: AbstractGeoviewLayerConfig
  ): ConfigBaseClass {
    return new EsriDynamicLayerEntryConfig(layerConfig, initialSettings, geoviewConfig);
  }
}
