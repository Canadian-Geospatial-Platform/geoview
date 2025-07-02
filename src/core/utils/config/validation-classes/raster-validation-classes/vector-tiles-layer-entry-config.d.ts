import { TypeSourceVectorTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { TypeTileGrid } from '@/api/config/types/map-schema-types';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
export declare class VectorTilesLayerEntryConfig extends TileLayerEntryConfig {
    source: TypeSourceVectorTilesInitialConfig;
    tileGrid: TypeTileGrid;
    styleUrl?: string;
    /**
     * The class constructor.
     * @param {VectorTilesLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: VectorTilesLayerEntryConfig);
}
//# sourceMappingURL=vector-tiles-layer-entry-config.d.ts.map