import BaseLayer from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import LayerGroup from 'ol/layer/Group';
import Feature from 'ol/Feature';
import { TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeLocalizedString, TypeLayerEntryConfig, TypeBaseLayerEntryConfig, TypeStyleConfig, TypeVectorLayerEntryConfig, TypeLayerEntryType, TypeOgcWmsLayerEntryConfig, TypeEsriDynamicLayerEntryConfig, TypeLayerInitialSettings, TypeLayerStatus, TypeStyleGeometry } from '@/geo/map/map-schema-types';
import { codedValueType, rangeDomainType, TypeArrayOfFeatureInfoEntries, QueryType, TypeLocation } from '@/api/events/payloads';
import { TypeJsonObject } from '@/core/types/global-types';
import { TimeDimension, TypeDateFragments } from '@/core/utils/date-mgt';
import { TypeEventHandlerFunction } from '@/api/events/event';
export type TypeLegend = {
    layerPath: string;
    layerName?: TypeLocalizedString;
    type: TypeGeoviewLayerType;
    styleConfig?: TypeStyleConfig | null;
    legend: TypeVectorLayerStyles | HTMLCanvasElement | null;
};
/**
 * type guard function that redefines a TypeLegend as a TypeWmsLegend
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const isWmsLegend: (verifyIfLegend: TypeLegend) => verifyIfLegend is TypeWmsLegend;
export interface TypeWmsLegendStyle {
    name: string;
    legend: HTMLCanvasElement | null;
}
export interface TypeWmsLegend extends Omit<TypeLegend, 'styleConfig'> {
    legend: HTMLCanvasElement | null;
    styles?: TypeWmsLegendStyle[];
}
/**
 * type guard function that redefines a TypeLegend as a TypeImageStaticLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const isImageStaticLegend: (verifyIfLegend: TypeLegend) => verifyIfLegend is TypeImageStaticLegend;
export interface TypeImageStaticLegend extends Omit<TypeLegend, 'styleConfig'> {
    legend: HTMLCanvasElement | null;
}
/**
 * type guard function that redefines a TypeLegend as a TypeVectorLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const isVectorLegend: (verifyIfLegend: TypeLegend) => verifyIfLegend is TypeVectorLegend;
export interface TypeVectorLegend extends TypeLegend {
    legend: TypeVectorLayerStyles;
}
export type TypeStyleRepresentation = {
    /** The defaultCanvas property is used by Simple styles and default styles when defined in unique value and class
     * break styles.
     */
    defaultCanvas?: HTMLCanvasElement | null;
    /** The arrayOfCanvas property is used by unique value and class break styles. */
    arrayOfCanvas?: (HTMLCanvasElement | null)[];
};
export type TypeVectorLayerStyles = Partial<Record<TypeStyleGeometry, TypeStyleRepresentation>>;
type LayerTypesKey = 'ESRI_DYNAMIC' | 'ESRI_FEATURE' | 'IMAGE_STATIC' | 'GEOJSON' | 'GEOCORE' | 'GEOPACKAGE' | 'XYZ_TILES' | 'VECTOR_TILES' | 'OGC_FEATURE' | 'WFS' | 'WMS';
/**
 * Type of GeoView layers
 */
export type TypeGeoviewLayerType = 'esriDynamic' | 'esriFeature' | 'imageStatic' | 'GeoJSON' | 'geoCore' | 'GeoPackage' | 'xyzTiles' | 'vectorTiles' | 'ogcFeature' | 'ogcWfs' | 'ogcWms';
/**
 * Definition of the GeoView layer constants
 */
export declare const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType>;
/**
 * Definition of the GeoView layer entry types for each type of Geoview layer
 */
export declare const CONST_LAYER_ENTRY_TYPE: Record<TypeGeoviewLayerType, TypeLayerEntryType>;
/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
export declare const CONST_GEOVIEW_SCHEMA_BY_TYPE: Record<TypeGeoviewLayerType, string>;
type TypeLayerSetHandlerFunctions = {
    requestLayerInventory?: TypeEventHandlerFunction;
    queryLegend?: TypeEventHandlerFunction;
    queryLayer?: TypeEventHandlerFunction;
    updateLayerStatus?: TypeEventHandlerFunction;
    updateLayerPhase?: TypeEventHandlerFunction;
};
/** ******************************************************************************************************************************
 * The AbstractGeoViewLayer class is normally used for creating subclasses and is not instantiated (using the new operator) in the
 * app. It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and mapLayerConfig. Its role is to save in attributes the mapId, type and elements of the
 * mapLayerConfig that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * metadataAccessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 */
export declare abstract class AbstractGeoViewLayer {
    /** The unique identifier of the map on which the GeoView layer will be drawn. */
    mapId: string;
    /** Flag used to indicate the layer's phase */
    layerPhase: string;
    /** The type of GeoView layer that is instantiated. */
    type: TypeGeoviewLayerType;
    /** The unique identifier for the GeoView layer. The value of this attribute is extracted from the mapLayerConfig parameter.
     * If its value is undefined, a unique value is generated.
     */
    geoviewLayerId: string;
    /** The GeoView layer name. The value of this attribute is extracted from the mapLayerConfig parameter. If its value is
     * undefined, a default value is generated.
     */
    geoviewLayerName: TypeLocalizedString;
    /** The GeoView layer metadataAccessPath. The name attribute is optional */
    metadataAccessPath: TypeLocalizedString;
    /**
     * An array of layer settings. In the schema, this attribute is optional. However, we define it as mandatory and if the
     * configuration does not provide a value, we use an empty array instead of an undefined attribute.
     */
    listOfLayerEntryConfig: TypeListOfLayerEntryConfig;
    /**
     * Initial settings to apply to the GeoView layer at creation time. This attribute is allowed only if listOfLayerEntryConfig.length > 1.
     */
    initialSettings?: TypeLayerInitialSettings;
    /** layers of listOfLayerEntryConfig that did not load. */
    layerLoadError: {
        layer: string;
        consoleMessage: string;
    }[];
    /**
     * The structure of the vector or raster layers to be displayed for this GeoView class. This property points to the root of the layer tree,
     * unlike the olLayer (singular) property stored in the layer configuration entries list, which points to a node or leaf in the tree.
     * The initial value of olLayers is null, indicating that the layer tree has not been created.
     */
    olLayers: BaseLayer | null;
    metadata: TypeJsonObject | null;
    /** Layer metadata */
    layerMetadata: Record<string, TypeJsonObject>;
    /** Layer temporal dimension indexed by layerPath. */
    layerTemporalDimension: Record<string, TimeDimension>;
    /** Attribution used in the OpenLayer source. */
    attributions: string[];
    /** LayerSet handler functions indexed by layerPath. This property is used to deactivate (off) events attached to a layer. */
    registerToLayerSetListenerFunctions: Record<string, TypeLayerSetHandlerFunctions>;
    /** Date format object used to translate server to ISO format and ISO to server format */
    serverDateFragmentsOrder?: TypeDateFragments;
    /** Date format object used to translate internal UTC ISO format to the external format, the one used by the user */
    externalFragmentsOrder: TypeDateFragments;
    layerPathAssociatedToTheGeoviewLayer: string;
    /** ***************************************************************************************************************************
     * The class constructor saves parameters and common configuration parameters in attributes.
     *
     * @param {TypeGeoviewLayerType} type The type of GeoView layer that is instantiated.
     * @param {TypeGeoviewLayer} mapLayerConfig The GeoView layer configuration options.
     * @param {string} mapId The unique identifier of the map on which the GeoView layer will be drawn.
     */
    constructor(type: TypeGeoviewLayerType, mapLayerConfig: TypeGeoviewLayerConfig, mapId: string);
    /** ***************************************************************************************************************************
     * Change the layer phase property and emit an event to update existing layer sets.
     *
     * @param {string} layerPhase The value to assign to the layer phase property.
     * @param {string} layerPath The layer path to the layer's configuration affected by the change.
     */
    setLayerPhase(layerPhase: string, layerPath?: string): void;
    /** ***************************************************************************************************************************
     * Change the layer status property and emit an event to update existing layer sets.
     *
     * @param {TypeLayerStatus} layerStatus The value to assign to the layer status property.
     * @param {string} layerPath The layer path to the layer's configuration affected by the change.
     */
    setLayerStatus(layerStatus: TypeLayerStatus, layerPath?: string): void;
    /** ***************************************************************************************************************************
     * Process recursively the list of layer entries to see if all of them are processed.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer's configuration
     *                                                            (default: this.listOfLayerEntryConfig).
     *
     * @returns {boolean} true when all layers are processed.
     */
    allLayerEntryConfigProcessed(listOfLayerEntryConfig?: TypeListOfLayerEntryConfig): boolean;
    /** ***************************************************************************************************************************
     * Process recursively the list of layer entries to see if all of them are in error.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer's configuration
     *                                                            (default: this.listOfLayerEntryConfig).
     *
     * @returns {boolean} true when all layers are in error.
     */
    allLayerEntryConfigAreInError(listOfLayerEntryConfig?: TypeListOfLayerEntryConfig): boolean;
    /** ***************************************************************************************************************************
     * Recursively process the list of layer entries to count all layers in error.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer's configuration
     *                                                            (default: this.listOfLayerEntryConfig).
     *
     * @returns {number} The number of layers in error.
     */
    countErrorStatus(listOfLayerEntryConfig?: TypeListOfLayerEntryConfig): number;
    /** ***************************************************************************************************************************
     * Process recursively the list of layer entries to initialize the registeredLayers object.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
     */
    private initRegisteredLayers;
    /** ***************************************************************************************************************************
     * Process recursively the list of layer Entries to register all layers to the layerSets.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
     */
    private registerAllLayersToLayerSets;
    /** ***************************************************************************************************************************
     * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
     * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
     * Its code is the same for all child classes. It must first validate that the olLayers attribute is null indicating
     * that the method has never been called before for this layer. If this is not the case, an error message must be sent.
     * Then, it calls the abstract method getAdditionalServiceDefinition. For example, when the child is a WFS service, this
     * method executes the GetCapabilities request and saves the result in the metadata attribute of the class. It also process
     * the layer's metadata for each layer in the listOfLayerEntryConfig tree in order to define the missing pieces of the layer's
     * configuration. Layer's configuration can come from the configuration of the GeoView layer or from the information saved by
     * the method processListOfLayerEntryMetadata, priority being given to the first of the two. When the GeoView layer does not
     * have a service definition, the getAdditionalServiceDefinition method does nothing.
     *
     * Finally, the processListOfLayerEntryConfig is called to instantiate each layer identified by the listOfLayerEntryConfig
     * attribute. This method will also register the layers to all layer sets that offer this possibility. For example, if a layer
     * is queryable, it will subscribe to the details-panel and every time the user clicks on the map, the panel will ask the layer
     * to return the descriptive information of all the features in a tolerance radius. This information will be used to populate
     * the details-panel.
     */
    createGeoViewLayers(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method reads from the metadataAccessPath additional information to complete the GeoView layer configuration.
     * If the GeoView layer does not have a service definition, this method does nothing.
     */
    protected getAdditionalServiceDefinition(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method reads the service metadata from the metadataAccessPath.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected fetchServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
     * necessary, additional code can be executed in the child method to complete the layer configuration.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method processes recursively the metadata of each layer in the "layer list" configuration.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected processListOfLayerEntryMetadata(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * This method is used to process metadata group layer entries. These layers behave as a GeoView group layer and also as a data
     * layer (i.e. they have extent, visibility and query flag definition). Metadata group layers can be identified by
     * the presence of an isMetadataLayerGroup attribute set to true.
     *
     * @param {TypeLayerGroupEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the vector layer configuration has its metadata and group layers processed.
     */
    private processMetadataGroupLayer;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
     * layer's configuration when applicable.
     *
     * @param {TypeLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the vector layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: TypeLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * Process recursively the list of layer Entries to create the layers and the layer groups.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
     * @param {LayerGroup} layerGroup Optional layer group to use when we have many layers. The very first call to
     *  processListOfLayerEntryConfig must not provide a value for this parameter. It is defined for internal use.
     *
     * @returns {Promise<BaseLayer | null>} The promise that the layers were processed.
     */
    protected processListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig, layerGroup?: LayerGroup): Promise<BaseLayer | null>;
    /** ***************************************************************************************************************************
     * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
     *
     * @param {TypeLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     *
     * @returns {Promise<BaseLayer | null>} The GeoView layer that has been created.
     */
    protected abstract processOneLayerEntry(layerConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null>;
    /** ***************************************************************************************************************************
     * Return feature information for the layer specified.
     *
     * @param {QueryType} queryType  The type of query to perform.
     * @param {string} layerPath The layer path to the layer's configuration.
     * @param {TypeLocation} location An optionsl pixel, coordinate or polygon that will be used by the query.
     *
     * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
     */
    getFeatureInfo(queryType: QueryType, layerPath: string, location?: TypeLocation): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features on a layer. Returns an empty array [] when the layer is
     * not queryable.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getAllFeatureInfo(layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided Pixel. Returns an empty array [] when the layer is
     * not queryable.
     *
     * @param {Coordinate} location The pixel coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided coordinate. Returns an empty array [] when the layer is
     * not queryable.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided longitude latitude. Returns an empty array [] when the
     * layer is not queryable.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoAtLongLat(location: Coordinate, layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided bounding box. Returns an empty array [] when the layer is
     * not queryable.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoUsingBBox(location: Coordinate[], layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided polygon. Returns an empty array [] when the layer is
     * not queryable.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeArrayOfFeatureInfoEntries>} The feature info table.
     */
    protected getFeatureInfoUsingPolygon(location: Coordinate[], layerPath: string): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * This method register the layer entry to layer sets. Nothing is done if the registration is already done.
     *
     * @param {TypeBaseLayerEntryConfig} layerConfig The layer config to register.
     */
    protected registerToLayerSets(layerConfig: TypeBaseLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method unregisters the layer from the layer sets.
     *
     * @param {TypeBaseLayerEntryConfig} layerConfig The layer entry to register.
     */
    unregisterFromLayerSets(layerConfig: TypeBaseLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method create a layer group.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     * @returns {LayerGroup} A new layer group.
     */
    protected createLayerGroup(layerConfig: TypeLayerEntryConfig): LayerGroup;
    /** ***************************************************************************************************************************
     * Get the layer configuration of the specified layer path.
     *
     * @param {string} layerPath The layer path.
     *
     * @returns {TypeLayerEntryConfig | undefined} The layer configuration or undefined if not found.
     */
    getLayerConfig(layerPath: string): TypeLayerEntryConfig | undefined;
    /** ***************************************************************************************************************************
     * Returns the layer bounds or undefined if not defined in the layer configuration or the metadata. If projectionCode is
     * defined, returns the bounds in the specified projection otherwise use the map projection. The bounds are different from the
     * extent. They are mainly used for display purposes to show the bounding box in which the data resides and to zoom in on the
     * entire layer data. It is not used by openlayer to limit the display of data on the map.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds.
     *
     * @returns {Extent} The layer bounding box.
     */
    getMetadataBounds(layerPath: string, projectionCode?: string | number | undefined): Extent | undefined;
    /** ***************************************************************************************************************************
     * Returns the domaine of the specified field or null if the field has no domain.
     *
     * @param {string} fieldName field name for which we want to get the domaine.
     * @param {TypeLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {null | codedValueType | rangeDomainType} The domain of the field.
     */
    protected getFieldDomain(fieldName: string, layerConfig: TypeLayerEntryConfig): null | codedValueType | rangeDomainType;
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
     * Return the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy]. This routine return undefined when the layer path can't be found.
     * The extent is used to clip the data displayed on the map.
     *
     * @param {string} layerPath Layer path to the layer's configuration.
     *
     * @returns {Extent} The layer extent.
     */
    getExtent(layerPath?: string): Extent | undefined;
    /** ***************************************************************************************************************************
     * set the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy]. This routine does nothing when the layerPath specified is not
     * found.
     *
     * @param {Extent} layerExtent The extent to assign to the layer.
     * @param {string} layerPath The layer path to the layer's configuration.
     */
    setExtent(layerExtent: Extent, layerPath?: string): void;
    /** ***************************************************************************************************************************
     * Return the opacity of the layer (between 0 and 1). This routine return undefined when the layerPath specified is not found.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {number} The opacity of the layer.
     */
    getOpacity(layerPath?: string): number | undefined;
    /** ***************************************************************************************************************************
     * Set the opacity of the layer (between 0 and 1). This routine does nothing when the layerPath specified is not found.
     *
     * @param {number} layerOpacity The opacity of the layer.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     */
    setOpacity(layerOpacity: number, layerPath?: string): void;
    /** ***************************************************************************************************************************
     * Return the visibility of the layer (true or false). This routine return undefined when the layerPath specified is not found.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {boolean} The visibility of the layer.
     */
    getVisible(layerPath?: string): boolean | undefined;
    /** ***************************************************************************************************************************
     * Set the visibility of the layer (true or false). This routine does nothing when the layerPath specified is not found.
     *
     * @param {boolean} layerVisibility The visibility of the layer.
     * @param {string} layerPath The layer path to the layer's configuration.
     */
    setVisible(layerVisibility: boolean, layerPath?: string): void;
    /** ***************************************************************************************************************************
     * Return the min zoom of the layer. This routine return undefined when the layerPath specified is not found.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {boolean} The visibility of the layer.
     */
    getMinZoom(layerPath?: string): number | undefined;
    /** ***************************************************************************************************************************
     * Set the min zoom of the layer. This routine does nothing when the layerPath specified is not found.
     *
     * @param {boolean} layerVisibility The visibility of the layer.
     * @param {string} layerPath The layer path to the layer's configuration.
     */
    setMinZoom(minZoom: number, layerPath?: string): void;
    /** ***************************************************************************************************************************
     * Return the max zoom of the layer. This routine return undefined when the layerPath specified is not found.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {boolean} The visibility of the layer.
     */
    getMaxZoom(layerPath?: string): number | undefined;
    /** ***************************************************************************************************************************
     * Set the max zoom of the layer. This routine does nothing when the layerPath specified is not found.
     *
     * @param {boolean} layerVisibility The visibility of the layer.
     * @param {string} layerPath The layer path to the layer's configuration.
     */
    setMaxZoom(maxZoom: number, layerPath?: string): void;
    /** ***************************************************************************************************************************
     * Return the legend of the layer. This routine returns null when the layerPath specified is not found. If the style property
     * of the layerConfig object is undefined, the legend property of the object returned will be null.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeLegend | null>} The legend of the layer.
     */
    getLegend(layerPath?: string): Promise<TypeLegend | null>;
    /** ***************************************************************************************************************************
     * Get and format the value of the field with the name passed in parameter. Vector GeoView layers convert dates to milliseconds
     * since the base date. Vector feature dates must be in ISO format.
     *
     * @param {Feature} features The features that hold the field values.
     * @param {string} fieldName The field name.
     * @param {'number' | 'string' | 'date'} fieldType The field type.
     *
     * @returns {string | number | Date} The formatted value of the field.
     */
    protected getFieldValue(feature: Feature, fieldName: string, fieldType: 'number' | 'string' | 'date'): string | number | Date;
    /** ***************************************************************************************************************************
     * Convert the feature information to an array of TypeArrayOfFeatureInfoEntries.
     *
     * @param {Feature[]} features The array of features to convert.
     * @param {TypeImageLayerEntryConfig | TypeVectorLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {TypeArrayOfFeatureInfoEntries} The Array of feature information.
     */
    protected formatFeatureInfoResult(features: Feature[], layerConfig: TypeOgcWmsLayerEntryConfig | TypeEsriDynamicLayerEntryConfig | TypeVectorLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Get the layerFilter that is associated to the layer. Returns undefined when the layer config can't be found using the layer
     * path.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {string | undefined} The filter associated to the layer or undefined.
     */
    getLayerFilter(layerPath?: string): string | undefined;
    /** ***************************************************************************************************************************
     * Get the layerFilter that is associated to the layer. Returns undefined when the layer config can't be found using the layer
     * path.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {TimeDimension} The temporal dimension associated to the layer or undefined.
     */
    getTemporalDimension(layerPath?: string): TimeDimension;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig pointed to by the cached layerPath, returns updated bounds
     *
     * @param {Extent | undefined} bounds The current bounding box to be adjusted.
     * @param {never} notUsed This parameter must not be provided. It is there to allow overloading of the method signature.
     *
     * @returns {Extent} The new layer bounding box.
     */
    protected abstract getBounds(bounds: Extent, notUsed?: never): Extent | undefined;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
     *
     * @param {string} layerPath The Layer path to the layer's configuration.
     * @param {Extent | undefined} bounds The current bounding box to be adjusted.
     *
     * @returns {Extent} The new layer bounding box.
     */
    protected abstract getBounds(layerPath: string, bounds?: Extent): Extent | undefined;
    /** ***************************************************************************************************************************
     * Compute the layer bounds or undefined if the result can not be obtained from the feature extents that compose the layer. If
     * projectionCode is defined, returns the bounds in the specified projection otherwise use the map projection. The bounds are
     * different from the extent. They are mainly used for display purposes to show the bounding box in which the data resides and
     * to zoom in on the entire layer data. It is not used by openlayer to limit the display of data on the map.
     *
     * @param {string} layerPath The Layer path to the layer's configuration.
     * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds. Default to
     * current projection.
     *
     * @returns {Extent} The layer bounding box.
     */
    calculateBounds(layerPath?: string): Extent | undefined;
    /** ***************************************************************************************************************************
     * Set the layerStatus code of all layers in the listOfLayerEntryConfig.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer's configuration.
     * @param {string} errorMessage The error message.
     */
    setAllLayerStatusToError(listOfLayerEntryConfig: TypeListOfLayerEntryConfig, errorMessage: string): void;
    /** ***************************************************************************************************************************
     * remove a layer configuration.
     *
     * @param {string} layerPath The layerpath to the node we want to delete.
     */
    removeConfig(layerPath?: string): void;
}
export {};
