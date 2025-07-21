import { TypeSourceVectorTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { CONST_LAYER_TYPES, TypeTileGrid } from '@/api/config/types/map-schema-types';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';

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
}
