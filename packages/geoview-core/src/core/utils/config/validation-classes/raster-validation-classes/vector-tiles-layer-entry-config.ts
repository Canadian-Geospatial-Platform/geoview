import { TypeSourceVectorTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { TypeTileGrid } from '@/geo/map/map-schema-types';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';

export class VectorTilesLayerEntryConfig extends TileLayerEntryConfig {
  declare source: TypeSourceVectorTilesInitialConfig;

  tileGrid!: TypeTileGrid;

  /**
   * The class constructor.
   * @param {VectorTilesLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
   */
  constructor(layerConfig: VectorTilesLayerEntryConfig) {
    super(layerConfig);
    Object.assign(this, layerConfig);

    /** layerConfig.source.dataAccessPath is mandatory. */
    if (!layerConfig.source!.dataAccessPath) {
      throw new Error(
        `source.dataAccessPath on layer entry ${this.layerPath} is mandatory for GeoView layer ${this.geoviewLayerConfig.geoviewLayerId} of type ${this.geoviewLayerConfig.geoviewLayerType}`,
      );
    }
  }
}
