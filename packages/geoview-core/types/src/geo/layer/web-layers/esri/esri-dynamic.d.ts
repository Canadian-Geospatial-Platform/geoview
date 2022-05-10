import L from 'leaflet';
import { DynamicMapLayer, MapService } from 'esri-leaflet';
import { AbstractWebLayersClass, TypeDynamicLayer, TypeJsonObject, TypeJsonArray, TypeBaseWebLayersConfig } from '../../../../core/types/cgpv-types';
export declare const layerConfigIsEsriDynamic: (verifyIfLayer: TypeBaseWebLayersConfig) => verifyIfLayer is TypeDynamicLayer;
export declare const webLayerIsEsriDynamic: (verifyIfWebLayer: AbstractWebLayersClass) => verifyIfWebLayer is EsriDynamic;
/**
 * a class to add esri dynamic layer
 *
 * @export
 * @class EsriDynamic
 */
export declare class EsriDynamic extends AbstractWebLayersClass {
    layer: DynamicMapLayer | null;
    mapService: MapService;
    /**
     * Initialize layer
     * @param {string} mapId the id of the map
     * @param {TypeDynamicLayer} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeDynamicLayer);
    /**
     * Add a ESRI dynamic layer to the map.
     *
     * @param {TypeDynamicLayer} layer the layer configuration
     * @return {Promise<DynamicMapLayer | null>} layers to add to the map
     */
    add(layer: TypeDynamicLayer): Promise<DynamicMapLayer | null>;
    /**
     * Get metadata of the current service
     *
     @returns {Promise<TypeJsonValue>} a json promise containing the result of the query
     */
    getMetadata: () => Promise<TypeJsonObject>;
    /**
     * Get legend configuration of the current layer
     *
     * @returns {TypeJsonValue} legend configuration in json format
     */
    getLegendJson: () => Promise<TypeJsonArray>;
    /**
     * Set Layer Opacity
     * @param {number} opacity layer opacity
     */
    setOpacity: (opacity: number) => void;
    /**
     * Fetch the bounds for an entry
     *
     * @param {number} entry
     * @returns {TypeJsonValue} the result of the fetch
     */
    private getEntry;
    /**
     * Get bounds through external metadata
     *
     * @returns {Promise<L.LatLngBounds>} layer bounds
     */
    getBounds: () => Promise<L.LatLngBounds>;
    /**
     * Sets Layer entries to toggle sublayers
     *
     * @param entries MapServer layer IDs
     */
    setEntries: (entries: number[]) => void;
}
