// GV: CONFIG EXTRACTION
// GV: This file was extracted and copied to the geoview config section
// GV: |||||
// GV: vvvvv
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@config/types/classes/sub-layer-config/raster-leaf/esri-dynamic-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@config/types/classes/sub-layer-config/vector-leaf/esri-feature-layer-entry-config';

export { MapFeatureConfig } from '@config/types/classes/map-feature-config';

// #region UTILITIES TYPES

/**
 *  Definition of the post settings type needed when the GeoView GeoJSON layers need to use a POST instead of a GET.
 */
export type TypePostSettings = { header?: Record<string, string>; data: unknown };

/**
 *  Definition of a bilingual string.
 */
export type TypeLocalizedString = TypeLocalizedStringEnAndFr | TypeLocalizedStringFr | TypeLocalizedStringEn;

/**
 *  Definition of a bilingual string, only English provided.
 */
export type TypeLocalizedStringEn = Pick<TypeLocalizedStringEnAndFr, 'en'> & Partial<Pick<TypeLocalizedStringEnAndFr, 'fr'>>;

/**
 *  Definition of a bilingual string, only French provided.
 */
export type TypeLocalizedStringFr = Pick<TypeLocalizedStringEnAndFr, 'fr'> & Partial<Pick<TypeLocalizedStringEnAndFr, 'en'>>;

/**
 *  Definition of a bilingual string, both English and French provided.
 */
export type TypeLocalizedStringEnAndFr = Required<Record<TypeDisplayLanguage, string>>;
// #endregion UTILITIES TYPES

/**
 * An array of numbers representing an extent: `[minx, miny, maxx, maxy]`.
 */
export type Extent = Array<number>;

/**
 * Initial settings to apply to the GeoView layer at creation time.
 */
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

/**
 * Control settings to use in UI.
 */
export type TypeLayerControls = {
  /** Is highlight control available for layer. Default = true */
  highlight?: boolean;
  /** Is hover control available for layer. Default = true */
  hover?: boolean;
  /** Is opacity control available for layer. Default = true */
  opacity?: boolean;
  /** Is query control available for layer. Default = true */
  query?: boolean;
  /** Is remove control available for layer. Default = true */
  remove?: boolean;
  /** Is table available for layer. Default = true */
  table?: boolean;
  /** Is visibility control available for layer. Default = true */
  visibility?: boolean;
  /** Is zoom available for layer. Default = true */
  zoom?: boolean;
};

/**
 * Initial settings to apply to the GeoView layer at creation time.
 */
export type TypeLayerStates = {
  /** Is the layer initially visible. Default = true */
  visible?: boolean;
  /** Initial opacity setting. Default = 1 */
  opacity?: number;
  /** Is layer hoverable initially. Domain = [0..1] and default = 1. */
  hoverable?: boolean;
  /** Is layer queryable initially. Default = true */
  queryable?: boolean;
};

/**
 * Type that defines the vector layer source formats.
 */
export type TypeVectorSourceFormats = 'GeoJSON' | 'EsriJSON' | 'KML' | 'WFS' | 'featureAPI' | 'GeoPackage' | 'CSV';

/**
 * Type used to configure the feature info for a layer.
 */
export type TypeFeatureInfoLayerConfig = {
  /**
   * The display field of the layer. If it is not present the viewer will make an attempt to find the first valid
   * field.
   */
  nameField: string;
  /** The list of fields to be displayed by the UI. */
  outfields: TypeOutfields;
};

/**
 * The definition of the fields to be displayed by the UI.
 */
export type TypeOutfields = {
  name: string;
  alias: string;
  type: TypeOutfieldsType;
  domain: unknown[];
};

/** The types supported by the outfields object. */
export type TypeOutfieldsType = 'string' | 'date' | 'number' | 'url';

/**
 * Initial settings to apply to the GeoView vector layer source at creation time.
 */
export type TypeBaseSourceVectorInitialConfig = {
  /** Maximum number of records to fetch (default: 0). */
  maxRecordCount: number;
  /** Filter to apply on features of this layer. */
  layerFilter?: string;
  /** Settings to use when loading a GeoJSON layer using a POST instead of a GET */
  postSettings?: TypePostSettings;
  /** The feature format used by the XHR feature loader when url is set. */
  format?: TypeVectorSourceFormats | 'MVT';
  /** The projection code of the source. Default value is EPSG:4326. */
  dataProjection?: TypeValidMapProjectionCodes;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
  /** Loading strategy to use (all or bbox). */
  strategy?: 'all' | 'bbox';
};

/**
 * Initial settings to apply to the GeoView vector layer source at creation time.
 */
export interface TypeVectorSourceInitialConfig extends TypeBaseSourceVectorInitialConfig {
  /** The feature format used by the XHR feature loader when url is set. */
  format?: TypeVectorSourceFormats;
  /** The character used to separate columns of csv file */
  separator?: string;
}

/**
 * Kind of symbol vector settings.
 */
export type TypeKindOfVectorSettings =
  | TypeBaseVectorConfig
  | TypeLineStringVectorConfig
  | TypePolygonVectorConfig
  | TypeSimpleSymbolVectorConfig
  | TypeIconSymbolVectorConfig;

/**
 * Definition of the line symbol vector settings type.
 */
export type TypeBaseVectorConfig = {
  /** Type of vector config */
  type: 'lineString' | 'filledPolygon' | 'simpleSymbol' | 'iconSymbol';
};

/**
 * Type of Style to apply to the GeoView vector layer source at creation time.
 */
export type TypeLayerEntryType = 'vector' | 'vector-tile' | 'raster-tile' | 'raster-image' | 'group' | 'geoCore';

/**
 * Type that defines the domain of valid values for the ESRI format parameter.
 */
export type TypeEsriFormatParameter = 'png' | 'jpg' | 'gif' | 'svg';

/**
 * Type of server.
 */
export type TypeOfServer = 'mapserver' | 'geoserver' | 'qgis';

/**
 * Initial settings for image sources.
 */
export type TypeSourceImageInitialConfig =
  | TypeSourceImageWmsInitialConfig
  | TypeSourceImageEsriInitialConfig
  | TypeSourceImageStaticInitialConfig;

/**
 * Initial settings for image sources.
 */
export type TypeBaseSourceImageInitialConfig = {
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

/**
 * Initial settings for WMS image sources.
 */
export interface TypeSourceImageWmsInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** The type of the remote WMS server. The default value is mapserver. */
  serverType?: TypeOfServer;
  /** Style to apply. Default = '' */
  style?: string | string[];
}

/**
 * Initial settings for static image sources.
 */
export interface TypeSourceImageStaticInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** Image extent */
  extent: Extent;
}

/**
 * Initial settings for WMS image sources.
 */
export interface TypeSourceImageEsriInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** Maximum number of records to fetch (default: 0). */
  maxRecordCount: number;
  /** Filter to apply on features of this layer. */
  layerFilter: string;
  /** The format used by the image layer. */
  format?: TypeEsriFormatParameter;
  /**
   * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png and
   * .gif formats support transparency. Default = true.
   */
  transparent?: boolean;
}

/**
 * Definition of the tile grid structure.
 */
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

/**
 * Initial settings for tile image sources.
 */
export interface TypeSourceTileInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
}

/**
 * Initial settings to apply to the GeoView vector tile layer source at creation time.
 */
export interface TypeVectorTileSourceInitialConfig extends TypeBaseSourceVectorInitialConfig {
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
}

/**
 * Layer config type.
 */
export type TypeLayerEntryConfig =
  | (ConfigBaseClass & GroupLayerEntryConfig)
  | (ConfigBaseClass & AbstractBaseLayerEntryConfig & (EsriDynamicLayerEntryConfig | EsriFeatureLayerEntryConfig));
// | VectorLayerEntryConfig
// | OgcWmsLayerEntryConfig
// | EsriImageLayerEntryConfig
// | ImageStaticLayerEntryConfig
// | TileLayerEntryConfig

/**
 *  Definition of a single Geoview layer configuration.
 */
export type TypeGeoviewLayerConfig = AbstractGeoviewLayerConfig;

// #region VIEWER CONFIG TYPES
/**
 * List of supported geoview theme.
 */
export type TypeDisplayTheme = 'dark' | 'light' | 'geo.ca';

/**
/** ISO 639-1  language code prefix. */
export type TypeDisplayLanguage = 'en' | 'fr';
/**
 * ISO 639-1 code indicating the languages supported by the configuration file. It will use value(s) provided here to access
 * bilangual nodes. For value(s) provided here, each bilingual node MUST provide a value.
 */
export type TypeLocalizedLanguages = 'en' | 'fr';
/** List of languages supported by the map. */
export type TypeListOfLocalizedLanguages = TypeLocalizedLanguages[];
/** Constante mainly use for language code validation. */
export const VALID_LOCALIZED_LANGUAGES: TypeListOfLocalizedLanguages = ['en', 'fr'];

/**
/** Valid version number. */
export type TypeValidVersions = '1.0';
/** Constante mainly use for version validation. */
export const VALID_VERSIONS: TypeValidVersions[] = ['1.0'];

/**
 *  Definition of the basemap options type.
 */
export type TypeBasemapId = 'transport' | 'osm' | 'simple' | 'nogeom' | 'shaded';

/**
 *  Definition of the basemap options type.
 */
export type TypeBasemapOptions = {
  /** Id of the basemap to use. */
  basemapId: TypeBasemapId;
  /** Enable or disable shaded basemap (if basemap id is set to shaded then this should be false). */
  shaded: boolean;
  /** Enable or disable basemap labels. */
  labeled: boolean;
};

/**
 *  Definition of the map configuration settings.
 */
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
  /** Additional options used for OpenLayers map options. */
  extraOptions?: Record<string, unknown>;
};

/**
 *  Definition of the valid map interactiom values. If map is dynamic (pan/zoom) or static to act as a thumbnail (no nav bar).
 */
export type TypeInteraction = 'static' | 'dynamic';
/** Constante mainly use for interaction validation. */
export const VALID_INTERACTION: TypeInteraction[] = ['static', 'dynamic'];

/**
 *  Definition of the initial view settings.
 */
export type TypeMapViewSettings = {
  /**
   * Option to set the zoom and center of initial view.
   * Zoom and center of the map defined as [zoom, [longitude, latitude]]. Longitude domain = [-160..160],
   * Latitude domain = [-80..80]. */
  zoomAndCenter?: [number, [number, number]];
  /**
   * Option to set initial view by extent.
   * Called with [minX, minY, maxX, maxY] extent coordinates. */
  extent?: Extent;
  /** IDs of layers to use for initial map extent. */
  layerIds?: string[];
};

/** ******************************************************************************************************************************
 *  Definition of the view settings.
 */
export type TypeViewSettings = {
  /** Settings for the initial view for map, default is zoomAndCenter of [3.5, [-90, 65]] */
  initialView?: TypeMapViewSettings;
  /** Enable rotation. If false, a rotation constraint that always sets the rotation to zero is used. Default = true. */
  enableRotation?: boolean;
  /**
   * The initial rotation for the view in degree (positive rotation clockwise, 0 means North). Will be converted to radiant by
   * the viewer. Domaine = [0..360], default = 0.
   */
  rotation?: number;
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates.
   * Default [-125, 30, -60, 89].
   */
  maxExtent?: Extent;
  /**
   * The minimum zoom level used to determine the resolution constraint. If not set, will use default from basemap.
   * Domaine = [0..50].
   */
  minZoom?: number;
  /**
   * The maximum zoom level used to determine the resolution constraint. If not set, will use default from basemap.
   * Domaine = [0..50].
   */
  maxZoom?: number;
  /**
   * Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada.
   * Default = 3978.
   */
  projection: TypeValidMapProjectionCodes;
};

/**
 *  Type used to define valid highlight colors.
 */
export type TypeHighlightColors = 'black' | 'white' | 'red' | 'green';

/**
 *  Type used to define valid projection codes.
 */
export type TypeValidMapProjectionCodes = 3978 | 3857;

/**
 *  Constant mainly used to test if a TypeValidMapProjectionCodes variable is a valid projection codes.
 */
export const VALID_PROJECTION_CODES = [3978, 3857];

/**
 * Controls available on the navigation bar. Default = ['zoom', 'fullscreen', 'home'].
 */
export type TypeNavBarProps = Array<'zoom' | 'fullscreen' | 'home' | 'location'>;

/**
 * Configuration available on the application bar. Default = ['geolocator']. The about GeoView and notification are always there.
 */
export type TypeAppBarProps = {
  tabs: {
    core: TypeValidAppBarCoreProps[];
  };
};
export type TypeValidAppBarCoreProps = 'geolocator' | 'export' | 'basemap-panel' | 'geochart' | 'guide' | 'legend' | 'details';

/**
 * Configuration available for the footer bar component.
 */
export type TypeFooterBarProps = {
  tabs: {
    core: TypeValidFooterBarTabsCoreProps;
    custom: Array<string>; // TODO: support custom tab by creating a Typeobject for it
  };
  collapsed: boolean;
};
export type TypeValidFooterBarTabsCoreProps = Array<'legend' | 'layers' | 'details' | 'data-table' | 'time-slider' | 'geochart' | 'guide'>;

/**
 *  Overview map options. Default none.
 */
export type TypeOverviewMapProps = { hideOnZoom: number };

/**
 * Core components to initialize on viewer load. Default = ['north-arrow', 'overview-map'].
 */
export type TypeMapComponents = Array<'north-arrow' | 'overview-map'>;

/**
 * Core packages to initialize on viewer load. The schema for those are on their own package. NOTE: config from packages are in
 * the same loaction as core config (<<core config name>>-<<package name>>.json).
 * Default = [].
 */
export type TypeMapCorePackages = Array<'swiper'>;

/**
 * List of external packages to initialize on viewer load. Default = [].
 */
export type TypeExternalPackages = {
  /** External Package name. The name must be identical to the window external package object to load. */
  name: string;
  /**
   * The url to the external package configuration setting. The core package will read the configuration and pass it inside
   * the package.
   */
  configUrl?: string;
}[];

/**
 * Service endpoint urls. Default = 'https://geocore.api.geo.ca'. Used in config-constant
 */
export type TypeServiceUrls = {
  /**
   * Service end point to access API for layers specification (loading and plugins parameters). By default it is GeoCore but can
   * be another endpoint with similar output.
   */
  geocoreUrl: string;
  /**
   * An optional proxy to be used for dealing with same-origin issues.  URL must either be a relative path on the same server
   * or an absolute path on a server which sets CORS headers.
   */
  proxyUrl?: string;
  /**
   * An optional geolocator service end point url, which will be used to call to get geo location of address.
   */
  geolocator?: string;
};
// #endregion VIEWER CONFIG TYPES

// #region STYLES TYPES
// TODO: Move all the type guard functions in the typeGuards file.
/**
 * type guard function that redefines a TypeBaseVectorConfig as a TypeLineStringVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'lineString'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isLineStringVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypeLineStringVectorConfig => {
  return verifyIfConfig?.type === 'lineString';
};

/**
 * type guard function that redefines a TypeBaseVectorConfig as a TypePolygonVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'filledPolygon'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isFilledPolygonVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypePolygonVectorConfig => {
  return verifyIfConfig?.type === 'filledPolygon';
};

/**
 * type guard function that redefines a TypeBaseVectorConfig as a TypeSimpleSymbolVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'simpleSymbol'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isSimpleSymbolVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypeSimpleSymbolVectorConfig => {
  return verifyIfConfig?.type === 'simpleSymbol';
};

/**
 * type guard function that redefines a TypeBaseVectorConfig as a TypeIconSymbolVectorConfig if the type attribute of the
 * verifyIfConfig parameter is 'iconSymbol'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeBaseVectorConfig} verifyIfConfig Polymorphic object to test in order to determine if the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isIconSymbolVectorConfig = (verifyIfConfig: TypeBaseVectorConfig): verifyIfConfig is TypeIconSymbolVectorConfig => {
  return verifyIfConfig?.type === 'iconSymbol';
};

/**
 * Valid values to specify line styles.
 */
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

/**
 * Stroke style for vector features.
 */
export type TypeStrokeSymbolConfig = {
  /** Color to use for vector features. */
  color?: string;
  /** Line style to use for the feature. */
  lineStyle?: TypeLineStyle;
  /** Width to use for the stroke */
  width?: number;
};

/**
 * Definition of the line symbol vector settings type.
 */
export interface TypeLineStringVectorConfig extends TypeBaseVectorConfig {
  /** Type of vector config */
  type: 'lineString';
  /** Line stroke symbology */
  stroke: TypeStrokeSymbolConfig;
}

/**
 * Valid values to specify fill styles.
 */
export type TypeFillStyle =
  | 'null'
  | 'solid'
  | 'backwardDiagonal'
  | 'cross'
  | 'diagonalCross'
  | 'forwardDiagonal'
  | 'horizontal'
  | 'vertical';

/**
 * Definition of the line symbol vector settings type.
 */
export interface TypePolygonVectorConfig extends TypeBaseVectorConfig {
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

/**
 * Valid values to specify symbol shapes.
 */
export type TypeSymbol = 'circle' | '+' | 'diamond' | 'square' | 'triangle' | 'X' | 'star';

/**
 * Definition of the circle symbol vector settings type.
 */
export interface TypeSimpleSymbolVectorConfig extends TypeBaseVectorConfig {
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

/**
 * Definition of the icon symbol vector settings type.
 */
export interface TypeIconSymbolVectorConfig extends TypeBaseVectorConfig {
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

/**
 * Base style configuration.
 */
export type TypeBaseStyleType = 'simple' | 'uniqueValue' | 'classBreaks';

/**
 * Base style configuration.
 */
export type TypeBaseStyleConfig = {
  /** Type of style. */
  styleType: TypeBaseStyleType;
};

/**
 * type guard function that redefines a TypeBaseStyleConfig as a TypeSimpleStyleConfig if the type attribute of the
 * verifyIfConfig parameter is 'simple'. The type assertion applies only to the true block of the if clause that use
 * this function.
 *
 * @param {TypeStyleSettings | TypeKindOfVectorSettings} verifyIfConfig Polymorphic object to test in order to determine if
 * the type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isSimpleStyleConfig = (
  verifyIfConfig: TypeStyleSettings | TypeKindOfVectorSettings
): verifyIfConfig is TypeSimpleStyleConfig => {
  return (verifyIfConfig as TypeStyleSettings)?.styleType === 'simple';
};

/**
 * Simple style configuration.
 */
export interface TypeSimpleStyleConfig extends TypeBaseStyleConfig {
  /** Type of style. */
  styleType: 'simple';
  /** Label associated to the style */
  label: string;
  /** options associated to the style. */
  settings: TypeKindOfVectorSettings;
}

/**
 * Unique value style information configuration.
 */
export type TypeUniqueValueStyleInfo = {
  /** Label used by the style. */
  label: string;
  /** Values associated to the style. */
  values: (string | number | Date)[];
  /** Flag used to show/hide features associated to the label (default: yes). */
  visible?: boolean;
  /** options associated to the style. */
  settings: TypeKindOfVectorSettings;
};

/**
 * type guard function that redefines a TypeStyleSettings | TypeKindOfVectorSettings as a TypeUniqueValueStyleConfig if the
 * styleType attribute of the verifyIfConfig parameter is 'uniqueValue'. The type assertion applies only to the true block of the
 * if clause that use this function.
 *
 * @param {TypeStyleSettings | TypeKindOfVectorSettings} verifyIfConfig Polymorphic object to test in order to determine if the
 * type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isUniqueValueStyleConfig = (
  verifyIfConfig: TypeStyleSettings | TypeKindOfVectorSettings
): verifyIfConfig is TypeUniqueValueStyleConfig => {
  return (verifyIfConfig as TypeStyleSettings)?.styleType === 'uniqueValue';
};

/**
 * Unique value style configuration.
 */
export interface TypeUniqueValueStyleConfig extends TypeBaseStyleConfig {
  /** Type of style. */
  styleType: 'uniqueValue';
  /** Label used if field/value association is not found. */
  defaultLabel?: string;
  /** Options used if field/value association is not found. */
  defaultSettings?: TypeKindOfVectorSettings;
  /** Flag used to show/hide features associated to the default label
   *  (default: no if ESRI renderer in the metadata has no default symbol defined). */
  defaultVisible?: boolean;
  /** Fields used by the style. */
  fields: string[];
  /** Unique value style information configuration. */
  uniqueValueStyleInfo: TypeUniqueValueStyleInfo[];
}

/**
 * Class break style information configuration.
 */
export type TypeClassBreakStyleInfo = {
  /** Label used by the style. */
  label: string;
  /** Minimum values associated to the style. */
  minValue: number | string | Date | undefined | null;
  /** Flag used to show/hide features associated to the label (default: yes). */
  visible?: boolean;
  /** Maximum values associated to the style. */
  maxValue: number | string | Date;
  /** options associated to the style. */
  settings: TypeKindOfVectorSettings;
};

/**
 * type guard function that redefines a TypeStyleSettings | TypeKindOfVectorSettings as a TypeClassBreakStyleConfig if the
 * styleType attribute of the verifyIfConfig parameter is 'classBreaks'. The type assertion applies only to the true block of the
 * if clause that use this function.
 *
 * @param {TypeStyleSettings | TypeKindOfVectorSettings} verifyIfConfig Polymorphic object to test in order to determine if the
 * type assertion is valid.
 *
 * @returns {boolean} true if the type assertion is valid.
 */
export const isClassBreakStyleConfig = (
  verifyIfConfig: TypeStyleSettings | TypeKindOfVectorSettings
): verifyIfConfig is TypeClassBreakStyleConfig => {
  return (verifyIfConfig as TypeStyleSettings)?.styleType === 'classBreaks';
};

/**
 * Class break style configuration.
 */
export interface TypeClassBreakStyleConfig extends TypeBaseStyleConfig {
  /** Type of style. */
  styleType: 'classBreaks';
  /** Label used if field/value association is not found. */
  defaultLabel?: string;
  /** Options used if field/value association is not found. */
  defaultVisible?: boolean;
  /** Flag used to show/hide features associated to the default label (default: yes). */
  defaultSettings?: TypeKindOfVectorSettings;
  /** Field used by the style. */
  field: string;
  /** Class break style information configuration. */
  classBreakStyleInfo: TypeClassBreakStyleInfo[];
}

export type TypeTemporalDimension = {
  field: string;
  default: string;
  unitSymbol: string;
  range: TypeRangeItems;
  nearestValues: TypeNearestValues;
  singleHandle: boolean;
};

export type TypeRangeItems = {
  type: string;
  range: string[];
};

export type TypeNearestValues = 'discrete' | 'absolute';

/**
 * Type of Style to apply to the GeoView vector layer source at creation time.
 */
export type TypeStyleSettings = TypeBaseStyleConfig | TypeSimpleStyleConfig | TypeUniqueValueStyleConfig | TypeClassBreakStyleConfig;

/**
 * Valid keys for the TypeStyleConfig object.
 */
export type TypeGeometryType = 'Point' | 'LineString' | 'Polygon';

/**
 * Type of Style to apply to the GeoView vector layer based on geometry types.
 */
export type TypeStyleConfig = {
  type: TypeGeometryType;
  fields: string[];
  hasDefault: boolean;
  info: TypeStyleConfigInfo;
};

/**
 * Information needed to render the feature.
 */
export type TypeStyleConfigInfo = {
  visible: boolean;
  label: string;
  values: (string | number)[];
  settings: TypeKindOfVectorSettings;
};
// #endregion STYLES TYPES
