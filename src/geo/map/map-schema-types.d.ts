import { Extent } from 'ol/extent';
import BaseLayer from 'ol/layer/Base';
import Feature from 'ol/Feature';
import RenderFeature from 'ol/render/Feature';
import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { TypeBasemapOptions, TypeViewSettings, TypeInteraction, TypeHighlightColors, TypeOverlayObjects, TypeValidMapProjectionCodes, TypeDisplayTheme, TypeLayerStates, TypeLayerControls, TypePostSettings, TypeServiceUrls, TypeNavBarProps, TypeAppBarProps, TypeFooterBarProps, TypeOverviewMapProps, TypeMapComponents, TypeMapCorePackages, TypeExternalPackages, TypeGlobalSettings, TypeOutfields, TypeOutfieldsType } from '@config/types/map-schema-types';
import { CONST_LAYER_TYPES, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { ImageStaticLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/core/utils/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import { VectorLayerEntryConfig } from '@/core/utils/config/validation-classes/vector-layer-entry-config';
import { TileLayerEntryConfig } from '@/core/utils/config/validation-classes/tile-layer-entry-config';
import { GroupLayerEntryConfig } from '@/core/utils/config/validation-classes/group-layer-entry-config';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeJsonValue } from '@/core/types/global-types';
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
    /** Settings for availablity of controls */
    states?: TypeLayerStates;
};
export type TypeVectorSourceFormats = typeof CONST_LAYER_TYPES.GEOJSON | 'EsriJSON' | 'KML' | 'WFS' | 'featureAPI' | typeof CONST_LAYER_TYPES.GEOPACKAGE | typeof CONST_LAYER_TYPES.CSV;
export type TypeFeatureInfoLayerConfig = {
    /** Allow querying. Default = false. */
    queryable: boolean;
    /**
     * The display field of the layer. If it is not present the viewer will make an attempt to find the first valid field.
     */
    nameField?: string;
    /** Array of the outfield objects. */
    outfields?: TypeOutfields[];
};
export type TypeBaseSourceVectorInitialConfig = {
    /** Path used to access the data. */
    dataAccessPath?: string;
    /** Settings to use when loading a GeoJSON layer using a POST instead of a GET */
    postSettings?: TypePostSettings;
    /** The feature format used by the XHR feature loader when url is set. */
    format?: TypeVectorSourceFormats | 'MVT';
    /** The projection code of the source. Default value is EPSG:4326. */
    dataProjection?: string;
    /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
    featureInfo?: TypeFeatureInfoLayerConfig;
    /** Loading strategy to use (all or bbox). */
    strategy?: 'all' | 'bbox';
};
export interface TypeVectorSourceInitialConfig extends TypeBaseSourceVectorInitialConfig {
    /** The feature format used by the XHR feature loader when url is set. */
    format?: TypeVectorSourceFormats;
    /** The character used to separate columns of csv file */
    separator?: string;
}
export type TypeBaseVectorConfig = {
    /** Type of vector config */
    type: 'lineString' | 'filledPolygon' | 'simpleSymbol' | 'iconSymbol';
};
export type LayerEntryTypesKey = 'VECTOR' | 'VECTOR_TILE' | 'RASTER_TILE' | 'RASTER_IMAGE' | 'GROUP' | 'GEOCORE';
/** ******************************************************************************************************************************
 * Type of Style to apply to the GeoView vector layer source at creation time.
 */
export type TypeLayerEntryType = 'vector' | 'vector-tile' | 'raster-tile' | 'raster-image' | 'group' | 'geoCore';
export declare const CONST_LAYER_ENTRY_TYPES: Record<LayerEntryTypesKey, TypeLayerEntryType>;
/**
 * Definition of the GeoView layer entry types for each type of Geoview layer
 */
export declare const convertLayerTypeToEntry: (layerType: TypeGeoviewLayerType) => TypeLayerEntryType;
export declare const layerEntryIsGroupLayer: (verifyIfLayer: TypeLayerEntryConfig | ConfigBaseClass) => verifyIfLayer is GroupLayerEntryConfig;
export declare const layerEntryIsVector: (verifyIfLayer: TypeLayerEntryConfig) => verifyIfLayer is VectorLayerEntryConfig;
export declare const layerEntryIsVectorTile: (verifyIfLayer: TypeLayerEntryConfig) => verifyIfLayer is TileLayerEntryConfig;
export declare const layerEntryIsRasterTile: (verifyIfLayer: TypeLayerEntryConfig) => verifyIfLayer is TileLayerEntryConfig;
export declare const layerEntryIsOgcWms: (verifyIfLayer: TypeLayerEntryConfig) => verifyIfLayer is OgcWmsLayerEntryConfig;
export declare const layerEntryIsEsriDynamic: (verifyIfLayer: TypeLayerEntryConfig) => verifyIfLayer is EsriDynamicLayerEntryConfig;
export declare const layerEntryIsEsriimage: (verifyIfLayer: TypeLayerEntryConfig) => verifyIfLayer is EsriImageLayerEntryConfig;
export declare const layerEntryIsImageStatic: (verifyIfLayer: TypeLayerEntryConfig) => verifyIfLayer is ImageStaticLayerEntryConfig;
export type TypeLayerStatus = 'registered' | 'newInstance' | 'processing' | 'processed' | 'loading' | 'loaded' | 'error';
export type TypeResultSetEntry = {
    layerPath: string;
    layerName: string;
    layerStatus: TypeLayerStatus;
};
export type TypeResultSet<T extends TypeResultSetEntry = TypeResultSetEntry> = {
    [layerPath: string]: T;
};
export type TypeLayerData = {
    eventListenerEnabled: boolean;
    queryStatus: TypeQueryStatus;
    features: TypeFeatureInfoEntry[] | undefined | null;
};
export type QueryType = 'at_pixel' | 'at_coordinate' | 'at_long_lat' | 'using_a_bounding_box' | 'using_a_polygon' | 'all';
export type TypeLocation = null | Pixel | Coordinate | Coordinate[] | string;
export type TypeQueryStatus = 'init' | 'processing' | 'processed' | 'error';
export type TypeFeatureInfoEntry = {
    featureKey: number;
    geoviewLayerType: TypeGeoviewLayerType;
    extent: Extent | undefined;
    geometry: TypeGeometry | Feature | null;
    featureIcon: string;
    fieldInfo: Partial<Record<string, TypeFieldEntry>>;
    nameField: string | null;
};
export interface TypeGeometry extends RenderFeature {
    ol_uid: string;
}
export type codeValueEntryType = {
    name: string;
    code: unknown;
};
export type codedValueType = {
    type: 'codedValue';
    name: string;
    description: string;
    codedValues: codeValueEntryType[];
};
export type rangeDomainType = {
    type: 'range';
    name: string;
    range: [minValue: unknown, maxValue: unknown];
};
export type TypeFieldEntry = {
    fieldKey: number;
    value: unknown;
    dataType: TypeOutfieldsType;
    alias: string;
    domain: null | codedValueType | rangeDomainType;
};
/**
 * Partial definition of a TypeFeatureInfoEntry for simpler use case queries.
 * Purposely linking this simpler type to the main TypeFeatureInfoEntry type here, in case, for future we want
 * to add more information on one or the other and keep things loosely linked together.
 */
export type TypeFeatureInfoEntryPartial = Pick<TypeFeatureInfoEntry, 'fieldInfo' | 'geometry'>;
/** The simplified layer statuses */
export type TypeLayerStatusSimplified = 'loading' | 'loaded' | 'error';
export type TypeEsriFormatParameter = 'png' | 'jpg' | 'gif' | 'svg';
export type TypeOfServer = 'mapserver' | 'geoserver' | 'qgis';
export type TypeSourceImageInitialConfig = TypeSourceImageWmsInitialConfig | TypeSourceImageEsriInitialConfig | TypeSourceImageStaticInitialConfig;
export type TypeBaseSourceImageInitialConfig = {
    /**
     * The service endpoint of the layer. Added during creation of specific layer entry config.
     */
    dataAccessPath?: string;
    /**
     * The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if you want to access pixel data
     * with the Canvas renderer.
     * */
    crossOrigin?: string;
    /** Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada. */
    projection?: TypeValidMapProjectionCodes;
    /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
    featureInfo?: TypeFeatureInfoLayerConfig;
};
export interface TypeSourceImageWmsInitialConfig extends TypeBaseSourceImageInitialConfig {
    /** The type of the remote WMS server. The default value is mapserver. */
    serverType?: TypeOfServer;
    /** Style to apply. Default = '' */
    wmsStyle?: string | string[];
}
export interface TypeSourceImageStaticInitialConfig extends Omit<TypeBaseSourceImageInitialConfig, 'featureInfo'> {
    /** Definition of the feature information structure that will be used by the getFeatureInfo method. We only use queryable and
     * it must be set to false if specified.
     */
    featureInfo?: {
        queryable: false;
    };
    /** Image extent */
    extent: Extent;
}
export interface TypeSourceImageEsriInitialConfig extends TypeBaseSourceImageInitialConfig {
    /** The format used by the image layer. */
    format?: TypeEsriFormatParameter;
    /**
     * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png and
     * .gif formats support transparency. Default = true.
     */
    transparent?: boolean;
}
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
export interface TypeSourceTileInitialConfig extends Omit<TypeBaseSourceImageInitialConfig, 'featureInfo'> {
    /** Definition of the feature information structure that will be used by the getFeatureInfo method. We only use queryable and
     * it must be set to false if specified.
     */
    featureInfo?: {
        queryable: false;
    };
    /** Tile grid parameters to use. */
    tileGrid?: TypeTileGrid;
}
export interface TypeVectorTileSourceInitialConfig extends TypeBaseSourceVectorInitialConfig {
    /** Tile grid parameters to use. */
    tileGrid?: TypeTileGrid;
}
export type TypeLayerEntryConfig = AbstractBaseLayerEntryConfig | GroupLayerEntryConfig;
/** ******************************************************************************************************************************
 *  Definition of a single Geoview layer configuration.
 */
export type TypeGeoviewLayerConfig = {
    /** This attribute is not part of the schema. It is used to link the displayed layer to its layer entry config. */
    olLayer?: Promise<BaseLayer>;
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
    /** Flag to exclude layer from time anble function like time slider */
    isTimeAware?: boolean;
    /**
     * Initial settings to apply to the GeoView layer at creation time.
     * This attribute is allowed only if listOfLayerEntryConfig.length > 1.
     */
    initialSettings?: TypeLayerInitialSettings;
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
/**
 * This type indicates the Layer entry possibilities. They can be either a regular GeoviewLayerConfig or a GeoCoreLayerConfig.
 * A {GeoCoreLayerConfig} isn't an official {TypeGeoviewLayerConfig}, but in the configuration they are treated as such.
 * This type, which presents the 2 options as 2 different types, helps to represent this and remain type safe.
 */
export type MapConfigLayerEntry = TypeGeoviewLayerConfig | GeoCoreLayerConfig;
/**
 * Returns true if the layer entry from the map configuration represents a GeoCore layer type.
 * @param {MapConfigLayerEntry} layerConfigEntryOption The layer entry config to check
 * @returns {boolean} True if the layer type if GeoCore
 */
export declare const mapConfigLayerEntryIsGeoCore: (layerConfigEntryOption: MapConfigLayerEntry) => boolean;
/**
 * Temporary? function to serialize a geoview layer configuration to be able to send it to the store
 * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The geoviewlayer config to serialize
 * @returns TypeJsonValue The serialized config as pure JSON
 */
export declare const serializeTypeGeoviewLayerConfig: (geoviewLayerConfig: MapConfigLayerEntry) => TypeJsonValue;
/** ******************************************************************************************************************************
 *  Definition of the map feature instance according to what is specified in the schema.
 */
export type TypeMapFeaturesInstance = {
    /** map configuration. */
    map: TypeMapConfig;
    /** Service URLs. */
    serviceUrls: TypeServiceUrls;
    /** Display theme, default = geo.ca. */
    theme?: TypeDisplayTheme;
    /** Nav bar properies. */
    navBar?: TypeNavBarProps;
    /** App bar properies. */
    appBar?: TypeAppBarProps;
    /** Footer bar properies. */
    footerBar?: TypeFooterBarProps;
    /** Overview map properies. */
    overviewMap?: TypeOverviewMapProps;
    /** Map components. */
    components?: TypeMapComponents;
    /** List of core packages. */
    corePackages?: TypeMapCorePackages;
    /** List of external packages. */
    externalPackages?: TypeExternalPackages;
    /**
     * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
     * this version of the viewer.
     */
    schemaVersionUsed?: '1.0';
    /** Global settings. */
    globalSettings?: TypeGlobalSettings;
};
/** ******************************************************************************************************************************
 *  Definition of the map configuration settings.
 */
export type TypeMapConfig = {
    basemapOptions: TypeBasemapOptions;
    /** Type of interaction. */
    interaction: TypeInteraction;
    /** List of GeoView Layers in the order which they should be added to the map. */
    listOfGeoviewLayerConfig?: MapConfigLayerEntry[];
    /** View settings. */
    viewSettings: TypeViewSettings;
    /** Highlight color. */
    highlightColor?: TypeHighlightColors;
    /** Highlight color. */
    overlayObjects?: TypeOverlayObjects;
    /** Additional options used for OpenLayers map options. */
    extraOptions?: Record<string, unknown>;
};
export declare const isLineStringVectorConfig: (verifyIfConfig: TypeBaseVectorConfig) => verifyIfConfig is TypeLineStringVectorConfig;
export declare const isFilledPolygonVectorConfig: (verifyIfConfig: TypeBaseVectorConfig) => verifyIfConfig is TypePolygonVectorConfig;
export declare const isSimpleSymbolVectorConfig: (verifyIfConfig: TypeBaseVectorConfig) => verifyIfConfig is TypeSimpleSymbolVectorConfig;
export declare const isIconSymbolVectorConfig: (verifyIfConfig: TypeBaseVectorConfig) => verifyIfConfig is TypeIconSymbolVectorConfig;
/** ******************************************************************************************************************************
 * Base style configuration.
 */
export type TypeBaseStyleType = 'simple' | 'uniqueValue' | 'classBreaks';
/** ******************************************************************************************************************************
 * Valid keys for the TypeStyleConfig object.
 */
export type TypeStyleGeometry = 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';
/** Styles to apply to the GeoView vector layer by geometry types. */
export type TypeLayerStyleConfig = Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>>;
/** Style settings to apply to the GeoView vector layer. */
export type TypeLayerStyleSettings = {
    type: TypeLayerStyleConfigType;
    fields: string[];
    hasDefault: boolean;
    info: TypeLayerStyleConfigInfo[];
};
/** Information needed to render the feature. */
export type TypeLayerStyleConfigInfo = {
    /** Flag used to show/hide features associated to the label (default: true). */
    visible: boolean;
    /** The label to display for the field. */
    label: string;
    /**
     * Simple type has a single value at index 0; uniqueValue type has many entries (up to 3 for ESRI) and classBreaks
     * type has two entries (index 0 for min and index 1 for max).
     */
    values: (string | number)[];
    /** The geometry settings. */
    settings: TypeKindOfVectorSettings;
};
/** Valid keys for the type property of style configurations. */
export type TypeLayerStyleConfigType = 'simple' | 'uniqueValue' | 'classBreaks';
/** Definition of the line symbol vector settings type. */
export type TypeBaseVectorGeometryConfig = {
    /** Type of vector config. */
    type: TypeBaseVectorType;
};
/** Valid values for the type property of the base vector settingd. */
export type TypeBaseVectorType = 'lineString' | 'filledPolygon' | 'simpleSymbol' | 'iconSymbol';
/** Kind of symbol vector settings. */
export type TypeKindOfVectorSettings = TypeBaseVectorGeometryConfig | TypeLineStringVectorConfig | TypePolygonVectorConfig | TypeSimpleSymbolVectorConfig | TypeIconSymbolVectorConfig;
/** Definition of the line symbol vector settings type. */
export interface TypeLineStringVectorConfig extends TypeBaseVectorGeometryConfig {
    /** Type of vector config */
    type: 'lineString';
    /** Line stroke symbology */
    stroke: TypeStrokeSymbolConfig;
}
/** Stroke style for vector features. */
export type TypeStrokeSymbolConfig = {
    /** Color to use for vector features. */
    color?: string;
    /** Line style to use for the feature. */
    lineStyle?: TypeLineStyle;
    /** Width to use for the stroke */
    width?: number;
};
/** Valid values to specify line styles. */
export type TypeLineStyle = 'dash' | 'dash-dot' | 'dash-dot-dot' | 'dot' | 'longDash' | 'longDash-dot' | 'null' | 'shortDash' | 'shortDash-dot' | 'shortDash-dot-dot' | 'solid';
/** Definition of the polygon symbol vector settings type. */
export interface TypePolygonVectorConfig extends TypeBaseVectorGeometryConfig {
    /** Type of vector config */
    type: 'filledPolygon';
    /** Fill color for vector features. */
    color?: string;
    /** Line stroke symbology */
    stroke: TypeStrokeSymbolConfig;
    /** Distance between patern lines. Default = 8. */
    paternSize?: number;
    /** Patern line width.default = 1. */
    paternWidth?: number;
    /** Kind of filling  for vector features. Default = solid.  */
    fillStyle: TypeFillStyle;
}
/** Valid values to specify fill styles. */
export type TypeFillStyle = 'null' | 'solid' | 'backwardDiagonal' | 'cross' | 'diagonalCross' | 'forwardDiagonal' | 'horizontal' | 'vertical';
/** Definition of the circle symbol vector settings type. */
export interface TypeSimpleSymbolVectorConfig extends TypeBaseVectorGeometryConfig {
    /** Type of vector config */
    type: 'simpleSymbol';
    /** Symbol rotation in radians. */
    rotation?: number;
    /** Fill color for vector features. */
    color?: string;
    /** Symbol stroke symbology */
    stroke?: TypeStrokeSymbolConfig;
    /** size of the symbol. */
    size?: number;
    /** Ofset of the symbol. */
    offset?: [number, number];
    /** Symbol to draw. */
    symbol: TypeSymbol;
}
/** Valid values to specify symbol shapes. */
export type TypeSymbol = 'circle' | '+' | 'diamond' | 'square' | 'triangle' | 'X' | 'star';
/** Definition of the icon symbol vector settings type. */
export interface TypeIconSymbolVectorConfig extends TypeBaseVectorGeometryConfig {
    /** Type of vector config */
    type: 'iconSymbol';
    /** Mime type of the icon. */
    mimeType: string;
    /** Icon source. */
    src: string;
    /** Icon width in pixel. */
    width?: number;
    /** Icon height in pixel. */
    height?: number;
    /** Icon rotation in radians. */
    rotation?: number;
    /** Icon opacity. */
    opacity?: number;
    /** Ofset of the icon. */
    offset?: [number, number];
    /**
     * The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if you want to access pixel data
     * with the Canvas renderer.
     */
    crossOrigin?: string;
}
