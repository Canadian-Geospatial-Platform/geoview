import { Geometry } from '@/geo/layer/geometry/geometry';
import { AbstractGeoViewLayer } from './geoview-layers/abstract-geoview-layers';
import { TypeGeoviewLayerConfig, TypeLayerEntryConfig, TypeListOfLayerEntryConfig, TypeListOfLocalizedLanguages } from '@/geo/map/map-schema-types';
/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 *
 * @exports
 * @class Layer
 */
export declare class Layer {
    /** Layers with valid configuration for this map. */
    registeredLayers: {
        [layerEntryConfigId: string]: TypeLayerEntryConfig;
    };
    geoviewLayers: {
        [geoviewLayerId: string]: AbstractGeoViewLayer;
    };
    geometry: Geometry | undefined;
    layerOrder: string[];
    /** used to reference the map id */
    private mapId;
    /** used to keep a reference the Layer's event handler functions */
    private eventHandlerFunctions;
    /** used to keep a reference of highlighted layer */
    private highlightedLayer;
    /**
     * Initialize layer types and listen to add/remove layer events from outside
     *
     * @param {string} mapId a reference to the map
     */
    constructor(mapId: string);
    /**
     * Delete the event handler functions associated to the Layer instance.
     */
    deleteEventHandlerFunctionsOfThisLayerInstance(): void;
    /**
     * Load layers that was passed in with the map config
     *
     * @param {TypeGeoviewLayerConfig[]} geoviewLayerConfigs an optional array containing layers passed within the map config
     */
    loadListOfGeoviewLayer(geoviewLayerConfigs?: TypeGeoviewLayerConfig[]): void;
    /**
     * Validate the geoview layer configuration array to eliminate duplicate entries and inform the user.
     * @param {TypeGeoviewLayerConfig[]} geoviewLayerConfigs The geoview layer configurations to validate.
     *
     * @returns {TypeGeoviewLayerConfig} The new configuration with duplicate entries eliminated.
     */
    private deleteDuplicatGeoviewLayerConfig;
    /**
     * Print an error message for the duplicate geoview layer configuration.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The geoview layer configuration in error.
     */
    private printDuplicateGeoviewLayerConfigError;
    /**
     * Get the layer Path of the layer configuration parameter.
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer configuration for wich we want to get the layer path.
     * @param {string} layerPath Internal parameter used to build the layer path (should not be used by the user).
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
     * Remove a layer from the map using its layer path. The path may point to the root geoview layer
     * or a sub layer.
     *
     * @param {string} partialLayerPath the path of the layer to be removed
     */
    removeLayersUsingPath: (partialLayerPath: string) => void;
    /**
     * Add a layer to the map
     *
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig the geoview layer configuration to add
     * @param {TypeListOfLocalizedLanguages} optionalSuportedLanguages an optional list of supported language
     */
    addGeoviewLayer: (geoviewLayerConfig: TypeGeoviewLayerConfig, optionalSuportedLanguages?: TypeListOfLocalizedLanguages) => string;
    /**
     * Remove a geoview layer from the map
     *
     * @param {TypeGeoviewLayerConfig} geoviewLayer the layer configuration to remove
     */
    removeGeoviewLayer: (geoviewLayer: AbstractGeoViewLayer) => string;
    /**
     * Remove all geoview layers from the map
     */
    removeAllGeoviewLayers: () => string;
    /**
     * Search for a layer using it's id and return the layer data
     *
     * @param {string} geoviewLayerId the layer id to look for
     * @returns the found layer data object
     */
    getGeoviewLayerById: (geoviewLayerId: string) => AbstractGeoViewLayer | null;
    /**
     * Search asynchronously for a layer using it's id and return the layer data.
     * If the layer we're searching for has to be loaded, set mustBeLoaded to true when awaiting on this method.
     * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
     * Note this function uses 'Async' suffix only to differentiate it from 'getGeoviewLayerById'.
     *
     * @param {string} layerID the layer id to look for
     * @param {string} mustBeLoaded indicate if the layer we're searching for must be found only once loaded
     * @param {string} checkFrequency optionally indicate the frequency at which to check for the condition on the layer
     * @param {string} timeout optionally indicate the timeout after which time to abandon the promise
     * @returns the found layer data object
     */
    getGeoviewLayerByIdAsync: (layerID: string, mustBeLoaded: boolean, checkFrequency?: number, timeout?: number) => Promise<AbstractGeoViewLayer | null>;
    /**
     * Function used to order the sublayers based on their position in the config.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerConfig List of layer configs to order
     */
    orderSubLayers(listOfLayerConfig: TypeListOfLayerEntryConfig): string[];
    /**
     * Set Z index for layer and it's sublayers
     *
     * @param {AbstractGeoViewLayer} geoviewLayer layer to set Z index for
     */
    setLayerZIndices: (geoviewLayer: AbstractGeoViewLayer) => void;
    /**
     * Move layer to new spot.
     *
     * @param {string} layerId ID of layer to be moved
     * @param {number} destination index that layer is to move to
     * @param {string} parentLayerId ID of parent layer if layer is a sublayer
     */
    moveLayer: (layerId: string, destination: number, parentLayerId?: string) => void;
    /**
     * Highlight layer or sublayer on map
     *
     * @param {string} layerPath ID of layer to highlight
     */
    highlightLayer(layerPath: string): void;
    /**
     * Remove layer or sublayer highlight
     */
    removeHighlightLayer(): void;
}
