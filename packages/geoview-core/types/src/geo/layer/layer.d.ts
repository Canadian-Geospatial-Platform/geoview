import { Vector } from './vector/vector';
import { MarkerClusterClass } from './vector/marker-cluster';
import { AbstractWebLayersClass, TypeLayerConfig } from '../../core/types/cgpv-types';
/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @export
 * @class Layer
 */
export declare class Layer {
    #private;
    layers: {
        [key: string]: AbstractWebLayersClass;
    };
    vector: Vector;
    markerCluster: MarkerClusterClass;
    /**
     * Initialize layer types and listen to add/remove layer events from outside
     *
     * @param {string} id a reference to the map
     * @param {TypeLayerConfig[]} layers an optional array containing layers passed within the map config
     */
    constructor(id: string, layers?: TypeLayerConfig[]);
    /**
     * Check if the layer is loading. We do validation prior to this so it should almost alwasy load
     * @param {string} name layer name
     * @param {leafletLayer} layer to aply the load event on to see it it loads
     */
    private layerIsLoaded;
    /**
     * Add the layer to the map if valid. If not (is a string) emit an error
     * @param {any} cgpvLayer the layer config
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
     * @param {TypeLayerConfig} layerConfig the layer configuration to add
     */
    addLayer: (layerConfig: TypeLayerConfig) => string;
    /**
     * Remove a layer from the map
     *
     * @param {TypeLayerConfig} layer the layer configuration to remove
     */
    removeLayer: (cgpvLayer: AbstractWebLayersClass) => string;
    /**
     * Search for a layer using it's id and return the layer data
     *
     * @param {string} id the layer id to look for
     * @returns the found layer data object
     */
    getLayerById: (id: string) => AbstractWebLayersClass | null;
}
