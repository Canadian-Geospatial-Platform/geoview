import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriGroupLayerConfig } from '@config/types/classes/sub-layer-config/group-node/esri-group-layer-config';
import { TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { AbstractGeoviewEsriLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-esri-layer-config';
import { EsriFeatureLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/vector/esri-feature-layer-entry-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

export type TypeEsriFeatureLayerNode = EsriGroupLayerConfig | EsriFeatureLayerEntryConfig;

// #region CLASS HEADER
/** The ESRI feature geoview layer class. */
export class EsriFeatureLayerConfig extends AbstractGeoviewEsriLayerConfig {
  // #region PUBLIC PROPERTIES
  /** Type of GeoView layer. */
  override geoviewLayerType = CV_CONST_LAYER_TYPES.ESRI_FEATURE;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: TypeEsriFeatureLayerNode[];

  // #region GETTER/SETTER
  // GV: The benifit of using a setter/getter with a private #property is that it is invisible to the schema
  // GV: validation and JSON serialization.

  /**
   * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
   * section of the schema must be used to do its validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected
   */
  protected override getGeoviewLayerSchema(): string {
    /** The GeoView layer schema associated to EsriFeatureLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.ESRI_FEATURE;
  }

  // #region METHODS
  /**
   * The method used to implement the class factory model that returns the instance of the class based on the leaf
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The leaf node configuration.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   */
  override createLeafNode(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new EsriFeatureLayerEntryConfig(layerConfig, language, geoviewConfig, parentNode);
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the group
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The group node configuration.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the geoview layer.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   */
  override createGroupNode(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new EsriGroupLayerConfig(layerConfig, language, geoviewConfig, parentNode);
  }
}
