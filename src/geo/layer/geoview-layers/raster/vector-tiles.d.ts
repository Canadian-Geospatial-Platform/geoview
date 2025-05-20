import VectorTileSource from 'ol/source/VectorTile';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeSourceTileInitialConfig, TypeGeoviewLayerConfig, CONST_LAYER_TYPES } from '@/api/config/types/map-schema-types';
import { TypeJsonArray } from '@/api/config/types/config-types';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { GVVectorTiles } from '@/geo/layer/gv-layers/vector/gv-vector-tiles';
export type TypeSourceVectorTilesInitialConfig = TypeSourceTileInitialConfig;
export interface TypeVectorTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.VECTOR_TILES;
    listOfLayerEntryConfig: VectorTilesLayerEntryConfig[];
}
/**
 * A class to add vector-tiles layer
 *
 * @exports
 * @class VectorTiles
 */
export declare class VectorTiles extends AbstractGeoViewRaster {
    /** Fallback projection (the map projection) */
    fallbackProjection: string;
    /**
     * Constructs a VectorTiles Layer configuration processor.
     * @param {TypeVectorTilesConfig} layerConfig the layer configuration
     */
    constructor(layerConfig: TypeVectorTilesConfig, fallbackProjection: string);
    /**
     * Overrides the way the layer metadata is processed.
     * @param {VectorTilesLayerEntryConfig} layerConfig - The layer entry configuration to process.
     * @returns {Promise<VectorTilesLayerEntryConfig>} A promise that the layer entry configuration has gotten its metadata processed.
     */
    protected onProcessLayerMetadata(layerConfig: VectorTilesLayerEntryConfig): Promise<VectorTilesLayerEntryConfig>;
    /**
     * Overrides the way the layer entry is processed to generate an Open Layer Base Layer object.
     * @param {VectorTilesLayerEntryConfig} layerConfig - The layer entry config needed to create the Open Layer object.
     * @returns {Promise<VectorTileLayer<VectorTileSource>>} The GeoView raster layer that has been created.
     */
    protected onProcessOneLayerEntry(layerConfig: VectorTilesLayerEntryConfig): Promise<GVVectorTiles>;
    /**
     * Overrides the creation of the GV Layer
     * @param {VectorTilesLayerEntryConfig} layerConfig - The layer entry configuration.
     * @returns {GVVectorTiles} The GV Layer
     */
    protected onCreateGVLayer(layerConfig: VectorTilesLayerEntryConfig): GVVectorTiles;
    /**
     * Creates a configuration object for a XYZTiles layer.
     * This function constructs a `TypeVectorTilesConfig` object that describes an XYZTiles layer
     * and its associated entry configurations based on the provided parameters.
     * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
     * @param {string} geoviewLayerName - The display name of the GeoView layer.
     * @param {string} metadataAccessPath - The URL or path to access metadata.
     * @param {boolean} isTimeAware - Indicates whether the layer supports time-based filtering.
     * @param {TypeJsonArray} layerEntries - An array of layer entries objects to be included in the configuration.
     * @returns {TypeVectorTilesConfig} The constructed configuration object for the XYZTiles layer.
     */
    static createVectorTilesLayerConfig(geoviewLayerId: string, geoviewLayerName: string, metadataAccessPath: string, isTimeAware: boolean, layerEntries: TypeJsonArray): TypeVectorTilesConfig;
    /**
     * Creates a VectorTileSource from a layer config.
     * This encapsulates projection, tileGrid, and format setup.
     * @param {VectorTilesLayerEntryConfig} layerConfig - Configuration object for the vector tile layer.
     * @param {string} fallbackProjection - Fallback projection if none is provided in the config.
     * @returns An initialized VectorTileSource ready for use in a layer.
     * @throws If required config fields like dataAccessPath are missing.
     */
    static createVectorTileSource(layerConfig: VectorTilesLayerEntryConfig, fallbackProjection: string): VectorTileSource;
}
/**
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeVectorTilesConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is VECTOR_TILES. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsVectorTiles: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeVectorTilesConfig;
/**
 * type guard function that redefines a TypeLayerEntryConfig as a VectorTilesLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is VECTOR_TILES. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsVectorTiles: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is VectorTilesLayerEntryConfig;
