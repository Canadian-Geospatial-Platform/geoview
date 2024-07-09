import VectorSource from 'ol/source/Vector';
import { GeoJSONLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { AbstractGVVector } from './abstract-gv-vector';
/**
 * Manages a GeoJSON layer.
 *
 * @exports
 * @class GVGeoJSON
 */
export declare class GVGeoJSON extends AbstractGVVector {
    /**
     * Constructs a GVGeoJSON layer to manage an OpenLayer layer.
     * @param {string} mapId - The map id
     * @param {VectorSource} olSource - The OpenLayer source.
     * @param {GeoJSONLayerEntryConfig} layerConfig - The layer configuration.
     */
    constructor(mapId: string, olSource: VectorSource, layerConfig: GeoJSONLayerEntryConfig);
    /**
     * Overrides the get of the layer configuration associated with the layer.
     * @returns {GeoJSONLayerEntryConfig} The layer configuration or undefined if not found.
     */
    getLayerConfig(): GeoJSONLayerEntryConfig;
}
