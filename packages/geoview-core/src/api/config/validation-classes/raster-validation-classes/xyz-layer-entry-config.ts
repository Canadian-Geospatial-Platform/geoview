import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { TypeSourceImageXYZTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
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
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.XYZ_TILES;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  /** The layer entry props that were used in the constructor. */
  declare layerEntryProps: XYZTilesLayerEntryConfigProps;

  declare source: TypeSourceImageXYZTilesInitialConfig;

  /** The minimum scale denominator as read from metadata */
  minScaleDenominator: number;

  /** The maximum scale denominator as read from metadata */
  maxScaleDenominator: number;

  /**
   * The class constructor.
   * @param {XYZTilesLayerEntryConfigProps | XYZTilesLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: XYZTilesLayerEntryConfigProps | XYZTilesLayerEntryConfigProps) {
    super(layerConfig);
    this.minScaleDenominator = layerConfig.minScaleDenominator || 0;
    this.maxScaleDenominator = layerConfig.maxScaleDenominator || 0;

    this.source ??= {};
    this.source.dataAccessPath ??= layerConfig.source?.dataAccessPath ?? this.geoviewLayerConfig.metadataAccessPath;

    // Format the dataAccessPath correctly
    if (!this.source.dataAccessPath!.includes('{z}/{y}/{x}'))
      this.source.dataAccessPath = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath}tile/{z}/{y}/{x}`
        : `${this.source.dataAccessPath}/tile/{z}/{y}/{x}`;
  }
}

export interface TypeMetadataXYZTiles {
  layers: TypeMetadataXYZTilesLayer[];
  listOfLayerEntryConfig: XYZTilesLayerEntryConfigProps[];
}

export type TypeMetadataXYZTilesLayer = XYZTilesLayerEntryConfigProps & { id: string };
