import VectorSource from 'ol/source/Vector';
import { GeoJSONObject } from 'ol/format/GeoJSON';
import { Projection as OLProjection } from 'ol/proj';
import { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
/**
 * Manages a GeoJSON layer.
 *
 * @exports
 * @class GVGeoJSON
 */
export declare class GVGeoJSON extends AbstractGVVector {
    #private;
    /**
     * Constructs a GVGeoJSON layer to manage an OpenLayer layer.
     * @param {VectorSource} olSource - The OpenLayer source.
     * @param {GeoJSONLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(olSource: VectorSource, layerConfig: GeoJSONLayerEntryConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {GeoJSONLayerEntryConfig} The strongly-typed layer configuration specific to this layer.
     */
    getLayerConfig(): GeoJSONLayerEntryConfig;
    /**
     * Overrides the refresh to reload the Geojson object in the layer source once the refresh completes.
     * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
     * @override
     */
    onRefresh(projection: OLProjection | undefined): void;
    /**
     * Loads a Geojson object as the layer source features, overriding the current features if any.
     * @param {GeoJSONObject | string} geojson - The geoJSON object.
     * @param {OLProjection} projection - The output projection.
     */
    setGeojsonSource(geojson: GeoJSONObject | string, projection: OLProjection): void;
    /**
     * Updates the Geojson object, if any, to reproject the features into the new provided projection.
     * @param {OLProjection} projection - The projection to project the geojson source features into.
     */
    updateGeojsonSource(projection: OLProjection): void;
}
//# sourceMappingURL=gv-geojson.d.ts.map