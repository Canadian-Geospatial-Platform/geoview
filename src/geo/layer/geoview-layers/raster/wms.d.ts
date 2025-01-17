import BaseLayer from 'ol/layer/Base';
import { TypeJsonObject } from '@/core/types/global-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGeoViewRaster } from '@/geo/layer/geoview-layers/raster/abstract-geoview-raster';
import { TypeLayerEntryConfig, TypeGeoviewLayerConfig } from '@/geo/map/map-schema-types';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
export interface TypeWMSLayerConfig extends Omit<TypeGeoviewLayerConfig, 'listOfLayerEntryConfig'> {
    geoviewLayerType: typeof CONST_LAYER_TYPES.WMS;
    listOfLayerEntryConfig: OgcWmsLayerEntryConfig[];
}
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeGeoviewLayerConfig as a TypeWMSLayerConfig if the geoviewLayerType attribute of the
 * verifyIfLayer parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {TypeGeoviewLayerConfig} verifyIfLayer Polymorphic object to test in order to determine if the type ascention is valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const layerConfigIsWMS: (verifyIfLayer: TypeGeoviewLayerConfig) => verifyIfLayer is TypeWMSLayerConfig;
/** *****************************************************************************************************************************
 * type guard function that redefines an AbstractGeoViewLayer as a WMS if the type attribute of the verifyIfGeoViewLayer
 * parameter is WMS. The type ascention applies only to the true block of the if clause that use this function.
 *
 * @param {AbstractGeoViewLayer} verifyIfGeoViewLayer Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewLayerIsWMS: (verifyIfGeoViewLayer: AbstractGeoViewLayer) => verifyIfGeoViewLayer is WMS;
/** *****************************************************************************************************************************
 * type guard function that redefines a TypeLayerEntryConfig as a OgcWmsLayerEntryConfig if the geoviewLayerType attribute of the
 * verifyIfGeoViewEntry.geoviewLayerConfig attribute is WMS. The type ascention applies only to the true block of
 * the if clause that use this function.
 *
 * @param {TypeLayerEntryConfig} verifyIfGeoViewEntry Polymorphic object to test in order to determine if the type ascention is
 * valid.
 *
 * @returns {boolean} true if the type ascention is valid.
 */
export declare const geoviewEntryIsWMS: (verifyIfGeoViewEntry: TypeLayerEntryConfig) => verifyIfGeoViewEntry is OgcWmsLayerEntryConfig;
/** *****************************************************************************************************************************
 * A class to add wms layer.
 *
 * @exports
 * @class WMS
 */
export declare class WMS extends AbstractGeoViewRaster {
    #private;
    WMSStyles: string[];
    fullSubLayers: boolean;
    /** ***************************************************************************************************************************
     * Initialize layer
     * @param {string} mapId the id of the map
     * @param {TypeWMSLayerConfig} layerConfig the layer configuration
     */
    constructor(mapId: string, layerConfig: TypeWMSLayerConfig, fullSubLayers: boolean);
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected fetchServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined.
     *
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[]): void;
    /** ****************************************************************************************************************************
     * This method creates a GeoView WMS layer using the definition provided in the layerConfig parameter.
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
     * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig>;
    /** ***************************************************************************************************************************
     * This method will create a Geoview temporal dimension if it existds in the service metadata
     * @param {TypeJsonObject} wmsTimeDimension The WMS time dimension object
     * @param {OgcWmsLayerEntryConfig} layerConfig The layer entry to configure
     */
    protected processTemporalDimension(wmsTimeDimension: TypeJsonObject, layerConfig: OgcWmsLayerEntryConfig): void;
}
