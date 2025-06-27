import BaseTileLayer from 'ol/layer/BaseTile';
import TileSource from 'ol/source/Tile';
import LayerRenderer from 'ol/renderer/Layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
/**
 * Abstract Geoview Layer managing an OpenLayer tile type layer.
 */
export declare abstract class AbstractGVTile extends AbstractGVLayer {
    /**
     * Overrides the get of the OpenLayers Layer
     * @returns The OpenLayers Layer
     */
    getOLLayer(): BaseTileLayer<TileSource, LayerRenderer<any>>;
}
//# sourceMappingURL=abstract-gv-tile.d.ts.map