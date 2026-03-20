import type { VectorTile } from 'ol/source';
import type { VectorTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { AbstractGVVectorTile } from '@/geo/layer/gv-layers/vector/abstract-gv-vector-tile';
/**
 * Manages a Vector Tiles layer.
 */
export declare class GVVectorTiles extends AbstractGVVectorTile {
    /**
     * Constructs a GVVectorTiles layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: VectorTile, layerConfig: VectorTilesLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): VectorTilesLayerEntryConfig;
    /**
     * Used to change the style of the vector tile layer.
     *
     * @param styleUrl - The style URL to apply to the layer.
     * @returns A promise that resolves when the style has been applied.
     */
    changeStyle(styleUrl: string): Promise<void>;
}
//# sourceMappingURL=gv-vector-tiles.d.ts.map