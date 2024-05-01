import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriFeatureLayerEntryConfig } from '@config/types/classes/sub-layer-config/vector-leaf/esri-feature-layer-entry-config';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { TypeGeoviewLayerType, TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage, TypeLayerInitialSettings } from '@config/types/map-schema-types';
import { MapFeaturesConfig } from '@config/types/classes/map-features-config';
import { isvalidComparedToSchema } from '@config/utils';

export type TypeEsriFeatureLayerNode =
  | (ConfigBaseClass & GroupLayerEntryConfig)
  | (ConfigBaseClass & AbstractBaseLayerEntryConfig & EsriFeatureLayerEntryConfig);

export class EsriFeatureLayerConfig extends AbstractGeoviewLayerConfig {
  /** Type of GeoView layer. */
  geoviewLayerType: TypeGeoviewLayerType;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: TypeEsriFeatureLayerNode[];

  /** ***************************************************************************************************************************
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   * @param {MapFeaturesConfig} mapFeaturesConfig An optional mapFeatureConfig instance if the layer is part of it.
   */
  constructor(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, mapFeaturesConfig?: MapFeaturesConfig) {
    super(layerConfig, language, mapFeaturesConfig);
    this.geoviewLayerType = CV_CONST_LAYER_TYPES.ESRI_FEATURE;
    if (!isvalidComparedToSchema(this.geoviewLayerSchema, this)) this.propagateError();
    if (!this.geoviewLayerId) {
      throw new Error(`geoviewLayerId is mandatory for GeoView layer of type ${this.geoviewLayerType}.`);
    }
    if (!this.metadataAccessPath) {
      throw new Error(`metadataAccessPath is mandatory for GeoView layer ${this.geoviewLayerId} of type ${this.geoviewLayerType}.`);
    }
  }

  /**
   * A method that returns the geoview layer schema to use for the validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @abstract
   */
  get geoviewLayerSchema(): string {
    /** The GeoView layer schema associated to EsriFeatureLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.ESRI_FEATURE;
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
   * @param {TypeJsonObject} layerConfig The lsub ayer configuration.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewInstance The GeoView instance that owns the sub layer.
   * @param {ConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {ConfigBaseClass | undefined} The sub layer instance or undefined if there is an error.
   */
  createLeafNode(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode: ConfigBaseClass
  ): ConfigBaseClass {
    return new EsriFeatureLayerEntryConfig(layerConfig, initialSettings, language, geoviewConfig, parentNode);
  }
}
