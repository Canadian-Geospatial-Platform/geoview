import TileLayer from 'ol/layer/Tile';
import type WMTSSource from 'ol/source/WMTS';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { OgcWmtsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
import type { TypeLegend } from '@/index';
/**
 * Manages a WMTS layer.
 */
export declare class GVWMTS extends AbstractGVTile {
    #private;
    /**
     * Constructs a GVWMTS layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: WMTSSource, layerConfig: OgcWmtsLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The strongly-typed OpenLayers type.
     */
    getOLLayer(): TileLayer<WMTSSource>;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     *
     * @returns The WMTS source instance associated with this layer.
     */
    getOLSource(): WMTSSource;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): OgcWmtsLayerEntryConfig;
    /**
     * Overrides the way to get the bounds for this layer type.
     *
     * @param projection - The projection to get the bounds into.
     * @param stops - The number of stops to use to generate the extent.
     * @returns A promise that resolves with the layer bounding box or undefined when not found
     */
    onGetBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Overrides the fetching of the legend for a WMTS layer.
     *
     * @returns A promise that resolves with the legend of the layer or null
     */
    onFetchLegend(): Promise<TypeLegend | null>;
}
//# sourceMappingURL=gv-wmts.d.ts.map