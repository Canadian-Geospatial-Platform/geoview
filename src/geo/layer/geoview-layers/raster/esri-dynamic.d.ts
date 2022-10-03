import { TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import { TypeImageLayerEntryConfig, TypeLayerEntryConfig, TypeSourceImageEsriInitialConfig, TypeGeoviewLayerConfig } from '../../../map/map-schema-types';
export interface TypeEsriDynamicLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
    source: TypeSourceImageEsriInitialConfig;
}
export interface TypeEsriDynamicLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'esriDynamic';
    listOfLayerEntryConfig: TypeEsriDynamicLayerEntryConfig[];
}
/** ******************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeEsriDynamicLayerConfig if the geoviewLayerType attribute of
 * the verifyIfLayer parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsEsriDynamic: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeEsriDynamicLayerConfig;
/** ******************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as an EsriDynamic if the type attribute of the verifyIfGeoViewLayer
 * parameter is ESRI_DYNAMIC. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsEsriDynamic: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is EsriDynamic;
/** ******************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeEsriDynamicLayerEntryConfig if the geoviewLayerType attribute
 * of the verifyIfGeoViewEntry.geoviewRootLayer attribute is ESRI_DYNAMIC. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsEsriDynamic: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeEsriDynamicLayerEntryConfig;
/** ******************************************************************************************************************************
 * A class to add esri dynamic layer.
 *
 * @exports
 * @class EsriDynamic
 */
export declare class EsriDynamic extends AbstractGeoViewRaster {
    /** Service metadata */
    metadata: TypeJsonObject;
    /** ****************************************************************************************************************************
     * Initialize layer.
     * @param {string} mapId The id of the map.
     * @param {TypeEsriDynamicLayerConfig} layerConfig The layer configuration.
     */
    constructor(mapId: string, layerConfig: TypeEsriDynamicLayerConfig);
    /** ****************************************************************************************************************************
     * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
     */
    getAdditionalServiceDefinition(): Promise<void>;
    /** ****************************************************************************************************************************
     * This method creates a GeoView EsriDynamic layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeEsriDynamicLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    processOneLayerEntry(layerEntryConfig: TypeEsriDynamicLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
    /**
     * This method associate a renderer to the GeoView layer.
     *
     * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer associated to the renderer.
     */
    processLayerMetadata(rasterLayer: TypeBaseRasterLayer): void;
    /**
     * This method register the GeoView layer to panels that offer this possibility.
     *
     * @param {TypeBaseRasterLayer} rasterLayer The GeoView layer who wants to register.
     */
    registerToPanels(rasterLayer: TypeBaseRasterLayer): void;
}
