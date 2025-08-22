import { ImageWMS } from 'ol/source';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, TypeOfServer, CONST_LAYER_TYPES, TypeMetadataWMSCapabilityLayer, TypeMetadataWMS } from '@/api/config/types/map-schema-types';
import { CallbackNewMetadataDelegate } from '@/geo/utils/utilities';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { ConfigBaseClass, TypeLayerEntryShell } from '@/core/utils/config/validation-classes/config-base-class';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.WMS;
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
    WMSStyles: string[];
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
     * @returns {Promise<T = TypeMetadataWMS | undefined>} A promise resolving to the parsed metadata object,
     * or `undefined` if metadata could not be retrieved or no capabilities were found.
     */
    protected onFetchServiceMetadata<T = TypeMetadataWMS | undefined>(): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
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
     * @throws If required config fields like dataAccessPath are missing.
     */
    createImageWMSSource(layerConfig: OgcWmsLayerEntryConfig): ImageWMS;
    /**
     * Fetches the metadata for WMS Capabilities.
     * @param {string} url - The url to query the metadata from.
     * @param {CallbackNewMetadataDelegate} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     */
    static fetchMetadataWMS(url: string, callbackNewMetadataUrl?: CallbackNewMetadataDelegate): Promise<TypeMetadataWMS>;
    /**
     * Fetches the metadata for WMS Capabilities for particular layer(s).
     * @param {string} url - The url to query the metadata from.
     * @param {string} layers - The layers to get the capabilities for.
     * @param {CallbackNewMetadataDelegate} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
     * The parameter sent in the callback is the proxy prefix with the '?' at the end.
     */
    static fetchMetadataWMSForLayer(url: string, layers: string, callbackNewMetadataUrl?: (proxyUsed: string) => void): Promise<TypeMetadataWMS>;
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
     * Creates a configuration object for a WMS layer.
     * This function constructs a `TypeWMSLayerConfig` object that describes an WMS layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {TypeOfServer} serverType - The server type.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @param {unknown} customGeocoreLayerConfig - An optional layer config from Geocore.
     * @returns {TypeWMSLayerConfig} The constructed configuration object for the WMS layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, serverType: TypeOfServer, isTimeAware: boolean, layerEntries: TypeLayerEntryShell[], customGeocoreLayerConfig?: unknown): TypeWMSLayerConfig;
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
     * @param {TypeOfServer} typeOfServer - Indicates the type of server.
     * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: number[], isTimeAware: boolean, typeOfServer: TypeOfServer): Promise<ConfigBaseClass[]>;
}
/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeWMSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsWMS: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeWMSLayerConfig;
/**
 * type guard function that redefines a TypeLayerEntryConfig as a OgcWmsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerConfig attribute is WMS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsWMS: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is OgcWmsLayerEntryConfig;
//# sourceMappingURL=wms.d.ts.map