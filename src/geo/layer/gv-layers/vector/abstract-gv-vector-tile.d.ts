import VectorTile from 'ol/source/VectorTile';
import VectorTileLayer from 'ol/layer/VectorTile';
import { Extent } from 'ol/extent';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
/**
 * Abstract Geoview Layer managing an OpenLayer vector tile type layer.
 */
export declare abstract class AbstractGVVectorTile extends AbstractGVLayer {
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {VectorTileLayer<Feature>} The OpenLayers Layer
     */
    getOLLayer(): VectorTileLayer<VectorTile>;
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns {VectorTile} The OpenLayers Layer
     */
    getOLSource(): VectorTile;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(): Extent | undefined;
}
