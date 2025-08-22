import BaseTileLayer from 'ol/layer/BaseTile';
import TileSource from 'ol/source/Tile';
import LayerRenderer from 'ol/renderer/Layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
/**
 * Abstract Geoview Layer managing an OpenLayer tile type layer.
 */
export declare abstract class AbstractGVTile extends AbstractGVLayer {
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @override
     * @returns {BaseTileLayer<TileSource, LayerRenderer<any>>} The strongly-typed OpenLayers type.
     */
    getOLLayer(): BaseTileLayer<TileSource, LayerRenderer<any>>;
}
//# sourceMappingURL=abstract-gv-tile.d.ts.map