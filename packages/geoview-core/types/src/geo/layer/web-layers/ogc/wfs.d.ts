import L from 'leaflet';
import { MapService } from 'esri-leaflet';
import { AbstractWebLayersClass, TypeJsonObject, TypeWFSLayer, TypeBaseWebLayersConfig } from '../../../../core/types/cgpv-types';
export declare const layerConfigIsWFS: (verifyIfLayer: TypeBaseWebLayersConfig) => verifyIfLayer is TypeWFSLayer;
export declare const webLayerIsWFS: (verifyIfWebLayer: AbstractWebLayersClass) => verifyIfWebLayer is WFS;
/**
 * a class to add WFS layer
 *
 * @export
 * @class WFS
 */
export declare class WFS extends AbstractWebLayersClass {
    #private;
    layer: L.GeoJSON | null;
    mapService: MapService;
    /**
     * Initialize layer
     * @param {string} mapId the id of the map
     * @param {TypeWFSLayer} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeWFSLayer);
    /**
     * Add a WFS layer to the map.
     *
     * @param {TypeWFSLayer} layer the layer configuration
     * @return {Promise<L.GeoJSON | null>} layers to add to the map
     */
    add(layer: TypeWFSLayer): Promise<L.GeoJSON | null>;
    /**
     * Get feature type info of a given entry
     * @param {object} featureTypeList feature type list
     * @param {string} entries names(comma delimited) to check
     * @returns {TypeJsonValue | null} feature type object or null
     */
    private getFeatyreTypeInfo;
    /**
     * Get capabilities of the current WFS service
     *
     * @returns {TypeJsonObject} WFS capabilities in json format
     */
    getCapabilities: () => TypeJsonObject;
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
