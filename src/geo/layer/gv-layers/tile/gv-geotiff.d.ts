import WebGLTile from 'ol/layer/WebGLTile';
import type GeoTIFFSource from 'ol/source/GeoTIFF';
import type { Extent } from 'ol/extent';
import type { Projection as OLProjection } from 'ol/proj';
import type { GeoTIFFLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';
import { AbstractGVTile } from '@/geo/layer/gv-layers/tile/abstract-gv-tile';
import type { TypeOutfieldsType } from '@/api/types/map-schema-types';
import { type TypeLegend } from '@/index';
/**
 * Manages a GeoTIFF layer.
 * @exports
 * @class GVGeoTIFF
 */
export declare class GVGeoTIFF extends AbstractGVTile {
    #private;
    /**
     * Constructs a GVGeoTIFF layer to manage an OpenLayer layer.
     * @param {GeoTIFFSource} olSource - The OpenLayer source.
     * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: GeoTIFFSource, layerConfig: GeoTIFFLayerEntryConfig);
    /**
     * Overrides the parent method to return a more specific OpenLayers layer type (covariant return).
     * @override
     * @returns {WebGLTile} The strongly-typed OpenLayers type.
     */
    getOLLayer(): WebGLTile;
    /**
     * Overrides the parent class's method to return a more specific OpenLayers source type (covariant return).
     * @override
     * @returns {GeoTIFFSource} The GeoTIFF source instance associated with this layer.
     */
    getOLSource(): GeoTIFFSource;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {GeoTIFFLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): GeoTIFFLayerEntryConfig;
    /**
     * Overrides the return of the field type from the metadata. If the type can not be found, return 'string'.
     * @param {string} fieldName - The field name for which we want to get the type.
     * @returns {TypeOutfieldsType} The type of the field.
     */
    protected onGetFieldType(fieldName: string): TypeOutfieldsType;
    /**
     * Overrides the way to get the bounds for this layer type.
     * @param {OLProjection} projection - The projection to get the bounds into.
     * @param {number} stops - The number of stops to use to generate the extent.
     * @returns {Extent | undefined} The layer bounding box.
     */
    onGetBounds(projection: OLProjection, stops: number): Extent | undefined;
    /**
     * Overrides the fetching of the legend for a static image layer.
     * @override
     * @returns {Promise<TypeLegend | null>} The legend of the layer or null.
     */
    onFetchLegend(): Promise<TypeLegend | null>;
}
//# sourceMappingURL=gv-geotiff.d.ts.map