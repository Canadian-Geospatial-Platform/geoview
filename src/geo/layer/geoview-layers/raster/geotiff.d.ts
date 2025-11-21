import GeoTIFFSource from 'ol/source/GeoTIFF';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GeoTIFFLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';
import { GVGeoTIFF } from '@/geo/layer/gv-layers/tile/gv-geotiff';
export interface TypeGeoTIFFLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.GEOTIFF;
    listOfLayerEntryConfig: GeoTIFFLayerEntryConfig[];
}
/**
 * A class to add GeoTIFF layer.
 * @exports
 * @class GeoTIFF
 */
export declare class GeoTIFF extends AbstractGeoViewRaster {
    #private;
    /**
     * Constructs a GeoTIFF Layer configuration processor.
     * @param {TypeGeoTIFFLayerConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeGeoTIFFLayerConfig);
    /**
     * Overrides the way the metadata is fetched.
     * Resolves with the Json object or undefined when no metadata is to be expected for a particular layer type.
     * @returns {Promise<T>} A promise with the metadata or undefined when no metadata for the particular layer type.
     */
    protected onFetchServiceMetadata<T>(): Promise<T>;
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<GeoTIFFLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: GeoTIFFLayerEntryConfig): Promise<GeoTIFFLayerEntryConfig>;
    /**
     * Creates a GeoTIFF source from a layer config.
     * @param {GeoTIFFLayerEntryConfig} layerConfig - The configuration for the GeoTIFF layer.
     * @returns A fully configured GeoTIFF source.
     * @throws If required config fields like dataAccessPath are missing.
     */
    static createGeoTIFFSource(layerConfig: GeoTIFFLayerEntryConfig): GeoTIFFSource;
    /**
     * Overrides the creation of the GV Layer
     * @param {GeoTIFFLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVGeoTIFF} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: GeoTIFFLayerEntryConfig): GVGeoTIFF;
    /**
     * Initializes a GeoView layer configuration for a GeoTIFF layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param {string} geoviewLayerId - A unique identifier for the layer.
     * @param {string} geoviewLayerName - The display name of the layer.
     * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for a GeoTIFF layer.
     * This function constructs a `TypeGeoTIFFConfig` object that describes an GeoTIFF layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeGeoTIFFConfig} The constructed configuration object for the GeoTIFF layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeLayerEntryShell[]): TypeGeoTIFFLayerConfig;
    /**
     * Processes a GeoTIFF GeoviewLayerConfig and returns a promise
     * that resolves to an array of `ConfigBaseClass` layer entry configurations.
     *
     * This method:
     * 1. Creates a Geoview layer configuration using the provided parameters.
     * 2. Instantiates a layer with that configuration.
     * 3. Processes the layer configuration and returns the result.
     * @param {string} geoviewLayerId - The unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name for the GeoView layer.
     * @param {string} url - The URL of the service endpoint.
     * @param {boolean} isTimeAware - Indicates if the layer is time aware.
     * @param {string[]} layerIds - An array of layer IDs to include in the configuration.
     * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
}
//# sourceMappingURL=geotiff.d.ts.map