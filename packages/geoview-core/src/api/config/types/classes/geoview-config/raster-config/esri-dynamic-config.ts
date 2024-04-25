import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriDynamicLayerEntryConfig } from '@config/types/classes/sub-layer-config/raster-leaf/esri-dynamic-layer-entry-config';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { TypeGeoviewLayerType, TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage, TypeLayerInitialSettings } from '@config/types/map-schema-types';
import { MapFeaturesConfig } from '@config/types/classes/map-features-config';
import { getListOfLayerEntryConfig, validateAgainstSchema } from '@config/utils';

export type TypeEsriDynamicLayerNode =
  | (ConfigBaseClass & GroupLayerEntryConfig)
  | (ConfigBaseClass & AbstractBaseLayerEntryConfig & EsriDynamicLayerEntryConfig);

/* *************************************************************************************************************************** */
export class EsriDynamicLayerConfig extends AbstractGeoviewLayerConfig {
  /** Type of GeoView layer. */
  geoviewLayerType: TypeGeoviewLayerType;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: TypeEsriDynamicLayerNode[];

  /** ***************************************************************************************************************************
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   * @param {MapFeaturesConfig} mapFeaturesConfig An optional mapFeatureConfig instance if the layer is part of it.
   */
  // GV: This class cannot be instanciated using its constructor. The static method getInstance must be used.
  // GV: # cannot be used to declare a private constructor. The 'private' keyword must be used. Also, a constructor cannot
  // GV: return a promise. That's the reason why we need the getInstance which can do that.
  private constructor(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, mapFeaturesConfig?: MapFeaturesConfig) {
    super(layerConfig, language, mapFeaturesConfig);
    this.geoviewLayerType = CV_CONST_LAYER_TYPES.ESRI_DYNAMIC;
  }

  /** ***************************************************************************************************************************
   * Method used to instanciate an EsriDynamicLayerConfig object. The interaction with the instance will use the provided
   * language. The language associated to the instance can be changed using the setConfigLanguage.
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   * @param {MapFeaturesConfig} mapFeaturesConfig An optional mapFeatureConfig instance if the layer is part of it.
   *
   * @returns {Promise<EsriDynamicLayerConfig>} The ESRI dynamic configuration instance.
   */
  static async getInstance(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    mapFeaturesConfig?: MapFeaturesConfig
  ): Promise<EsriDynamicLayerConfig> {
    const esriDynamicLayerConfig = new EsriDynamicLayerConfig(layerConfig, language, mapFeaturesConfig);
    (esriDynamicLayerConfig.listOfLayerEntryConfig as ConfigBaseClass[]) = await getListOfLayerEntryConfig(
      layerConfig.listOfLayerEntryConfig,
      esriDynamicLayerConfig.initialSettings,
      esriDynamicLayerConfig
    );
    esriDynamicLayerConfig.processMetadata();
    esriDynamicLayerConfig.setDefaultValues();
    validateAgainstSchema(esriDynamicLayerConfig.getGeoviewLayerSchema(), esriDynamicLayerConfig);
    return Promise.resolve(esriDynamicLayerConfig);
  }

  /**
   * A method that returns the geoview layer schema to use for the validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @abstract
   */
  getGeoviewLayerSchema(): string {
    /** The GeoView layer schema associated to EsriDynamicLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.ESRI_DYNAMIC;
  }

  /**
   * @protected Process layer metadata.
   */
  // TODO: Implement this method
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected processMetadata(): void {}

  /**
   * @protected Set the default value when a class property that has a default value is left undefined.
   *
   * @param {TypeJsonObject} layerConfig The layer configuration affected.
   */
  // TODO: Implement this method
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  protected setDefaultValues(): void {}

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
