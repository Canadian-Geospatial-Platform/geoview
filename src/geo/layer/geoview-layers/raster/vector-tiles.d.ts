import { Extent } from 'ol/extent';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeSourceTileInitialConfig, TypeTileLayerEntryConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeTileGrid } from '@/geo/map/map-schema-types';
export type TypeSourceVectorTilesInitialConfig = TypeSourceTileInitialConfig;
export declare class TypeVectorTilesLayerEntryConfig extends TypeTileLayerEntryConfig {
    source: TypeSourceVectorTilesInitialConfig;
    tileGrid: TypeTileGrid;
    /**
     * The class constructor.
     * @param {TypeVectorTilesLayerEntryConfig} layerConfig The layer configuration we want to instanciate.
     */
    constructor(layerConfig: TypeVectorTilesLayerEntryConfig);
}
export interface TypeVectorTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'vectorTiles';
    listOfLayerEntryConfig: TypeVectorTilesLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeVectorTilesConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is VECTOR_TILES. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsVectorTiles: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeVectorTilesConfig;
/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as an VectorTiles if the type attribute of the verifyIfGeoViewLayer
 * parameter is Vector_TILES. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsVectorTiles: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is VectorTiles;
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeVectorTilesLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewLayerConfig attribute is VECTOR_TILES. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsVectorTiles: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeVectorTilesLayerEntryConfig;
/** *****************************************************************************************************************************
 * a class to add vector-tiles layer
 *
 * @exports
 * @class VectorTiles
 */
export declare class VectorTiles extends AbstractGeoViewRaster {
    /** ***************************************************************************************************************************
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeVectorTilesConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeVectorTilesConfig);
    /** ***************************************************************************************************************************
     * Extract the type of the specified field from the metadata. If the type can not be found, return 'string'.
     *
     * @param {string} fieldName field name for which we want to get the type.
     * @param {TypeLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {'string' | 'date' | 'number'} The type of the field.
     */
    protected getFieldType(fieldName: string, layerConfig: TypeLayerEntryConfig): 'string' | 'date' | 'number';
    /** ***************************************************************************************************************************
     * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
     * extra configuration may be done here.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
    /** ****************************************************************************************************************************
     * This method creates a GeoView VectorTiles layer using the definition provided in the layerConfig parameter.
     *
     * @param {TypeVectorTilesLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    protected processOneLayerEntry(layerConfig: TypeVectorTilesLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeTileLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<TypeLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: TypeTileLayerEntryConfig): Promise<TypeLayerEntryConfig>;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig pointed to by the cached layerPath, returns updated bounds
     *
     * @param {Extent | undefined} bounds The current bounding box to be adjusted.
     * @param {never} notUsed This parameter must not be provided. It is there to allow overloading of the method signature.
     *
     * @returns {Extent} The new layer bounding box.
     */
    protected getBounds(bounds: Extent, notUsed?: never): Extent | undefined;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
     *
     * @param {string} layerPath The Layer path to the layer's configuration.
     * @param {Extent | undefined} bounds The current bounding box to be adjusted.
     *
     * @returns {Extent} The new layer bounding box.
     */
    protected getBounds(layerPath: string, bounds?: Extent): Extent | undefined;
    addVectorTileLayer(): void;
    /**
     * Set Vector Tile style
     *
     * @param {string} layerPath Path of layer to style.
     * @param {string} styleUrl The url of the styles to apply.
     */
    setVectorTileStyle(layerPath: string, styleUrl: string): void;
}
