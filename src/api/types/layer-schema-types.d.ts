import { codedValueType, Extent, rangeDomainType, TypeEsriFormatParameter, TypeOutfields } from '@/api/types/map-schema-types';
import { AbstractBaseLayerEntryConfig, AbstractBaseLayerEntryConfigProps } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { ConfigBaseClass, ConfigBaseClassProps, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { VectorTilesLayerEntryConfig, VectorTilesLayerEntryConfigProps } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { GeoPackageFeature } from '@/api/config/reader/geopackage-reader';
import { TypeProjection } from '@/geo/utils/projection';
import { TimeDimensionESRI } from '@/core/utils/date-mgt';
import { EsriBaseRenderer } from '@/geo/utils/renderer/esri-renderer';
/** Definition of the keys used to create the constants of the GeoView layer */
type LayerTypesKey = 'CSV' | 'ESRI_DYNAMIC' | 'ESRI_FEATURE' | 'ESRI_IMAGE' | 'IMAGE_STATIC' | 'GEOJSON' | 'XYZ_TILES' | 'VECTOR_TILES' | 'OGC_FEATURE' | 'WFS' | 'WKB' | 'WMS';
/** Definition of the geoview layer types accepted by the viewer. */
export type TypeGeoviewLayerType = 'CSV' | 'esriDynamic' | 'esriFeature' | 'esriImage' | 'GeoJSON' | 'imageStatic' | 'ogcFeature' | 'ogcWfs' | 'ogcWms' | 'vectorTiles' | 'WKB' | 'xyzTiles';
/** Definition of the geoview layer types accepted by the viewer. */
export type TypeInitialGeoviewLayerType = TypeGeoviewLayerType | 'geoCore' | 'GeoPackage' | 'shapefile';
/**
 * Definition of the GeoView layer constants
 */
export declare const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType>;
/** Type used to configure the feature info for a layer. */
export type TypeFeatureInfoLayerConfig = {
    /** Allow querying. */
    queryable: boolean;
    /**
     * The display field of the layer. If it is not present the viewer will make an attempt to find the first valid
     * field.
     */
    nameField?: string;
    /** The list of fields to be displayed by the UI. */
    outfields?: TypeOutfields[];
};
export type TypeLayerEntryConfig = AbstractBaseLayerEntryConfig | GroupLayerEntryConfig;
/** Explicit type to eventually get rid of clearly pointing out the issue with
 * the configs being treated as types and class instances simultaneously in the code base. */
export type ConfigClassOrType = ConfigBaseClass | ConfigBaseClassProps;
/** Explicit type to eventually get rid of clearly pointing out the issue with
 * the configs being treated as types and class instances simultaneously in the code base. */
export type ConfigAbstractBaseClassOrType = AbstractBaseLayerEntryConfig | AbstractBaseLayerEntryConfigProps;
/** Explicit type to eventually get rid of clearly pointing out the issue with
 * the configs being treated as types and class instances simultaneously in the code base. */
export type ConfigVectorTilesClassOrType = VectorTilesLayerEntryConfig | VectorTilesLayerEntryConfigProps;
export interface TypeSourceOgcFeatureInitialConfig extends TypeVectorSourceInitialConfig {
    format: 'featureAPI';
}
export interface TypeSourceWFSVectorInitialConfig extends TypeVectorSourceInitialConfig {
    format: 'WFS';
}
/** Definition of the post settings type needed when the GeoView GeoJSON layers need to use a POST instead of a GET. */
export type TypePostSettings = {
    header?: Record<string, string>;
    data: unknown;
};
/** Type of Style to apply to the GeoView vector layer source at creation time. */
export type TypeLayerEntryType = 'vector' | 'vector-tile' | 'raster-tile' | 'raster-image' | 'group' | 'geoCore' | 'GeoPackage' | 'shapefile';
/** The possible layer statuses when processing layer configs */
export type TypeLayerStatus = 'newInstance' | 'registered' | 'processing' | 'processed' | 'loading' | 'loaded' | 'error';
/** The possible strategies when working with vector layers data */
export type VectorStrategy = 'all' | 'bbox';
export type LayerEntryTypesKey = 'VECTOR' | 'VECTOR_TILE' | 'RASTER_TILE' | 'RASTER_IMAGE' | 'GROUP' | 'GEOCORE' | 'GEOPACKAGE' | 'SHAPEFILE';
/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
export declare const CONST_GEOVIEW_SCHEMA_BY_TYPE: Record<TypeGeoviewLayerType, string>;
export declare const validVectorLayerLegendTypes: TypeGeoviewLayerType[];
export declare const CONST_LAYER_ENTRY_TYPES: Record<LayerEntryTypesKey, TypeLayerEntryType>;
/** Type used to define valid source projection codes. */
export type TypeValidSourceProjectionCodes = 3978 | 3857 | 4326;
/** Base type from which we derive the source properties for all the leaf nodes in the layer tree. */
export type TypeBaseSourceInitialConfig = {
    /**
     * The service endpoint of the layer. Added during creation of specific layer entry config.
     */
    dataAccessPath?: string;
    /**
     * Spatial Reference EPSG code supported (https://epsg.io/). We support lon/lat, Web Mercator and Lambert Conical Conform Canada.
     * Default = 3978.
     */
    projection?: TypeValidSourceProjectionCodes;
    /** The crossOrigin attribute if needed to load the data. */
    crossOrigin?: string;
    /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
    featureInfo?: TypeFeatureInfoLayerConfig;
};
/** Initial settings for tile image sources. */
export interface TypeSourceTileInitialConfig extends TypeBaseSourceInitialConfig {
    /** Tile grid parameters to use. */
    tileGrid?: TypeTileGrid;
}
/** Initial settings for WMS image sources. */
export interface TypeSourceWmsInitialConfig extends TypeBaseSourceInitialConfig {
    /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
    featureInfo?: TypeFeatureInfoLayerConfig;
    /** The type of the remote WMS server. The default value is mapserver. */
    serverType?: TypeOfServer;
    /** Style to apply. Default = '' */
    wmsStyle?: string[];
}
/** Type of server. */
export type TypeOfServer = 'mapserver' | 'geoserver' | 'qgis';
/** Base type from which we derive the source properties for all the vector leaf nodes in the layer tree. */
export interface TypeBaseVectorSourceInitialConfig extends TypeBaseSourceInitialConfig {
    /** Path used to access the data. */
    dataAccessPath?: string;
    /** Maximum number of records to fetch (default: 0). */
    maxRecordCount?: number;
    /** Filter to apply on features of this layer. */
    layerFilter?: string;
    /** The feature format used by the XHR feature loader when url is set. */
    format?: TypeVectorSourceFormats;
    /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
    featureInfo?: TypeFeatureInfoLayerConfig;
    /** Loading strategy to use (all or bbox). */
    strategy?: VectorStrategy;
    /** The projection code of the source. Default value is EPSG:4326. */
    dataProjection?: string;
    /** Settings to use when loading a GeoJSON layer using a POST instead of a GET */
    postSettings?: TypePostSettings;
}
/** Type from which we derive the source properties for all the Wfs leaf nodes in the layer tree. */
export type TypeSourceWfsInitialConfig = TypeBaseVectorSourceInitialConfig;
/** Initial settings to apply to the GeoView vector layer source at creation time. */
export interface TypeVectorSourceInitialConfig extends TypeBaseVectorSourceInitialConfig {
    /** The character used to separate columns of csv file. */
    separator?: string;
    /** The feature format used by the XHR feature loader when url is set. */
    format?: TypeVectorSourceFormats;
}
export interface TypeSourceGeoJSONInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
    format: 'GeoJSON';
    geojson?: string;
}
export interface TypeSourceWkbVectorInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
    format: 'WKB';
    geoPackageFeatures?: GeoPackageFeature[];
}
/** Initial settings to apply to the GeoView vector tile layer source at creation time. */
export interface TypeVectorTileSourceInitialConfig extends TypeBaseVectorSourceInitialConfig {
    /** Tile grid parameters to use. */
    tileGrid?: TypeTileGrid;
}
/** Definition of the tile grid structure. */
export type TypeTileGrid = {
    /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates. */
    extent?: Extent;
    /**
     * The tile grid origin, i.e. where the x and y axes meet ([z, 0, 0]). Tile coordinates increase left to right and downwards.
     * If not specified, extent must be provided.
     */
    origin: [number, number];
    /**
     * Resolutions. The array index of each resolution needs to match the zoom level. This means that even if a minZoom is
     * configured, the resolutions array will have a length of maxZoom + 1.
     */
    resolutions: number[];
    /**
     * The tile grid origin, i.e. where the x and y axes meet ([z, 0, 0]). Tile coordinates increase left to right and downwards.
     * If not specified, extent must be provided. Default = [256, 256].
     */
    tileSize?: [number, number];
};
/** Type that defines the vector layer source formats. */
export type TypeVectorSourceFormats = 'GeoJSON' | 'EsriJSON' | 'KML' | 'WFS' | 'featureAPI' | 'CSV' | 'MVT' | 'WKB';
/** Type from which we derive the source properties for all the ESRI dynamic leaf nodes in the layer tree. */
export interface TypeSourceEsriDynamicInitialConfig extends TypeBaseSourceInitialConfig {
    /** Maximum number of records to fetch (default: 0). */
    maxRecordCount?: number;
    /** Filter to apply on features of this layer. */
    layerFilter?: string;
    /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
    featureInfo?: TypeFeatureInfoLayerConfig;
    /** The format used by the image layer. */
    format?: TypeEsriFormatParameter;
    /**
     * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png
     * and .gif formats support transparency.
     */
    transparent?: boolean;
    /**
     * If true, the layer will call the service using its native SRID so that OpenLayers take charge of the reprojection on the map.
     */
    forceServiceProjection?: boolean;
}
/** Type from which we derive the source properties for all the ESRI Image leaf nodes in the layer tree. */
export interface TypeSourceEsriImageInitialConfig extends TypeBaseSourceInitialConfig {
    /** The format used by the image layer. */
    format: TypeEsriFormatParameter;
    /**
     * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png
     * and .gif formats support transparency.
     */
    transparent?: boolean;
}
/** Initial settings to apply to the GeoView layer at creation time. */
export type TypeLayerInitialSettings = {
    /** Settings for availablity of controls */
    controls?: TypeLayerControls;
    /** The geographic bounding box that contains all the layer's features. */
    bounds?: Extent;
    /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates. */
    extent?: Extent;
    /** The minimum view zoom level (exclusive) above which this layer will be visible. */
    minZoom?: number;
    /** The maximum view zoom level (inclusive) below which this layer will be visible. */
    maxZoom?: number;
    /** A CSS class name to set to the layer element. */
    className?: string;
    /** Settings for availablity of controls. */
    states?: TypeLayerStates;
};
/** Control settings to use in UI. */
export type TypeLayerControls = {
    /** Is highlight control available for layer. Default = true */
    highlight?: boolean;
    /** Is hover control available for layer. Default = true */
    hover?: boolean;
    /** Is opacity control available for layer. Default = true */
    opacity?: boolean;
    /** Is query control available for layer. Default = true */
    query?: boolean;
    /** Is remove control available for layer. Default = false */
    remove?: boolean;
    /** Is table available for layer. Default = true */
    table?: boolean;
    /** Is visibility control available for layer. Default = true */
    visibility?: boolean;
    /** Is zoom available for layer. Default = true */
    zoom?: boolean;
};
/** Initial settings for layer states. */
export type TypeLayerStates = {
    /** Is the layer initially visible. Default = true */
    visible?: boolean;
    /** Is the layer's legend initially collapsed. Default = false */
    legendCollapsed?: boolean;
    /** Initial opacity setting. Default = 1 */
    opacity?: number;
    /** Is layer hoverable initially. Domain = [0..1] and default = 1. */
    hoverable?: boolean;
    /** Is layer queryable initially. Default = false */
    queryable?: boolean;
};
export type TypeGeoviewLayerConfig = {
    /** The GeoView layer identifier. */
    geoviewLayerId: string;
    /**
     * The display name of the layer (English/French). If it is not present the viewer will make an attempt to scrape this
     * information.
     */
    geoviewLayerName?: string;
    /** The GeoView layer access path (English/French). */
    metadataAccessPath?: string;
    /** Type of GeoView layer. */
    geoviewLayerType: TypeGeoviewLayerType;
    /** Date format used by the service endpoint. */
    serviceDateFormat?: string;
    /** Date format used by the getFeatureInfo to output date variable. */
    externalDateFormat?: string;
    /** Flag to include layer in time able function like time slider */
    isTimeAware?: boolean;
    /**
     * Initial settings to apply to the GeoView layer at creation time.
     * This attribute is allowed only if listOfLayerEntryConfig.length > 1.
     */
    initialSettings?: TypeLayerInitialSettings;
    /** Min and max scales */
    minScale?: number;
    maxScale?: number;
    /** The layer entries to use from the GeoView layer. */
    listOfLayerEntryConfig: TypeLayerEntryConfig[];
};
export type GeoCoreLayerConfig = {
    /** Type of GeoView layer. */
    geoviewLayerType: typeof CONST_LAYER_ENTRY_TYPES.GEOCORE;
    /** The GeoCore UUID. */
    geoviewLayerId: string;
    /**
     * The display name of the layer (English/French). This overrides the default name coming from the GeoCore API.
     */
    geoviewLayerName: string | undefined;
    /** Initial settings to apply to the GeoCore layer at creation time. */
    initialSettings?: TypeLayerInitialSettings;
    /** The layer entries to use from the GeoCore layer. */
    listOfLayerEntryConfig?: TypeLayerEntryConfig[];
};
export type GeoPackageLayerConfig = {
    /** Type of GeoView layer. */
    geoviewLayerType: typeof CONST_LAYER_ENTRY_TYPES.GEOPACKAGE;
    /** The GeoView layer identifier. */
    geoviewLayerId: string;
    /** The path to the GeoPackage */
    metadataAccessPath: string;
    /** The display name of the layer. This overrides the default name coming from the GeoCore API. */
    geoviewLayerName?: string | undefined;
    /** Initial settings to apply to the layer at creation time. */
    initialSettings?: TypeLayerInitialSettings;
    /** The layer entries to use from the GeoPackage. */
    listOfLayerEntryConfig?: TypeLayerEntryConfig[];
};
export type ShapefileLayerConfig = {
    /** Type of GeoView layer. */
    geoviewLayerType: typeof CONST_LAYER_ENTRY_TYPES.SHAPEFILE;
    /** The GeoView layer identifier. */
    geoviewLayerId: string;
    /** The path to the shapefile */
    metadataAccessPath: string;
    /** The display name of the layer. This overrides the default name coming from the GeoCore API. */
    geoviewLayerName?: string | undefined;
    /** Initial settings to apply to the layer at creation time. */
    initialSettings?: TypeLayerInitialSettings;
    /** The layer entries to use from the shapefile. */
    listOfLayerEntryConfig?: TypeLayerEntryConfig[];
};
/**
 * Type guard that checks if a given map layer configuration entry is of type GeoCore.
 * @param {MapConfigLayerEntry} layerConfigEntryOption - The layer entry config to check
 * @returns {layerConfigEntryOption is GeoCoreLayerConfig} True if the layer is a GeoCore layer, narrowing the type to GeoCoreLayerConfig.
 */
export declare const mapConfigLayerEntryIsGeoCore: (layerConfigEntryOption: MapConfigLayerEntry) => layerConfigEntryOption is GeoCoreLayerConfig;
/**
 * Type guard that checks if a given map layer configuration entry is of type GeoPackage.
 * @param {MapConfigLayerEntry} layerConfigEntryOption - The layer entry config to check
 * @returns {boolean} True if the layer is a GeoPackage layer, narrowing the type to GeoPackageLayerConfig.
 */
export declare const mapConfigLayerEntryIsGeoPackage: (layerConfigEntryOption: MapConfigLayerEntry) => boolean;
/**
 * Type guard that checks if a given map layer configuration entry is of type Shapefile.
 * @param {MapConfigLayerEntry} layerConfigEntryOption - The layer entry config to check
 * @returns {layerConfigEntryOption is ShapefileLayerConfig} True if the layer is a Shapefile layer, narrowing the type to ShapefileLayerConfig.
 */
export declare const mapConfigLayerEntryIsShapefile: (layerConfigEntryOption: MapConfigLayerEntry) => layerConfigEntryOption is ShapefileLayerConfig;
export type MapConfigLayerEntry = TypeGeoviewLayerConfig | GeoCoreLayerConfig | GeoPackageLayerConfig | ShapefileLayerConfig;
/**
 * Temporary? function to serialize a geoview layer configuration to be able to send it to the store
 * @param {MapConfigLayerEntry} geoviewLayerConfig - The geoviewlayer config to serialize
 * @returns {MapConfigLayerEntry} The serialized config as pure JSON
 */
export declare const serializeTypeGeoviewLayerConfig: (geoviewLayerConfig: MapConfigLayerEntry) => TypeGeoviewLayerConfig;
export type TypeSourceImageInitialConfig = TypeSourceImageWmsInitialConfig | TypeSourceImageEsriInitialConfig | TypeSourceImageStaticInitialConfig;
export interface TypeSourceImageStaticInitialConfig extends Omit<TypeBaseSourceInitialConfig, 'featureInfo'> {
    /** Definition of the feature information structure that will be used by the getFeatureInfo method. We only use queryable and
     * it must be set to false if specified.
     */
    featureInfo?: {
        queryable: false;
    };
    /** Image extent */
    extent: Extent;
}
export interface TypeSourceImageWmsInitialConfig extends TypeBaseSourceInitialConfig {
    /** The type of the remote WMS server. The default value is mapserver. */
    serverType?: TypeOfServer;
    /** Style to apply. Default = '' */
    wmsStyle?: string | string[];
}
export interface TypeSourceImageEsriInitialConfig extends TypeBaseSourceInitialConfig {
    /** The format used by the image layer. */
    format?: TypeEsriFormatParameter;
    /**
     * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png and
     * .gif formats support transparency. Default = true.
     */
    transparent?: boolean;
}
export interface TypeMetadataWMS {
    Capability: TypeMetadataWMSCapability;
    Service: TypeMetadataWMSService;
    version: string;
}
export interface TypeMetadataWMSCapability {
    Request: TypeMetadataWMSCapabilityRequest;
    Layer: TypeMetadataWMSCapabilityLayer;
}
export interface TypeMetadataWMSService {
    Abstract: string;
    Name: string;
    Title: string;
    KeywordList: string[];
}
export interface TypeMetadataWMSCapabilityRequest {
    GetMap: TypeMetadataWMSCapabilityRequestGetMap;
    GetCapabilities: unknown;
    GetFeatureInfo: TypeMetadataWMSCapabilityRequestFeatureInfo;
}
export interface TypeMetadataWMSCapabilityRequestGetMap {
    DCPType: TypeMetadataWMSCapabilityRequestGetMapDCPType[];
}
export interface TypeMetadataWMSCapabilityRequestGetMapDCPType {
    HTTP: TypeMetadataWMSCapabilityRequestGetMapDCPTypeHTTP;
}
export interface TypeMetadataWMSCapabilityRequestGetMapDCPTypeHTTP {
    Get: TypeMetadataWMSCapabilityRequestGetMapDCPTypeHTTPGet;
}
export interface TypeMetadataWMSCapabilityRequestGetMapDCPTypeHTTPGet {
    OnlineResource: string;
}
export interface TypeMetadataWMSCapabilityRequestFeatureInfo {
    Format: string[];
}
export interface TypeMetadataWMSCapabilityLayer {
    Name?: string;
    Title: string;
    Abstract: string;
    BoundingBox: TypeMetadataWMSCapabilityLayerBBox[];
    Layer: TypeMetadataWMSCapabilityLayer[];
    Attribution: TypeMetadataWMSCapabilityLayerAttribution;
    MinScaleDenominator: number;
    MaxScaleDenominator: number;
    Style: TypeMetadataWMSCapabilityLayerStyle[];
    CRS: TypeMetadataWMSCapabilityLayerCRS[];
    Dimension: TypeMetadataWMSCapabilityLayerDimension[];
    EX_GeographicBoundingBox: Extent;
    queryable: boolean;
    cascaded: unknown;
    opaque: unknown;
    fixedWidth: unknown;
    fixedHeight: unknown;
    noSubsets: unknown;
}
export interface TypeMetadataWMSCapabilityLayerCRS {
    Name: string;
}
export interface TypeMetadataWMSCapabilityLayerBBox {
    crs: string;
    extent: number[];
}
export interface TypeMetadataWMSCapabilityLayerStyle {
    Name: string;
}
export interface TypeMetadataWMSCapabilityLayerAttribution {
    Title: string;
}
export interface TypeMetadataWMSCapabilityLayerDimension {
    name: string;
}
export interface TypeLayerMetadataWMS {
    Style: TypeLayerMetadataWMSStyle[];
    fields?: TypeLayerMetadataFields[];
}
export interface TypeLayerMetadataWMSStyle {
    Name: string;
    LegendURL: TypeLayerMetadataWMSStyleLegendUrl[];
}
export interface TypeLayerMetadataWMSStyleLegendUrl {
    Format: string;
    OnlineResource: string;
}
export interface TypeMetadataFeatureInfo {
    Layer: TypeMetadataFeatureInfoLayer;
}
export interface TypeMetadataFeatureInfoLayer {
    Attribute: TypeMetadataFeatureInfoLayerAttributes;
    '@attributes': TypeMetadataFeatureInfoLayerAttribute;
}
export interface TypeMetadataFeatureInfoLayerAttributes {
    '@attributes': TypeMetadataFeatureInfoLayerAttribute;
}
export interface TypeMetadataFeatureInfoLayerAttribute {
    name: string;
    value: unknown;
}
export interface TypeMetadataEsriFeature {
    layers: TypeMetadataEsriDynamicLayer[];
    id: string;
    name: string;
}
/**
 * Represents layer metadata as read from an Esri layer service.
 */
export interface TypeLayerMetadataEsri {
    type: string;
    capabilities: string;
    geometryField: TypeLayerMetadataEsriField;
    displayField: string;
    defaultVisibility: boolean;
    minScale: number;
    maxScale: number;
    maxRecordCount: number;
    spatialReference: TypeProjection;
    sourceSpatialReference: TypeProjection;
    extent: TypeLayerMetadataEsriExtent;
    drawingInfo: TypeLayerMetadataEsriDrawingInfo;
    timeInfo: TimeDimensionESRI;
    geometryType: unknown;
    fields: TypeLayerMetadataFields[];
}
export interface TypeLayerMetadataEsriDrawingInfo {
    renderer: EsriBaseRenderer;
}
export interface TypeLayerMetadataEsriExtent {
    spatialReference: TypeProjection;
    xmin: number;
    xmax: number;
    ymin: number;
    ymax: number;
}
export interface TypeLayerMetadataEsriField {
    name: unknown;
}
export interface TypeMetadataEsriDynamic {
    layers: TypeMetadataEsriDynamicLayer[];
    supportsDynamicLayers: boolean;
    fields?: TypeLayerMetadataFields[];
}
export interface TypeMetadataEsriDynamicLayer {
    id: number;
    name: string;
    type: string;
    subLayerIds: number[];
}
export interface TypeLayerMetadataVector {
    maxRecordCount: number;
    fields?: TypeLayerMetadataFields[];
}
export interface TypeLayerMetadataFields {
    name: string;
    type: string;
    alias: string;
    domain: codedValueType | rangeDomainType;
}
export interface TypeMetadataOGCFeature {
    collections: TypeMetadataOGCFeatureCollection[];
}
export interface TypeMetadataOGCFeatureCollection {
    id: string;
    description: string;
    extent: TypeMetadataOGCFeatureCollectionExtent;
}
export interface TypeMetadataOGCFeatureCollectionExtent {
    spatial: TypeMetadataOGCFeatureCollectionExtentSpatial;
}
export interface TypeMetadataOGCFeatureCollectionExtentSpatial {
    crs: string;
    bbox: number[][];
}
export interface TypeLayerMetadataQueryables {
    properties: TypeLayerMetadataOGC;
}
export interface TypeLayerMetadataOGC {
    [key: string]: TypeLayerMetadataOGCRecord;
}
export interface TypeLayerMetadataOGCRecord {
    type: string;
}
export interface WFSJsonResponse {
    featureTypes: WFSJsonResponseFeatureType[];
}
export interface WFSJsonResponseFeatureType {
    properties: WFSJsonResponseFeatureTypeFields[];
}
export interface WFSJsonResponseFeatureTypeFields {
    type: string;
    name: string;
}
export interface TypeMetadataWFS {
    FeatureTypeList: TypeMetadataWFSFeatureTypeList;
    '@attributes': TypeMetadataWFSAttributes;
    'ows:OperationsMetadata': TypeMetadataWFSOperationMetadata;
}
export interface TypeMetadataWFSFeatureTypeList {
    FeatureType: TypeMetadataWFSFeatureTypeListFeatureType | TypeMetadataWFSFeatureTypeListFeatureType[];
}
export interface TypeMetadataWFSFeatureTypeListFeatureType {
    Name: string | TypeMetadataWFSFeatureTypeListFeatureTypeText;
    Title: string | TypeMetadataWFSFeatureTypeListFeatureTypeText;
    'ows:WGS84BoundingBox': TypeMetadataWFSFeatureTypeListFeatureTypeBBox;
}
export interface TypeMetadataWFSFeatureTypeListFeatureTypeBBox {
    'ows:LowerCorner': TypeMetadataWFSFeatureTypeListFeatureTypeBBoxCorner;
    'ows:UpperCorner': TypeMetadataWFSFeatureTypeListFeatureTypeBBoxCorner;
}
export interface TypeMetadataWFSFeatureTypeListFeatureTypeBBoxCorner {
    '#text': string;
}
export interface TypeMetadataWFSFeatureTypeListFeatureTypeText {
    '#text': string;
}
export interface TypeMetadataWFSAttributes {
    version?: string;
}
export interface TypeMetadataWFSOperationMetadata {
    'ows:Operation': TypeMetadataWFSOperationMetadataOperation[];
}
export interface TypeMetadataWFSOperationMetadataOperation {
    'ows:Parameter': TypeMetadataWFSOperationMetadataOperationParameter | TypeMetadataWFSOperationMetadataOperationParameter[];
}
export interface TypeMetadataWFSOperationMetadataOperationParameter {
    'ows:Value': TypeMetadataWFSOperationMetadataOperationParameterValue;
}
export interface TypeMetadataWFSOperationMetadataOperationParameterValue {
    '#text': string;
}
export interface TypeLayerMetadataWfs {
    name: string;
    type: string;
}
export interface TypeMetadataGeoJSON {
    listOfLayerEntryConfig: TypeLayerEntryShell[];
}
export interface TypeMetadataVectorTiles {
    defaultStyles: string;
    tileInfo: TypeMetadataVectorTilesTileInfo;
    fullExtent: TypeMetadataVectorTilesFullExtent;
    minScale?: number;
    maxScale?: number;
    minZoom?: number;
    maxZoom?: number;
}
export interface TypeMetadataVectorTilesTileInfo {
    spatialReference: TypeProjection;
    origin: TypeMetadataVectorTilesTileInfoOrigin;
    lods: TypeLod[];
    rows: number;
    cols: number;
}
export interface TypeLod {
    resolution: number;
    scale: number;
    level: number;
}
export interface TypeMetadataVectorTilesTileInfoOrigin {
    x: number;
    y: number;
}
export interface TypeMetadataVectorTilesFullExtent {
    spatialReference: TypeProjection;
    xmin: number;
    ymin: number;
    xmax: number;
    ymax: number;
}
export {};
//# sourceMappingURL=layer-schema-types.d.ts.map