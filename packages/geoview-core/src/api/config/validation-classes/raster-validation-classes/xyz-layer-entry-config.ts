import type { ConfigClassOrType, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { TileLayerEntryConfig } from '@/api/config/validation-classes/tile-layer-entry-config';
import type { TypeSourceImageXYZTilesInitialConfig, TypeXYZTilesConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import type { TypeProjection } from '@/geo/utils/projection';

export interface XYZTilesLayerEntryConfigProps extends AbstractBaseLayerEntryConfigProps {
  /** Source settings to apply to the GeoView layer source at creation time. */
  source?: TypeSourceImageXYZTilesInitialConfig;
  /** The minimum scale denominator as read from metadata */
  minScaleDenominator?: number;
  /** The maximum scale denominator as read from metadata */
  maxScaleDenominator?: number;
}

export class XYZTilesLayerEntryConfig extends TileLayerEntryConfig {
  /** The minimum scale denominator as read from metadata. */
  minScaleDenominator: number;

  /** The maximum scale denominator as read from metadata. */
  maxScaleDenominator: number;

  /**
   * Creates an instance of XYZTilesLayerEntryConfig.
   *
   * @param layerConfig - The layer configuration we want to instantiate
   */
  constructor(layerConfig: XYZTilesLayerEntryConfigProps) {
    super(layerConfig, CONST_LAYER_TYPES.XYZ_TILES, CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE);
    this.minScaleDenominator = layerConfig.minScaleDenominator || 0;
    this.maxScaleDenominator = layerConfig.maxScaleDenominator || 0;

    // Value for this.source.featureInfo.queryable can only be false.
    this.setQueryableSource(false);

    // If pointing to something else than {z}/{y}/{x}
    if (!this.getDataAccessPath().includes('{z}/{y}/{x}')) {
      // Set it
      this.setDataAccessPath(`${this.getDataAccessPath(true)}tile/{z}/{y}/{x}`);
    }
  }

  // #region OVERRIDES

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed layer configuration specific to this layer.
   */
  override getGeoviewLayerConfig(): TypeXYZTilesConfig {
    return super.getGeoviewLayerConfig() as TypeXYZTilesConfig;
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed source configuration specific to this layer entry config.
   */
  override getSource(): TypeSourceImageXYZTilesInitialConfig {
    return super.getSource();
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   *
   * @returns The strongly-typed service metadata specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataXYZTiles | undefined {
    return super.getServiceMetadata() as TypeMetadataXYZTiles | undefined;
  }

  // #endregion OVERRIDES

  // #region STATIC METHODS

  /**
   * Type guard that checks whether the given configuration (class instance or plain object) represents a XYZTiles layer type.
   *
   * Supports `ConfigClassOrType` (class instance or plain object) and plain layer config objects (`TypeGeoviewLayerConfig`).
   *
   * @param layerConfig - The layer config to check. Can be an instance of a config class or a raw config object
   * @returns `true` if the config is for a XYZTiles layer; otherwise `false`
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
  spatialReference?: TypeProjection;
  crs?: string; // The CRS url such as http://www.opengis.net/def/crs/OGC/1.3/CRS84
}

export type TypeMetadataXYZTilesLayer = XYZTilesLayerEntryConfigProps & { id: string };
