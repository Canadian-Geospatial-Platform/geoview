import VectorSource from 'ol/source/Vector';
import { GeoJSONObject } from 'ol/format/GeoJSON';
import { Projection as OLProjection } from 'ol/proj';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
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
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {GeoJSONLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): GeoJSONLayerEntryConfig;
    /**
     * Overrides the refresh to reload the Geojson object in the layer source once the refresh completes.
     * @param {OLProjection | undefined} projection - Optional, the projection to refresh to.
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