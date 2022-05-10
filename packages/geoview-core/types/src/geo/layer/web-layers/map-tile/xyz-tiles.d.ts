import L from 'leaflet';
import { AbstractWebLayersClass, TypeBaseWebLayersConfig, TypeXYZTiles } from '../../../../core/types/cgpv-types';
export declare const layerConfigIsXYZTiles: (verifyIfLayer: TypeBaseWebLayersConfig) => verifyIfLayer is TypeXYZTiles;
export declare const webLayerIsXYZTiles: (verifyIfWebLayer: AbstractWebLayersClass) => verifyIfWebLayer is XYZTiles;
/**
 * a class to add xyz-tiles layer
 *
 * @export
 * @class XYZTiles
 */
export declare class XYZTiles extends AbstractWebLayersClass {
    layer: L.TileLayer | null;
    /**
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeXYZTiles} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeXYZTiles);
    /**
     * Add a XYZ Tiles layer to the map.
     *
     * @param {TypeXYZTiles} layer the layer configuration
     * @return {Promise<L.TileLayer | null>} layers to add to the map
     */
    add(layer: TypeXYZTiles): Promise<L.TileLayer | null>;
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
