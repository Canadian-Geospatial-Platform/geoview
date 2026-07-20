import type { TypeDisplayLanguage } from '@/api/types/map-schema-types';
import type { TypeLayerEntryConfig, TypeGeoviewLayerConfig, TypeGeoviewLayerType, TypeOfServer } from '@/api/types/layer-schema-types';
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
     * @throws {LayerGeoCoreServiceFailError} When the Geocore service fails to respond
     * @throws {LayerGeoCoreInvalidResponseError} When the Geocore service fails to respond with a valid payload
     * @throws {LayerGeoCoreNoLayersError} When the Geocore service responds a 'valid' payload with missing layers information
     * @throws {NotSupportedError} When the layer type read in the layerType property from Geocore payload isn't a supported type
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
     * @throws {LayerGeoCoreServiceFailError} When the Geocore service fails to respond
     * @throws {LayerGeoCoreInvalidResponseError} When the Geocore service fails to respond with a valid payload
     * @throws {LayerGeoCoreNoLayersError} When the Geocore service responds a 'valid' payload with missing layers information
     * @throws {NotSupportedError} When the layer type read in the layerType property from Geocore payload isn't a supported type
     */
    static getGVConfigFromUUIDsRCS(baseUrl: string, lang: TypeDisplayLanguage, uuids: string[], abortSignal?: AbortSignal): Promise<UUIDmapConfigReaderResponse>;
}
/** The GeoCore response JSON root. */
export type GeoCoreConfigResponseRoot = {
    response: GeoCoreConfigResponse;
    errorMessage?: string;
};
/** The GeoCore response payload containing RCS and GCS sections. */
export type GeoCoreConfigResponse = {
    rcs: Record<TypeDisplayLanguage, GeoCoreConfigResponseRCSLayers[] | object>;
    gcs: Record<TypeDisplayLanguage, GeoCoreConfigResponseGCSLayers>[];
};
/** The RCS response item containing layer definitions. */
export type GeoCoreConfigResponseRCSLayers = {
    layers: GeoCoreConfigResponseLayer[];
};
/** The GCS response item containing layer overrides and package configs. */
export type GeoCoreConfigResponseGCSLayers = {
    listOfLayerEntryConfig?: TypeLayerEntryConfig[];
    packages?: GeoCoreConfigResponsePackages;
};
export type GeoCoreConfigResponsePackages = {
    /** The geochart configurations. */
    geochart: GeoChartGeoCoreConfig[];
    /** Optional time-slider configurations. */
    'time-slider'?: GeoViewTimeSliderConfig[];
};
/** The GeoCore geochart package payload. */
export type GeoChartGeoCoreConfig = {
    layers: GeoChartGeoCoreConfigLayer;
};
/** The GeoCore geochart layer payload. */
export type GeoChartGeoCoreConfigLayer = {
    layerId: string;
    propertyValue: string;
    propertyDisplay: string;
};
/** The RCS layer payload used to construct GeoView layer configs. */
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
/** The time-slider config object as returned by GeoCore. */
export type GeoViewTimeSliderConfig = {
    /** The slider configuration entries. */
    sliders: Record<string, unknown>[];
};
/** The type representing the GeoCore parsed response */
export type UUIDmapConfigReaderResponse = {
    /** The parsed layer configurations. */
    layers: TypeGeoviewLayerConfig[];
    /** Optional parsed custom list of layer entry config from GCS. */
    customListOfLayerEntryConfig?: TypeLayerEntryConfig[];
    /** Optional geochart configurations. */
    geocharts?: GeoViewGeoChartConfig[];
    /** Optional time-slider configurations. */
    timeSliderConfigs?: GeoViewTimeSliderConfig[];
};
//# sourceMappingURL=uuid-config-reader.d.ts.map