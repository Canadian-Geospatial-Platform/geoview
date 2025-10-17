import XYZ from 'ol/source/XYZ';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import type { TypeSourceTileInitialConfig, TypeGeoviewLayerConfig } from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import type { TypeMetadataXYZTiles } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { XYZTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { GVXYZTiles } from '@/geo/layer/gv-layers/tile/gv-xyz-tiles';
import type { ConfigBaseClass, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
export type TypeSourceImageXYZTilesInitialConfig = TypeSourceTileInitialConfig;
export interface TypeXYZTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.XYZ_TILES;
    listOfLayerEntryConfig: XYZTilesLayerEntryConfig[];
}
/**
 * A class to add xyz-tiles layer
 *
 * @exports
 * @class XYZTiles
 */
export declare class XYZTiles extends AbstractGeoViewRaster {
    /**
     * Constructs a XYZTiles Layer configuration processor.
     * @param {TypeXYZTilesConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeXYZTilesConfig);
    /**
     * Overrides the parent class's getter to provide a more specific return type (covariant return).
     * @override
     * @returns {TypeMetadataXYZTiles | undefined} The strongly-typed layer configuration specific to this layer.
     */
    getMetadata(): TypeMetadataXYZTiles | undefined;
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
     * @param {XYZTilesLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<XYZTilesLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: XYZTilesLayerEntryConfig): Promise<XYZTilesLayerEntryConfig>;
    /**
     * Overrides the creation of the GV Layer
     * @param {XYZTilesLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVXYZTiles} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: XYZTilesLayerEntryConfig): GVXYZTiles;
    /**
     * Initializes a GeoView layer configuration for a XYZ Tiles layer.
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
     * Creates a configuration object for a XYZTiles layer.
     * This function constructs a `TypeXYZTilesConfig` object that describes an XYZTiles layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeLayerEntryShell[]} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeXYZTilesConfig} The constructed configuration object for the XYZTiles layer.
     */
    static createGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeLayerEntryShell[]): TypeXYZTilesConfig;
    /**
     * Processes an XYZ Tiles GeoviewLayerConfig and returns a promise
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
    static processGeoviewLayerConfig(geoviewLayerId: string, geoviewLayerName: string, url: string, layerIds: string[], isTimeAware: boolean): Promise<ConfigBaseClass[]>;
    /**
     * Creates an XYZ source from a layer config.
     * @param {XYZTilesLayerEntryConfig} layerConfig - The configuration for the XYZ layer.
     * @returns A fully configured XYZ source.
     * @throws If required config fields like dataAccessPath are missing.
     */
    static createXYZSource(layerConfig: XYZTilesLayerEntryConfig): XYZ;
}
//# sourceMappingURL=xyz-tiles.d.ts.map