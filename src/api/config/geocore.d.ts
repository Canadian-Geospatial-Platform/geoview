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
     * @param uuid - The UUID of the layer.
     * @param language - The language.
     * @param mapId - The optional map id.
     * @param layerConfig - Optional layer configuration.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
     * @returns List of layer configurations to add to the map.
     */
    static createLayerConfigFromUUID(uuid: string, language: TypeDisplayLanguage, mapId?: string, layerConfig?: GeoCoreLayerConfig, abortSignal?: AbortSignal): Promise<GeoCoreLayerConfigResponse>;
    /**
     * Gets GeoView layer configurations list from the RCS UUIDs of the list of layer entry configurations.
     * @param uuid - The UUID of the layer.
     * @param language - The language.
     * @param mapId - The optional map id.
     * @param layerConfig - Optional layer configuration.
     * @param abortSignal - Optional {@link AbortSignal} used to handle cancelling of fetch.
     * @returns List of layer configurations to add to the map.
     */
    static createLayerConfigFromRCSUUID(uuid: string, language: TypeDisplayLanguage, mapId: string, layerConfig?: RCSLayerConfig, abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig>;
}
export type GeoCoreLayerConfigResponse = {
    config: TypeGeoviewLayerConfig;
    geocharts: {
        [key: string]: GeoViewGeoChartConfig;
    };
};
//# sourceMappingURL=geocore.d.ts.map