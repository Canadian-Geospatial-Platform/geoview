import WebGLTile from 'ol/layer/WebGLTile';
import type GeoTIFFSource from 'ol/source/GeoTIFF';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import { type TypeLegend } from '@/api/types/layer-schema-types';
import type { GeoTIFFLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';
import type { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
/**
 * Manages a GeoTIFF layer.
 */
export declare class GVGeoTIFF extends AbstractGVTile {
    #private;
    /**
     * Constructs a GVGeoTIFF layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source
     * @param layerConfig - The layer configuration
     */
    constructor(olSource: GeoTIFFSource, layerConfig: GeoTIFFLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     *
     * @returns The strongly-typed OpenLayers type.
     */
    getOLLayer(): WebGLTile;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     *
     * @returns The GeoTIFF source instance associated with this layer.
     */
    protected getOLSource(): GeoTIFFSource;
    /**
     * Overrides the generic tile-error decipher to surface a specific source-load message.
     *
     * A GeoTIFF (COG) failing means the whole source could not be read - not one tile of a tiled service -
     * so this reports the access path that couldn't be loaded instead of a generic "a tile" error.
     *
     * @param event - The event which is being triggered
     * @returns A LayerSourceFailedToLoadError naming the GeoTIFF access path
     */
    protected onErrorDecipherError(event: Event): GeoViewError;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): GeoTIFFLayerEntryConfig;
    /**
     * Overrides the way to initialize the bounds for this layer type.
     *
     * @param projection - The projection to initialize the bounds into
     * @param stops - The number of stops to use to generate the extent
     * @returns A promise that resolves with the layer bounding box or undefined when not found
     */
    onInitBounds(projection: OLProjection, stops: number): Promise<Extent | undefined>;
    /**
     * Overrides the fetching of the legend for a geotiff layer.
     *
     * @returns A promise that resolves with the legend of the layer or null
     */
    onFetchLegend(): Promise<TypeLegend | null>;
}
//# sourceMappingURL=gv-geotiff.d.ts.map