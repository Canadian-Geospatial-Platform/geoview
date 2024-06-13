import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriFeatureLayerEntryConfig } from '@config/types/classes/sub-layer-config/vector-leaf/esri-feature-layer-entry-config';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage, TypeLayerInitialSettings } from '@config/types/map-schema-types';
import { isvalidComparedToSchema } from '@config/utils';
import { MapFeatureConfig } from '@config/types/classes/map-feature-config';
import { AbstractGeoviewEsriLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-esri-layer-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

export type TypeEsriFeatureLayerNode = GroupLayerEntryConfig | EsriFeatureLayerEntryConfig;

/** The ESRI feature geoview layer class. */
export class EsriFeatureLayerConfig extends AbstractGeoviewEsriLayerConfig {
  /** Type of GeoView layer. */
  geoviewLayerType = CV_CONST_LAYER_TYPES.ESRI_FEATURE;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: TypeEsriFeatureLayerNode[];

  /**
   * The class constructor.
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   * @param {MapFeatureConfig} mapFeatureConfig An optional mapFeatureConfig instance if the layer is part of it.
   * @constructor
   */
  constructor(layerConfig: TypeJsonObject, language: TypeDisplayLanguage, mapFeatureConfig?: MapFeatureConfig) {
    super(layerConfig, language, mapFeatureConfig);
    if (!isvalidComparedToSchema(this.geoviewLayerSchema, layerConfig)) this.setErrorDetectedFlag(); // Input schema validation.
    if (!isvalidComparedToSchema(this.geoviewLayerSchema, this)) this.setErrorDetectedFlag(); // Internal schema validation.
    this.validate();
  }

  /**
   * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
   * section of the schema must be used to do its validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected
   */
  protected override get geoviewLayerSchema(): string {
    /** The GeoView layer schema associated to EsriFeatureLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.ESRI_FEATURE;
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the sublayer
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The lsub ayer configuration.
   * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   */
  override createLeafNode(
    layerConfig: TypeJsonObject,
    initialSettings: TypeLayerInitialSettings,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new EsriFeatureLayerEntryConfig(layerConfig, initialSettings, language, geoviewConfig, parentNode);
  }
}
