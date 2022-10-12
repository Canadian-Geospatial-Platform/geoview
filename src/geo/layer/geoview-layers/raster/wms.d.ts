import { Coordinate } from 'ol/coordinate';
import { TypeJsonObject } from '../../../../core/types/global-types';
import { AbstractGeoViewLayer } from '../abstract-geoview-layers';
import { AbstractGeoViewRaster, TypeBaseRasterLayer } from './abstract-geoview-raster';
import { TypeImageLayerEntryConfig, TypeLayerEntryConfig, TypeSourceImageWmsInitialConfig, TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeBaseLayerEntryConfig } from '../../../map/map-schema-types';
import { TypeFeatureInfoResult } from '../../../../api/events/payloads/get-feature-info-payload';
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
    /** ***************************************************************************************************************************
     * Initialize layer
     * @param {string} mapId the id of the map
     * @param {TypeWMSLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeWMSLayerConfig);
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
    /** ***************************************************************************************************************************
     * This method processes recursively the metadata of each layer in the list of layer configuration.
     *
     *  @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected processListOfLayerEntryMetadata(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<void>;
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
