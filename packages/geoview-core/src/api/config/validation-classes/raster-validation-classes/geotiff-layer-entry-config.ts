import type { ConfigClassOrType, TypeGeoviewLayerConfig, TypeSourceGeoTIFFInitialConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeGeoTIFFLayerConfig } from '@/geo/layer/geoview-layers/raster/geotiff';

export interface GeoTIFFLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceGeoTIFFInitialConfig;
}

/**
 * Type used to define a GeoTIFF layer to display on the map.
 */
export class GeoTIFFLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Source settings to apply to the GeoTIFF layer source at creation time. */
  declare source: TypeSourceGeoTIFFInitialConfig;

  /**
   * The class constructor.
   * @param {GeoTIFFLayerEntryConfigProps} layerConfig -  The layer configuration we want to instanciate.
   */
  constructor(layerConfig: GeoTIFFLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.GEOTIFF, CONST_LAYER_ENTRY_TYPES.RASTER_TILE);

    // If not pointing to an image file directly
    if (!this.getDataAccessPath().toLowerCase().endsWith('.tif') && !this.getDataAccessPath().toLowerCase().startsWith('blob')) {
      // Set it
      this.setDataAccessPath(`${this.getDataAccessPath(true)}${this.layerId}`);
    }
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object) represents an GeoTIFF layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns `true` if the config is for a GeoTIFF layer; otherwise `false`.
   * @static
   */
  static isClassOrTypeGeoTIFF(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeGeoTIFFLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.GEOTIFF);
  }
}
