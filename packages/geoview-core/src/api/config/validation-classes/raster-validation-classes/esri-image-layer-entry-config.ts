import {
  ConfigClassOrType,
  CONST_LAYER_ENTRY_TYPES,
  CONST_LAYER_TYPES,
  TypeGeoviewLayerConfig,
  TypeLayerMetadataEsri,
  TypeSourceImageEsriInitialConfig,
} from '@/api/types/layer-schema-types';
import {
  AbstractBaseLayerEntryConfig,
  AbstractBaseLayerEntryConfigProps,
} from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { TypeEsriImageLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-image';

export interface EsriImageLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageEsriInitialConfig;
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class EsriImageLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageEsriInitialConfig;

  /**
   * The class constructor.
   * @param {EsriImageLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: EsriImageLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.ESRI_IMAGE, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);

    // Write the default properties when not specified
    this.source ??= {};

    // Format the dataAccessPath correctly
    this.source.dataAccessPath = this.getMetadataAccessPath();
    if (!this.source.dataAccessPath!.endsWith('/')) this.source.dataAccessPath += '/';
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeLayerMetadataEsri | undefined} The strongly-typed layer metadata specific to this layer entry config.
   */
  override getLayerMetadata(): TypeLayerMetadataEsri | undefined {
    return super.getLayerMetadata() as TypeLayerMetadataEsri | undefined;
  }

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
}
