import type { Projection as OLProjection } from 'ol/proj';
import { ImageWMS } from 'ol/source';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeGeoviewLayerConfig, TypeOfServer, TypeMetadataWMS, TypeMetadataWMSCapabilityLayer, TypeStylesWMS } from '@/api/types/layer-schema-types';
import type { DisplayDateMode, TypeLayerStyleSettings, TypeStyleGeometry } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { CallbackNewMetadataDelegate } from '@/geo/utils/utilities';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.WMS;
    fetchVectorsOnWFS?: boolean;
    useFullWmsSublayers?: boolean;
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
    /** Default setting for the WMS layer group processing (true will explode the group in many wms layers) */
    static readonly DEFAULT_WMS_LAYER_GROUP_FULL_SUB_LAYERS = true;
    /**
     * Constructs a WMS Layer configuration processor.
     *
     * @param layerConfig - The layer configuration
     */
    constructor(layerConfig: TypeWMSLayerConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed layer configuration specific to this layer.
     */
    getGeoviewLayerConfig(): TypeWMSLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed metadata specific to this layer.
     */
    getMetadata(): TypeMetadataWMS | undefined;
    /**
     * Fetches and processes service metadata for the WMS layer.
     * Depending on whether the metadata URL points to an XML document or a standard WMS endpoint,
     * this method delegates to the appropriate metadata fetching logic.
     * - If the URL ends in `.xml`, a direct XML metadata fetch is performed.
     * - Otherwise, the method constructs a WMS GetCapabilities request.
     *   - If no specific layer configs are provided, a single metadata fetch is made.
     *   - If layer configs are present (e.g., Geomet use case), individual layer metadata is merged.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
     * @returns {Promise<T = TypeMetadataWMS | undefined>} A promise resolving to the parsed metadata object,
     * or `undefined` if metadata could not be retrieved or no capabilities were found.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     * @override
     * @protected
     */
    protected onFetchServiceMetadata<T = TypeMetadataWMS | undefined>(abortSignal?: AbortSignal): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
     * @returns A promise resolved once the layer entries have been initialized.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error.
     * @override
     * @protected
     */
    protected onInitLayerEntries(abortSignal?: AbortSignal): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the validation of a layer entry config.
     * @param {ConfigBaseClass} layerConfig - The layer entry config to validate.
     * @returns {void}
     * @override
     * @protected
     */
    protected onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {OgcWmsLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @param {DisplayDateMode} displayDateMode - The display date mode to use for processing time dimensions in the metadata.
     * @param {OLProjection?} [mapProjection] - The map projection.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
     * @returns {Promise<OgcWmsLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     * @throws {InvalidTimeDimensionError} When range couldn't be computed, or when duration is invalid, or non-positive or when an infinite loop is detected.
     * @throws {InvalidDateError} When input has invalid dates.
     * @override
     * @protected
     */
    protected onProcessLayerMetadata(layerConfig: OgcWmsLayerEntryConfig, displayDateMode: DisplayDateMode, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<OgcWmsLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     * @param {OgcWmsLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVWMS} The GV Layer
     * @override
     * @protected
     */
    protected onCreateGVLayer(layerConfig: OgcWmsLayerEntryConfig): GVWMS;
    /**
     * Recursively gets the layer capability for a given layer id.
     * @param {string} layerId - The layer identifier to get the capabilities for.
     * @param {TypeMetadataWMSCapabilityLayer?} layer - The current layer entry from the capabilities that will be recursively searched.
     * @returns {TypeMetadataWMSCapabilityLayer?} The found layer from the capabilities or undefined if not found.
     */
    getLayerCapabilities(layerId: string, layer?: TypeMetadataWMSCapabilityLayer | undefined): TypeMetadataWMSCapabilityLayer | undefined;
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
     * @param {CallbackNewMetadataDelegate?} [callbackNewMetadataUrl] - Callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     * @static
     */
    static fetchMetadataWMS(url: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate, abortSignal?: AbortSignal): Promise<TypeMetadataWMS>;
    /**
     * Fetches the metadata for WMS Capabilities for particular layer(s).
     * @param {string} url - The url to query the metadata from.
     * @param {string} layers - The layers to get the capabilities for.
     * @param {CallbackNewMetadataDelegate?} [callbackNewMetadataUrl] - Callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration.
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal.
     * @throws {ResponseError} When the response is not OK (non-2xx).
     * @throws {ResponseEmptyError} When the JSON response is empty.
     * @throws {NetworkError} When a network issue happened.
     * @static
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
     * @static
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
    static createStylesFromWMS(url: string, layers: string, geomType: TypeStyleGeometry | undefined): Promise<Record<TypeStyleGeometry, TypeLayerStyleSettings>>;
    /**
     * Initializes a GeoView layer configuration for a WMS layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param geoviewLayerId - A unique identifier for the layer.
     * @param geoviewLayerName - The display name of the layer.
     * @param metadataAccessPath - The full service URL to the layer endpoint.
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param useFullWmsSublayers - Indicates if we want the full sublayers of all wms or grouped (default is all sublayers).
     * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries.
     * @static
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean, useFullWmsSublayers?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a complete configuration object for a WMS GeoView layer.
     * This function constructs a `TypeWMSLayerConfig` object that defines a WMS layer and its associated
     * entries. It supports both individual layers and nested group layers through recursive processing.
     * @param geoviewLayerId - A unique identifier for the GeoView layer.
     * @param geoviewLayerName - The display name of the GeoView layer.
     * @param metadataAccessPath - The full service URL to the layer endpoint.
     * @param serverType - The type of WMS server (e.g., 'geoserver', 'mapserver').
     * @param isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param layerEntries - The root array of parsed layer entries (may include nested groups).
     * @param useFullWmsSublayers - Indicates if we want the full sublayers of all wms or grouped (default is all sublayers).
     * @param customGeocoreLayerConfig - Optional custom layer configuration to merge into leaf layers.
     * @returns The fully constructed WMS layer configuration object.
     * @static
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, serverType: TypeOfServer | undefined, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[], useFullWmsSublayers?: boolean, customGeocoreLayerConfig?: unknown): TypeWMSLayerConfig;
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
     * @param useFullWmsSublayers - Indicates if we want the full sublayers of all wms or grouped (default is all sublayers).
     * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
     * @static
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: number[], isTimeAware: boolean, useFullWmsSublayers?: boolean): Promise<ConfigBaseClass[]>;
}
/** Delegate type for the callback when processing group layers */
export type GroupLayerCreatedDelegate = (config: ConfigBaseClass) => void;
//# sourceMappingURL=wms.d.ts.map