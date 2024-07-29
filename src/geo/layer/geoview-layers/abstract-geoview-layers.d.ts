import BaseLayer from 'ol/layer/Base';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Extent } from 'ol/extent';
import LayerGroup from 'ol/layer/Group';
import Feature from 'ol/Feature';
import Source from 'ol/source/Source';
import { TypeLocalizedString } from '@config/types/map-schema-types';
import { TypeJsonObject } from '@/core/types/global-types';
import { TimeDimension, TypeDateFragments } from '@/core/utils/date-mgt';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeGeoviewLayerConfig, TypeLayerEntryConfig, TypeStyleConfig, TypeLayerInitialSettings, TypeLayerStatus, TypeStyleGeometry, CONST_LAYER_ENTRY_TYPES, TypeLoadEndListenerType, TypeFeatureInfoEntry, codedValueType, rangeDomainType, TypeLocation, QueryType } from '@/geo/map/map-schema-types';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLegend } from '@/core/stores/store-interface-and-intial-values/layer-state';
import { MapViewer } from '@/geo/map/map-viewer';
/**
 * The AbstractGeoViewLayer class is the abstraction class of all GeoView Layers classes.
 * It registers the configuration options and defines the methods shared by all its descendant. The class constructor has
 * three parameters: mapId, type and mapLayerConfig. Its role is to save in attributes the mapId, type and elements of the
 * mapLayerConfig that are common to all GeoView layers. The main characteristic of a GeoView layer is the presence of an
 * metadataAccessPath attribute whose value is passed as an attribute of the mapLayerConfig object.
 */
export declare abstract class AbstractGeoViewLayer {
    #private;
    static DEFAULT_HIT_TOLERANCE: number;
    hitTolerance: number;
    /** The map id on which the GeoView layer will be drawn. */
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
    listOfLayerEntryConfig: TypeLayerEntryConfig[];
    /** Initial settings to apply to the GeoView layer at creation time. This attribute is allowed only if listOfLayerEntryConfig.length > 1. */
    initialSettings?: TypeLayerInitialSettings;
    /** layers of listOfLayerEntryConfig that did not load. */
    layerLoadError: {
        layer: string;
        loggerMessage: string;
    }[];
    /** The OpenLayer root layer representing this GeoView Layer. */
    olRootLayer?: BaseLayer;
    /** The service metadata. */
    metadata: TypeJsonObject | null;
    /** Date format object used to translate server to ISO format and ISO to server format */
    serverDateFragmentsOrder?: TypeDateFragments;
    /** Date format object used to translate internal UTC ISO format to the external format, the one used by the user */
    externalFragmentsOrder: TypeDateFragments;
    /** ***************************************************************************************************************************
     * The class constructor saves parameters and common configuration parameters in attributes.
     *
     * @param {TypeGeoviewLayerType} type - The type of GeoView layer that is instantiated.
     * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration options.
     * @param {string} mapId - The unique identifier of the map on which the GeoView layer will be drawn.
     */
    constructor(type: TypeGeoviewLayerType, geoviewLayerConfig: TypeGeoviewLayerConfig, mapId: string);
    /**
     * Gets the MapViewer where the layer resides
     * @returns {MapViewer} The MapViewer
     */
    getMapViewer(): MapViewer;
    /** ***************************************************************************************************************************
     * Gets the layer configuration of the specified layer path.
     *
     * @param {string} layerPath The layer path.
     *
     * @returns {ConfigBaseClass | undefined} The layer configuration or undefined if not found.
     */
    getLayerConfig(layerPath: string): ConfigBaseClass | undefined;
    /** ***************************************************************************************************************************
     * Gets the OpenLayer of the specified layer path.
     *
     * @param {string} layerPath The layer path.
     *
     * @returns {BaseLayer | undefined} The layer configuration or undefined if not found.
     */
    getOLLayer(layerPath: string): BaseLayer | undefined;
    /** ***************************************************************************************************************************
     * Gets the Geoview layer id.
     * @returns {string} The geoview layer id
     */
    getGeoviewLayerId(): string;
    /** ***************************************************************************************************************************
     * Gets the Geoview layer name.
     * @returns {TypeLocalizedString | undefined} The geoview layer name
     */
    getGeoviewLayerName(): TypeLocalizedString | undefined;
    /**
     * Gets the layer status
     * @returns The layer status
     */
    getLayerStatus(layerPath: string): TypeLayerStatus;
    /** ***************************************************************************************************************************
     * Gets the layer name.
     * @returns {TypeLocalizedString | undefined} The geoview layer name
     */
    getLayerName(layerPath: string): TypeLocalizedString | undefined;
    /** ***************************************************************************************************************************
     * Sets the layer name.
     * @param {string} layerPath The layer path.
     * @param {TypeLocalizedString} name The layer name.
     */
    setLayerName(layerPath: string, name: TypeLocalizedString | undefined): void;
    /**
     * Gets the layer style
     * @returns The layer style
     */
    getStyle(layerPath: string): TypeStyleConfig | undefined;
    /**
     * Sets the layer style
     * @param {TypeStyleConfig | undefined} style - The layer style
     */
    setStyle(layerPath: string, style: TypeStyleConfig): void;
    /**
     * Gets the layer attributions
     * @returns {string[]} The layer attributions
     */
    getAttributions(): string[];
    /**
     * Sets the layer attributions
     * @param {string[]} attributions - The layer attributions
     */
    setAttributions(attributions: string[]): void;
    /** ***************************************************************************************************************************
     * Get the layer metadata that is associated to the layer.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {TypeJsonObject} The layer metadata.
     */
    getLayerMetadata(layerPath: string): TypeJsonObject;
    /** ***************************************************************************************************************************
     * Set the layer metadata for the layer identified by specified layerPath.
     *
     * @param {string} layerPath The layer path to the layer's configuration affected by the change.
     * @param {TypeJsonObject} layerMetadata The value to assign to the layer metadata property.
     */
    setLayerMetadata(layerPath: string, layerMetadata: TypeJsonObject): void;
    /** ***************************************************************************************************************************
     * Get the temporal dimension that is associated to the layer. Returns undefined when the layer config can't be found using the layer
     * path.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {TimeDimension} The temporal dimension associated to the layer or undefined.
     */
    getTemporalDimension(layerPath: string): TimeDimension;
    /** ***************************************************************************************************************************
     * Set the layerTemporalDimension for the layer identified by specified layerPath.
     *
     * @param {string} layerPath The layer path to the layer's configuration affected by the change.
     * @param {TimeDimension} temporalDimension The value to assign to the layer temporal dimension property.
     */
    setTemporalDimension(layerPath: string, temporalDimension: TimeDimension): void;
    /**
     * Gets the flag if layer use its time dimension, this can be use to exclude layers from time function like time slider
     * @returns {boolean} The flag indicating if the layer should be included in time awareness functions such as the Time Slider. True by default..
     */
    getIsTimeAware(): boolean;
    /** ***************************************************************************************************************************
     * Recursively process the list of layer entries to count all layers in error.
     *
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer's configuration
     *                                                        (default: this.listOfLayerEntryConfig).
     *
     * @returns {number} The number of layers in error.
     */
    countErrorStatus(listOfLayerEntryConfig?: TypeLayerEntryConfig[]): number;
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
     */
    protected getAdditionalServiceDefinition(): Promise<void>;
    /** ***************************************************************************************************************************
     * This method Validate the list of layer configs and extract them in the geoview instance.
     */
    validateAndExtractLayerMetadata(): Promise<void>;
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
     * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layer entries configuration to validate.
     */
    protected abstract validateListOfLayerEntryConfig(listOfLayerEntryConfig: ConfigBaseClass[]): void;
    /** ***************************************************************************************************************************
     * This method processes recursively the metadata of each layer in the "layer list" configuration.
     *
     * @param {ConfigBaseClass[]} listOfLayerEntryConfig The list of layers to process.
     *
     * @returns {Promise<void>} A promise that the execution is completed.
     */
    protected processListOfLayerEntryMetadata(listOfLayerEntryConfig: ConfigBaseClass[]): Promise<void>;
    /** ***************************************************************************************************************************
     * This method is used to process the layer's metadata. It will fill the empty outfields and aliasFields properties of the
     * layer's configuration when applicable.
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig The layer entry configuration to process.
     *
     * @returns {Promise<AbstractBaseLayerEntryConfig>} A promise that the vector layer configuration has its metadata processed.
     */
    protected processLayerMetadata(layerConfig: AbstractBaseLayerEntryConfig): Promise<AbstractBaseLayerEntryConfig>;
    /** ***************************************************************************************************************************
     * Process recursively the list of layer Entries to create the layers and the layer groups.
     *
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer entries to process.
     * @param {LayerGroup} layerGroup Optional layer group to use when we have many layers. The very first call to
     *  processListOfLayerEntryConfig must not provide a value for this parameter. It is defined for internal use.
     *
     * @returns {Promise<BaseLayer | null>} The promise that the layers were processed.
     */
    processListOfLayerEntryConfig(listOfLayerEntryConfig: TypeLayerEntryConfig[], layerGroup?: LayerGroup): Promise<BaseLayer | undefined>;
    /** ***************************************************************************************************************************
     * This method creates a GeoView layer using the definition provided in the layerConfig parameter.
     *
     * @param {AbstractBaseLayerEntryConfig} layerConfig Information needed to create the GeoView layer.
     *
     * @returns {Promise<BaseLayer | undefined>} The GeoView layer that has been created.
     */
    protected processOneLayerEntry(layerConfig: AbstractBaseLayerEntryConfig): Promise<BaseLayer | undefined>;
    /** ***************************************************************************************************************************
     * Return feature information for the layer specified.
     *
     * @param {QueryType} queryType  The type of query to perform.
     * @param {string} layerPath The layer path to the layer's configuration.
     * @param {TypeLocation} location An optionsl pixel, coordinate or polygon that will be used by the query.
     *
     * @returns {Promise<TypeFeatureInfoResult>} The feature info table.
     */
    getFeatureInfo(queryType: QueryType, layerPath: string, location?: TypeLocation): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features on a layer. Returns an empty array [] when the layer is
     * not queryable.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
     */
    protected getAllFeatureInfo(layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided Pixel. Returns an empty array [] when the layer is
     * not queryable.
     *
     * @param {Coordinate} location The pixel coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
     */
    protected getFeatureInfoAtPixel(location: Pixel, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided coordinate. Returns an empty array [] when the layer is
     * not queryable.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
     */
    protected getFeatureInfoAtCoordinate(location: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features around the provided longitude latitude. Returns an empty array [] when the
     * layer is not queryable.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
     */
    protected getFeatureInfoAtLongLat(location: Coordinate, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided bounding box. Returns an empty array [] when the layer is
     * not queryable.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
     */
    protected getFeatureInfoUsingBBox(location: Coordinate[], layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Return feature information for all the features in the provided polygon. Returns an empty array [] when the layer is
     * not queryable.
     *
     * @param {Coordinate} location The coordinate that will be used by the query.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The feature info table.
     */
    protected getFeatureInfoUsingPolygon(location: Coordinate[], layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /**
     * Queries the legend.
     * This function raises legend querying and queried events.
     * @returns {Promise<TypeLegend | null>} The promise when the legend (or null) will be received
     */
    queryLegend(layerPath: string): Promise<TypeLegend | null>;
    /**
     * Update the size of the icon image list based on styles.
     * @param {TypeLegend} legend - The legend to check.
     */
    updateIconImageCache(legend: TypeLegend): void;
    /** ***************************************************************************************************************************
     * Creates a layer group.
     * @param {TypeLayerEntryConfig} layerConfig The layer configuration.
     * @param {TypeLayerInitialSettings } initialSettings Initial settings to apply to the layer.
     * @returns {LayerGroup} A new layer group.
     */
    protected createLayerGroup(layerConfig: TypeLayerEntryConfig, initialSettings: TypeLayerInitialSettings): LayerGroup;
    /** ***************************************************************************************************************************
     * Returns the domain of the specified field or null if the field has no domain.
     *
     * @param {string} fieldName field name for which we want to get the domain.
     * @param {TypeLayerEntryConfig} layerConfig layer configuration.
     *
     * @returns {null | codedValueType | rangeDomainType} The domain of the field.
     */
    protected getFieldDomain(fieldName: string, layerConfig: AbstractBaseLayerEntryConfig): null | codedValueType | rangeDomainType;
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
     * Return the extent of the layer or undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy]. This routine return undefined when the layer path can't be found.
     * The extent is used to clip the data displayed on the map.
     *
     * @param {string} layerPath Layer path to the layer's configuration.
     *
     * @returns {Extent | undefined} The layer extent.
     */
    getExtent(layerPath: string): Extent | undefined;
    /** ***************************************************************************************************************************
     * set the extent of the layer. Use undefined if it will be visible regardless of extent. The layer extent is an array of
     * numbers representing an extent: [minx, miny, maxx, maxy]. This routine does nothing when the layerPath specified is not
     * found.
     *
     * @param {Extent} layerExtent The extent to assign to the layer.
     * @param {string} layerPath The layer path to the layer's configuration.
     */
    setExtent(layerExtent: Extent, layerPath: string): void;
    /** ***************************************************************************************************************************
     * Return the opacity of the layer (between 0 and 1). This routine return undefined when the layerPath specified is not found.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {number | undefined} The opacity of the layer.
     */
    getOpacity(layerPath: string): number | undefined;
    /** ***************************************************************************************************************************
     * Set the opacity of the layer (between 0 and 1). This routine does nothing when the layerPath specified is not found.
     *
     * @param {number} layerOpacity The opacity of the layer.
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     */
    setOpacity(layerOpacity: number, layerPath: string): void;
    /** ***************************************************************************************************************************
     * Return the visibility of the layer (true or false). This routine return undefined when the layerPath specified is not found.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {boolean | undefined} The visibility of the layer.
     */
    getVisible(layerPath: string): boolean | undefined;
    /** ***************************************************************************************************************************
     * Set the visibility of the layer (true or false). This routine does nothing when the layerPath specified is not found.
     *
     * @param {boolean} layerVisibility The visibility of the layer.
     * @param {string} layerPath The layer path to the layer's configuration.
     */
    setVisible(layerVisibility: boolean, layerPath: string): void;
    /** ***************************************************************************************************************************
     * Return the min zoom of the layer. This routine return undefined when the layerPath specified is not found.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {number | undefined} The min zoom of the layer.
     */
    getMinZoom(layerPath: string): number | undefined;
    /** ***************************************************************************************************************************
     * Set the min zoom of the layer. This routine does nothing when the layerPath specified is not found.
     *
     * @param {boolean} layerVisibility The min zoom of the layer.
     * @param {string} layerPath The layer path to the layer's configuration.
     */
    setMinZoom(minZoom: number, layerPath: string): void;
    /** ***************************************************************************************************************************
     * Return the max zoom of the layer. This routine return undefined when the layerPath specified is not found.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {number | undefined} The max zoom of the layer.
     */
    getMaxZoom(layerPath: string): number | undefined;
    /** ***************************************************************************************************************************
     * Set the max zoom of the layer. This routine does nothing when the layerPath specified is not found.
     *
     * @param {boolean} layerVisibility The max zoom of the layer.
     * @param {string} layerPath The layer path to the layer's configuration.
     */
    setMaxZoom(maxZoom: number, layerPath: string): void;
    /** ***************************************************************************************************************************
     * Overridable function returning the legend of the layer. Returns null when the layerPath specified is not found. If the style property
     * of the layerConfig object is undefined, the legend property of the object returned will be null.
     * @param {string} layerPath The layer path to the layer's configuration.
     * @returns {Promise<TypeLegend | null>} The legend of the layer.
     */
    getLegend(layerPath: string): Promise<TypeLegend | null>;
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
     * Convert the feature information to an array of TypeFeatureInfoEntry[] | undefined | null.
     *
     * @param {Feature[]} features The array of features to convert.
     * @param {ImageLayerEntryConfig | VectorLayerEntryConfig} layerConfig The layer configuration.
     *
     * @returns {Promise<TypeFeatureInfoEntry[] | undefined | null>} The Array of feature information.
     */
    protected formatFeatureInfoResult(features: Feature[], layerConfig: OgcWmsLayerEntryConfig | EsriDynamicLayerEntryConfig | VectorLayerEntryConfig): Promise<TypeFeatureInfoEntry[] | undefined | null>;
    /** ***************************************************************************************************************************
     * Get the layerFilter that is associated to the layer. Returns undefined when the layer config can't be found using the layer
     * path.
     *
     * @param {string} layerPath The layer path to the layer's configuration.
     *
     * @returns {string | undefined} The filter associated to the layer or undefined.
     */
    getLayerFilter(layerPath: string): string | undefined;
    /**
     * Overridable function called when the layer gets in loaded status.
     * @param layerConfig - The layer configuration
     */
    onLoaded(layerConfig: AbstractBaseLayerEntryConfig): void;
    /**
     * Overridable function called when the layer gets in error status.
     * @param layerConfig - The layer configuration
     */
    onError(layerConfig: AbstractBaseLayerEntryConfig): void;
    /** ***************************************************************************************************************************
     * Get the bounds of the layer represented in the layerConfig pointed to by the layerPath, returns updated bounds
     *
     * @param {string} layerPath The Layer path to the layer's configuration.
     *
     * @returns {Extent} The new layer bounding box.
     */
    abstract getBounds(layerPath: string): Extent | undefined;
    /**
     * Overridable function that gets the extent of an array of features.
     * @param {string} layerPath - The layer path
     * @param {string[]} objectIds - The IDs of features to get extents from.
     * @returns {Promise<Extent | undefined>} The extent of the features, if available
     */
    getExtentFromFeatures(layerPath: string, objectIds: string[]): Promise<Extent | undefined>;
    /** ***************************************************************************************************************************
     * Set the layerStatus code of all layers in the listOfLayerEntryConfig.
     *
     * @param {TypeLayerStatus} newStatus The new status to assign to the layers.
     * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig The list of layer's configuration.
     * @param {string} errorMessage The error message.
     */
    setAllLayerStatusTo(newStatus: TypeLayerStatus, listOfLayerEntryConfig: TypeLayerEntryConfig[], errorMessage?: string): void;
    /** ***************************************************************************************************************************
     * Recursively processes the list of layer entries to see if all of them are greater than or equal to the provided layer status.
     * @param {TypeLayerStatus} layerStatus The layer status to compare with the internal value of the config.
     * @returns {boolean} true when all layers are greater than or equal to the layerStatus parameter.
     */
    allLayerStatusAreGreaterThanOrEqualTo(layerStatus: TypeLayerStatus): boolean;
    /**
     * Returns a Promise that will be resolved once the given layer is in a processed phase.
     * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
     * @param {AbstractGeoViewLayer} geoviewLayerConfig - The layer object
     * @param {number} timeout - Optionally indicate the timeout after which time to abandon the promise
     * @param {number} checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
     * @returns {Promise<void>} A promise when done waiting
     * @throws An exception when the layer failed to become in processed phase before the timeout expired
     */
    waitForAllLayerStatusAreGreaterThanOrEqualTo(timeout?: number, checkFrequency?: number): Promise<void>;
    /**
     * The olLayerAndLoadEndListeners setter method for the ConfigBaseClass class and its descendant classes.
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer configuration we are creating a layer for.
     * @param {BaseLayer} olLayer - The OpenLayer we are creating
     * @param {TypeLoadEndListenerType} listenerType - The layer listener type.
     */
    setLayerAndLoadEndListeners(layerConfig: AbstractBaseLayerEntryConfig, olLayer: BaseLayer, listenerType: TypeLoadEndListenerType): void;
    /**
     * Recursively gets all layer entry configs in the GeoView Layer.
     * @returns {ConfigBaseClass[]} The list of layer entry configs
     */
    getAllLayerEntryConfigs(): ConfigBaseClass[];
    /**
     * Registers a layer name changed event handler.
     * @param {LayerNameChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerNameChanged(callback: LayerNameChangedDelegate): void;
    /**
     * Unregisters a layer name changed event handler.
     * @param {LayerNameChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerNameChanged(callback: LayerNameChangedDelegate): void;
    /**
     * Registers a legend querying event handler.
     * @param {LegendQueryingDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLegendQuerying(callback: LegendQueryingDelegate): void;
    /**
     * Unregisters a legend querying event handler.
     * @param {LegendQueryingDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLegendQuerying(callback: LegendQueryingDelegate): void;
    /**
     * Registers a legend queried event handler.
     * @param {LegendQueriedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLegendQueried(callback: LegendQueriedDelegate): void;
    /**
     * Unregisters a legend queried event handler.
     * @param {LegendQueriedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLegendQueried(callback: LegendQueriedDelegate): void;
    /**
     * Registers a visible changed event handler.
     * @param {VisibleChangedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onVisibleChanged(callback: VisibleChangedDelegate): void;
    /**
     * Unregisters a visible changed event handler.
     * @param {VisibleChangedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offVisibleChanged(callback: VisibleChangedDelegate): void;
    /**
     * Registers a layer entry config processed event handler.
     * @param {LayerEntryProcessedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLayerEntryProcessed(callback: LayerEntryProcessedDelegate): void;
    /**
     * Unregisters a layer entry config processed event handler.
     * @param {LayerEntryProcessedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLayerEntryProcessed(callback: LayerEntryProcessedDelegate): void;
    /**
     * Emits an event to all handlers.
     * @param {LayerRequestingEvent} event The event to emit
     * @private
     */
    protected emitLayerRequesting(event: LayerRequestingEvent): (BaseLayer | undefined)[];
    /**
     * Registers a layer creation event handler.
     * @param {LayerRequestingDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLayerRequesting(callback: LayerRequestingDelegate): void;
    /**
     * Unregisters a layer creation event handler.
     * @param {LayerRequestingDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLayerRequesting(callback: LayerRequestingDelegate): void;
    /**
     * Emits an event to all handlers.
     * @param {LayerCreationEvent} event The event to emit
     * @private
     */
    protected emitLayerCreation(event: LayerCreationEvent): void;
    /**
     * Registers a layer creation event handler.
     * @param {LayerCreationDelegate} callback The callback to be executed whenever the event is emitted
     */
    onLayerCreation(callback: LayerCreationDelegate): void;
    /**
     * Unregisters a layer creation event handler.
     * @param {LayerCreationDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offLayerCreation(callback: LayerCreationDelegate): void;
    /**
     * Emits filter applied event.
     * @param {FilterAppliedEvent} event - The event to emit
     * @private
     */
    protected emitLayerFilterApplied(event: LayerFilterAppliedEvent): void;
    /**
     * Registers a filter applied event handler.
     * @param {FilterAppliedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerFilterApplied(callback: LayerFilterAppliedDelegate): void;
    /**
     * Unregisters a filter applied event handler.
     * @param {FilterAppliedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerFilterApplied(callback: LayerFilterAppliedDelegate): void;
    /**
     * Registers a layer style changed event handler.
     * @param {LayerStyleChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerStyleChanged(callback: LayerStyleChangedDelegate): void;
    /**
     * Unregisters a layer style changed event handler.
     * @param {LayerStyleChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerStyleChanged(callback: LayerStyleChangedDelegate): void;
    /**
     * Registers an opacity changed event handler.
     * @param {LayerOpacityChangedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayerOpacityChanged(callback: LayerOpacityChangedDelegate): void;
    /**
     * Unregisters an opacity changed event handler.
     * @param {LayerOpacityChangedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayerOpacityChanged(callback: LayerOpacityChangedDelegate): void;
    /**
     * Registers an individual layer loaded event handler.
     * @param {IndividualLayerLoadedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onIndividualLayerLoaded(callback: IndividualLayerLoadedDelegate): void;
    /**
     * Unregisters an individual layer loaded event handler.
     * @param {IndividualLayerLoadedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offIndividualLayerLoaded(callback: IndividualLayerLoadedDelegate): void;
}
/**
 * Define an event for the delegate
 */
export type LegendQueryingEvent = {
    layerPath: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type LegendQueryingDelegate = EventDelegateBase<AbstractGeoViewLayer, LegendQueryingEvent, void>;
/**
 * Define an event for the delegate
 */
export type LegendQueriedEvent = {
    layerPath: string;
    legend: TypeLegend;
};
/**
 * Define a delegate for the event handler function signature
 */
type LegendQueriedDelegate = EventDelegateBase<AbstractGeoViewLayer, LegendQueriedEvent, void>;
/**
 * Define an event for the delegate
 */
export type VisibleChangedEvent = {
    layerPath: string;
    visible: boolean;
};
/**
 * Define a delegate for the event handler function signature
 */
type VisibleChangedDelegate = EventDelegateBase<AbstractGeoViewLayer, VisibleChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerEntryProcessedEvent = {
    config: ConfigBaseClass;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerEntryProcessedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerEntryProcessedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerRequestingEvent = {
    config: ConfigBaseClass;
    source: Source;
    extraConfig?: unknown;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerRequestingDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerRequestingEvent, BaseLayer | undefined>;
/**
 * Define an event for the delegate
 */
export type LayerCreationEvent = {
    config: ConfigBaseClass;
    layer: BaseLayer;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerCreationDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerCreationEvent, void>;
export interface TypeWmsLegendStyle {
    name: string;
    legend: HTMLCanvasElement | null;
}
/**
 * Define a delegate for the event handler function signature
 */
type LayerFilterAppliedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerFilterAppliedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerFilterAppliedEvent = {
    layerPath: string;
    filter: string;
};
/**
 * Define a delegate for the event handler function signature.
 */
type LayerNameChangedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerNameChangedEvent, void>;
/**
 * Define an event for the delegate.
 */
export type LayerNameChangedEvent = {
    layerName?: TypeLocalizedString;
    layerPath: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerOpacityChangedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerOpacityChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerOpacityChangedEvent = {
    layerPath: string;
    opacity: number;
};
/**
 * Define a delegate for the event handler function signature
 */
type LayerStyleChangedDelegate = EventDelegateBase<AbstractGeoViewLayer, LayerStyleChangedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayerStyleChangedEvent = {
    style: TypeStyleConfig;
    layerPath: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type IndividualLayerLoadedDelegate = EventDelegateBase<AbstractGeoViewLayer, IndividualLayerLoadedEvent, void>;
/**
 * Define an event for the delegate
 */
export type IndividualLayerLoadedEvent = {
    layerPath: string;
};
export interface TypeWmsLegend extends Omit<TypeLegend, 'styleConfig'> {
    legend: HTMLCanvasElement | null;
    styles?: TypeWmsLegendStyle[];
}
export interface TypeImageStaticLegend extends Omit<TypeLegend, 'styleConfig'> {
    legend: HTMLCanvasElement | null;
}
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
/** ******************************************************************************************************************************
 * GeoViewAbstractLayers types
 */
type LayerTypesKey = 'CSV' | 'ESRI_DYNAMIC' | 'ESRI_FEATURE' | 'ESRI_IMAGE' | 'IMAGE_STATIC' | 'GEOJSON' | 'GEOPACKAGE' | 'XYZ_TILES' | 'VECTOR_TILES' | 'OGC_FEATURE' | 'WFS' | 'WMS';
/**
 * Type of GeoView layers
 */
export type TypeGeoviewLayerType = 'CSV' | 'esriDynamic' | 'esriFeature' | 'esriImage' | 'imageStatic' | 'GeoJSON' | 'GeoPackage' | 'xyzTiles' | 'vectorTiles' | 'ogcFeature' | 'ogcWfs' | 'ogcWms';
/**
 * This type is created to only be used when validating the configuration schema types.
 * Indeed, GeoCore is not an official Abstract Geoview Layer, but it can be used in schema types.
 */
export type TypeGeoviewLayerTypeWithGeoCore = TypeGeoviewLayerType | typeof CONST_LAYER_ENTRY_TYPES.GEOCORE;
/**
 * Definition of the GeoView layer constants
 */
export declare const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType>;
/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
export declare const CONST_GEOVIEW_SCHEMA_BY_TYPE: Record<TypeGeoviewLayerType, string>;
/**
 * type guard function that redefines a TypeLegend as a TypeVectorLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const isVectorLegend: (verifyIfLegend: TypeLegend) => verifyIfLegend is TypeVectorLegend;
/**
 * type guard function that redefines a TypeLegend as a TypeWmsLegend
 * if the event attribute of the verifyIfPayload parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const isWmsLegend: (verifyIfLegend: TypeLegend) => verifyIfLegend is TypeWmsLegend;
/**
 * type guard function that redefines a TypeLegend as a TypeImageStaticLegend
 * if the type attribute of the verifyIfLegend parameter is valid. The type ascention
 * applies only to the true block of the if clause.
 *
 * @param {TypeLegend} verifyIfLegend object to test in order to determine if the type ascention is valid
 * @returns {boolean} returns true if the payload is valid
 */
export declare const isImageStaticLegend: (verifyIfLegend: TypeLegend) => verifyIfLegend is TypeImageStaticLegend;
export {};
