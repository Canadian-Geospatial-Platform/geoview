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
     * Overrides the features of a geojson layer with new geojson.
     *
     * @param {GeoJSONObject | string} geojson - The new geoJSON.
     * @param {OLProjection} projection - The output projection.
     */
    setGeojsonSource(geojson: GeoJSONObject | string, projection: OLProjection): void;
}
