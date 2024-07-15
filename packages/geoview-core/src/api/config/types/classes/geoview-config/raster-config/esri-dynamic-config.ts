import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriDynamicLayerEntryConfig } from '@config/types/classes/sub-layer-config/raster-leaf/esri-dynamic-layer-entry-config';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { TypeJsonObject } from '@config/types/config-types';
import { TypeDisplayLanguage } from '@config/types/map-schema-types';
import { AbstractGeoviewEsriLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-esri-layer-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

export type TypeEsriDynamicLayerNode = GroupLayerEntryConfig | EsriDynamicLayerEntryConfig;

/** The ESRI dynamic geoview layer class. */
export class EsriDynamicLayerConfig extends AbstractGeoviewEsriLayerConfig {
  /** Type of GeoView layer. */
  geoviewLayerType = CV_CONST_LAYER_TYPES.ESRI_DYNAMIC;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: TypeEsriDynamicLayerNode[];

  /**
   * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
   * section of the schema must be used to do its validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected
   */
  protected override get geoviewLayerSchema(): string {
    /** The GeoView layer schema associated to EsriDynamicLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.ESRI_DYNAMIC;
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the sublayer
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The sublayer configuration.
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
    return new EsriDynamicLayerEntryConfig(layerConfig, language, geoviewConfig, parentNode);
  }
}
