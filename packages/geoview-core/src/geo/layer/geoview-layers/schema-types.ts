import { TypeLangString } from '../../../core/types/global-types';

/** ******************************************************************************************************************************
 *  Basic type used to identify a GeoView layer to display on the map.
 */
export type TypeLayerBasicInfoNode = {
  /**
   * The id of the layer for referencing within the viewer (does not relate directly to any external service).
   * The id will have the language extension (id-'lang').
   */
  layerId: string;
  /** The display name of the layer (English/French). If it is not present the viewer will make an attempt to
   * scrape this information.
   */
  layerName?: TypeLangString;
  /**
   * The metadata url of the layer service (English/French).
   */
  layerMetadataUrl?: TypeLangString;
};

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView layer at creation time.
 */
export type TypeLayerInitialSettingsNode = {
  /** Initial opacity setting. Domain = [0..1] and default = 1. */
  layerOpacity?: number;
  /** Initial visibility setting. Default = true. */
  layerVisibility?: boolean;
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates. */
  layerExtent?: number[];
  /** The minimum view zoom level (exclusive) above which this layer will be visible. */
  layerMinZoom?: number;
  /** The maximum view zoom level (inclusive) below which this layer will be visible. */
  layerMaxZoom?: number;
  /** A CSS class name to set to the layer element. */
  layerClassName?: string;
};

/** ******************************************************************************************************************************
 * Type that defines the vector layer source formats.
 */
export type TypeVectorSourceFormats = 'GeoJSON' | 'EsriJSON' | 'KML' | 'WFS' | 'featureAPI';

/** ******************************************************************************************************************************
 * Type used to configure the cluster feature of a vector layer. Works out of the box with point geometries. If another geometry is
 * provided, it will be converted to points geometry.
 */
export type TypeVectorSourceClusterConfig = {
  /** Flag used to enable clustering. Default = false. */
  enable: boolean;
  /** Distance in pixels within which features will be clustered together (deafult 20px). */
  distance: number;
  /** Minimum distance in pixels between clusters. Will be capped at the configured distance. By default no minimum distance is
   * guaranteed. This config can be used to avoid overlapping icons. As a tradoff, the cluster feature's position will no longer
   * be the center of all its features.
   */
  minDistance: number;
};

/** ******************************************************************************************************************************
 * Type used to configure a custom parser.
 */
export type TypeDetailsLayerSettings = {
  /**
   * A path to a javascript file with a function for parsing the layers identify output. Only needed if a custom template is
   * being used.
   */
  parser?: string;
  /** A path to an html template (English/French) that will override default identify output. */
  template: TypeLangString;
};

/** ******************************************************************************************************************************
 * Type used to configure the cluster feature of a vector layer. Works out of the box with point geometries. If another geometry is
 * provided, it will be converted to points geometry.
 */
export type TypeFeatureInfoLayerSettings = {
  customParser: TypeDetailsLayerSettings;
  /**
   * The display field (English/French) of the layer. If it is not present the viewer will make an attempt to find the first valid
   * field.
   */
  nameField: TypeLangString;
  /** The field (English/French) to be used for tooltips. If it is not present the viewer will use nameField (if provided). */
  tooltipField: TypeLangString;
  /** A comma separated list of attribute names (English/French) that should be requested on query (all by default). */
  outfields: TypeLangString;
  /** A comma separated list of attribute names (English/French) that should be use for alias. If empty, no alias will be set */
  aliasFields: TypeLangString;
};

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView vector layer source at creation time.
 */
export type TypeSourceVectorInitialSettings = {
  /** The feature format used by the XHR feature loader when url is set. */
  format: TypeVectorSourceFormats;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerSettings;
  /** Vector source clustering configuration. */
  cluster?: TypeVectorSourceClusterConfig;
};

/** ******************************************************************************************************************************
 * Kind of symbol vector settings.
 */
export type TypeKinfOfSymbolVectorSettings = TypeSimpleSymbolVectorSettings | TypeCircleSymbolVectorSettings | TypeIconSymbolVectorSettings;

/** ******************************************************************************************************************************
 * Fill style for vector features.
 */
export type TypeFillSymbolNode = {
  /** Color to use for vector features. */
  color: string;
};

/** ******************************************************************************************************************************
 * Stroke style for vector features.
 */
export type TypeStrokeSymbolNode = {
  /** Color to use for vector features. */
  color: string;
  /** Width to use for the stroke */
  width: number;
};

/** ******************************************************************************************************************************
 * Definition of the simple symbol vector settings type.
 */
export type TypeSimpleSymbolVectorSettings = {
  /** Fill style for vector features. */
  fill: TypeFillSymbolNode;
  /** Symbol stroke symbology */
  stroke: TypeStrokeSymbolNode;
  /** Radius of the symbol. */
  radius: number;
};

/** ******************************************************************************************************************************
 * Definition of the circle symbol vector settings type.
 */
export type TypeCircleSymbolVectorSettings = {
  /** Fill style for vector features. */
  fill?: TypeFillSymbolNode;
  /** Symbol stroke symbology */
  stroke?: TypeStrokeSymbolNode;
  /** Radius of the circle symbol. */
  radius: number;
};
/** ******************************************************************************************************************************
 * Definition of the icon symbol vector settings type.
 */
export type TypeIconSymbolVectorSettings = {
  /** Icon source. */
  src: string;
  /** Icon size in pixel. */
  size: number;
  /** Icon opacity. */
  opacity: number;
  /** The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if you want to access pixel data
   * with the Canvas renderer.
   */
  crossOrigin: string;
};

/** ******************************************************************************************************************************
 * Simple style configuration.
 */
export type TypeSimpleStyleNode = {
  /** Style identifier. */
  id?: string;
  /** Type of style. */
  styleType: 'simple';
  /** Label associated to the style */
  label: string;
  /** options associated to the style. */
  options: TypeKinfOfSymbolVectorSettings;
};

/** ******************************************************************************************************************************
 * Unique value style information configuration.
 */
export type TypeUniqueValueStyleInfo = {
  /** Label used by the style. */
  lable: string;
  /** Values associated to the style. */
  values: string[];
  /** options associated to the style. */
  options: TypeKinfOfSymbolVectorSettings;
};

/** ******************************************************************************************************************************
 * Unique value style configuration.
 */
export type TypeUniqueValueStyleNode = {
  /** Style identifier. */
  id?: string;
  /** Type of style. */
  styleType: 'uniqueValue';
  /** Label associated to the style */
  label: string;
  /** Fields used by the style. */
  fields: string[];
  /**  Unique value style information configuration. */
  uniqueValueStyleInfo: TypeUniqueValueStyleInfo[];
};

/** ******************************************************************************************************************************
 * Class break style information configuration.
 */
export type TypeClassBreakStyleInfo = {
  /** Label used by the style. */
  lable: string;
  /** Minimum values associated to the style. */
  minValues: number;
  /** Maximum values associated to the style. */
  maxValues: number;
  /** options associated to the style. */
  options: TypeKinfOfSymbolVectorSettings;
};

/** ******************************************************************************************************************************
 * Class break style configuration.
 */
export type TypeClassBreakStyleNode = {
  /** Style identifier. */
  id?: string;
  /** Type of style. */
  styleType: 'classBreak';
  /** Label associated to the style */
  label: string;
  /** Field used by the style. */
  field: string[];
  /**  Class break style information configuration. */
  classBreakStyleInfo: TypeClassBreakStyleInfo[];
};

/** ******************************************************************************************************************************
 * Type of Style to apply to the GeoView vector layer source at creation time.
 */
export type TypeStyleNode = TypeSimpleStyleNode | TypeUniqueValueStyleNode | TypeClassBreakStyleNode;

/** ******************************************************************************************************************************
 *  Type used to define a GeoView vector layer to display on the map.
 */
export type TypeVectorLayerNode = {
  /** Basic information used to identify the GeoView layer. */
  info?: TypeLayerBasicInfoNode;
  /** Initial settings to apply to the GeoView layer at creation time. */
  initialSettings?: TypeLayerInitialSettingsNode;
  /** The type of GeoView layer. */
  layerType: 'vector';
  /** Initial settings to apply to the GeoView vector layer source at creation time. */
  source: TypeSourceVectorInitialSettings;
  /** Style to apply to the vector layer. */
  style?: TypeStyleNode;
};

/** ******************************************************************************************************************************
 *  Initial settings for the source.
 */
export type TypeSourceInitialSettingsNode = {
  /** Initial opacity setting. Domain = [0..1] and default = 1. */
  layerOpacity?: number;
  /** Initial visibility setting. Default = true */
  layerVisibility?: boolean;
  /** Allow querying. Default = true */
  query?: boolean;
};

/** ******************************************************************************************************************************
 *  Initial settings for the ESRI image source.
 */
export type TypeSourceImageEsriLayerNode = {
  /** The index of the layer in the map service. */
  index: number;
  /** Basic information used to identify the GeoView layer. */
  info?: TypeLayerBasicInfoNode;
  /** Initial settings for the source. */
  state?: TypeSourceInitialSettingsNode;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerSettings;
};

/** ******************************************************************************************************************************
 *  Initial settings for the WMS source.
 */
export type TypeSourceImageWMSLayerNode = {
  /** The id of the layer entry in the WMS. */
  id: string;
  /** Basic information used to identify the GeoView layer. */
  info?: TypeLayerBasicInfoNode;
  /** Initial settings for the source. */
  state?: TypeSourceInitialSettingsNode;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerSettings;
};

/** ******************************************************************************************************************************
 * Type that defines the image layer source formats.
 */
export type TypeImageSourceFormats = 'WMS' | 'ESRI';

/** ******************************************************************************************************************************
 *  Initial settings for the WMS source.
 */
export type TypeWmsParameters = {
  /** Array of layers to use for this WMS source. */
  layers: TypeSourceImageWMSLayerNode[];
  /** Style to apply. Default = '' */
  style: string;
};

/** ******************************************************************************************************************************
 * Type that defines the domain of valid values for the ESRI format parameter.
 */
export type TypeEsriFormatParameter = 'png' | 'jpg' | 'gif' | 'svg';

/** ******************************************************************************************************************************
 * Type of server.
 */
export type TypeOfServer = 'mapserver' | 'geoserver' | 'qgis';

/** ******************************************************************************************************************************
 * Initial settings for the ESRI source ArcGIS Rest parameters. Service defaults will be used for any fields not specified.
 * https://developers.arcgis.com/rest/services-reference/enterprise/export-map.htm
 */
export type TypeEsriParameters = {
  /** Array of layers to use for this ESRI source. */
  layers: TypeSourceImageEsriLayerNode[];
  /** The format of the exported image. Default = png. */
  format: TypeEsriFormatParameter;
  /**
   * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png and
   * .gif formats support transparency. Default = true.
   */
  transparent: boolean;
};

/** ******************************************************************************************************************************
 *  Initial settings for image sources.
 */
export type TypeSourceImageInitialSettings = TypeSourceImageWmsInitialSettings | TypeSourceImageEsriInitialSettings;

/** ******************************************************************************************************************************
 *  Initial settings for image sources.
 */
export type TypeBaseSourceImageInitialSettings = {
  /** The service endpoint of the layer (English/French). It should match the type provided in sourceType. */
  accesPath: TypeLangString;
  /** The source type for the image layer. Default = WMS. */
  sourceType: TypeImageSourceFormats;
  /**
   * The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if you want to access pixel data
   * with the Canvas renderer.
   * */
  crossOrigin?: string;
  /** The type of the remote WMS server. Not needed for type ESRI. */
  serverType?: TypeOfServer;
  /** Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada. */
  projection?: number;
};

/** ******************************************************************************************************************************
 *  Initial settings for WMS image sources.
 */
export interface TypeSourceImageWmsInitialSettings extends TypeBaseSourceImageInitialSettings {
  /** Initial settings for the WMS source. */
  paramsWMS: TypeWmsParameters;
}

/** ******************************************************************************************************************************
 *  Initial settings for WMS image sources.
 */
export interface TypeSourceImageEsriInitialSettings extends TypeBaseSourceImageInitialSettings {
  /** Initial settings for the ESRI source ArcGIS Rest parameters. */
  paramsESRI: TypeEsriParameters;
}

/** ******************************************************************************************************************************
 * Type that defines the image layer source formats.
 */
export type TypeTileSourceFormats = 'XYZ' | 'GeoTIFF';

/** ******************************************************************************************************************************
 *  Definition of the tile grid structure.
 */
export type TypeTileGrid = {
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates. */
  extent?: [number, number, number, number];
  /**
   * The tile grid origin, i.e. where the x and y axes meet ([z, 0, 0]). Tile coordinates increase left to right and downwards.
   * If not specified, extent must be provided.
   */
  origin: [number, number];
  /**
   * Resolutions. The array index of each resolution needs to match the zoom level. This means that even if a minZoom is
   * configured, the resolutions array will have a length of maxZoom + 1.
   */
  resolution: number[];
  /**
   * The tile grid origin, i.e. where the x and y axes meet ([z, 0, 0]). Tile coordinates increase left to right and downwards.
   * If not specified, extent must be provided. Default = [256, 256].
   */
  tileSize?: [number, number];
};

/** ******************************************************************************************************************************
 *  Initial settings for image sources.
 */
export type TypeSourceTileInitialSettings = {
  /** The service endpoint of the layer (English/French). It should match the type provided in sourceType. */
  accessPath: TypeLangString;
  /** The source type for the tile layer. Default = XYZ. */
  sourceType: TypeTileSourceFormats;
  /** Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada. */
  projection?: number;
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
};

/** ******************************************************************************************************************************
 *  Type used to identify a GeoView vector heamap layer to display on the map.
 */
export type TypeVectorHeatmapLayerNode = {
  /** Basic information used to identify the GeoView layer. */
  info?: TypeLayerBasicInfoNode;
  /** Initial settings to apply to the GeoView layer at creation time. */
  initialSettings?: TypeLayerInitialSettingsNode;
  /**
   * Layer for rendering vector data as a heatmap. Use points as source. If another geometry is provided, it will be converted to
   * points geometry.
   */
  layerType: 'vectorHeatmap';
  /** Initial settings to apply to the GeoView vector layer source at creation time. */
  source: TypeSourceVectorInitialSettings;
  /**
   * Color gradient of the heatmap, specified as an array of CSS color strings.
   * Default = ["#00f", "#0ff", "#0f0", "#ff0", "#f00"].
   */
  gradient?: string[];
  /** Radius size in pixels. Default = 8px. */
  radius?: number;
  /** Blur size in pixels. Default = 15px. */
  blur?: number;
  /** Feature attribute to use for the weight or a function (ADD FORMAT) that returns a weight from a feature. */
  weight?: string;
};

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView vector tile layer source at creation time.
 */
export type TypeVectorTileSourceInitialSettings = {
  /** The service endpoint of the layer (English/French). It should match the type provided in sourceType. */
  accessPath: TypeLangString;
  /** The source type for the vector tile layer. */
  sourceType: 'vectorTile';
  /** The feature format used by the XHR feature loader when url is set. */
  format?: TypeVectorSourceFormats | 'MVT';
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerSettings;
  /** Style to apply to the vector layer. */
  style?: TypeStyleNode;
  /** Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada. */
  projection?: number;
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
};

/** ******************************************************************************************************************************
 *  Type used to define a GeoView vector tile layer to display on the map. The vector data is divided into a tile grid.
 */
export type TypeVectorTileLayerNode = {
  /** Basic information used to identify the GeoView layer. */
  info?: TypeLayerBasicInfoNode;
  /** Initial settings to apply to the GeoView layer at creation time. */
  initialSettings?: TypeLayerInitialSettingsNode;
  /** The type of GeoView layer. Layer for vector tile data that is rendered client-side. */
  layerType: 'vectorTile';
  /**
   * Initial settings to apply to the GeoView vector layer source at creation time. Layer sources providing vector data divided
   * into a tile grid.
   */
  source: TypeVectorTileSourceInitialSettings;
};

/** ******************************************************************************************************************************
 *  Type used to define a GeoView image layer to display on the map.
 */
export type TypeImageLayerNode = {
  /** Basic information used to identify the GeoView layer. */
  info?: TypeLayerBasicInfoNode;
  /** Initial settings to apply to the GeoView layer at creation time. */
  initialSettings?: TypeLayerInitialSettingsNode;
  /**
   * The type of GeoView layer. Server-rendered images that are available for arbitrary extents and resolutions like OGC WMS,
   * ESRI MapServer, ESRI ImageServer, ...
   */
  layerType: 'image';
  /** Initial settings to apply to the GeoView image layer source at creation time. */
  source: TypeSourceImageInitialSettings;
};

/** ******************************************************************************************************************************
 *  Type used to define a GeoView image layer to display on the map.
 */
export type TypeTileLayerNode = {
  /** Basic information used to identify the GeoView layer. */
  info?: TypeLayerBasicInfoNode;
  /** Initial settings to apply to the GeoView layer at creation time. */
  initialSettings?: TypeLayerInitialSettingsNode;
  /**
   * Layer sources that provide pre-rendered, tiled images in grids that are organized by zoom levels for specific resolutions
   * like OGC WMTS, GeoTIFF, XYZ, ESRI TileServer, ...
   */
  layerType: 'tile';
  /** Initial settings to apply to the GeoView image layer source at creation time. */
  source: TypeSourceTileInitialSettings;
};

/** ******************************************************************************************************************************
 *  Type used to define a GeoView layer where configration is extracted by a configuration snippet stored on a serve.
 */
export type TypeGeoCoreLayerNode = {
  /** The GeoCore catalog uuid of the layer. The id will have the language extension (id-'lang'). */
  id: string;
  /** The access path to the geoCore endpoint (optional, this value should be embeded in the GeoView API). */
  accessPath?: string;
  /** The type of GeoView layer. */
  layerType: 'geoCore';
};

/** ******************************************************************************************************************************
 *  Layer node type.
 */
export type TypeLayerNode =
  | TypeVectorHeatmapLayerNode
  | TypeVectorTileLayerNode
  | TypeVectorLayerNode
  | TypeImageLayerNode
  | TypeTileLayerNode
  | TypeGeoCoreLayerNode;

/** ******************************************************************************************************************************
 *  List of layers. Corresponds to the layerList defined in the schema.
 */
export type TypeLayerEntries = TypeLayerNode[];
