import BaseLayer from 'ol/layer/Base';
import { Extent } from 'ol/extent';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeSourceTileInitialConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { VectorTilesLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
export type TypeSourceVectorTilesInitialConfig = TypeSourceTileInitialConfig;
export interface TypeVectorTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.VECTOR_TILES;
    listOfLayerEntryConfig: VectorTilesLayerEntryConfig[];
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
    protected getFieldType(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): 'string' | 'date' | 'number';
    /** ***************************************************************************************************************************
     * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
     * extra configuration may be done here.
     *
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;
    /** ****************************************************************************************************************************
     * This method creates a GeoView VectorTiles layer using the definition provided in the layerConfig parameter.
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     *
     * @returns {Promise<BaseLayer | undefined>} The GeoView raster layer that has been created.
     */
    protected processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined>;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig>;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
     *
     * @param {string} layerPath The Layer path to the layer's configuration.
     *
     * @returns {Extent | undefined} The new layer bounding box.
     */
    getBounds(layerPath: string): Extent | undefined;
    /**
     * Set Vector Tile style
     *
     * @param {string} layerPath Path of layer to style.
     * @param {string} styleUrl The url of the styles to apply.
     * @returns {Promise<unknown>}
     */
    setVectorTileStyle(layerPath: string, styleUrl: string): Promise<unknown>;
}
