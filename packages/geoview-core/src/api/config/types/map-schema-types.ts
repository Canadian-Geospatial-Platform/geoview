import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { Coordinate } from 'ol/coordinate';

import { TimeDimension } from '@/core/utils/date-mgt';

// #region UTILITY TYPES

/** An array of numbers representing an extent: `[minx, miny, maxx, maxy]`. */
export type Extent = Array<number>;

/** ISO 639-1 language code prefix. */
export type TypeDisplayLanguage = 'en' | 'fr';

/** Definition of the post settings type needed when the GeoView GeoJSON layers need to use a POST instead of a GET. */
export type TypePostSettings = { header?: Record<string, string>; data: unknown };

// #region MAP FEATURES

/** Definition of the map configuration settings. */
export { MapFeatureConfig } from '@config/types/classes/map-feature-config';

/** Supported geoview themes. */
export type TypeDisplayTheme = 'dark' | 'light' | 'geo.ca';

/** Valid values for the navBar array. */
export type TypeValidNavBarProps = 'zoom' | 'fullscreen' | 'home' | 'location' | 'basemap-select' | 'projection';

/** Controls available on the navigation bar. Default = ['zoom', 'fullscreen', 'home', 'basemap-select]. */
export type TypeNavBarProps = TypeValidNavBarProps[];

/** Supported footer bar tabs */
export type TypeValidFooterBarTabsCoreProps = 'legend' | 'layers' | 'details' | 'data-table' | 'time-slider' | 'geochart' | 'guide';

/** Footer bar tabs custom definition. */
export type TypeFooterBarTabsCustomProps = {
  id: string;
  label: string;
  contentHTML: string;
};

/** Configuration available for the footer bar component. */
export type TypeFooterBarProps = {
  tabs: {
    core: TypeValidFooterBarTabsCoreProps[];
    custom: TypeFooterBarTabsCustomProps[]; // TODO: support custom tab by creating a Typeobject for it
  };
  collapsed: boolean;
  selectedTab: TypeValidFooterBarTabsCoreProps;
  selectedLayersLayerPath: string;
};

/** Supported app bar values. */
export type TypeValidAppBarCoreProps =
  | 'geolocator'
  | 'export'
  | 'aoi-panel'
  | 'custom-legend'
  | 'geochart'
  | 'guide'
  | 'legend'
  | 'details'
  | 'data-table'
  | 'layers';

/** Configuration available on the application bar. Default = ['geolocator']. The about GeoView and notification are always there. */
export type TypeAppBarProps = {
  tabs: {
    core: TypeValidAppBarCoreProps[];
  };
  collapsed: boolean;
  selectedTab: TypeValidAppBarCoreProps;
  selectedLayersLayerPath: string;
};

/** Overview map options. Default none. */
export type TypeOverviewMapProps = { hideOnZoom: number };

/** Supported map component values. */
export type TypeValidMapComponentProps = 'overview-map' | 'north-arrow';

export type TypeMapComponents = TypeValidMapComponentProps[];

/** Supported map component values. */
export type TypeValidMapCorePackageProps = 'swiper';

/**
 * Core packages to initialize on viewer load. The schema for those are on their own package. NOTE: config from packages are in
 * the same loaction as core config (<<core config name>>-<<package name>>.json).
 * Default = [].
 */
export type TypeMapCorePackages = TypeValidMapCorePackageProps[];

/**
 * Core packages config to initialize on viewer load. The schema for those are on their own package.
 * NOTE: config from packages are in the same loaction as core config (<<core config name>>-<<package name>>.json)
 * OR inline with this parameter
 * Default = [].
 */
export type TypeCorePackagesConfig = [];

/** External package objexct definition. */
export type TypeExternalPackagesProps = {
  /** External Package name. The name must be identical to the window external package object to load. */
  name: string;
  /**
   * The url to the external package configuration setting. The core package will read the configuration and pass it inside
   * the package.
   */
  configUrl?: string;
};

/** List of external packages to initialize on viewer load. Default = []. */
export type TypeExternalPackages = TypeExternalPackagesProps[];

/** Service endpoint urls. */
export type TypeServiceUrls = {
  /**
   * Service end point to access API for layers specification (loading and plugins parameters). By default it is GeoCore but can
   * be another endpoint with similar output. Default = CV_CONFIG_GEOCORE_URL ('https://geocore.api.geo.ca'. Used in config-constants).
   */
  geocoreUrl: string;
  /**
   * An optional proxy to be used for dealing with same-origin issues.  URL must either be a relative path on the same server
   * or an absolute path on a server which sets CORS headers.
   */
  proxyUrl?: string;
  /**
   * An optional geolocator service end point url, which will be used to call to get geo location of address.
   * Default = CV_CONFIG_GEOLOCATOR_URL ('https://geolocator.api.geo.ca?keys=geonames,nominatim,locate'. Used in config-constants).
   */
  geolocator?: string;
};

/** Valid schema version number. */
export type TypeValidVersions = '1.0';

/** Service endpoint urls. */
export type TypeGlobalSettings = {
  /**
   * Whether or not sublayers can be removed from layer groups. Default = true.
   */
  canRemoveSublayers?: boolean;
};

/** Definition of the map configuration settings. */
export type TypeMapConfig = {
  /** Basemap options settings for this map configuration. */
  basemapOptions: TypeBasemapOptions;
  /** Type of interaction. */
  interaction: TypeInteraction;
  /** List of GeoView Layers in the order which they should be added to the map. */
  listOfGeoviewLayerConfig: AbstractGeoviewLayerConfig[];
  /** View settings. */
  viewSettings: TypeViewSettings;
  /** Highlight color. */
  highlightColor?: TypeHighlightColors;
  /** Point markers to add to map. */
  overlayObjects?: TypeOverlayObjects;
  /** Additional options used for OpenLayers map options. */
  extraOptions?: Record<string, unknown>;
};

/** Definition of the basemap options type. */
export type TypeBasemapOptions = {
  /** Id of the basemap to use. */
  basemapId: TypeBasemapId;
  /** Enable or disable shaded basemap (if basemap id is set to shaded then this should be false). */
  shaded: boolean;
  /** Enable or disable basemap labels. */
  labeled: boolean;
};

/** Definition of the basemap options type. */
export type TypeBasemapId = 'transport' | 'osm' | 'simple' | 'nogeom' | 'shaded' | 'imagery';

/** Definition of the valid map interactiom values. If map is dynamic (pan/zoom) or static to act as a thumbnail (no nav bar). */
export type TypeInteraction = 'static' | 'dynamic';

/** Definition of the view settings. */
export type TypeViewSettings = {
  /** Settings for the initial view for map, default is zoomAndCenter of [3.5, [-90, 60]] */
  initialView?: TypeMapViewSettings;
  /** Settings for the home nav bar button. */
  homeView?: TypeMapViewSettings;
  /** Enable rotation. If false, a rotation constraint that always sets the rotation to zero is used. Default = true. */
  enableRotation?: boolean;
  /**
   * The initial rotation for the view in degree (positive rotation clockwise, 0 means North). Will be converted to radiant by
   * the viewer. Domain = [0..360], default = 0.
   */
  rotation?: number;
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates.
   * Default [-135, 25, -50, 89].
   */
  maxExtent?: Extent;
  /**
   * The minimum zoom level used to determine the resolution constraint. If not set, will use default from basemap.
   * Domain = [0..20].
   */
  minZoom?: number;
  /**
   * The maximum zoom level used to determine the resolution constraint. If not set, will use default from basemap.
   * Domain = [0..20].
   */
  maxZoom?: number;
  /**
   * Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada.
   * Default = 3978.
   */
  projection: TypeValidMapProjectionCodes;
};

/** Definition of the zoomAndCenter properties */
export type TypeZoomAndCenter = [number, [number, number]];

/** Definition of the initial view settings. */
export type TypeMapViewSettings = {
  /**
   * Option to set the zoom and center of initial view.
   * Zoom and center of the map defined as [zoom, [longitude, latitude]]. Longitude domain = [-160..160],
   * Latitude domain = [-80..80]. */
  zoomAndCenter?: TypeZoomAndCenter;
  /**
   * Option to set initial view by extent.
   * Called with [minX, minY, maxX, maxY] extent coordinates. */
  extent?: Extent;
  /** Geoview layer ID(s) or layer path(s) of layer(s) to use as initial map focus. If empty, will use all layers. */
  layerIds?: string[];
};

/** Type used to define valid map projection codes. */
export type TypeValidMapProjectionCodes = 3978 | 3857;

/** Type used to define valid source projection codes. */
export type TypeValidSourceProjectionCodes = 3978 | 3857 | 4326;

/** Type used to define valid highlight colors. */
export type TypeHighlightColors = 'black' | 'white' | 'red' | 'green';

/** Type used to define overlay objects. */
// TODO: Add more overlay objects - polygons, bounding box?
export type TypeOverlayObjects = {
  /** Non interactive markers */
  pointMarkers?: TypePointMarkers;
};

/** Type used to define point markers object. */
type TypePointMarkers = Record<string, TypePointMarker[]>;

/** Type used to define point marker. */
export type TypePointMarker = {
  /** ID for marker, must be unique within group */
  id: string;
  /** Marker coordinates, unique in group, projection code must be added if not in lon/lat */
  coordinate: Coordinate;
  /** Marker color */
  color?: string;
  /** Marker opacity */
  opacity?: number;
  /** Projection code if coordinates are not in lon/lat */
  projectionCode?: number;
};

// #region GEOVIEW LAYERS

/** Parent class of the GeoView layers. */
export { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';

/** Child classes derived from the AbstractGeoviewLayerConfig. */
export { EsriDynamicLayerConfig } from '@config/types/classes/geoview-config/raster-config/esri-dynamic-config';
export { EsriFeatureLayerConfig } from '@config/types/classes/geoview-config/vector-config/esri-feature-config';
export { WmsLayerConfig } from '@config/types/classes/geoview-config/raster-config/wms-config';
export { WfsLayerConfig } from '@config/types/classes/geoview-config/vector-config/wfs-config';

/** Definition of the geoview layer types accepted by the viewer. */
export type TypeGeoviewLayerType =
  | 'CSV'
  | 'esriDynamic'
  | 'esriFeature'
  | 'esriImage'
  | 'GeoJSON'
  | 'GeoPackage'
  | 'imageStatic'
  | 'ogcFeature'
  | 'ogcWfs'
  | 'ogcWms'
  | 'vectorTiles'
  | 'xyzTiles';

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

// #region SUB LAYERS
export { EntryConfigBaseClass } from '@/api/config/types/classes/sub-layer-config/entry-config-base-class';

export { AbstractBaseLayerEntryConfig } from '@/api/config/types/classes/sub-layer-config/leaf/abstract-base-layer-entry-config';
export { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-node/group-layer-entry-config';
/** Child classes derived from the AbstractBaseLayerEntryConfig. */
export { EsriDynamicLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/raster/esri-dynamic-layer-entry-config';
export { EsriFeatureLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/vector/esri-feature-layer-entry-config';
export { WmsLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/raster/wms-layer-entry-config';
export { WfsLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/vector/wfs-layer-entry-config';
export { GeoJsonLayerEntryConfig } from '@config/types/classes/sub-layer-config/leaf/vector/geojson-layer-entry-config';

/** Valid keys for the geometryType property. */
export type TypeStyleGeometry = 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';

/** Type of Style to apply to the GeoView vector layer source at creation time. */
export type TypeLayerEntryType = 'vector' | 'vector-tile' | 'raster-tile' | 'raster-image' | 'group';

/** Temporal dimension associated to the layer. */
export type TypeTemporalDimension = TimeDimension;

/** Definition of the range object that is part of the temporal dimension. */
export type TypeRangeItems = {
  type: string;
  range: string[];
};

/** Definition of the domain for the nearestValues property of the temporal dimension. */
export type TypeNearestValues = 'discrete' | 'absolute';

/** Base type from which we derive the source properties for all the leaf nodes in the layer tree. */
export type TypeBaseSourceInitialConfig = {
  /**
   * Spatial Reference EPSG code supported (https://epsg.io/). We support lat/long, Web Mercator and Lambert Conical Conform Canada.
   * Default = 3978.
   */
  projection: TypeValidSourceProjectionCodes;
  /** The crossOrigin attribute if needed to load the data. */
  crossOrigin?: string;
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
  /** Maximum number of records to fetch (default: 0). */
  maxRecordCount: number;
  /** Filter to apply on features of this layer. */
  layerFilter?: string;
  /** The feature format used by the XHR feature loader when url is set. */
  format?: TypeVectorSourceFormats;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
  /** Loading strategy to use (all or bbox). */
  strategy?: 'all' | 'bbox';
}

/** Type from which we derive the source properties for all the Wfs leaf nodes in the layer tree. */
export type TypeSourceWfsInitialConfig = TypeBaseVectorSourceInitialConfig;

/** Initial settings to apply to the GeoView vector layer source at creation time. */
export interface TypeVectorSourceInitialConfig extends TypeBaseVectorSourceInitialConfig {
  /** The character used to separate columns of csv file. */
  separator?: string;
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
export type TypeVectorSourceFormats = 'GeoJSON' | 'EsriJSON' | 'KML' | 'WFS' | 'featureAPI' | 'GeoPackage' | 'CSV' | 'MVT';

/** Type from which we derive the source properties for all the ESRI feature leaf nodes in the layer tree. */
export type TypeSourceEsriFeatureInitialConfig = TypeBaseVectorSourceInitialConfig;

/** Type from which we derive the source properties for all the GeoJson feature leaf nodes in the layer tree. */
export type TypeSourceGeoJsonInitialConfig = TypeBaseVectorSourceInitialConfig;

/** Type from which we derive the source properties for all the ESRI dynamic leaf nodes in the layer tree. */
export interface TypeSourceEsriDynamicInitialConfig extends TypeBaseSourceInitialConfig {
  /** Maximum number of records to fetch (default: 0). */
  maxRecordCount: number;
  /** Filter to apply on features of this layer. */
  layerFilter?: string;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
  /** The format used by the image layer. */
  format: TypeEsriFormatParameter;
  /**
   * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png
   * and .gif formats support transparency.
   */
  transparent?: boolean;
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

/** The format used by the image layer. */
export type TypeEsriFormatParameter = 'png' | 'jpg' | 'gif' | 'svg';

/** Type used to configure the feature info for a layer. */
export type TypeFeatureInfoLayerConfig = {
  /** Allow querying. Default = false. */
  queryable: boolean;
  /**
   * The display field of the layer. If it is not present the viewer will make an attempt to find the first valid
   * field.
   */
  nameField: string;
  /** The list of fields to be displayed by the UI. */
  outfields: TypeOutfields[];
};

/** The definition of the fields to be displayed by the UI. */
export type TypeOutfields = {
  name: string;
  alias: string;
  type: TypeOutfieldsType;
  domain: null | codedValueType | rangeDomainType;
};

/** The types supported by the outfields object. */
export type TypeOutfieldsType = 'string' | 'date' | 'number' | 'url' | 'oid';

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

export type codeValueEntryType = {
  name: string;
  code: unknown;
};

/** Styles to apply to the GeoView vector layer by geometry types. */
export type TypeLayerStyleConfig = Partial<Record<TypeStyleGeometry, TypeLayerStyleSettings>>;

/** Style settings to apply to the GeoView vector layer. */
export type TypeLayerStyleSettings = {
  type: TypeLayerStyleConfigType;
  fields: string[];
  // If true, last style info from info array is default style.
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
  settings: TypeBaseVectorGeometryConfig;
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
export type TypeKindOfVectorSettings =
  | TypeBaseVectorGeometryConfig
  | TypeLineStringVectorConfig
  | TypePolygonVectorConfig
  | TypeSimpleSymbolVectorConfig
  | TypeIconSymbolVectorConfig;

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
export type TypeLineStyle =
  | 'dash'
  | 'dash-dot'
  | 'dash-dot-dot'
  | 'dot'
  | 'longDash'
  | 'longDash-dot'
  | 'null'
  | 'shortDash'
  | 'shortDash-dot'
  | 'shortDash-dot-dot'
  | 'solid';

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
export type TypeFillStyle =
  | 'null'
  | 'solid'
  | 'backwardDiagonal'
  | 'cross'
  | 'diagonalCross'
  | 'forwardDiagonal'
  | 'horizontal'
  | 'vertical';

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
