import { CV_CONST_LAYER_TYPES, CV_GEOVIEW_SCHEMA_PATH } from '@/api/config/types/config-constants';
import { AbstractGeoviewLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriGroupLayerConfig } from '@/api/config/types/classes/sub-layer-config/group-node/esri-group-layer-config';
import { TypeJsonObject } from '@/api/config/types/config-types';
import { AbstractGeoviewEsriLayerConfig } from '@/api/config/types/classes/geoview-config/abstract-geoview-esri-layer-config';
import { EsriImageLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/raster/esri-image-layer-entry-config';
import { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

export type TypeEsriImageLayerNode = EsriGroupLayerConfig | EsriImageLayerEntryConfig;

// ========================
// #region CLASS HEADER
/**
 * The ESRI Image geoview layer class.
 */
export class EsriImageLayerConfig extends AbstractGeoviewEsriLayerConfig {
  // ==================
  // #region PROPERTIES

  /** Type of GeoView layer. */
  override geoviewLayerType = CV_CONST_LAYER_TYPES.ESRI_IMAGE;

  /** The layer entries to use from the GeoView layer. */
  declare listOfLayerEntryConfig: TypeEsriImageLayerNode[];
  // #endregion PROPERTIES

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected and public.
   */
  // ================
  // #region OVERRIDE

  /**
   * The getter method that returns the geoview layer schema to use for the validation. Each geoview layer type knows what
   * section of the schema must be used to do its validation.
   *
   * @returns {string} The GeoView layer schema associated to the config.
   * @protected @override
   */
  protected override getGeoviewLayerSchema(): string {
    /** The GeoView layer schema associated to EsriDynamicLayerConfig */
    return CV_GEOVIEW_SCHEMA_PATH.ESRI_IMAGE;
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the sublayer
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The sublayer configuration.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   * @override
   */
  override createLeafNode(
    layerConfig: TypeJsonObject,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new EsriImageLayerEntryConfig(layerConfig, geoviewConfig, parentNode);
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the group
   * type needed.
   *
   * @param {TypeJsonObject} layerConfig The group node configuration.
   * @param {AbstractGeoviewLayerConfig} geoviewConfig The GeoView instance that owns the sublayer.
   * @param {EntryConfigBaseClass} parentNode The The parent node that owns this layer or undefined if it is the root layer..
   *
   * @returns {EntryConfigBaseClass} The sublayer instance or undefined if there is an error.
   * @override
   */
  override createGroupNode(
    layerConfig: TypeJsonObject,
    geoviewConfig: AbstractGeoviewLayerConfig,
    parentNode?: EntryConfigBaseClass
  ): EntryConfigBaseClass {
    return new EsriGroupLayerConfig(layerConfig, geoviewConfig, parentNode);
  }
  // #endregion OVERRIDE
  // #endregion METHODS
  // #endregion CLASS HEADER
}
