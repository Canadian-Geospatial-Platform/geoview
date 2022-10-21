import { Vector } from './vector/vector';
import { AbstractGeoViewLayer } from './geoview-layers/abstract-geoview-layers';
import { TypeGeoviewLayerConfig, TypeLayerEntryConfig } from '../map/map-schema-types';
/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class Layer
 */
export declare class Layer {
    /** Layers with valid configuration for this map. */
    registeredLayers: Record<string, TypeLayerEntryConfig>;
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
     * @param {string} mapId a reference to the map
     * @param {TypeGeoviewLayerConfig} layersConfig an optional array containing layers passed within the map config
     */
    constructor(mapId: string, layersConfig?: TypeGeoviewLayerConfig[]);
    /**
     * Get the layer Path of the layer parameter.
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration for wich we want to get the layer path.
     *
     * @returns {string} Returns the layer path.
     */
    static getLayerPath(layerEntryConfig: TypeLayerEntryConfig, layerPath?: string): string;
    /**
     * Register the layer identifier. Duplicate identifier are not allowed.
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration to register.
     *
     * @returns {boolean} Returns false if the layer configuration can't be registered.
     */
    registerLayerConfig(layerEntryConfig: TypeLayerEntryConfig): boolean;
    /**
     * Method used to verify if a layer is registered. Returns true if registered.
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration to test.
     *
     * @returns {boolean} Returns true if the layer configuration is registered.
     */
    isRegistered(layerEntryConfig: TypeLayerEntryConfig): boolean;
    /**
     * Add the layer to the map if valid. If not (is a string) emit an error
     * @param {any} geoviewLayer the layer config
     */
    private addToMap;
    /**
     * Remove a layer from the map
     *
     * @param {string} id the id of the layer to be removed
     */
    removeGeoviewLayerById: (geoviewLayerId: string) => void;
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
    getGeoviewLayerById: (geoviewLayerId: string) => AbstractGeoViewLayer | null;
}
