import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { GeoCoreLayerConfig, RCSLayerConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
/** Class used to add GeoCore layers to the map. */
export declare class GeoCore {
    /**
     * Gets GeoView layer configurations list from the UUIDs of the list of layer entry configurations.
     *
     * @param uuid - The UUID of the layer
     * @param language - The language
     * @param mapId - Optional map id
     * @param layerConfig - Optional layer configuration
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the layer configuration and associated geocharts
     */
    static createLayerConfigFromUUID(uuid: string, currentLayerIds: string[], language: TypeDisplayLanguage, mapId?: string, layerConfig?: GeoCoreLayerConfig, abortSignal?: AbortSignal): Promise<GeoCoreLayerConfigResponse>;
    /**
     * Gets GeoView layer configurations list from the RCS UUIDs of the list of layer entry configurations.
     *
     * @param uuid - The UUID of the layer
     * @param language - The language
     * @param mapId - The map identifier
     * @param layerConfig - Optional layer configuration
     * @param abortSignal - Optional {@link AbortSignal} used to handle cancelling of fetch
     * @returns A promise that resolves with the layer configuration to add to the map
     */
    static createLayerConfigFromRCSUUID(uuid: string, language: TypeDisplayLanguage, mapId: string, layerConfig?: RCSLayerConfig, abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig>;
}
/** Response structure containing the layer configuration and associated geocharts. */
export type GeoCoreLayerConfigResponse = {
    config: TypeGeoviewLayerConfig;
    geocharts: {
        [key: string]: GeoViewGeoChartConfig;
    };
};
//# sourceMappingURL=geocore.d.ts.map