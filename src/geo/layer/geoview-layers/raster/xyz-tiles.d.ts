import XYZ from 'ol/source/XYZ';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeSourceTileInitialConfig, TypeGeoviewLayerConfig, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { TypeJsonArray } from '@/api/config/types/config-types';
import { XYZTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { GVXYZTiles } from '@/geo/layer/gv-layers/tile/gv-xyz-tiles';
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
     * Overrides the validation of a layer entry config.
     * @param {TypeLayerEntryConfig} layerConfig - The layer entry config to validate.
     */
    protected onValidateLayerEntryConfig(layerConfig: TypeLayerEntryConfig): void;
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
     * Creates a configuration object for a XYZTiles layer.
     * This function constructs a `TypeXYZTilesConfig` object that describes an XYZTiles layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeXYZTilesConfig} The constructed configuration object for the XYZTiles layer.
     */
    static createXYZTilesLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeJsonArray): TypeXYZTilesConfig;
    /**
     * Creates an XYZ source from a layer config.
     * @param {XYZTilesLayerEntryConfig} layerConfig - The configuration for the XYZ layer.
     * @returns A fully configured XYZ source.
     * @throws If required config fields like dataAccessPath are missing.
     */
    static createXYZSource(layerConfig: XYZTilesLayerEntryConfig): XYZ;
}
/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeXYZTilesConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is XYZ_TILES. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsXYZTiles: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeXYZTilesConfig;
/**
 * type guard function that redefines a TypeLayerEntryConfig as a XYZTilesLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is XYZ_TILES. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsXYZTiles: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is XYZTilesLayerEntryConfig;
//# sourceMappingURL=xyz-tiles.d.ts.map