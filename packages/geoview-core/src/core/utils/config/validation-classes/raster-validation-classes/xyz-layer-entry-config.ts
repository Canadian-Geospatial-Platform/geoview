import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { TypeSourceImageXYZTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';

export class XYZTilesLayerEntryConfig extends TileLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.XYZ_TILES;

  /** Layer entry data type. */
  override entryType = CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;

  declare source: TypeSourceImageXYZTilesInitialConfig;

  /** The minimum scale denominator as read from metadata */
  minScaleDenominator: number = 0;

  /** The maximum scale denominator as read from metadata */
  maxScaleDenominator: number = 0;

  /**
   * The class constructor.
   * @param {XYZTilesLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: XYZTilesLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    this.source ??= {};
    this.source.dataAccessPath ??= this.geoviewLayerConfig.metadataAccessPath;

    // Format the dataAccessPath correctly
    if (!this.source.dataAccessPath!.includes('{z}/{y}/{x}'))
      this.source.dataAccessPath = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath}tile/{z}/{y}/{x}`
        : `${this.source.dataAccessPath}/tile/{z}/{y}/{x}`;
  }
}

export interface TypeMetadataXYZTiles {
  layers: TypeMetadataXYZTilesLayer[];
  listOfLayerEntryConfig: XYZTilesLayerEntryConfig[];
}

export type TypeMetadataXYZTilesLayer = XYZTilesLayerEntryConfig & { id: string };
