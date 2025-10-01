import { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import { GeoCoreLayerConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
/**
 * Class used to add geoCore layer to the map
 * @exports
 * @class GeoCore
 */
export declare class GeoCore {
    /**
     * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
     * @param {string} uuid - The UUID of the layer
     * @param {TypeDisplayLanguage} language - The language
     * @param {string} mapId - The optional map id
     * @param {GeoCoreLayerConfig?} layerConfig - The optional layer configuration
     * @returns {Promise<TypeGeoviewLayerConfig>} List of layer configurations to add to the map.
     */
    static createLayerConfigFromUUID(uuid: string, language: TypeDisplayLanguage, mapId?: string, layerConfig?: GeoCoreLayerConfig): Promise<TypeGeoviewLayerConfig>;
}
//# sourceMappingURL=geocore.d.ts.map