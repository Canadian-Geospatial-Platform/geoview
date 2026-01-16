import { ImageArcGISRest } from 'ol/source';
import type { Projection as OLProjection } from 'ol/proj';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
export interface TypeEsriImageLayerConfig extends TypeGeoviewLayerConfig {
    geoviewLayerType: typeof CONST_LAYER_TYPES.ESRI_IMAGE;
    listOfLayerEntryConfig: EsriImageLayerEntryConfig[];
}
/**
 * A class to add an EsriImage layer.
 *
 * @exports
 * @class EsriImage
 */
export declare class EsriImage extends AbstractGeoViewRaster {
    /**
     * Constructs an EsriImage Layer configuration processor.
     * @param {TypeEsriImageLayerConfig} layerConfig The layer configuration.
     */
    constructor(layerConfig: TypeEsriImageLayerConfig);
    /**
     * Overrides the way a geoview layer config initializes its layer entries.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise resolved once the layer entries have been initialized.
     */
    protected onInitLayerEntries(): Promise<TypeGeoviewLayerConfig>;
    /**
     * Overrides the way the layer metadata is processed.
     * @param {EsriImageLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @param {OLProjection?} [mapProjection] - The map projection.
     * @param {AbortSignal?} [abortSignal] - Abort signal to handle cancelling of the process.
     * @returns {Promise<EsriImageLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: EsriImageLayerEntryConfig, mapProjection?: OLProjection, abortSignal?: AbortSignal): Promise<EsriImageLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     * @param {EsriImageLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVEsriImage} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: EsriImageLayerEntryConfig): GVEsriImage;
    /**
     * Initializes a GeoView layer configuration for an Esri Image layer.
     * This method creates a basic TypeGeoviewLayerConfig using the provided
     * ID, name, and metadata access path URL. It then initializes the layer entries by calling
     * `initGeoViewLayerEntries`, which may involve fetching metadata or sublayer info.
     * @param {string} geoviewLayerId - A unique identifier for the layer.
     * @param {string} geoviewLayerName - The display name of the layer.
     * @param {string} metadataAccessPath - The full service URL to the layer endpoint.
     * @param {boolean?} [isTimeAware] - Indicates whether the layer supports time-based filtering.
     * @returns {Promise<TypeGeoviewLayerConfig>} A promise that resolves to an initialized GeoView layer configuration with layer entries.
     * @static
     */
    static initGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware?: boolean): Promise<TypeGeoviewLayerConfig>;
    /**
     * Creates a configuration object for a Esri Image layer.
     * This function constructs a `TypeEsriImageLayerConfig` object that describes an Esri Image layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @returns {TypeEsriImageLayerConfig} The constructed configuration object for the Esri Image layer.
     * @static
     */
    static createGeoviewLayerConfigSimple(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean | undefined): TypeEsriImageLayerConfig;
    /**
     * Creates a configuration object for a Esri Image layer.
     * This function constructs a `TypeEsriImageLayerConfig` object that describes an Esri Image layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {boolean | undefined} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeEsriImageLayerConfig} The constructed configuration object for the Esri Image layer.
     * @static
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean | undefined, layerEntries: TypeLayerEntryShell[]): TypeEsriImageLayerConfig;
    /**
     * Processes an Esri Image GeoviewLayerConfig and returns a promise
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
     * @returns {Promise<ConfigBaseClass[]>} A promise that resolves to an array of layer configurations.
     * @static
     */
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, isTimeAware: boolean): Promise<ConfigBaseClass[]>;
    /**
     * Creates an ImageArcGISRest source from a layer config.
     * @param {EsriImageLayerEntryConfig} layerConfig - The configuration for the EsriImage layer.
     * @returns A fully configured ImageArcGISRest source.
     * @throws {LayerDataAccessPathMandatoryError} When the Data Access Path was undefined, likely because initDataAccessPath wasn't called.
     * @static
     */
    static createEsriImageSource(layerConfig: EsriImageLayerEntryConfig): ImageArcGISRest;
}
//# sourceMappingURL=esri-image.d.ts.map