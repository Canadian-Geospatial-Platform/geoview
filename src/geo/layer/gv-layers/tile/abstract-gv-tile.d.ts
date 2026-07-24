import type BaseTileLayer from 'ol/layer/BaseTile';
import type TileSource from 'ol/source/Tile';
import type LayerRenderer from 'ol/renderer/Layer';
import { type GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
/**
 * Abstract Geoview Layer managing an OpenLayer tile type layer.
 */
export declare abstract class AbstractGVTile extends AbstractGVLayer {
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The strongly-typed OpenLayers type.
     */
    getOLLayer(): BaseTileLayer<TileSource, LayerRenderer<any>>;
    /**
     * Overridable method called to get a more specific error code for all errors.
     *
     * @param event - The event which is being triggered.
     * @returns The GeoViewError stored in the GVVectorSource if any or the one from the parent method.
     */
    protected onErrorDecipherError(event: Event): GeoViewError;
}
//# sourceMappingURL=abstract-gv-tile.d.ts.map