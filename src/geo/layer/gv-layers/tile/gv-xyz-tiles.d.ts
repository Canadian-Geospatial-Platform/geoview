import TileLayer from 'ol/layer/Tile';
import type XYZ from 'ol/source/XYZ';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { XYZTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
/**
 * Manages a Tile<XYZ> layer.
 *
 * @exports
 * @class GVXYZTiles
 */
export declare class GVXYZTiles extends AbstractGVTile {
    /**
     * Constructs a GVXYZTiles layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: XYZ, layerConfig: XYZTilesLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The strongly-typed OpenLayers type.
     */
    getOLLayer(): TileLayer<XYZ>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     *
     * @returns The XYZ source instance associated with this layer.
     */
    getOLSource(): XYZ;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): XYZTilesLayerEntryConfig;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param projection - The projection to get the bounds into.
     * @param stops - The number of stops to use to generate the extent.
     * @returns A promise of layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
}
//# sourceMappingURL=gv-xyz-tiles.d.ts.map