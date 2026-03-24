import type {
  ConfigClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataGeoTIFF,
  TypeSourceGeoTIFFInitialConfig,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { TypeGeoTIFFLayerConfig } from '@/geo/layer/geoview-layers/raster/geotiff';
import type { RGBA } from '@/core/utils/utilities';

export interface GeoTIFFLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceGeoTIFFInitialConfig;
}

/** Type used to define a GeoTIFF layer to display on the map. */
export class GeoTIFFLayerEntryConfig extends AbstractBaseLayerEntryConfig {
  /** Embedded RGBA color palette extracted from the GeoTIFF file, if present. */
  #embeddedColorMap: RGBA[] | undefined;

  /**
   * Creates an instance of GeoTIFFLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   */
  constructor(layerConfig: GeoTIFFLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.GEOTIFF, CONST_LAYER_ENTRY_TYPES.RASTER_TILE);

    // If not pointing to an image file directly
    if (!this.getDataAccessPath().toLowerCase().endsWith('.tif') && !this.getDataAccessPath().toLowerCase().startsWith('blob')) {
      // Set it
      this.setDataAccessPath(`${this.getDataAccessPath(true)}${this.layerId}`);
    }
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getGeoviewLayerConfig(): TypeGeoTIFFLayerConfig {
    return super.getGeoviewLayerConfig() as TypeGeoTIFFLayerConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed source configuration specific to this layer entry config.
   */
  override getSource(): TypeSourceGeoTIFFInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed service metadata specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataGeoTIFF | undefined {
    return super.getServiceMetadata() as TypeMetadataGeoTIFF | undefined;
  }

  // #endregion OVERRIDES

  /**
   * Getter for the embedded color map.
   *
   * @returns The embedded RGBA color map, or undefined if not present
   */
  getEmbeddedColorMap(): RGBA[] | undefined {
    return this.#embeddedColorMap;
  }

  /**
   * Setter for the embedded color map.
   *
   * @param colorMap - Optional embedded RGBA color map to set
   */
  setEmbeddedColorMap(colorMap: RGBA[] | undefined): void {
    this.#embeddedColorMap = colorMap;
  }

  /**
   * Checks if an embedded color map is present in the layer config.
   *
   * @returns `true` if an embedded color map exists; otherwise `false`
   */
  hasEmbeddedColorMap(): boolean {
    return this.#embeddedColorMap !== undefined;
  }

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object) represents a GeoTIFF layer type.
   *
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   *
   * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
   * @returns `true` if the config is for a GeoTIFF layer; otherwise `false`
   */
  static isClassOrTypeGeoTIFF(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeGeoTIFFLayerConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.GEOTIFF);
  }

  // #endregion STATIC METHODS
}
