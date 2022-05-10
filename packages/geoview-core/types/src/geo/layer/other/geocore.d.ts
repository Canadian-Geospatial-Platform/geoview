import { TypeGeoCoreLayer, TypeLayerConfig, TypeBaseWebLayersConfig } from '../../../core/types/cgpv-types';
export declare const layerConfigIsGeoCore: (verifyIfLayer: Omit<TypeBaseWebLayersConfig, 'url'>) => verifyIfLayer is TypeGeoCoreLayer;
/**
 * Class used to add geoCore layer to the map
 *
 * @export
 * @class GeoCore
 */
export declare class GeoCore {
    #private;
    /**
     * Initialize layer
     * @param {string} mapId the id of the map
     */
    constructor(mapId: string);
    /**
     * Get layer from uuid
     *
     * @param {TypeGeoCoreLayer} layer the layer configuration
     * @return {Promise<TypeLayerConfig | null>} layers to add to the map
     */
    add(layer: TypeGeoCoreLayer): Promise<TypeLayerConfig | null>;
}
