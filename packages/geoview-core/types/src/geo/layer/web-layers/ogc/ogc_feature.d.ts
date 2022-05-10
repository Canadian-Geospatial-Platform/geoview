import L from 'leaflet';
import { MapService } from 'esri-leaflet';
import { AbstractWebLayersClass, TypeJsonValue, TypeOgcFeatureLayer, TypeBaseWebLayersConfig } from '../../../../core/types/cgpv-types';
export declare const layerConfigIsOgcFeature: (verifyIfLayer: TypeBaseWebLayersConfig) => verifyIfLayer is TypeOgcFeatureLayer;
export declare const webLayerIsOgcFeature: (verifyIfWebLayer: AbstractWebLayersClass) => verifyIfWebLayer is OgcFeature;
/**
 * a class to add OGC api feature layer
 *
 * @export
 * @class OgcFeature
 */
export declare class OgcFeature extends AbstractWebLayersClass {
    #private;
    layer: L.GeoJSON | null;
    mapService: MapService;
    /**
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeOgcFeatureLayer} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeOgcFeatureLayer);
    /**
     * Add a OGC API feature layer to the map.
     *
     * @param {TypeOgcFeatureLayer} layer the layer configuration
     *
     * @return {Promise<L.GeoJSON | null>} layers to add to the map
     */
    add(layer: TypeOgcFeatureLayer): Promise<L.GeoJSON | null>;
    /**
     * Get feature type info of a given entry
     * @param {object} featureTypeList feature type list
     * @param {string} entries names(comma delimited) to check
     * @returns {TypeJsonValue | null} feature type object or null
     */
    private getFeatureTypeInfo;
    /**
     * Get capabilities of the current WFS service
     *
     * @returns {TypeJsonObject} WFS capabilities in json format
     */
    getMeta: () => TypeJsonValue;
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
