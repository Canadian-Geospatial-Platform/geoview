import { Coordinate } from 'ol/coordinate';
import { Pixel } from 'ol/pixel';
import { Geometry } from 'ol/geom';
import Feature from 'ol/Feature';

import { MapFeatureConfig } from '@/api/config/map-feature-config';
import { MapConfigLayerEntry, TypeGeoviewLayerType, TypeLayerStatus } from './layer-schema-types';

/**
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
  navBar?: TypeValidNavBarProps[];
  /** App bar properies. */
  appBar?: TypeAppBarProps;
  /** Footer bar properies. */
  footerBar?: TypeFooterBarProps;
  /** Overview map properies. */
  overviewMap?: TypeOverviewMapProps;
  /** Map components. */
  components?: TypeValidMapComponentProps[];
  /** List of core packages. */
  corePackages?: TypeValidMapCorePackageProps[];
  /** List of core packages. */
  corePackagesConfig?: TypeCorePackagesConfig;
  /** List of external packages. */
  externalPackages?: TypeExternalPackagesProps[];
  /**
   * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
   * this version of the viewer.
   */
  schemaVersionUsed?: TypeValidVersions;
  /** Global settings. */
  globalSettings?: TypeGlobalSettings;
};

/** An array of numbers representing an extent: `[minx, miny, maxx, maxy]`. */
export type Extent = Array<number>;

/** ISO 639-1 language code prefix. */
export type TypeDisplayLanguage = 'en' | 'fr';

/** Constante mainly use for language validation. */
export const VALID_DISPLAY_LANGUAGE: TypeDisplayLanguage[] = ['en', 'fr'];

// #region MAP FEATURES

/** Supported geoview themes. */
export type TypeDisplayTheme = 'dark' | 'light' | 'geo.ca';

/** Array of valid geoview themes. */
export const VALID_DISPLAY_THEME: TypeDisplayTheme[] = ['dark', 'light', 'geo.ca'];

/** Valid values for the navBar array. */
export type TypeValidNavBarProps = 'zoom' | 'fullscreen' | 'home' | 'location' | 'basemap-select' | 'projection' | 'drawer';

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
  selectedDataTableLayerPath: string;
  selectedTimeSliderLayerPath: string;
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
  selectedDataTableLayerPath: string;
  selectedTimeSliderLayerPath: string;
};

/** Overview map options. Default none. */
export type TypeOverviewMapProps = {
  hideOnZoom: number;
};

/** Supported map component values. */
export type TypeValidMapComponentProps = 'overview-map' | 'north-arrow';

/** Supported map component values. */
export type TypeValidMapCorePackageProps = 'swiper';

/**
 * Core packages config to initialize on viewer load. The schema for those are on their own package.
 * NOTE: config from packages are in the same loaction as core config (<<core config name>>-<<package name>>.json)
 * OR inline with this parameter
 * Default = [].
 */
export type TypeCorePackagesConfig = Record<string, unknown>[];

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

/** Service endpoint urls. */
export type TypeServiceUrls = {
  /**
   * Service end point to access API for layers specification (loading and plugins parameters). By default it is GeoCore but can
   * be another endpoint with similar output. Default = CONFIG_GEOCORE_URL ('https://geocore.api.geo.ca').
   */
  geocoreUrl: string;
  /**
   * An optional proxy to be used for dealing with same-origin issues.  URL must either be a relative path on the same server
   * or an absolute path on a server which sets CORS headers.
   * Default = CONFIG_PROXY_URL ('https://maps.canada.ca/wmsproxy/ws/wmsproxy/executeFromProxy').
   */
  proxyUrl?: string;
  /**
   * An optional geolocator service end point url, which will be used to call to get geo location of address.
   * Default = CONFIG_GEOLOCATOR_URL ('https://geolocator.api.geo.ca?keys=geonames,nominatim,locate').
   */
  geolocatorUrl?: string;
  /**
   * An optional metadata service end point url, which will be used to call to metadata page for uuid layer.
   * Mostly use for currated amp were en and fr config are use.
   * Default = CONFIG_METADATA_RECORDS_URL
   */
  metadataUrl?: string;
};

/** Valid schema version number. */
export type TypeValidVersions = '1.0';

/** Array of schema versions accepted by the viewer. */
export const ACCEPTED_SCHEMA_VERSIONS: TypeValidVersions[] = ['1.0'];

/** Service endpoint urls. */
export type TypeGlobalSettings = {
  /** Whether or not sublayers can be removed from layer groups. Default = true */
  canRemoveSublayers?: boolean;
  /** Whether a certain layer type should be disabled */
  disabledLayerTypes?: TypeGeoviewLayerType[];
  /** Whether to display unsymbolized features in the datatable and other components */
  showUnsymbolizedFeatures?: boolean;
  /** Whether the initial state of the coordinate info tool should be enabled */
  coordinateInfoEnabled?: boolean;
  /** Whether the coordinate info tool should be removed from the UI */
  hideCoordinateInfoSwitch?: boolean;
};

/** Definition of the map configuration settings. */
export type TypeMapConfig = {
  /** Basemap options settings for this map configuration. */
  basemapOptions: TypeBasemapOptions;
  /** Type of interaction. */
  interaction: TypeInteraction;
  /** List of GeoView Layers in the order which they should be added to the map. */
  listOfGeoviewLayerConfig: MapConfigLayerEntry[];
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
export type TypeBasemapId = 'transport' | 'osm' | 'simple' | 'nogeom' | 'shaded' | 'imagery' | 'labeled';

/** Definition of the valid map interactiom values. If map is dynamic (pan/zoom) or static to act as a thumbnail (no nav bar). */
export type TypeInteraction = 'static' | 'dynamic';

/** Constante mainly use for interaction validation. */
export const VALID_INTERACTION: TypeInteraction[] = ['static', 'dynamic'];

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

/** Constant mainly used to test if a TypeValidMapProjectionCodes variable is a valid projection codes. */
export const VALID_PROJECTION_CODES = [3978, 3857];

/**
 *  Definition of the basemap options type.
 */
export const VALID_BASEMAP_ID: TypeBasemapId[] = ['transport', 'osm', 'simple', 'nogeom', 'shaded', 'imagery', 'labeled'];

/** default configuration if provided configuration is missing or wrong */
// valid basemap ids
export const BASEMAP_ID: Record<TypeValidMapProjectionCodes, TypeBasemapId[]> = {
  3857: VALID_BASEMAP_ID,
  3978: VALID_BASEMAP_ID,
};

// valid shaded basemap values for each projection
export const BASEMAP_SHADED: Record<TypeValidMapProjectionCodes, boolean[]> = {
  3857: [true, false],
  3978: [true, false],
};

// valid labeled basemap values for each projection
export const BASEMAP_LABEL: Record<TypeValidMapProjectionCodes, boolean[]> = {
  3857: [true, false],
  3978: [true, false],
};

// valid center levels from each projection
export const VALID_MAP_CENTER: Record<TypeValidMapProjectionCodes, Record<string, number[]>> = {
  3857: { lat: [-90, 90], long: [-180, 180] },
  3978: { lat: [40, 90], long: [-140, 40] },
};

// extents and center for each projection
export const MAP_EXTENTS: Record<TypeValidMapProjectionCodes, number[]> = {
  3857: [-180, 0, 80, 84],
  3978: [-135, 25, -45, 89],
};

export const MAP_CENTER: Record<TypeValidMapProjectionCodes, [number, number]> = {
  3857: [-90, 67],
  3978: [-90, 60],
};

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

// #endregion MAP FEATURES

// #region GEOVIEW LAYERS

export const MAP_CONFIG_SCHEMA_PATH = 'https://cgpv/schema#/definitions/TypeMapFeaturesInstance';

/** The default geocore url */
export const CONFIG_GEOCORE_URL = 'https://geocore.api.geo.ca';

/** The default geolocator url */
export const CONFIG_GEOLOCATOR_URL = 'https://geolocator.api.geo.ca?keys=geonames,nominatim,locate';

/** The default proxy url */
export const CONFIG_PROXY_URL = 'https://maps.canada.ca/wmsproxy/ws/wmsproxy/executeFromProxy';

/** The default metadata recors url for uuid layer (empty because it needs to be set by config en and fr) */
export const CONFIG_METADATA_RECORDS_URL = '';

export const CONFIG_GEOCORE_TYPE = 'geoCore';
export const CONFIG_GEOPACKAGE_TYPE = 'GeoPackage';
export const CONFIG_SHAPEFILE_TYPE = 'shapefile';

// valid zoom levels from each projection
export const VALID_ZOOM_LEVELS: number[] = [0, 20];

/**
 *  Definition of the MapFeatureConfig default values. All the default values that applies to the map feature configuration are
 * defined here.
 */
// TODO: Move this in better class than here.
// TODO: Revise default values.
// GV: The Cast operation doesn't create a real MapFeatureConfig instance because methods are missing.
// GV: We do that only to create an object that has the default values who can be accessed using the instance property names.
export const DEFAULT_MAP_FEATURE_CONFIG = {
  map: {
    basemapOptions: {
      basemapId: 'transport',
      shaded: true,
      labeled: true,
    },
    interaction: 'dynamic',
    listOfGeoviewLayerConfig: [],
    highlightColor: 'black',
    overlayObjects: {
      pointMarkers: {},
    },
    viewSettings: {
      initialView: {
        zoomAndCenter: [3.5, MAP_CENTER[3978]],
      },
      enableRotation: true,
      rotation: 0,
      minZoom: VALID_ZOOM_LEVELS[0],
      maxZoom: VALID_ZOOM_LEVELS[1],
      maxExtent: MAP_EXTENTS[3978],
      projection: 3978,
    },
    extraOptions: {},
  },
  theme: 'geo.ca',
  navBar: ['zoom', 'fullscreen', 'home', 'basemap-select'],
  footerBar: {
    tabs: {
      core: ['legend', 'layers', 'details', 'data-table'],
      custom: [],
    },
    collapsed: false,
  },
  components: ['north-arrow', 'overview-map'],
  appBar: { tabs: { core: ['geolocator'] } },
  corePackages: [],
  corePackagesConfig: [],
  overviewMap: { hideOnZoom: 0 },
  externalPackages: [],
  serviceUrls: {
    geocoreUrl: CONFIG_GEOCORE_URL,
    geolocatorUrl: CONFIG_GEOLOCATOR_URL,
    proxyUrl: CONFIG_PROXY_URL,
    metadataUrl: CONFIG_METADATA_RECORDS_URL,
  },
  globalSettings: {
    canRemoveSublayers: true,
    disabledLayerTypes: [],
    showUnsymbolizedFeatures: false,
  },
  schemaVersionUsed: '1.0',
} as unknown as MapFeatureConfig;

/**
 * Definition of the default order of the tabs inside appbar
 */
export const DEFAULT_APPBAR_TABS_ORDER = ['geolocator', 'aoi-panel', 'legend', 'custom-legend', 'layers', 'details', 'data-table', 'guide'];

export const DEFAULT_APPBAR_CORE = {
  GEOLOCATOR: 'geolocator',
  EXPORT: 'export',
  GUIDE: 'guide',
  DETAILS: 'details',
  LEGEND: 'legend',
  DATA_TABLE: 'data-table',
  LAYERS: 'layers',
} as const;

// #endregion GEOVIEW LAYERS

// #region SUB LAYERS

/** Valid keys for the geometryType property. */
export type TypeStyleGeometry = 'Point' | 'MultiPoint' | 'LineString' | 'MultiLineString' | 'Polygon' | 'MultiPolygon';

export type SerializedGeometry = {
  type: TypeStyleGeometry;
  coordinates: Coordinate | Coordinate[] | Coordinate[][] | Coordinate[][][];
};

/** Definition of the range object that is part of the temporal dimension. */
export type TypeRangeItems = {
  type: string;
  range: string[];
};

/** Definition of the domain for the nearestValues property of the temporal dimension. */
export type TypeNearestValues = 'discrete' | 'absolute';

// #endregion SUB LAYERS

/** The format used by the image layer. */
export type TypeEsriFormatParameter = 'png' | 'jpg' | 'gif' | 'svg';

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

export type TypeFieldEntry = {
  fieldKey: number;
  value: unknown;
  dataType: TypeOutfieldsType;
  alias: string;
  domain: null | codedValueType | rangeDomainType;
};

// Definition of the alias lookup for matching field names to aliases
export type TypeAliasLookup = { [key: string]: string };

// #region STYLE

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
  /** Line cap style. */
  lineCap?: 'butt' | 'round' | 'square';
  /** Line dash pattern. */
  lineDash?: number[];
  /** Line join style. */
  lineJoin?: 'bevel' | 'round' | 'miter';
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
// #endregion STYLE

// #region RESULT SET

export type TypeQueryStatus = 'init' | 'processing' | 'processed' | 'error';

export type QueryType = 'at_pixel' | 'at_coordinate' | 'at_lon_lat' | 'using_a_bounding_box' | 'using_a_polygon' | 'all';

export type TypeLocation = null | Pixel | Coordinate | Coordinate[] | string;

export type TypeResultSetEntry = {
  layerPath: string;
  layerName: string;
  layerStatus: TypeLayerStatus;
};

export type TypeResultSet<T extends TypeResultSetEntry = TypeResultSetEntry> = {
  [layerPath: string]: T;
};

export type TypeFeatureInfoEntry = {
  featureKey: number;
  geoviewLayerType: TypeGeoviewLayerType;
  uid?: string;
  feature?: Feature<Geometry>;
  geometry?: Geometry;
  extent: Extent | undefined;
  featureIcon?: string;
  fieldInfo: Partial<Record<string, TypeFieldEntry>>;
  nameField: string | null;
  layerPath: string;
};

/**
 * Partial definition of a TypeFeatureInfoEntry for simpler use case queries.
 * Purposely linking this simpler type to the main TypeFeatureInfoEntry type here, in case, for future we want
 * to add more information on one or the other and keep things loosely linked together.
 */
export type TypeFeatureInfoEntryPartial = Pick<TypeFeatureInfoEntry, 'fieldInfo' | 'geometry'>;

// TODO: Refactor - Check if this type is still used and replace it with something like TypeAllFeatureInfoResultSetEntry?
// TO.DOCONT:  Still use in data-table-state and detail.tsx
export type TypeLayerData = {
  eventListenerEnabled: boolean;
  // When property features is undefined, we are waiting for the query result.
  // when Array.isArray(features) is true, the features property contains the query result.
  // when property features is null, the query ended with an error.
  queryStatus: TypeQueryStatus;
  features: TypeFeatureInfoEntry[] | undefined | null;
  isDisabled?: boolean;
};

// #endregion RESULT SET

/**
 * Type guard function that redefines a TypeBaseVectorGeometryConfig as a TypeLineStringVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'lineString'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorGeometryConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isLineStringVectorConfig = (verifyIfConfig: TypeBaseVectorGeometryConfig): verifyIfConfig is TypeLineStringVectorConfig => {
  return verifyIfConfig?.type === 'lineString';
};

/**
 * Type guard function that redefines a TypeBaseVectorGeometryConfig as a TypePolygonVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'filledPolygon'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorGeometryConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isFilledPolygonVectorConfig = (verifyIfConfig: TypeBaseVectorGeometryConfig): verifyIfConfig is TypePolygonVectorConfig => {
  return verifyIfConfig?.type === 'filledPolygon';
};

/**
 * Type guard function that redefines a TypeBaseVectorGeometryConfig as a TypeSimpleSymbolVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'simpleSymbol'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorGeometryConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isSimpleSymbolVectorConfig = (
  verifyIfConfig: TypeBaseVectorGeometryConfig
): verifyIfConfig is TypeSimpleSymbolVectorConfig => {
  return verifyIfConfig?.type === 'simpleSymbol';
};

/**
 * Type guard function that redefines a TypeBaseVectorGeometryConfig as a TypeIconSymbolVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'iconSymbol'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorGeometryConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isIconSymbolVectorConfig = (verifyIfConfig: TypeBaseVectorGeometryConfig): verifyIfConfig is TypeIconSymbolVectorConfig => {
  return verifyIfConfig?.type === 'iconSymbol';
};
