import { TypeSourceImageXYZTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
export declare class XYZTilesLayerEntryConfig extends TileLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/config/types/map-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/config/types/map-schema-types").TypeLayerEntryType;
    source: TypeSourceImageXYZTilesInitialConfig;
    /** The minimum scale denominator as read from metadata */
    minScaleDenominator: number;
    /** The maximum scale denominator as read from metadata */
    maxScaleDenominator: number;
    /**
     * The class constructor.
     * @param {XYZTilesLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: XYZTilesLayerEntryConfig);
}
export interface TypeMetadataXYZTiles {
    layers: TypeMetadataXYZTilesLayer[];
    listOfLayerEntryConfig: XYZTilesLayerEntryConfig[];
}
export type TypeMetadataXYZTilesLayer = XYZTilesLayerEntryConfig & {
    id: string;
};
//# sourceMappingURL=xyz-layer-entry-config.d.ts.map