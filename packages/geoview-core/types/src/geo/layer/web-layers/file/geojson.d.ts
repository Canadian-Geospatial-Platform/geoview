import L from 'leaflet';
import { AbstractWebLayersClass, TypeGeoJSONLayer, TypeBaseWebLayersConfig } from '../../../../core/types/cgpv-types';
export declare const layerConfigIsGeoJSON: (verifyIfLayer: TypeBaseWebLayersConfig) => verifyIfLayer is TypeGeoJSONLayer;
export declare const webLayerIsGeoJSON: (verifyIfWebLayer: AbstractWebLayersClass) => verifyIfWebLayer is GeoJSON;
/**
 * Class used to add geojson layer to the map
 *
 * @export
 * @class GeoJSON
 */
export declare class GeoJSON extends AbstractWebLayersClass {
    layer: L.GeoJSON | null;
    /**
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeGeoJSONLayer} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeGeoJSONLayer);
    /**
     * Add a GeoJSON layer to the map.
     *
     * @param {TypeGeoJSONLayer} layer the layer configuration
     * @return {Promise<L.GeoJSON | null>} layers to add to the map
     */
    add(layer: TypeGeoJSONLayer): Promise<L.GeoJSON | null>;
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
