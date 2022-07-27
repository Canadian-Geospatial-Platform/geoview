import { TypeLangString } from '../../../core/types/global-types';
import { TypeGeoviewLayerConfig, TypeProjectionCodes } from '../../map/map-types';

/** ******************************************************************************************************************************
 * Basic type used to identify the layer to display on the map.
 */
export type TypeLayerBasicInfoConfig = {
  /** The id of the layer to display on the map. */
  layerId: string;
  /** The display name of the layer (English/French). */
  layerName?: TypeLangString;
  /** The metadata url of the layer service (English/French). */
  metadataUrl?: TypeLangString;
};

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView layer at creation time.
 */
export type TypeLayerInitialConfig = {
  /** Initial opacity setting. Domain = [0..1] and default = 1. */
  opacity?: number;
  /** Initial visibility setting. Default = true. */
  visible?: boolean;
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates. */
  extent?: [number, number, number, number];
  /** The minimum view zoom level (exclusive) above which this layer will be visible. */
  minZoom?: number;
  /** The maximum view zoom level (inclusive) below which this layer will be visible. */
  maxZoom?: number;
  /** A CSS class name to set to the layer element. */
  className?: string;
};

/** ******************************************************************************************************************************
 * Type that defines the vector layer source formats.
 */
export type TypeVectorSourceFormats = 'GeoJSON' | 'EsriJSON' | 'KML' | 'WFS' | 'featureAPI';

/** ******************************************************************************************************************************
 * Type used to configure the cluster feature of a vector layer. Works out of the box with point geometries. If another geometry is
 * provided, it will be converted to points geometry.
 */
export type TypeSourceVectorClusterConfig = {
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
export type TypeDetailsLayerConfig = {
  /**
   * A path to a javascript file with a function for parsing the layers identify output. Only needed if a custom template is
   * being used.
   */
  parser?: string;
  /** A path to an html template (English/French) that will override default identify output. */
  template: TypeLangString;
};

/** ******************************************************************************************************************************
 * Type used to configure the feature info for a layer.
 */
export type TypeFeatureInfoLayerConfig = {
  /** Allow querying. Default = true. */
  queryable?: boolean;
  customParser: TypeDetailsLayerConfig;
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
export type TypeBaseVectorSourceInitialConfig = {
  /** Path used to access the data. */
  accessPath: TypeLangString;
  /** The feature format used by the XHR feature loader when url is set. */
  format: TypeVectorSourceFormats | 'MVT';
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
};

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView vector layer source at creation time.
 */
export interface TypeVectorSourceInitialConfig extends Omit<TypeBaseVectorSourceInitialConfig, 'format'> {
  /** The feature format used by the XHR feature loader when url is set. */
  format: TypeVectorSourceFormats;
  /** Vector source clustering configuration. */
  cluster?: TypeSourceVectorClusterConfig;
}

/** ******************************************************************************************************************************
 * Kind of symbol vector settings.
 */
export type TypeKinfOfSymbolVectorSettings = TypeSimpleSymbolVectorConfig | TypeCircleSymbolVectorConfig | TypeIconSymbolVectorConfig;

/** ******************************************************************************************************************************
 * Fill style for vector features.
 */
export type TypeFillSymbolConfig = {
  /** Color to use for vector features. */
  color: string;
};

/** ******************************************************************************************************************************
 * Stroke style for vector features.
 */
export type TypeStrokeSymbolConfig = {
  /** Color to use for vector features. */
  color: string;
  /** Width to use for the stroke */
  width: number;
};

/** ******************************************************************************************************************************
 * Definition of the simple symbol vector settings type.
 */
export type TypeSimpleSymbolVectorConfig = {
  /** Fill style for vector features. */
  fill: TypeFillSymbolConfig;
  /** Symbol stroke symbology */
  stroke: TypeStrokeSymbolConfig;
  /** Radius of the symbol. */
  radius: number;
};

/** ******************************************************************************************************************************
 * Definition of the circle symbol vector settings type.
 */
export type TypeCircleSymbolVectorConfig = {
  /** Fill style for vector features. */
  fill?: TypeFillSymbolConfig;
  /** Symbol stroke symbology */
  stroke?: TypeStrokeSymbolConfig;
  /** Radius of the circle symbol. */
  radius: number;
};
/** ******************************************************************************************************************************
 * Definition of the icon symbol vector settings type.
 */
export type TypeIconSymbolVectorConfig = {
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
export type TypeSimpleStyleConfig = {
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
export type TypeUniqueValueStyleConfig = {
  /** Style identifier. */
  id?: string;
  /** Type of style. */
  styleType: 'uniqueValue';
  /** Label associated to the style */
  label: string;
  /** Fields used by the style. */
  fields: string[];
  /** Unique value style information configuration. */
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
export type TypeClassBreakStyleConfig = {
  /** Style identifier. */
  id?: string;
  /** Type of style. */
  styleType: 'classBreak';
  /** Label associated to the style */
  label: string;
  /** Field used by the style. */
  field: string;
  /** Class break style information configuration. */
  classBreakStyleInfo: TypeClassBreakStyleInfo[];
};

/** ******************************************************************************************************************************
 * Type of Style to apply to the GeoView vector layer source at creation time.
 */
export type TypeStyleConfig = TypeSimpleStyleConfig | TypeUniqueValueStyleConfig | TypeClassBreakStyleConfig;

/** ******************************************************************************************************************************
 * Type of vector layer.
 */
export type TypeOfVectorLayerEntry = 'vector' | 'vectorHeatmap' | 'vectorTile';

/** ******************************************************************************************************************************
 * Type used to define a GeoView vector layer to display on the map.
 */
export type TypeBaseVectorLayerEntryConfig = {
  /** This attribute is not part of the schema. It is used to link the layer config to the GeoView layer config parent. */
  geoviewLayerParent: TypeGeoviewLayerConfig;
  /** Basic information used to identify the GeoView layer. */
  info: TypeLayerBasicInfoConfig;
  /** Initial settings to apply to the GeoView layer at creation time. */
  initialSettings?: TypeLayerInitialConfig;
  /** The type of GeoView layer. */
  layerEntryType: TypeOfVectorLayerEntry;
  /** Source settings to apply to the GeoView vector layer source at creation time. */
  source: TypeBaseVectorSourceInitialConfig; // YC: delete this comment TypeVectorSourceInitialConfig | TypeVectorTileSourceInitialConfig;
};

/** ******************************************************************************************************************************
 * Type used to define a GeoView vector layer to display on the map.
 */
export interface TypeVectorLayerEntryConfig extends Omit<TypeBaseVectorLayerEntryConfig, 'source'> {
  /** Initial settings to apply to the GeoView vector layer source at creation time. */
  source: TypeVectorSourceInitialConfig;
  /** Style to apply to the vector layer. */
  style?: TypeStyleConfig;
}

/** ******************************************************************************************************************************
 * Type that defines the domain of valid values for the ESRI format parameter.
 */
export type TypeEsriFormatParameter = 'png' | 'jpg' | 'gif' | 'svg';

/** ******************************************************************************************************************************
 * Type of server.
 */
export type TypeOfServer = 'mapserver' | 'geoserver' | 'qgis';

/** ******************************************************************************************************************************
 * Initial settings for image sources.
 */
export type TypeSourceImageInitialConfig = TypeSourceImageWmsInitialConfig | TypeSourceImageEsriInitialConfig;

/** ******************************************************************************************************************************
 * Initial settings for image sources.
 */
export type TypeBaseSourceImageInitialConfig = {
  /** The service endpoint of the layer (English/French). It should match the type provided in sourceType. */
  accessPath: TypeLangString;
  /**
   * The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if you want to access pixel data
   * with the Canvas renderer.
   * */
  crossOrigin?: string;
  /** Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada. */
  projection?: TypeProjectionCodes;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
};

/** ******************************************************************************************************************************
 * Type that defines the image layer source formats.
 */
export type TypeImageSourceFormats = 'WMS' | 'ESRI';

/** ******************************************************************************************************************************
 * Initial settings for WMS image sources.
 */
export interface TypeSourceImageWmsInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** The source type for the image layer. */
  sourceType: 'WMS';
  /** The type of the remote WMS server. */
  serverType: TypeOfServer;
  /** Style to apply. Default = '' */
  style?: string;
}

/** ******************************************************************************************************************************
 * Initial settings for WMS image sources.
 */
export interface TypeSourceImageEsriInitialConfig extends TypeBaseSourceImageInitialConfig {
  /** The source type for the image layer. */
  sourceType: 'ESRI';
  /** The format used by the image layer. */
  format?: TypeEsriFormatParameter;
  /**
   * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png and
   * .gif formats support transparency. Default = true.
   */
  transparent?: boolean;
}

/** ******************************************************************************************************************************
 * Type that defines the image layer source formats.
 */
export type TypeTileSourceFormats = 'XYZ' | 'GeoTIFF';

/** ******************************************************************************************************************************
 * Definition of the tile grid structure.
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
  resolutions: number[];
  /**
   * The tile grid origin, i.e. where the x and y axes meet ([z, 0, 0]). Tile coordinates increase left to right and downwards.
   * If not specified, extent must be provided. Default = [256, 256].
   */
  tileSize?: [number, number];
};

/** ******************************************************************************************************************************
 * Initial settings for tile image sources.
 */
export type TypeSourceTileInitialConfig = {
  /** The service endpoint of the layer (English/French). It should match the type provided in sourceType. */
  accessPath: TypeLangString;
  /** The crossOrigin attribute for loaded images. Note that you must provide a crossOrigin value if you want to access pixel data
   * with the Canvas renderer.
   */
  crossOrigin?: string;
  /** The source type for the tile layer. Default = XYZ. */
  sourceType: TypeTileSourceFormats;
  /** Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada. */
  projection?: TypeProjectionCodes;
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
};

/** ******************************************************************************************************************************
 * Type used to identify a GeoView vector heamap layer to display on the map.
 */
export interface TypeVectorHeatmapLayerEntryConfig extends Omit<TypeBaseVectorLayerEntryConfig, 'source'> {
  /** Initial settings to apply to the GeoView vector layer source at creation time. */
  source: TypeVectorSourceInitialConfig;
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
}

/** ******************************************************************************************************************************
 * Initial settings to apply to the GeoView vector tile layer source at creation time.
 */
export interface TypeVectorTileSourceInitialConfig extends TypeBaseVectorSourceInitialConfig {
  /** The source type for the vector tile layer. */
  sourceType: 'vectorTile';
  /** Style to apply to the vector layer. */
  style?: TypeStyleConfig;
  /** Spatial Reference EPSG code supported (https://epsg.io/). We support Web Mercator and Lambert Conical Conform Canada. */
  projection?: TypeProjectionCodes;
  /** Tile grid parameters to use. */
  tileGrid?: TypeTileGrid;
}

/** ******************************************************************************************************************************
 * Type used to define a GeoView vector tile layer to display on the map. The vector data is divided into a tile grid.
 */
export interface TypeVectorTileLayerEntryConfig extends Omit<TypeBaseVectorLayerEntryConfig, 'source'> {
  /**
   * Initial settings to apply to the GeoView vector layer source at creation time. Layer sources providing vector data divided
   * into a tile grid.
   */
  source: TypeVectorTileSourceInitialConfig;
}

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export type TypeImageLayerEntryConfig = {
  /** This attribute is not part of the schema. It is used to link the layer config to the GeoView layer config parent. */
  geoviewLayerParent: TypeGeoviewLayerConfig;
  /** Basic information used to identify the GeoView layer. */
  info: TypeLayerBasicInfoConfig;
  /** Initial settings to apply to the GeoView layer at creation time. */
  initialSettings?: TypeLayerInitialConfig;
  /**
   * The type of GeoView layer. Server-rendered images that are available for arbitrary extents and resolutions like OGC WMS,
   * ESRI MapServer, ESRI ImageServer, ...
   */
  layerEntryType: 'image';
  /** Initial settings to apply to the GeoView image layer source at creation time. */
  source: TypeSourceImageInitialConfig;
};

/** ******************************************************************************************************************************
 * Type used to define a GeoView image layer to display on the map.
 */
export type TypeTileLayerEntryConfig = {
  /** This attribute is not part of the schema. It is used to link the layer config to the GeoView layer config parent. */
  geoviewLayerParent: TypeGeoviewLayerConfig;
  /** Basic information used to identify the GeoView layer. */
  info: TypeLayerBasicInfoConfig;
  /** Initial settings to apply to the GeoView layer at creation time. */
  initialSettings?: TypeLayerInitialConfig;
  /**
   * Layer sources that provide pre-rendered, tiled images in grids that are organized by zoom levels for specific resolutions
   * like OGC WMTS, GeoTIFF, XYZ, ESRI TileServer, ...
   */
  layerEntryType: 'tile';
  /** Initial settings to apply to the GeoView image layer source at creation time. */
  source: TypeSourceTileInitialConfig;
};

/** ******************************************************************************************************************************
 * Type used to define a GeoView layer where configration is extracted by a configuration snippet stored on a server. The server
 * configuration will handle bilangual informations.
 */
export type TypeGeoCoreLayerEntryConfig = {
  /** This attribute is not part of the schema. It is used to link the layer config to the GeoView layer config parent. */
  geoviewLayerParent: TypeGeoviewLayerConfig;
  /** Basic information used to identify the GeoView layer. The GeoCore catalog uuid of the layer is stored in the layerId
   * attribute. The id will have the language extension (id-'lang').
   */
  info: Pick<TypeLayerBasicInfoConfig, 'layerId' | 'layerName'>;
  /** The GeoCore catalog uuid of the layer. The id will have the language extension (id-'lang'). */
  // id: string;
  /** The access path to the geoCore endpoint (optional, this value should be embeded in the GeoView API). */
  accessPath?: string;
  /** The type of GeoView layer. */
  layerEntryType: 'geoCore';
};

/** ******************************************************************************************************************************
 * Layer config type.
 */
export type TypeLayerEntryConfig =
  | TypeBaseVectorLayerEntryConfig
  | TypeVectorHeatmapLayerEntryConfig
  | TypeVectorTileLayerEntryConfig
  | TypeVectorLayerEntryConfig
  | TypeImageLayerEntryConfig
  | TypeTileLayerEntryConfig
  | TypeGeoCoreLayerEntryConfig;

/** ******************************************************************************************************************************
 * List of layers. Corresponds to the layerList defined in the schema.
 */
export type TypeArrayOfLayerEntryConfig = TypeLayerEntryConfig[];
