import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { TypeGeoviewLayerConfig, TypeGeoviewLayerType, TypeOfServer } from '@/api/types/layer-schema-types';
import type { TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
/** A class to generate GeoView layers config from a URL using a UUID. */
export declare class UUIDmapConfigReader {
    #private;
    /**
     * Generates GeoView layers and package configurations (i.e. geochart), from GeoCore API, using a list of UUIDs.
     *
     * @param baseUrl - The base url of GeoCore API
     * @param lang - The language to get the config for
     * @param uuids - A list of uuids to get the configurations for
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the layers and geocharts parsed from GeoCore
     */
    static getGVConfigFromUUIDs(baseUrl: string, lang: TypeDisplayLanguage, uuids: string[], abortSignal?: AbortSignal): Promise<UUIDmapConfigReaderResponse>;
    /**
     * Generates GeoView layers configurations, from Geonetwork RCS API, using a list of UUIDs.
     *
     * @param baseUrl - The base url of GeoCore API
     * @param lang - The language to get the config for
     * @param uuids - A list of uuids to get the configurations for
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the layers parsed from Geonetwork RCS
     */
    static getGVConfigFromUUIDsRCS(baseUrl: string, lang: TypeDisplayLanguage, uuids: string[], abortSignal?: AbortSignal): Promise<UUIDmapConfigReaderResponse>;
}
/** The GeoCore response JSON root. */
export type GeoCoreConfigResponseRoot = {
    response: GeoCoreConfigResponse;
    errorMessage?: string;
};
export type GeoCoreConfigResponse = {
    rcs: Record<TypeDisplayLanguage, GeoCoreConfigResponseRCSLayers[]>;
    gcs: Record<TypeDisplayLanguage, GeoCoreConfigResponseGCSLayers>[];
};
export type GeoCoreConfigResponseRCSLayers = {
    layers: GeoCoreConfigResponseLayer[];
};
export type GeoCoreConfigResponseGCSLayers = {
    layers?: GeoCoreConfigResponseGCSLayer;
    packages: GeoCoreConfigResponsePackages;
};
export type GeoCoreConfigResponseGCSLayer = {
    layerName: string;
};
export type GeoCoreConfigResponsePackages = {
    geochart: GeoChartGeoCoreConfig[];
};
export type GeoChartGeoCoreConfig = {
    layers: GeoChartGeoCoreConfigLayer;
};
export type GeoChartGeoCoreConfigLayer = {
    layerId: string;
    propertyValue: string;
    propertyDisplay: string;
};
export type GeoCoreConfigResponseLayer = {
    id: string;
    name: string;
    layerType: TypeGeoviewLayerType;
    url: string;
    serverType?: TypeOfServer;
    isTimeAware?: boolean;
    layerEntries: TypeLayerEntryShell[];
};
/** The GeoChart JSON object expected by GeoView */
export type GeoViewGeoChartConfig = {
    layers: GeoChartGeoCoreConfigLayer[];
};
/** The type representing the GeoCore parsed response */
export type UUIDmapConfigReaderResponse = {
    layers: TypeGeoviewLayerConfig[];
    geocharts?: GeoViewGeoChartConfig[];
};
//# sourceMappingURL=uuid-config-reader.d.ts.map