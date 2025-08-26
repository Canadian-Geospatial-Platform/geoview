import { TypeMetadataVectorTiles, TypeSourceVectorTilesInitialConfig, TypeTileGrid } from '@/api/config/types/map-schema-types';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
export declare class VectorTilesLayerEntryConfig extends TileLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
    source: TypeSourceVectorTilesInitialConfig;
    tileGrid: TypeTileGrid;
    styleUrl?: string;
    /**
     * The class constructor.
     * @param {VectorTilesLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: VectorTilesLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataVectorTiles | undefined} The strongly-typed layer configuration specific to this layer entry config.
     */
    getServiceMetadata(): TypeMetadataVectorTiles | undefined;
}
//# sourceMappingURL=vector-tiles-layer-entry-config.d.ts.map