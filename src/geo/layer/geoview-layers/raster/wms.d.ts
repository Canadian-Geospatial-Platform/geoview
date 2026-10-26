import type { Projection as OLProjection } from 'ol/proj';
import { ImageWMS } from 'ol/source';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeGeoviewLayerConfig, TypeOfServer, TypeMetadataWMSCapabilities, TypeMetadataWMSCapabilityLayer } from '@/api/types/layer-schema-types';
import type { DisplayDateMode, TypeLayerStyleSettings, TypeStyleGeometry } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { FetchWithProxyResult } from '@/geo/utils/utilities';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import type { TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { VectorLayerEntryConfig } from '@/api/config/validation-classes/vector-layer-entry-config';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.WMS;
    fetchVectorsExternally?: boolean;
    useFullWmsSublayers?: boolean;
    listOfLayerEntryConfig: OgcWmsLayerEntryConfig[];
}
/**
 * A class to add wms layer.
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
     * @returns The strongly-typed layer configuration specific to this layer
     */
    getGeoviewLayerConfig(): TypeWMSLayerConfig;
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     *
     * @returns The strongly-typed metadata specific to this layer
     */
    getMetadata(): TypeMetadataWMSCapabilities | undefined;
    /**
     * Fetches and processes service metadata for the WMS layer.
     *
     * Depending on whether the metadata URL points to an XML document or a standard WMS endpoint,
     * this method delegates to the appropriate metadata fetching logic.
     * - If the URL ends in `.xml`, a direct XML metadata fetch is performed.
     * - Otherwise, the method constructs a WMS GetCapabilities request.
     *   - If no specific layer configs are provided, a single metadata fetch is made.
     *   - If layer configs are present (e.g., Geomet use case), individual layer metadata is merged.
     *
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the fetched metadata and proxy information,
     * or data of `undefined` if metadata could not be retrieved or no capabilities were found.
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
     * @throws {LayerNoCapabilitiesError} When the metadata is empty (no Capabilities)
     */
    protected onFetchServiceMetadata(abortSignal?: AbortSignal): Promise<FetchWithProxyResult<unknown>>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     *
     * @returns A promise that resolves once the layer entries have been initialized
     * @throws {LayerServiceMetadataUnableToFetchError} When the metadata fetch fails or contains an error
     * @throws {LayerNoCapabilitiesError} When the metadata is empty (no Capabilities)
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the validation of a layer entry config.
     *
     * @param layerConfig - The layer entry config to validate
     */
    protected onValidateLayerEntryConfig(layerConfig: ConfigBaseClass): void;
    /**
     * Overrides the way the layer metadata is processed.
     *
     * @param layerConfig - The layer entry configuration to process
     * @param displayDateMode - The display date mode to use for processing time dimensions in the metadata
     * @param mapProjection - Optional map projection
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves once the layer entry configuration has gotten its metadata processed
     */
    protected onProcessLayerMetadata(layerConfig: OgcWmsLayerEntryConfig, displayDateMode: DisplayDateMode, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<OgcWmsLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     *
     * @param layerConfig - The layer entry configuration
     * @returns The GV Layer
     */
    protected onCreateGVLayer(layerConfig: OgcWmsLayerEntryConfig): GVWMS;
    /**
     * Creates an ImageWMS source from a layer config.
     *
     * @param layerConfig - The configuration for the WMS layer
     * @returns A fully configured ImageWMS source
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called
     * @throws {LayerEntryConfigWMSSubLayerNotFoundError} When the layer is not found in the capabilities metadata
     */
    createImageWMSSource(layerConfig: OgcWmsLayerEntryConfig): ImageWMS;
    /**
     * Creates a complete configuration object for a WMS GeoView layer.
     *
     * This function constructs a `TypeWMSLayerConfig` object that defines a WMS layer and its associated
     * entries. It supports both individual layers and nested group layers through recursive processing.
     *
     * @param geoviewLayerId - A unique identifier for the GeoView layer
     * @param geoviewLayerName - The display name of the GeoView layer
     * @param metadataAccessPath - The full service URL to the layer endpoint
     * @param serverType - The type of WMS server (e.g., 'geoserver', 'mapserver')
     * @param isTimeAware - Indicates whether the layer supports time-based filtering
     * @param layerEntries - The root array of parsed layer entries (may include nested groups)
     * @param useFullWmsSublayers - Optional to indicates if we want the full sublayers of all wms or grouped (default is all sublayers)
     * @returns The fully constructed WMS layer configuration object
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string | undefined, metadataAccessPath: string, serverType: TypeOfServer | undefined, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[], useFullWmsSublayers?: boolean): TypeWMSLayerConfig;
    /**
     * Initializes a GeoView layer configuration for a WMS layer.
     *
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     *
     * @param geoviewLayerId - A unique identifier for the layer
     * @param geoviewLayerName - The display name of the layer
     * @param metadataAccessPath - The full service URL to the layer endpoint
     * @param isTimeAware - Optional to indicates whether the layer supports time-based filtering
     * @param useFullWmsSublayers - Optional to indicates if we want the full sublayers of all wms or grouped (default is all sublayers)
     * @returns A promise that resolves to an initialized GeoView layer configuration with layer entries
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean, useFullWmsSublayers?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Initializes the layer metadata information in the provided layer config.
     *
     * @param layerConfig - The layer configuration to initialize
     * @param layerCapabilities - The WMS capabilities metadata for the specific layer
     * @param wasAddedAsAGroup - Indicates whether the layer was added as part of a group initially in the config
     * @param displayDateMode - The display date mode to use when creating time dimensions
     */
    static initLayerMetadata(layerConfig: OgcWmsLayerEntryConfig, layerCapabilities: TypeMetadataWMSCapabilityLayer | undefined, wasAddedAsAGroup: boolean, displayDateMode: DisplayDateMode): Promise<void>;
    /**
     * Processes a WMS GeoviewLayerConfig and returns a promise
     * that resolves to an array of `ConfigBaseClass` layer entry configurations.
     *
     * This method:
     * 1. Creates a Geoview layer configuration using the provided parameters.
     * 2. Instantiates a layer with that configuration.
     * 3. Processes the layer configuration and returns the result.
     *
     * @param geoviewLayerId - The unique identifier for the GeoView layer
     * @param geoviewLayerName - The display name for the GeoView layer
     * @param url - The URL of the service endpoint
     * @param layerEntries - An array of layer entry shells to include in the configuration
     * @param isTimeAware - Indicates if the layer is time aware
     * @param useFullWmsSublayers - Optional - Indicates if we want the full sublayers of all wms or grouped (default is all sublayers)
     * @returns A promise that resolves to an array of layer configurations
     * @throws {LayerServiceMetadataUnableToFetchError} When WMS service metadata cannot be fetched
     * @throws {LayerServiceMetadataEmptyError} When the WMS service metadata response is empty
     * @throws {LayerNoCapabilitiesError} When the WMS capabilities response is empty
     * @throws {LayerEntryConfigLayerIdNotFoundError} When a configured layer ID is not found
     * @throws {LayerEntryConfigWMSSubLayerNotFoundError} When a configured sublayer is not found
     * @throws {LayerDataAccessPathMandatoryError} When a layer data access path is not configured
     * @throws {LayerEntryConfigEmptyLayerGroupError} When an empty layer group prevents the root layer from being created
     * @throws {LayerEntryConfigUnableToCreateGroupLayerError} When a layer group cannot be created
     * @throws {AggregateError} When multiple layer entries fail to process
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerEntries: TypeLayerEntryShell[], isTimeAware: boolean, useFullWmsSublayers?: boolean): Promise<ConfigBaseClass[]>;
    /**
     * Recursively gets the layer capability for a given layer id.
     *
     * @param layerId - The layer identifier to get the capabilities for
     * @param layer - Optional current layer entry from the capabilities that will be recursively searched
     * @returns The found layer from the capabilities or undefined if not found
     */
    static findLayerMetadataInCapability(layerId: string, layerCapability: TypeMetadataWMSCapabilityLayer | undefined): TypeMetadataWMSCapabilityLayer | undefined;
    /**
     * Fetches the metadata for WMS Capabilities.
     *
     * @param url - The url to query the metadata from
     * @param configProxyUrl - Proxy URL to use when necessary
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the parsed WMS metadata and proxy information
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal
     * @throws {ResponseError} When the response is not OK (non-2xx)
     * @throws {ResponseEmptyError} When the JSON response is empty
     * @throws {NetworkError} When a network issue happened
     */
    static fetchMetadataWMS(url: string, configProxyUrl: string | undefined, abortSignal?: AbortSignal): Promise<FetchWithProxyResult<TypeMetadataWMSCapabilities>>;
    /**
     * Fetches the metadata for WMS Capabilities for particular layer(s).
     *
     * @param url - The url to query the metadata from
     * @param configProxyUrl - Proxy URL to use when necessary
     * @param layers - The layers to get the capabilities for
     * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process
     * @returns A promise that resolves with the parsed WMS metadata and proxy information
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal
     * @throws {ResponseError} When the response is not OK (non-2xx)
     * @throws {ResponseEmptyError} When the JSON response is empty
     * @throws {NetworkError} When a network issue happened
     */
    static fetchMetadataWMSForLayer(url: string, configProxyUrl: string | undefined, layers: string, abortSignal?: AbortSignal): Promise<FetchWithProxyResult<TypeMetadataWMSCapabilities>>;
    /**
     * Fetches and constructs style configurations for WMS layers.
     *
     * This method retrieves style definitions from a WMS (Web Map Service) endpoint
     * for the specified layers, processes them, and returns a mapping of geometry
     * types to their corresponding layer style settings.
     *
     * @param url - The WMS service URL used to fetch styles. If a proxy should be used, it has to be part of the URL here.
     * @param geomType - Optional geometry type
     * @returns A promise that resolves to a record mapping geometry types to layer style settings
     * @throws {RequestTimeoutError} When the request exceeds the timeout duration
     * @throws {RequestAbortedError} When the request was aborted by the caller's signal
     * @throws {ResponseError} When the response is not OK (non-2xx)
     * @throws {ResponseEmptyError} When the JSON response is empty
     * @throws {NetworkError} When a network issue happened
     * @throws {GetStylesInvalidResponseError} When the GetStyles input schema is invalid
     * @throws {GetStylesNotSupportedError} When the symbolizer type in a rule is unsupported
     */
    static createLayerStyleFromWMS(url: string, geomType: TypeStyleGeometry | undefined): Promise<Record<TypeStyleGeometry, TypeLayerStyleSettings>>;
    /**
     * Attempts to derive and apply styling information to a WFS layer using corresponding WMS styles.
     *
     * This method:
     *  - Checks whether the layer has no defined style and is configured to fetch styles from this.
     *  - Determines the WMS layer identifier associated with the WFS layer.
     *  - Attempts to infer the geometry type from metadata (non-fatal if it fails).
     *  - Converts the WFS service URL into its WMS equivalent (commonly `cgi-bin/wfs` -> `cgi-bin/wms`).
     * Any failures during the process are logged as warnings but do not throw.
     *
     * Enables a WFS layer to adopt styling derived from a corresponding WMS service, allowing
     * consistent symbology between raster and vector representations when the server supports
     * style retrieval through WMS `GetStyles`.
     *
     * @param layerConfig - The WFS layer configuration for which styling should be processed
     * @returns A promise that resolves with the layer style settings or undefined
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called
     */
    static tryProcessLayerStylingInformationIfAny(layerConfig: VectorLayerEntryConfig): Promise<Record<TypeStyleGeometry, TypeLayerStyleSettings> | undefined>;
}
/** Delegate type for the callback when processing group layers */
export type GroupLayerCreatedDelegate = (config: ConfigBaseClass) => void;
//# sourceMappingURL=wms.d.ts.map