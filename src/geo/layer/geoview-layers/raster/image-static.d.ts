import { Extent } from 'ol/extent';
import { AbstractGeoViewLayer, TypeLegend } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeImageStaticLayerEntryConfig } from '@/geo/map/map-schema-types';
export interface TypeImageStaticLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'imageStatic';
    listOfLayerEntryConfig: TypeImageStaticLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeImageStaticLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is ImageStatic. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsImageStatic: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeImageStaticLayerConfig;
/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a ImageStatic if the type attribute of the verifyIfGeoViewLayer
 * parameter is ImageStatic. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsImageStatic: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is ImageStatic;
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a TypeImageStaticLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is ImageStatic. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsImageStatic: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeImageStaticLayerEntryConfig;
/** *****************************************************************************************************************************
 * A class to add image static layer.
 *
 * @exports
 * @class ImageStatic
 */
export declare class ImageStatic extends AbstractGeoViewRaster {
    /** ***************************************************************************************************************************
     * Initialize layer
     *
     * @param {string} mapId the id of the map
     * @param {TypeImageStaticLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeImageStaticLayerConfig);
    /** ***************************************************************************************************************************
     * Image static has no metadata.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * Get the legend image of a layer.
     *
     * @param {TypeImageStaticLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {blob} image blob
     */
    private getLegendImage;
    /** ***************************************************************************************************************************
     * Return the legend of the layer.This routine return null when the layerPath specified is not found. If the legend can't be
     * read, the legend property of the object returned will be null.
     *
     * @param {string | TypeLayerEntryConfig} layerPathOrConfig Layer path or configuration.
     *
     * @returns {Promise<TypeLegend | null>} The legend of the layer.
     */
    getLegend(layerPathOrConfig: string | TypeLayerEntryConfig): Promise<TypeLegend | null>;
    /** ***************************************************************************************************************************
     * This method recursively validates the layer configuration entries by filtering and reporting invalid layers. If needed,
     * extra configuration may be done here.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new list of layer entries configuration with deleted error layers.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
    /** ****************************************************************************************************************************
     * This method creates a GeoView Image Static layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeImageStaticLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    processOneLayerEntry(layerEntryConfig: TypeImageStaticLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig, returns updated bounds
     *
     * @param {TypeLayerEntryConfig} layerConfig Layer config to get bounds from.
     * @param {Extent | undefined} bounds The current bounding box to be adjusted.
     *
     * @returns {Extent} The layer bounding box.
     */
    protected getBounds(layerConfig: TypeLayerEntryConfig, bounds: Extent | undefined): Extent | undefined;
}
