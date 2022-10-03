import { Vector } from './vector/vector';
import { AbstractGeoViewLayer } from './geoview-layers/abstract-geoview-layers';
import { TypeGeoviewLayerConfig } from '../map/map-schema-types';
/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class Layer
 */
export declare class Layer {
    layers: {
        [key: string]: AbstractGeoViewLayer;
    };
    vector: Vector | undefined;
    /**
     * used to reference the map id
     */
    private mapId;
    /**
     * Initialize layer types and listen to add/remove layer events from outside
     *
     * @param {string} id a reference to the map
     * @param {TypeGeoviewLayerConfig} layersConfig an optional array containing layers passed within the map config
     */
    constructor(id: string, layersConfig?: TypeGeoviewLayerConfig[]);
    /**
     * Add the layer to the map if valid. If not (is a string) emit an error
     * @param {any} geoviewLayer the layer config
     */
    private addToMap;
    /**
     * Remove feature from ESRI Feature and GeoJSON layer from tabindex
     */
    removeTabindex(): void;
    /**
     * Remove a layer from the map
     *
     * @param {string} id the id of the layer to be removed
     */
    removeLayerById: (id: string) => void;
    /**
     * Add a layer to the map
     *
     * @param {TypeGeoviewLayerConfig} layerConfig the layer configuration to add
     */
    addLayer: (layerConfig: TypeGeoviewLayerConfig) => string;
    /**
     * Remove a layer from the map
     *
     * @param {TypeGeoviewLayerConfig} layer the layer configuration to remove
     */
    removeLayer: (geoviewLayer: AbstractGeoViewLayer) => string;
    /**
     * Search for a layer using it's id and return the layer data
     *
     * @param {string} id the layer id to look for
     * @returns the found layer data object
     */
    getLayerById: (id: string) => AbstractGeoViewLayer | null;
}
