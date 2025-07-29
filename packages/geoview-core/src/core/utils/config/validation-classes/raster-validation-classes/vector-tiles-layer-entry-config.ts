import { TypeSourceVectorTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { CONST_LAYER_TYPES, TypeTileGrid } from '@/api/config/types/map-schema-types';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
import { TypeProjection } from '@/geo/utils/projection';

export class VectorTilesLayerEntryConfig extends TileLayerEntryConfig {
  /** Tag used to link the entry to a specific schema. */
  override schemaTag = CONST_LAYER_TYPES.VECTOR_TILES;

  declare source: TypeSourceVectorTilesInitialConfig;

  tileGrid!: TypeTileGrid;

  styleUrl?: string;

  /**
   * The class constructor.
   * @param {VectorTilesLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: VectorTilesLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    // Write the default properties when not specified
    this.source ??= {};
    this.source.dataAccessPath ??= this.geoviewLayerConfig.metadataAccessPath;

    // Format the dataAccessPath correctly
    if (!this.source.dataAccessPath!.toLowerCase().endsWith('.pbf')) {
      this.source.dataAccessPath = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath}tile/{z}/{y}/{x}.pbf`
        : `${this.source.dataAccessPath}/tile/{z}/{y}/{x}.pbf`;
    }
  }

  /**
   * Overrides the parent class's getter to provide a more specific return type (covariant return).
   * @override
   * @returns {TypeMetadataVectorTiles | undefined} The strongly-typed layer configuration specific to this layer entry config.
   */
  override getServiceMetadata(): TypeMetadataVectorTiles | undefined {
    return super.getServiceMetadata() as TypeMetadataVectorTiles | undefined;
  }
}

export interface TypeMetadataVectorTiles {
  defaultStyles: string;
  tileInfo: TypeMetadataVectorTilesTileInfo;
  fullExtent: TypeMetadataVectorTilesFullExtent;
  minScale?: number;
  maxScale?: number;
  minZoom?: number;
  maxZoom?: number;
}

export interface TypeMetadataVectorTilesTileInfo {
  spatialReference: TypeProjection;
  origin: TypeMetadataVectorTilesTileInfoOrigin;
  lods: TypeLod[];
  rows: number;
  cols: number;
}

// TODO: Move this type somewhere more generic than in vector tiles
export interface TypeLod {
  resolution: number;
  scale: number;
  level: number;
}

export interface TypeMetadataVectorTilesTileInfoOrigin {
  x: number;
  y: number;
}

export interface TypeMetadataVectorTilesFullExtent {
  spatialReference: TypeProjection;
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
}
