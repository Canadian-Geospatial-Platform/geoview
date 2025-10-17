import type VectorTile from 'ol/source/VectorTile';
import type VectorTileLayer from 'ol/layer/VectorTile';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
/**
 * Abstract Geoview Layer managing an OpenLayer vector tile type layer.
 */
export declare abstract class AbstractGVVectorTile extends AbstractGVLayer {
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @override
     * @returns {VectorTileLayer<VectorTile>} The strongly-typed OpenLayers type.
     */
    getOLLayer(): VectorTileLayer<VectorTile>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     * @override
     * @returns {VectorTile} The VectorTile source instance associated with this layer.
     */
    getOLSource(): VectorTile;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @override
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
}
//# sourceMappingURL=abstract-gv-vector-tile.d.ts.map