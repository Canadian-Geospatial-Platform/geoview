import { ImageWMS } from 'ol/source';
import { TypeJsonArray, TypeJsonObject } from '@/api/config/types/config-types';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, TypeOfServer, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
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
     * Overrides the way the metadata is fetched and set in the 'metadata' property. Resolves when done.
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected onFetchAndSetServiceMetadata(): Promise<void>;
    /**
     * Overrides the validation of a layer entry config.
     * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
     */
    protected onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void;
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
     * Recursively finds gets the layer capability for a given layer id.
     * @param {string} layerId - The layer identifier to get the capabilities for.
     * @param {TypeJsonObject | undefined} layer - The current layer entry from the capabilities that will be recursively searched.
     * @returns {TypeJsonObject?} The found layer from the capabilities or undefined if not found.
     */
    getLayerCapabilities(layerId: string, currentLayerEntry?: TypeJsonObject | undefined): TypeJsonObject | undefined;
    /**
     * Fetches the metadata for a typical WFS class.
     * @param {string} url - The url to query the metadata from.
     * @param {Function} callbackNewMetadataUrl - Callback executed when a proxy had to be used to fetch the metadata.
     *                                            The parameter sent in the callback is the proxy prefix with the '?' at the end.
     */
    static fetchMetadata(url: string, callbackNewMetadataUrl?: (proxyUsed: string) => void): Promise<TypeJsonObject>;
    /**
     * Creates a configuration object for a WMS layer.
     * This function constructs a `TypeWMSLayerConfig` object that describes an WMS layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {TypeOfServer} serverType - The server type.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeWMSLayerConfig} The constructed configuration object for the WMS layer.
     */
    static createWMSLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, serverType: TypeOfServer, isTimeAware: boolean, layerEntries: TypeJsonArray, customGeocoreLayerConfig: TypeJsonObject): TypeWMSLayerConfig;
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