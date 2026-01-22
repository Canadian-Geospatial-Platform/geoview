import type {
  ConfigClassOrType,
  ConfigVectorTilesClassOrType,
  TypeGeoviewLayerConfig,
  TypeMetadataVectorTiles,
  TypeSourceTileInitialConfig,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { TileLayerEntryConfig } from '@/api/config/validation-classes/tile-layer-entry-config';
import type { TypeVectorTilesConfig } from '@/geo/layer/geoview-layers/raster/vector-tiles';

export interface VectorTilesLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceTileInitialConfig;
  /** The style url */
  styleUrl?: string;
}

export class VectorTilesLayerEntryConfig extends TileLayerEntryConfig {
  /** The style url */
  #styleUrl?: string;

  /**
   * The class constructor.
   * @param {VectorTilesLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   * @constructor
   */
  constructor(layerConfig: VectorTilesLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.VECTOR_TILES, CONST_LAYER_ENTRY_TYPES.RASTER_TILE);

    // Keep attributes
    this.#styleUrl = VectorTilesLayerEntryConfig.getClassOrTypeStyleUrl(layerConfig);

    // If not pointing to an image file directly
    if (!this.getDataAccessPath().toLowerCase().endsWith('.pbf')) {
      // Set it
      this.setDataAccessPath(`${this.getDataAccessPath(true)}tile/{z}/{y}/{x}.pbf`);
    }
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @return {TypeSourceTileInitialConfig} The strongly-typed source configuration specific to this layer entry config.
   * @override
   */
  override getSource(): TypeSourceTileInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @return {TypeMetadataVectorTiles | undefined} The strongly-typed layer configuration specific to this layer entry config.
   * @override
   */
  override getServiceMetadata(): TypeMetadataVectorTiles | undefined {
    return super.getServiceMetadata() as TypeMetadataVectorTiles | undefined;
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the style url or undefined.
   * @return {string | undefined} The style url or undefined.
   */
  getStyleUrl(): string | undefined {
    return this.#styleUrl;
  }

  /**
   * Sets the style url.
   * @param {string} styleUrl - The style url.
   * @return {void}
   */
  setStyleUrl(styleUrl: string): void {
    this.#styleUrl = styleUrl;
  }

  // #endregion METHODS

  // #region STATIC METHODS

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigVectorTilesClassOrType | undefined} layerConfig - The layer config class instance or regular json object.
   * @return {string | undefined} The style url or undefined.
   * @static
   */
  static getClassOrTypeStyleUrl(layerConfig: ConfigVectorTilesClassOrType | undefined): string | undefined {
    if (layerConfig instanceof ConfigBaseClass) {
      return layerConfig.getStyleUrl();
    }
    return layerConfig?.styleUrl;
  }

  /**
   * Helper function to support when a layerConfig is either a class instance or a regular json object.
   * @param {ConfigVectorTilesClassOrType} layerConfig - The layer config class instance or regular json object.
   * @param {string} styleUrl - The style url.
   * @return {void}
   * @static
   */
  static setClassOrTypeStyleUrl(layerConfig: ConfigVectorTilesClassOrType, styleUrl: string): void {
    if (layerConfig instanceof ConfigBaseClass) {
      layerConfig.setStyleUrl(styleUrl);
    } else {
      // eslint-disable-next-line no-param-reassign
      layerConfig.styleUrl = styleUrl;
    }
  }

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a VectorTiles layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns {boolean} true if the config is for a VectorTiles layer; otherwise false.
   * @static
   */
  static isClassOrTypeVectorTiles(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeVectorTilesConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.VECTOR_TILES);
  }

  // #endregion STATIC METHODS
}
