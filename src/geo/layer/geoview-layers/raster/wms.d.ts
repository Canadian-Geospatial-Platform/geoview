import { TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import { TypeImageLayerEntryConfig, TypeLayerEntryConfig, TypeSourceImageWmsInitialConfig, TypeGeoviewLayerConfig } from '../../../map/map-schema-types';
export interface TypeWmsLayerEntryConfig extends Omit<TypeImageLayerEntryConfig, 'source'> {
    source: TypeSourceImageWmsInitialConfig;
}
export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: 'ogcWms';
    listOfLayerEntryConfig: TypeWmsLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeGeoviewLayerConfig as a TypeWMSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsWMS: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeWMSLayerConfig;
/** *****************************************************************************************************************************
 * Type Gard function that redefines an AbstractGeoViewLayer as a WMS if the type attribute of the verifyIfGeoViewLayer
 * parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsWMS: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is WMS;
/** *****************************************************************************************************************************
 * Type Gard function that redefines a TypeLayerEntryConfig as a TypeWmsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewRootLayer attribute is WMS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsWMS: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is TypeWmsLayerEntryConfig;
/** *****************************************************************************************************************************
 * A class to add wms layer.
 *
 * @exports
 * @class WMS
 */
export declare class WMS extends AbstractGeoViewRaster {
    private metadata;
    private attributions;
    /** ***************************************************************************************************************************
     * Initialize layer
     * @param {string} mapId the id of the map
     * @param {TypeWMSLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeWMSLayerConfig);
    /** ****************************************************************************************************************************
     * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
     */
    getAdditionalServiceDefinition(): Promise<void>;
    /** ****************************************************************************************************************************
     * This method creates a GeoView WMS layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeWmsLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {TypeBaseRasterLayer} The GeoView raster layer that has been created.
     */
    processOneLayerEntry(layerEntryConfig: TypeWmsLayerEntryConfig): Promise<TypeBaseRasterLayer | null>;
    /**
     * This method search recursively the layerId in the layer entry of the capabilities.
     *
     * @param {string} layerId The layer identifier that must exists on the server.
     * @param {TypeJsonObject} layerFromCapabilities The layer entry found in the capabilities.
     */
    findLayerCapabilities(layerId: string, layerFromCapabilities: TypeJsonObject): TypeJsonObject | null;
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
