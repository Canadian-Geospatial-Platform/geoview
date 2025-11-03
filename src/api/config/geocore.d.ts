import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { GeoCoreLayerConfig, RCSLayerConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
/**
 * Class used to add geoCore layer to the map
 * @exports
 * @class GeoCore
 */
export declare class GeoCore {
    /**
     * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
     * @param {string} uuid - The UUID of the layer.
     * @param {TypeDisplayLanguage} language - The language.
     * @param {string} mapId - The optional map id.
     * @param {GeoCoreLayerConfig?} layerConfig - The optional layer configuration.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<GeoCoreLayerConfigResponse>} List of layer configurations to add to the map.
     */
    static createLayerConfigFromUUID(uuid: string, language: TypeDisplayLanguage, mapId?: string, layerConfig?: GeoCoreLayerConfig, abortSignal?: AbortSignal): Promise<GeoCoreLayerConfigResponse>;
    /**
     * Gets GeoView layer configurations list from the RCS UUIDs of the list of layer entry configurations.
     * @param {string} uuid - The UUID of the layer.
     * @param {TypeDisplayLanguage} language - The language.
     * @param {RCSLayerConfig?} layerConfig - The optional layer configuration.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<TypeGeoviewLayerConfig>} List of layer configurations to add to the map.
     */
    static createLayerConfigFromRCSUUID(uuid: string, language: TypeDisplayLanguage, layerConfig?: RCSLayerConfig, abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig>;
}
export type GeoCoreLayerConfigResponse = {
    config: TypeGeoviewLayerConfig;
    geocharts: {
        [key: string]: GeoViewGeoChartConfig;
    };
};
//# sourceMappingURL=geocore.d.ts.map