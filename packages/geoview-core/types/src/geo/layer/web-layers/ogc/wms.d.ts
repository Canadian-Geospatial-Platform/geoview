import L from 'leaflet';
import { MapService } from 'esri-leaflet';
import { AbstractWebLayersClass, TypeJsonObject, TypeWMSLayer, TypeJsonArray, TypeBaseWebLayersConfig } from '../../../../core/types/cgpv-types';
export declare const layerConfigIsWMS: (verifyIfLayer: TypeBaseWebLayersConfig) => verifyIfLayer is TypeWMSLayer;
export declare const webLayerIsWMS: (verifyIfWebLayer: AbstractWebLayersClass) => verifyIfWebLayer is WMS;
/**
 * a class to add wms layer
 *
 * @export
 * @class WMS
 */
export declare class WMS extends AbstractWebLayersClass {
    #private;
    layer: L.TileLayer.WMS | null;
    mapService: MapService;
    /**
     * Initialize layer
     * @param {string} mapId the id of the map
     * @param {TypeWMSLayer} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeWMSLayer);
    /**
     * Add a WMS layer to the map.
     *
     * @param {TypeWMSLayer} layer the layer configuration
     * @return {Promise<Layer | null>} layers to add to the map
     */
    add(layer: TypeWMSLayer): Promise<L.TileLayer.WMS | null>;
    /**
     * Check if the entries we try to create a layer exist in the getCapabilities layer object
     * @param {object} layer layer of capability of a WMS object
     * @param {string} entries names(comma delimited) to check
     * @returns {boolean} entry is valid
     */
    private validateEntries;
    /**
     * Helper function. Find all values of a given key form a nested object
     * @param {object} obj a object/nested object
     * @param {string} keyToFind key to check
     * @returns {any} all values found
     */
    private findAllByKey;
    /**
     * Get capabilities of the current WMS service
     *
     * @returns {TypeJsonObject} WMS capabilities in json format
     */
    getCapabilities: () => TypeJsonObject;
    /**
     * Get the legend image of a layer from the capabilities. Return null if it does not exist,,
     *
     * @returns {TypeJsonObject | null} URL of a Legend image in png format or null
     */
    getLegendUrlFromCapabilities: () => TypeJsonObject | null;
    /**
     * Get the legend image of a layer
     *
     * @param {layerName} string the name of the layer to get the legend image for
     * @returns {blob} image blob
     */
    getLegendGraphic: () => Promise<string | ArrayBuffer | null>;
    /**
     * Get feature info given a latlng
     *
     * @param {L.LatLng} latlng lat/lng coordinates received on any interaction with the map
     * @param {L.Map} map the map odject
     * @param {number} featureCount the map odject
     *
     * @returns {Promise<TypeJsonArray | null>} a promise that returns the feature info in a json format
     */
    getFeatureInfo: (latlng: L.LatLng, map: L.Map, featureCount?: number) => Promise<TypeJsonArray | null>;
    /**
     * Get the parameters used to query feature info url from a lat lng point
     *
     * @param {LatLng} latlng a latlng point to generate the feature url from
     * @param {L.Map} map the map odject
     * @returns the map service url including the feature query
     */
    private getFeatureInfoParams;
    /**
     * Set Layer Opacity
     * @param {number} opacity layer opacity
     */
    setOpacity: (opacity: number) => void;
    /**
     * Get bounds through Leaflet built-in functions
     *
     * @returns {L.LatLngBounds} layer bounds
     */
    getBounds: () => L.LatLngBounds;
}
