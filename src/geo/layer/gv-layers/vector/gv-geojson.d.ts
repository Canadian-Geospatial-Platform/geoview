import type VectorSource from 'ol/source/Vector';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import type { Projection as OLProjection } from 'ol/proj';
import type { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
/**
 * Manages a GeoJSON layer.
 */
export declare class GVGeoJSON extends AbstractGVVector {
    #private;
    /**
     * Constructs a GVGeoJSON layer to manage an OpenLayer layer.
     *
     * @param olSource - The OpenLayer source.
     * @param layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: GeoJSONLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): GeoJSONLayerEntryConfig;
    /**
     * Overrides the refresh to reload the Geojson object in the layer source once the refresh completes.
     *
     * @param projection - Optional projection to refresh to.
     */
    onRefresh(projection: OLProjection | undefined): void;
    /**
     * Loads a Geojson object as the layer source features, overriding the current features if any.
     *
     * @param geojson - The geoJSON object.
     * @param projection - The output projection.
     * @returns A promise that resolves once the source has been updated with the new features.
     */
    setGeojsonSource(geojson: GeoJSONObject | string, projection: OLProjection): Promise<void>;
    /**
     * Updates the Geojson object, if any, to reproject the features into the new provided projection.
     *
     * @param projection - The projection to project the geojson source features into.
     * @returns A promise that resolves once the source has been updated with the reprojected features, or immediately if no geojson source is defined.
     */
    updateGeojsonSource(projection: OLProjection): Promise<void>;
}
//# sourceMappingURL=gv-geojson.d.ts.map