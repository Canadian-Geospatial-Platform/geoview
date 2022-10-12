import TileLayer from 'ol/layer/Tile';
import XYZ from 'ol/source/XYZ';
import { Coordinate } from 'ol/coordinate';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeSourceTileInitialConfig, TypeTileLayerEntryConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeBaseLayerEntryConfig } from '../../../map/map-schema-types';
import { TypeFeatureInfoResult } from '../../../../api/events/payloads/get-feature-info-payload';
export declare type TypeSourceImageXYZTilesInitialConfig = TypeSourceTileInitialConfig;
export interface TypeXYZTilesLayerEntryConfig extends Omit<TypeTileLayerEntryConfig, 'source'> {
    source: TypeSourceImageXYZTilesInitialConfig;
}
export interface TypeXYZTilesConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig' | 'geoviewLayerType'> {
    geoviewLayerType: 'xyzTiles';
    listOfLayerEntryConfig: TypeXYZTilesLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeXYZTilesConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is XYZ_TILES. The type ascention applies only to the true block of the if clause that use this
 * function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsXYZTiles: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeXYZTilesConfig;
/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an XYZTiles if the type attribute of the verifyIfGeoViewLayer
 * parameter is XYZ_TILES. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention
 * is valid
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsXYZTiles: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is XYZTiles;
/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeXYZTilesLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is XYZ_TILES. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsXYZTiles: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeXYZTilesLayerEntryConfig;
/** *****************************************************************************************************************************
 * a class to add xyz-tiles layer
 *
 * @exports
 * @class XYZTiles
 */
export declare class XYZTiles extends AbstractGeoViewRaster {
    layer: TileLayer<XYZ>;
    /** ***************************************************************************************************************************
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeXYZTilesConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeXYZTilesConfig);
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method processes recursively the metadata of each layer in the list of layer configuration.
     *
     *  @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected processListOfLayerEntryMetadata(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
     * Since xyz-tile layer does not have metadata for the moment, the method does nothing.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
    /** ****************************************************************************************************************************
     * This method creates a GeoView XYZTiles layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeXYZTilesLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    processOneLayerEntry(layerEntryConfig: TypeXYZTilesLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided coordinate.
     *
     * @param {Coordinate} lnglat The coordinate that will be used by the query.
     * @param {string} layerId Optional layer identifier. If undefined, this.activeLayer is used.
     *
     * @returns {Promise<TypeFeatureInfoResult>} The promised feature info table.
     */
    protected getFeatureInfoAtCoordinate(lnglat: Coordinate, layerId?: string): Promise<TypeFeatureInfoResult>;
}
