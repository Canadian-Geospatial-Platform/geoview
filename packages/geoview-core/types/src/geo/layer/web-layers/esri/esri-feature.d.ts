import L from 'leaflet';
import { FeatureLayer, MapService } from 'esri-leaflet';
import { AbstractWebLayersClass, TypeFeatureLayer, TypeJsonValue, TypeJsonObject, TypeBaseWebLayersConfig } from '../../../../core/types/cgpv-types';
export declare const layerConfigIsEsriFeature: (verifyIfLayer: TypeBaseWebLayersConfig) => verifyIfLayer is TypeFeatureLayer;
export declare const webLayerIsEsriFeature: (verifyIfWebLayer: AbstractWebLayersClass) => verifyIfWebLayer is EsriFeature;
/**
 * a class to add esri feature layer
 *
 * @export
 * @class EsriFeature
 */
export declare class EsriFeature extends AbstractWebLayersClass {
    layer: FeatureLayer | null;
    mapService: MapService;
    /**
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeFeatureLayer} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeFeatureLayer);
    /**
     * Add a ESRI feature layer to the map.
     *
     * @param {TypeFeatureLayer} layer the layer configuration
     * @return {Promise<FeatureLayer | null>} layers to add to the map
     */
    add(layer: TypeFeatureLayer): Promise<FeatureLayer | null>;
    /**
     * Get metadata of the current service
     *
     @returns {Promise<TypeJsonValue>} a json promise containing the result of the query
     */
    getMetadata: () => Promise<TypeJsonObject>;
    /**
     * Get legend configuration of the current layer
     *
     * @returns {Promise<TypeJsonValue> } legend configuration in json format
     */
    getLegendJson: () => Promise<TypeJsonValue>;
    /**
     * Set Layer Opacity
     * @param {number} opacity layer opacity
     */
    setOpacity: (opacity: number) => void;
    /**
     * Get bounds through external metadata
     *
     * @returns {Promise<L.LatLngBounds>} layer bounds
     */
    getBounds: () => Promise<L.LatLngBounds>;
}
