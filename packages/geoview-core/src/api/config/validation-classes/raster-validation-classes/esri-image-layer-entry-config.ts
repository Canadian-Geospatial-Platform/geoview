import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataEsriImage,
  TypeSourceImageEsriInitialConfig,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeEsriImageLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-image';

export interface EsriImageLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageEsriInitialConfig;
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /**
   * The class constructor.
   *
   * @param layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriImageLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.ESRI_IMAGE, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getGeoviewLayerConfig(): TypeEsriImageLayerConfig {
    return super.getGeoviewLayerConfig() as TypeEsriImageLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed source configuration specific to this layer entry config.
   */
  override getSource(): TypeSourceImageEsriInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed service metadata specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataEsriImage | undefined {
    return super.getServiceMetadata() as TypeMetadataEsriImage | undefined;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * Note, in the case of an EsriImage, the layer metadata is the same as the service metadata.
   *
   * @returns The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeMetadataEsriImage | undefined {
    return super.getLayerMetadata() as TypeMetadataEsriImage | undefined;
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents an Esri Image layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for an Esri Image layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeEsriImage(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeEsriImageLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.ESRI_IMAGE);
  }

  // #endregion STATIC METHODS
}
