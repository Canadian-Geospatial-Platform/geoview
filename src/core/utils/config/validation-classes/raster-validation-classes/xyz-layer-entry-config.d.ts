import { TypeSourceImageXYZTilesInitialConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
export declare class XYZTilesLayerEntryConfig extends TileLayerEntryConfig {
    source: TypeSourceImageXYZTilesInitialConfig;
    /**
     * The class constructor.
     * @param {TypeXYZTilesLayerEntryConfig} layerConfig - The layer configuration we want to instanciate.
     */
    constructor(layerConfig: XYZTilesLayerEntryConfig);
}
