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
export declare class XYZTilesLayerEntryConfig extends TileLayerEntryConfig {
    /** Tag used to link the entry to a specific schema. */
    schemaTag: import("@/api/types/layer-schema-types").TypeGeoviewLayerType;
    /** Layer entry data type. */
    entryType: import("@/api/types/layer-schema-types").TypeLayerEntryType;
    /** The layer entry props that were used in the constructor. */
    layerEntryProps: XYZTilesLayerEntryConfigProps;
    source: TypeSourceImageXYZTilesInitialConfig;
    /** The minimum scale denominator as read from metadata */
    minScaleDenominator: number;
    /** The maximum scale denominator as read from metadata */
    maxScaleDenominator: number;
    /**
     * The class constructor.
     * @param {XYZTilesLayerEntryConfigProps | XYZTilesLayerEntryConfigProps} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: XYZTilesLayerEntryConfigProps | XYZTilesLayerEntryConfigProps);
}
export interface TypeMetadataXYZTiles {
    layers: TypeMetadataXYZTilesLayer[];
    listOfLayerEntryConfig: XYZTilesLayerEntryConfigProps[];
}
export type TypeMetadataXYZTilesLayer = XYZTilesLayerEntryConfigProps & {
    id: string;
};
//# sourceMappingURL=xyz-layer-entry-config.d.ts.map