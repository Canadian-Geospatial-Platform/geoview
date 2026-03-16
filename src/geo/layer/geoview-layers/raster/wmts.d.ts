import WMTSSource from 'ol/source/WMTS';
import type { Projection as OLProjection } from 'ol/proj';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeSourceTileInitialConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeMetadataWMTS } from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import { OgcWmtsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import { GVWMTS } from '@/geo/layer/gv-layers/tile/gv-wmts';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { DisplayDateMode } from '@/api/types/map-schema-types';
export interface TypeSourceImageWMTSInitialConfig extends TypeSourceTileInitialConfig {
    wmtsStyle?: string;
    extent?: [number, number, number, number];
    resolutionLevels?: number;
}
export interface TypeWmtsLayerConfig extends TypeGeoviewLayerConfig {
    geoviewLayerType: typeof CONST_LAYER_TYPES.WMTS;
    listOfLayerEntryConfig: (GroupLayerEntryConfig | OgcWmtsLayerEntryConfig)[];
}
/**
 * A class to add wmts layer
 *
 * @class WMTS
 */
export declare class WMTS extends AbstractGeoViewRaster {
    #private;
    /**
     * Constructs a WMTS Layer configuration processor.
     *
     * @param layerConfig - The layer configuration
     */
    constructor(layerConfig: TypeWmtsLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeWmtsLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed metadata specific to this layer.
     */
    getMetadata(): TypeMetadataWMTS | undefined;
    /**
     * Fetches and processes service metadata for the WMTS layer.
     *
     * Depending on whether the metadata URL points to an XML document or a standard WMS endpoint,
     * this method delegates to the appropriate metadata fetching logic.
     * - If the URL ends in `.xml`, a direct XML metadata fetch is performed.
     * - Otherwise, the method constructs a WMS GetCapabilities request.
     *   - If no specific layer configs are provided, a single metadata fetch is made.
     *   - If layer configs are present (e.g., Geomet use case), individual layer metadata is merged.
     *
     * @param abortSignal - Optional abort signal to handle cancelling of the process.
     * @returns A promise resolving to the parsed metadata object,
     * or `undefined` if metadata could not be retrieved or no capabilities were found.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     */
    protected onFetchServiceMetadata<T = TypeMetadataWMTS | undefined>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     *
     * @returns A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the validation of a layer entry config.
     * @param layerConfig - The layer entry config to validate.
     */
    protected onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the way the layer metadata is processed.
     *
     * @param layerConfig - The layer entry configuration to process.
     * @param mapProjection - Optional map projection.
     * @param abortSignal - Optional abort signal to handle cancelling of the process.
     * @returns A promise that the layer entry configuration has gotten its metadata processed.
     * @throws {LayerWMTSMetadataError} When the metadata is missing necessary information or contains an error.
     */
    protected onProcessLayerMetadata(layerConfig: OgcWmtsLayerEntryConfig, displayDateMode: DisplayDateMode, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<OgcWmtsLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer.
     *
     * @param layerConfig - The layer entry configuration.
     * @returns The GV Layer
     */
    protected onCreateGVLayer(layerConfig: OgcWmtsLayerEntryConfig): GVWMTS;
    /**
     * Fetches the metadata for WMS Capabilities.
     *
     * @param url - The url to query the metadata from.
     * @param abortSignal - Optional abort signal to handle cancelling of the process.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static fetchMetadata<T = TypeMetadataWMTS>(url: string, abortSignal?: AbortSignal): Promise<T>;
    /**
     * Initializes a GeoView layer configuration for a WMTS layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     *
     * @param geoviewLayerId - A unique identifier for the layer.
     * @param geoviewLayerName - The display name of the layer.
     * @param metadataAccessPath - The full service URL to the layer endpoint.
     * @param isTimeAware - Optional - Indicates whether the layer supports time-based filtering.
     * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries.
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for a WMTS layer.
     * This function constructs a `TypeWMTSConfig` object that describes a WMTS layer
     * and its associated entry configurations based on the provided parameters.
     *
     * @param geoviewLayerId - A unique identifier for the GeoView layer.
     * @param geoviewLayerName - The display name of the GeoView layer.
     * @param metadataAccessPath - The URL or path to access metadata.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns The constructed configuration object for the WMTS layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[]): TypeWmtsLayerConfig;
    /**
     * Processes an  WMTS GeoviewLayerConfig and returns a promise
     * that resolves to an array of `ConfigBaseClass` layer entry configurations.
     *
     * This method:
     * 1. Creates a Geoview layer configuration using the provided parameters.
     * 2. Instantiates a layer with that configuration.
     * 3. Processes the layer configuration and returns the result.
     *
     * @param geoviewLayerId - The unique identifier for the GeoView layer.
     * @param geoviewLayerName - The display name for the GeoView layer.
     * @param url - The URL of the service endpoint.
     * @param layerIds - An array of layer IDs to include in the configuration.
     * @param isTimeAware - Indicates if the layer is time aware.
     * @returns A promise that resolves to an array of layer configurations.
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
    /**
     * Creates a WMTS source from a layer config.
     *
     * @param layerConfig - The configuration for the WMTS layer.
     * @returns A fully configured WMTS source.
     * @throws {LayerWMTSMetadataError} When we don't have enough info to create a source, throw an error.
     */
    static createWMTSSource(layerConfig: OgcWmtsLayerEntryConfig): WMTSSource;
}
//# sourceMappingURL=wmts.d.ts.map