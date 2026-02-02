import type { VectorTile } from 'ol/source';
import type { VectorTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { AbstractGVVectorTile } from '@/geo/layer/gv-layers/vector/abstract-gv-vector-tile';
/**
 * Manages a Vector Tiles layer.
 *
 * @exports
 * @class GVVectorTiles
 */
export declare class GVVectorTiles extends AbstractGVVectorTile {
    /**
     * Constructs a GVVectorTiles layer to manage an OpenLayer layer.
     * @param {VectorTile} olSource - The OpenLayer source.
     * @param {VectorTilesLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: VectorTile, layerConfig: VectorTilesLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {VectorTilesLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): VectorTilesLayerEntryConfig;
    /**
     * Used to change the style of the vector tile layer.
     * @param styleUrl The style URL to apply to the layer
     * @returns Promise<void>
     */
    changeStyle(styleUrl: string): Promise<void>;
}
//# sourceMappingURL=gv-vector-tiles.d.ts.map