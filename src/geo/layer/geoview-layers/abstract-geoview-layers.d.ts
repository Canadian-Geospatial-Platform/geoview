import BaseLayer from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import { TypeGeoviewLayerConfig, TypeListOfLayerEntryConfig, TypeLocalizedString, TypeLayerEntryConfig, TypeBaseLayerEntryConfig, TypeStyleConfig, TypeStyleConfigKey } from '../../map/map-schema-types';
import { TypeArrayOfFeatureInfoEntries, TypeQueryType } from '../../../api/events/payloads/get-feature-info-payload';
import { TypeJsonObject } from '../../../core/types/global-types';
export type TypeLegend = {
    layerPath: string;
    layerName?: TypeLocalizedString;
    type: TypeGeoviewLayerType;
    styleConfig?: TypeStyleConfig;
    legend: TypeLayerStyle | HTMLCanvasElement;
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
export interface TypeWmsLegend extends Omit<TypeLegend, 'styleConfig'> {
    legend: HTMLCanvasElement;
}
/**
 * type guard function that redefines a TypeLegend as a TypeVectorLegend
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const isVectorLegend: (verifyIfLegend: TypeLegend) => verifyIfLegend is TypeVectorLegend;
export interface TypeVectorLegend extends TypeLegend {
    legend: TypeLayerStyle;
}
export type TypeStyleRepresentation = {
    /** The defaultCanvas property is used by WMS legends, Simple styles and default styles when defined in unique value and class
     * break styles.
     */
    defaultCanvas?: HTMLCanvasElement | null;
    /** The arrayOfCanvas property is used by unique value and class break styles. */
    arrayOfCanvas?: (HTMLCanvasElement | null)[];
};
export type TypeLayerStyle = Partial<Record<TypeStyleConfigKey, TypeStyleRepresentation>>;
type LayerTypesKey = 'ESRI_DYNAMIC' | 'ESRI_FEATURE' | 'GEOJSON' | 'GEOCORE' | 'XYZ_TILES' | 'OGC_FEATURE' | 'WFS' | 'WMS';
/**
 * Type of GeoView layers
 */
export type TypeGeoviewLayerType = 'esriDynamic' | 'esriFeature' | 'GeoJSON' | 'geoCore' | 'xyzTiles' | 'ogcFeature' | 'ogcWfs' | 'ogcWms';
/**
 * Definition of the GeoView layer constants
 */
export declare const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType>;
/** ******************************************************************************************************************************
 * The AbstractGeoViewLayer class is normally used for creating subclasses and is not instantiated (using the new operator) in the
 * app. It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and mapLayerConfig. Its role is to save in attributes the mapId, type and elements of the
 * mapLayerConfig that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * metadataAccessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 */
export declare abstract class AbstractGeoViewLayer {
    /** Flag used to indicate that the layer is loaded */
    isLoaded: boolean;
    /** Flag used to indicate a layer load error */
    loadError: boolean;
    /** The unique identifier of the map on which the GeoView layer will be drawn. */
    mapId: string;
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
    /** Name of listOfLayerEntryConfig that did not load. */
    layerLoadError: {
        layer: string;
        consoleMessage: string;
    }[];
    /**
     * The vector or raster layer structure to be displayed for this GeoView class. Initial value is null indicating that the layers
     * have not been created.
     */
    gvLayers: BaseLayer | null;
    /** The layer Identifier that is used to get and set layer's settings. */
    activeLayer: TypeLayerEntryConfig | null;
    metadata: TypeJsonObject | null;
    /** Attribution used in the OpenLayer source. */
    attributions: string[];
    /** ***************************************************************************************************************************
     * The class constructor saves parameters and common configuration parameters in attributes.
     *
     * @param {TypeGeoviewLayerType} type The type of GeoView layer that is instantiated.
     * @param {TypeGeoviewLayer} mapLayerConfig The GeoView layer configuration options.
     * @param {string} mapId The unique identifier of the map on which the GeoView layer will be drawn.
     */
    constructor(type: TypeGeoviewLayerType, mapLayerConfig: TypeGeoviewLayerConfig, mapId: string);
    /** ***************************************************************************************************************************
     * This method is used to create the layers specified in the listOfLayerEntryConfig attribute inherited from its parent.
     * Normally, it is the second method called in the life cycle of a GeoView layer, the first one being the constructor.
     * Its code is the same for all child classes. It must first validate that the gvLayers attribute is null indicating
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
     * @returns {Promise<void>} A promise that the execution is done.
     */
    protected abstract getServiceMetadata(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method recursively validates the configuration of the layer entries to ensure that each layer is correctly defined. If
     * necessary, additional code can be executed in the child method to complete the layer configuration.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries configuration to validate.
     *
     * @returns {TypeListOfLayerEntryConfig} A new layer configuration list with layers in error removed.
     */
    protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): TypeListOfLayerEntryConfig;
    /** ***************************************************************************************************************************
     * This method processes recursively the metadata of each layer in the "layer list" configuration.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layers to process.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected processListOfLayerEntryMetadata(listOfLayerEntryConfig?: TypeListOfLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * This method is used to process metadata group layer entries. These layers behave as a GeoView group layer and also as a data
     * layer (i.e. they have extent, visibility and query flag definition). Metadata group layers can be identified by
     * the presence of an isMetadataLayerGroup attribute set to true.
     *
     * @param {TypeLayerGroupEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the vector layer configuration has its metadata and group layers processed.
     */
    private processMetadataGroupLayer;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty fields of the layer's configuration (renderer,
     * initial settings, fields and aliases).
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration to process.
     *
     * @returns {Promise<void>} A promise that the layer configuration has its metadata processed.
     */
    protected abstract processLayerMetadata(layerEntryConfig: TypeLayerEntryConfig): Promise<void>;
    /** ***************************************************************************************************************************
     * Process recursively the list of layer Entries to create the layers and the layer groups.
     *
     * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entries to process.
     *
     * @returns {Promise<BaseLayer | null>} The promise that the layers were processed.
     */
    protected processListOfLayerEntryConfig(listOfLayerEntryConfig: TypeListOfLayerEntryConfig): Promise<BaseLayer | null>;
    /** ***************************************************************************************************************************
     * This method creates a GeoView layer using the definition provided in the layerEntryConfig parameter.
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig Information needed to create the GeoView layer.
     *
     * @returns {Promise<BaseLayer | null>} The GeoView layer that has been created.
     */
    protected abstract processOneLayerEntry(layerEntryConfig: TypeBaseLayerEntryConfig): Promise<BaseLayer | null>;
    /** ***************************************************************************************************************************
     * Return feature information for the layer specified. If layerId is undefined, this.activeLayer is used.
     *
     * @param {Pixel | Coordinate | Coordinate[]} location A pixel, a coordinate or a polygon that will be used by the query.
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     * @param {TypeQueryType} queryType Optional query type, default value is 'at pixel'.
     *
     * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
     */
    getFeatureInfo(location: Pixel | Coordinate | Coordinate[], layerPathOrConfig?: string | TypeLayerEntryConfig | null, queryType?: TypeQueryType): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided Pixel.
     *
     * @param {Coordinate} location The pixel coordinate that will be used by the query.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
     */
    protected abstract getFeatureInfoAtPixel(location: Pixel, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided coordinate.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
     */
    protected abstract getFeatureInfoAtCoordinate(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided longitude latitude.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
     */
    protected abstract getFeatureInfoAtLongLat(location: Coordinate, layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided bounding box.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
     */
    protected abstract getFeatureInfoUsingBBox(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided polygon.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
     */
    protected abstract getFeatureInfoUsingPolygon(location: Coordinate[], layerConfig: TypeLayerEntryConfig): Promise<TypeArrayOfFeatureInfoEntries>;
    /** ***************************************************************************************************************************
     * This method register the layer entry to layer sets.
     *
     * @param {TypeBaseLayerEntryConfig} layerEntryConfig The layer entry to register.
     */
    protected registerToLayerSets(layerEntryConfig: TypeBaseLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * This method create a layer group. it uses the layer initial settings of the GeoView layer configuration.
     *
     * @returns {LayerGroup} A new layer group.
     */
    private createLayerGroup;
    /** ***************************************************************************************************************************
     * Set the active layer. It is the layer that will be used in some functions when the optional layer path is undefined.
     * The parameter can be a layer path (string) or a layer configuration. When the parameter is a layer path that
     * can not be found, the active layer remain unchanged.
     *
     * @param {string | TypeLayerEntryConfig} layerPathOrConfig The layer identifier.
     */
    setActiveLayer(layerPathOrConfig: string | TypeLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * Get the layer configuration of the specified layer path. If the layer path is undefined, the active layer is returned.
     *
     * @param {string} layerPath The layer path.
     *
     * @returns {TypeLayerEntryConfig | null} The layer configuration or null if not found.
     */
    getLayerConfig(layerPath?: string): TypeLayerEntryConfig | null | undefined;
    /** ***************************************************************************************************************************
     * Returns the layer bounds or undefined if not defined in the layer configuration or the metadata. if layerPathOrConfig is
     * undefined, the active layer is used. If projectionCode is defined, returns the bounds in the specified projection otherwise
     * use the map projection. The bounds are different from the extent. They are mainly used for display purposes to show the
     * bounding box in which the data resides and to zoom in on the entire layer data. It is not used by openlayer to limit the
     * display of data on the map.
     *
     * @param {string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig | null} layerPathOrConfig Optional layer path or
     * configuration.
     * @param {string | number | undefined} projectionCode Optional projection code to use for the returned bounds.
     *
     * @returns {Extent} The layer bounding box.
     */
    getBounds(layerPathOrConfig?: string | TypeLayerEntryConfig | TypeListOfLayerEntryConfig | null, projectionCode?: string | number | undefined): Extent | undefined;
    /** ***************************************************************************************************************************
     * Return the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy]. If layerPathOrConfig is undefined, the activeLayer of the class
     * will be used. This routine return undefined when no layerPathOrConfig is specified and the active layer is null. The extent
     * is used to clip the data displayed on the map.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {Extent} The layer extent.
     */
    getExtent(layerPathOrConfig?: string | TypeLayerEntryConfig | null): Extent | undefined;
    /** ***************************************************************************************************************************
     * set the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy]. If layerPathOrConfig is undefined, the activeLayer of the class
     * will be used. This routine does nothing when no layerPathOrConfig is specified and the active layer is null.
     *
     * @param {Extent} layerExtent The extent to assign to the layer.
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     */
    setExtent(layerExtent: Extent, layerPathOrConfig?: string | TypeLayerEntryConfig | null): void;
    /** ***************************************************************************************************************************
     * Return the opacity of the layer (between 0 and 1). When layerPathOrConfig is undefined, the activeLayer of the class is
     * used. This routine return undefined when the layerPath specified is not found or when the layerPathOrConfig is undefined and
     * the active layer is null.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {number} The opacity of the layer.
     */
    getOpacity(layerPathOrConfig?: string | TypeLayerEntryConfig | null): number | undefined;
    /** ***************************************************************************************************************************
     * Set the opacity of the layer (between 0 and 1). When layerPathOrConfig is undefined, the activeLayer of the class is used.
     * This routine does nothing when the layerPath specified is not found or when the layerPathOrConfig is undefined and the
     * active layer is null.
     *
     * @param {number} layerOpacity The opacity of the layer.
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     */
    setOpacity(layerOpacity: number, layerPathOrConfig?: string | TypeLayerEntryConfig | null): void;
    /** ***************************************************************************************************************************
     * Return the visibility of the layer (true or false). When layerPathOrConfig is undefined, the activeLayer of the class is
     * used. This routine return undefined when the layerPath specified is not found or when the layerPathOrConfig is undefined and
     * the active layer is null.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {boolean} The visibility of the layer.
     */
    getVisible(layerPathOrConfig?: string | TypeLayerEntryConfig | null): boolean | undefined;
    /** ***************************************************************************************************************************
     * Set the visibility of the layer (true or false). When layerPathOrConfig is undefined, the activeLayer of the class is
     * used. This routine does nothing when the layerPath specified is not found or when the layerPathOrConfig is undefined and the
     * active layer is null.
     *
     * @param {boolean} layerVisibility The visibility of the layer.
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     */
    setVisible(layerVisibility: boolean, layerPathOrConfig?: string | TypeLayerEntryConfig | null): void;
    /** ***************************************************************************************************************************
     * Return the min zoom of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
     * return undefined when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer
     * is null.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {boolean} The visibility of the layer.
     */
    getMinZoom(layerPathOrConfig?: string | TypeLayerEntryConfig | null): number | undefined;
    /** ***************************************************************************************************************************
     * Set the min zoom of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
     * does nothing when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer is
     * null.
     *
     * @param {boolean} layerVisibility The visibility of the layer.
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     */
    setMinZoom(minZoom: number, layerPathOrConfig?: string | TypeLayerEntryConfig | null): void;
    /** ***************************************************************************************************************************
     * Return the max zoom of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
     * return undefined when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer
     * is null.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {boolean} The visibility of the layer.
     */
    getMaxZoom(layerPathOrConfig?: string | TypeLayerEntryConfig | null): number | undefined;
    /** ***************************************************************************************************************************
     * Set the max zoom of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
     * does nothing when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer is
     * null.
     *
     * @param {boolean} layerVisibility The visibility of the layer.
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     */
    setMaxZoom(maxZoom: number, layerPathOrConfig?: string | TypeLayerEntryConfig | null): void;
    /** ***************************************************************************************************************************
     * Return the legend of the layer. When layerPathOrConfig is undefined, the activeLayer of the class is used. This routine
     * return null when the layerPath specified is not found or when the layerPathOrConfig is undefined and the active layer
     * is null or the layerConfig.style property is undefined.
     *
     * @param {string | TypeLayerEntryConfig | null} layerPathOrConfig Optional layer path or configuration.
     *
     * @returns {Promise<TypeLegend | null>} The legend of the layer.
     */
    getLegend(layerPathOrConfig?: string | TypeLayerEntryConfig | null): Promise<TypeLegend | null>;
    /** ***************************************************************************************************************************
     * Utility method use to add an entry to the outfields or aliasFields attribute of the layerEntryConfig.source.featureInfo.
     *
     * @param {TypeLayerEntryConfig} layerEntryConfig The layer entry configuration that contains the source.featureInfo.
     * @param {outfields' | 'aliasFields} fieldName The field name to update.
     * @param {string} fieldValue The value to append to the field name.
     * @param {number} prefixEntryWithComa flag (0 = false) indicating that we must prefix the entry with a ','
     */
    protected addFieldEntryToSourceFeatureInfo: (layerEntryConfig: TypeLayerEntryConfig, fieldName: 'outfields' | 'aliasFields', fieldValue: string, prefixEntryWithComa: number) => void;
}
export {};
