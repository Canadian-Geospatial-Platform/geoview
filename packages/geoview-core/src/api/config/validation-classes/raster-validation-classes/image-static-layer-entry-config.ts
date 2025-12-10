import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeSourceImageStaticInitialConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeImageStaticLayerConfig } from '@/geo/layer/geoview-layers/raster/image-static';

export interface ImageStaticLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageStaticInitialConfig;
}

/**
 * Type used to define a GeoView image layer to display on the map.
 */
export class ImageStaticLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Source settings to apply to the GeoView image layer source at creation time. */
  declare source: TypeSourceImageStaticInitialConfig;

  /**
   * The class constructor.
   * @param {ImageStaticLayerEntryConfigProps} layerConfig -  The layer configuration we want to instanciate.
   */
  constructor(layerConfig: ImageStaticLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.IMAGE_STATIC, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);

    // Value for this.source.featureInfo.queryable can only be false.
    this.setQueryable(false);

    // If not pointing to an image file directly
    if (
      !this.getDataAccessPath().toLowerCase().endsWith('.png') &&
      !this.getDataAccessPath().toLowerCase().endsWith('.jpg') &&
      !this.getDataAccessPath().toLowerCase().endsWith('.jpeg')
    ) {
      // Set it
      this.setDataAccessPath(`${this.getDataAccessPath(true)}${this.layerId}`);
    }
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents an Image Static layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for an Image Static layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeImageStatic(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeImageStaticLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.IMAGE_STATIC);
  }
}
