import type { ConfigClassOrType, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeSourceImageXYZTilesInitialConfig, TypeXYZTilesConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { TileLayerEntryConfig } from '@/api/config/validation-classes/tile-layer-entry-config';

export interface XYZTilesLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageXYZTilesInitialConfig;
  /** The minimum scale denominator as read from metadata */
  minScaleDenominator?: number;
  /** The maximum scale denominator as read from metadata */
  maxScaleDenominator?: number;
}

export class XYZTilesLayerEntryConfig extends TileLayerEntryConfig {
  /** The minimum scale denominator as read from metadata */
  minScaleDenominator: number;

  /** The maximum scale denominator as read from metadata */
  maxScaleDenominator: number;

  /**
   * The class constructor.
   * @param {XYZTilesLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   * @constructor
   */
  constructor(layerConfig: XYZTilesLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.XYZ_TILES, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);
    this.minScaleDenominator = layerConfig.minScaleDenominator || 0;
    this.maxScaleDenominator = layerConfig.maxScaleDenominator || 0;

    // If pointing to something else than {z}/{y}/{x}
    if (!this.getDataAccessPath().includes('{z}/{y}/{x}')) {
      // Set it
      this.setDataAccessPath(`${this.getDataAccessPath(true)}tile/{z}/{y}/{x}`);
    }
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @returns {TypeSourceImageXYZTilesInitialConfig} The strongly-typed source configuration specific to this layer entry config.
   * @override
   */
  override getSource(): TypeSourceImageXYZTilesInitialConfig {
    return super.getSource();
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object)
   * represents a XYZTiles layer type.
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   * @param {ConfigClassOrType | TypeGeoviewLayerConfig} layerConfig - The layer config to check. Can be an instance of a config class or a raw config object.
   * @returns {boolean} true if the config is for a XYZTiles layer; otherwise false.
   * @static
   */
  static isClassOrTypeXYZTiles(layerConfig: ConfigClassOrType | TypeGeoviewLayerConfig): layerConfig is TypeXYZTilesConfig {
    // Redirect
    return this.isClassOrTypeSchemaTag(layerConfig, CONST_LAYER_TYPES.XYZ_TILES);
  }

  // #endregion STATIC METHODS
}

export interface TypeMetadataXYZTiles {
  layers: TypeMetadataXYZTilesLayer[];
  listOfLayerEntryConfig: XYZTilesLayerEntryConfigProps[];
}

export type TypeMetadataXYZTilesLayer = XYZTilesLayerEntryConfigProps & { id: string };
