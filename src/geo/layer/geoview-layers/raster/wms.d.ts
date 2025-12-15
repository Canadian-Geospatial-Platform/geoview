import { ImageWMS } from 'ol/source';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeGeoviewLayerConfig, TypeOfServer, TypeMetadataWMS, TypeMetadataWMSCapabilityLayer, TypeStylesWMS } from '@/api/types/layer-schema-types';
import type { TypeLayerStyleSettings, TypeStyleGeometry } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { CallbackNewMetadataDelegate } from '@/geo/utils/utilities';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.WMS;
    fetchVectorsOnWFS?: boolean;
    listOfLayerEntryConfig: OgcWmsLayerEntryConfig[];
}
/**
 * A class to add wms layer.
 *
 * @exports
 * @class WMS
 */
export declare class WMS extends AbstractGeoViewRaster {
    #private;
    fullSubLayers: boolean;
    /**
     * Constructs a WMS Layer configuration processor.
     * @param {TypeWMSLayerConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeWMSLayerConfig, fullSubLayers: boolean);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataWMS | undefined} The strongly-typed layer configuration specific to this layer.
     */
    getMetadata(): TypeMetadataWMS | undefined;
    /**
     * Recursively gets the layer capability for a given layer id.
     * @param {string} layerId - The layer identifier to get the capabilities for.
     * @param {TypeMetadataWMSCapabilityLayer?} layer - The current layer entry from the capabilities that will be recursively searched.
     * @returns {TypeMetadataWMSCapabilityLayer?} The found layer from the capabilities or undefined if not found.
     */
    getLayerCapabilities(layerId: string, layer?: TypeMetadataWMSCapabilityLayer | undefined): TypeMetadataWMSCapabilityLayer | undefined;
    /**
     * Fetches and processes service metadata for the WMS layer.
     * Depending on whether the metadata URL points to an XML document or a standard WMS endpoint,
     * this method delegates to the appropriate metadata fetching logic.
     * - If the URL ends in `.xml`, a direct XML metadata fetch is performed.
     * - Otherwise, the method constructs a WMS GetCapabilities request.
     *   - If no specific layer configs are provided, a single metadata fetch is made.
     *   - If layer configs are present (e.g., Geomet use case), individual layer metadata is merged.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<T = TypeMetadataWMS | undefined>} A promise resolving to the parsed metadata object,
     * or `undefined` if metadata could not be retrieved or no capabilities were found.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     */
    protected onFetchServiceMetadata<T = TypeMetadataWMS | undefined>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     */
    protected onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the validation of a layer entry config.
     * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
     */
    protected onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {OgcWmsLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<OgcWmsLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: OgcWmsLayerEntryConfig): Promise<OgcWmsLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     * @param {OgcWmsLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVWMS} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: OgcWmsLayerEntryConfig): GVWMS;
    /**
     * Creates an ImageWMS source from a layer config.
     * @param {OgcWmsLayerEntryConfig} layerConfig - The configuration for the WMS layer.
     * @returns A fully configured ImageWMS source.
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
     */
    createImageWMSSource(layerConfig: OgcWmsLayerEntryConfig): ImageWMS;
    /**
     * Fetches the metadata for WMS Capabilities.
     * @param {string} url - The url to query the metadata from.
     * @param {CallbackNewMetadataDelegate} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     * @param {AbortSignal | undefined} abortSignal - Abort signal to handle cancelling of fetch.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static fetchMetadataWMS(url: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate, abortSignal?: AbortSignal): Promise<TypeMetadataWMS>;
    /**
     * Fetches the metadata for WMS Capabilities for particular layer(s).
     * @param {string} url - The url to query the metadata from.
     * @param {string} layers - The layers to get the capabilities for.
     * @param {CallbackNewMetadataDelegate} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static fetchMetadataWMSForLayer(url: string, layers: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate): Promise<TypeMetadataWMS>;
    /**
     * Fetches the WMS styles for the specified layer(s) from a WMS service.
     * @param {string} url - The url to query the metadata from.
     * @param {string} layers - The layers to get the capabilities for.
     * @returns {Promise<TypeStylesWMS>} A promise that resolves with a TypeStylesWMS object for the layer(s).
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     */
    static fetchStylesForLayer(url: string, layers: string): Promise<TypeStylesWMS>;
    /**
     * Fetches and constructs style configurations for WMS layers.
     * This method retrieves style definitions from a WMS (Web Map Service) endpoint
     * for the specified layers, processes them, and returns a mapping of geometry
     * types to their corresponding layer style settings.
     * @param {string} url - The base WMS service URL used to fetch styles.
     * @param {string} layers - A comma-separated list of WMS layer names to retrieve styles for.
     * @returns {Promise<Record<TypeStyleGeometry, TypeLayerStyleSettings>>}
     * A promise that resolves to a record mapping geometry types to layer style settings.
     * @throws {NotSupportedError} If the symbolizer type in a rule is unsupported.
     * @static
     * @async
     */
    static createStylesFromWMS(url: string, layers: string, geomType: TypeStyleGeometry): Promise<Record<TypeStyleGeometry, TypeLayerStyleSettings>>;
    /**
     * Initializes a GeoView layer configuration for a WMS layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param {string} geoviewLayerId - A unique identifier for the layer.
     * @param {string} geoviewLayerName - The display name of the layer.
     * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, fullSubLayers: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a complete configuration object for a WMS GeoView layer.
     * This function constructs a `TypeWMSLayerConfig` object that defines a WMS layer and its associated
     * entries. It supports both individual layers and nested group layers through recursive processing.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The human-readable name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path used to access the layer's metadata.
     * @param {TypeOfServer | undefined} serverType - The type of WMS server (e.g., 'geoserver', 'mapserver').
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering or animation.
     * @param {TypeLayerEntryShell[]} layerEntries - The root array of parsed layer entries (may include nested groups).
     * @param {boolean} fullSubLayers - If false, will simulate legacy behavior and skip deeper layers after the first.
     * @param {unknown} [customGeocoreLayerConfig={}] - Optional custom layer configuration to merge into leaf layers.
     * @returns {TypeWMSLayerConfig} The fully constructed WMS layer configuration object.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, serverType: TypeOfServer | undefined, isTimeAware: boolean, layerEntries: TypeLayerEntryShell[], fullSubLayers: boolean, customGeocoreLayerConfig?: unknown): TypeWMSLayerConfig;
    /**
     * Processes a WMS GeoviewLayerConfig and returns a promise
     * that resolves to an array of `ConfigBaseClass` layer entry configurations.
     *
     * This method:
     * 1. Creates a Geoview layer configuration using the provided parameters.
     * 2. Instantiates a layer with that configuration.
     * 3. Processes the layer configuration and returns the result.
     * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name for the GeoView layer.
     * @param {string} url - The URL of the service endpoint.
     * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
     * @param {boolean} isTimeAware - Indicates if the layer is time aware.
     * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: number[], isTimeAware: boolean, fullSubLayers: boolean): Promise<ConfigBaseClass[]>;
}
/** Delegate type for the callback when processing group layers */
export type GroupLayerCreatedDelegate = (config: ConfigBaseClass) => void;
//# sourceMappingURL=wms.d.ts.map