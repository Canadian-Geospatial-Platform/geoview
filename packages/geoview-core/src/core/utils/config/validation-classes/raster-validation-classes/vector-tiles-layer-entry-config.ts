import { TypeSourceVectorTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { TypeTileGrid } from '@/api/config/types/map-schema-types';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
import { LayerDataAccessPathMandatoryError } from '@/core/exceptions/layer-exceptions';

export class VectorTilesLayerEntryConfig extends TileLayerEntryConfig {
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

    // Validate the dataAccessPath exists when metadataAccessPath is empty
    if (!this.geoviewLayerConfig.metadataAccessPath && !this.source?.dataAccessPath) {
      // Throw error missing dataAccessPath
      throw new LayerDataAccessPathMandatoryError(this.geoviewLayerConfig.geoviewLayerId);
    }

    if (!this.source) this.source = {};
    if (!this.source.dataAccessPath) this.source.dataAccessPath = this.geoviewLayerConfig.metadataAccessPath;
    if (!this.source.dataAccessPath!.toLowerCase().endsWith('.pbf')) {
      this.source.dataAccessPath = this.source.dataAccessPath!.endsWith('/')
        ? `${this.source.dataAccessPath}tile/{z}/{y}/{x}.pbf`
        : `${this.source.dataAccessPath}/tile/{z}/{y}/{x}.pbf`;
    }
  }
}
