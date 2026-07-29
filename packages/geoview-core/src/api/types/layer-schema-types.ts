import type {
  codedValueType,
  Extent,
  rangeDomainType,
  TypeEsriFormatParameter,
  TypeLayerStyleConfig,
  TypeOutfields,
  TypeStyleGeometry,
} from '@/api/types/map-schema-types';
import type {
  AbstractBaseLayerEntryConfig,
  AbstractBaseLayerEntryConfigProps,
} from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { ConfigBaseClass, ConfigBaseClassProps, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type {
  VectorTilesLayerEntryConfig,
  VectorTilesLayerEntryConfigProps,
} from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import type { GeoPackageFeature } from '@/api/config/reader/geopackage-reader';

import type { TypeProjection } from '@/geo/utils/projection';
import type { TemporalMode, TimeDimensionESRI, TimeIANA, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { EsriBaseRenderer } from '@/geo/utils/renderer/esri-renderer';

/** Definition of the keys used to create the constants of the GeoView layer */
type LayerTypesKey =
  | 'CSV'
  | 'ESRI_DYNAMIC'
  | 'ESRI_FEATURE'
  | 'ESRI_IMAGE'
  | 'IMAGE_STATIC'
  | 'GEOJSON'
  | 'GEOTIFF'
  | 'KML'
  | 'XYZ_TILES'
  | 'VECTOR_TILES'
  | 'OGC_FEATURE'
  | 'WFS'
  | 'WKB'
  | 'WMS'
  | 'WMTS';

/** Definition of the geoview layer types accepted by the viewer. */
export type TypeGeoviewLayerType =
  | 'CSV'
  | 'esriDynamic'
  | 'esriFeature'
  | 'esriImage'
  | 'GeoJSON'
  | 'GeoTIFF'
  | 'imageStatic'
  | 'KML'
  | 'ogcFeature'
  | 'ogcWfs'
  | 'ogcWms'
  | 'ogcWmts'
  | 'vectorTiles'
  | 'WKB'
  | 'xyzTiles';

/** Definition of the geoview layer types accepted by the viewer. */
export type TypeInitialGeoviewLayerType = TypeGeoviewLayerType | 'geoCore' | 'GeoPackage' | 'shapefile' | 'rcs';

/** Definition of the GeoView layer constants. */
export const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType> = {
  CSV: 'CSV',
  ESRI_DYNAMIC: 'esriDynamic',
  ESRI_FEATURE: 'esriFeature',
  ESRI_IMAGE: 'esriImage',
  GEOJSON: 'GeoJSON',
  GEOTIFF: 'GeoTIFF',
  IMAGE_STATIC: 'imageStatic',
  KML: 'KML',
  XYZ_TILES: 'xyzTiles',
  VECTOR_TILES: 'vectorTiles',
  OGC_FEATURE: 'ogcFeature',
  WFS: 'ogcWfs',
  WKB: 'WKB',
  WMS: 'ogcWms',
  WMTS: 'ogcWmts',
};

/** Type used to configure the feature info for a layer. */
export type TypeFeatureInfoLayerConfig = {
  /** Allow querying. */
  queryable?: boolean;

  /**
   * The display field of the layer. If it is not present the viewer will make an attempt to find the first valid
   * field.
   */
  nameField?: string;

  /** The list of fields to be displayed by the UI. */
  outfields?: TypeOutfields[];

  /** The geometry field information. */
  geometryField?: TypeOutfields;
};

// TODO: Refactor - This type should be deleted and 'ConfigBaseClass' should be used instead where a class instance is used and ConfigBaseClassProps should be used where regular json object is used.
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

/** Definition of the post settings type needed when the GeoView GeoJSON layers need to use a POST instead of a GET. */
export type TypePostSettings = { header?: Record<string, string>; data: unknown };

// TODO: REFACTOR - Remove geoCore from the type
/** Type of Style to apply to the GeoView vector layer source at creation time. */
export type TypeLayerEntryType =
  'vector' | 'vector-tile' | 'raster-tile' | 'raster-image' | 'group' | 'geoCore' | 'GeoPackage' | 'shapefile' | 'rcs';

/** The possible layer statuses when processing layer configs */
export type TypeLayerStatus = 'newInstance' | 'registered' | 'processing' | 'processed' | 'loading' | 'loaded' | 'error';

/** The possible strategies when working with vector layers data */
export type VectorStrategy = 'all' | 'bbox';

// Definition of the keys used to create the constants of the GeoView layer
export type LayerEntryTypesKey =
  'VECTOR' | 'VECTOR_TILE' | 'RASTER_TILE' | 'RASTER_IMAGE' | 'GROUP' | 'GEOCORE' | 'GEOPACKAGE' | 'SHAPEFILE' | 'RCS';

/** Definition of the sub schema to use for each type of Geoview layer. */
export const CONST_GEOVIEW_SCHEMA_BY_TYPE: Record<TypeGeoviewLayerType, string> = {
  CSV: 'TypeVectorLayerEntryConfig',
  esriDynamic: 'TypeEsriDynamicLayerEntryConfig',
  esriFeature: 'TypeVectorLayerEntryConfig',
  esriImage: 'TypeEsriImageLayerEntryConfig',
  GeoJSON: 'TypeVectorLayerEntryConfig',
  GeoTIFF: 'TypeGeoTIFFLayerEntryConfig',
  imageStatic: 'TypeImageStaticLayerEntryConfig',
  KML: 'TypeVectorLayerEntryConfig',
  xyzTiles: 'TypeTileLayerEntryConfig',
  vectorTiles: 'TypeTileLayerEntryConfig',
  ogcFeature: 'TypeVectorLayerEntryConfig',
  ogcWfs: 'TypeVectorLayerEntryConfig',
  ogcWms: 'TypeOgcWmsLayerEntryConfig',
  ogcWmts: 'TypeOgcWmtsLayerEntryConfig',
  WKB: 'TypeVectorLayerEntryConfig',
};

export const validVectorLayerLegendTypes: TypeGeoviewLayerType[] = [
  CONST_LAYER_TYPES.CSV,
  CONST_LAYER_TYPES.GEOJSON,
  CONST_LAYER_TYPES.ESRI_DYNAMIC,
  CONST_LAYER_TYPES.ESRI_FEATURE,
  CONST_LAYER_TYPES.ESRI_IMAGE,
  CONST_LAYER_TYPES.KML,
  CONST_LAYER_TYPES.OGC_FEATURE,
  CONST_LAYER_TYPES.WFS,
  CONST_LAYER_TYPES.WKB,
];

export const CONST_LAYER_ENTRY_TYPES: Record<LayerEntryTypesKey, TypeLayerEntryType> = {
  VECTOR: 'vector',
  VECTOR_TILE: 'vector-tile',
  RASTER_TILE: 'raster-tile',
  RASTER_IMAGE: 'raster-image',
  GROUP: 'group',
  GEOCORE: 'geoCore',
  GEOPACKAGE: 'GeoPackage',
  SHAPEFILE: 'shapefile',
  RCS: 'rcs',
};

/** The possible OGC Service types */
export type TypeOGCService = 'WMS' | 'WMTS' | 'WFS';

/** Type used to define valid source projection codes. */
export type TypeValidSourceProjectionCodes = 3978 | 3857 | 4326;

/** Base type from which we derive the source properties for all the leaf nodes in the layer tree. */
export type TypeBaseSourceInitialConfig = {
  /**
   * The service endpoint of the layer. Added during creation of specific layer entry config.
   */
  dataAccessPath?: string;

  /**
   * Spatial Reference EPSG code supported (https://epsg.io/).
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

/** Initial settings for GeoTIFF sources. */
export interface TypeSourceGeoTIFFInitialConfig extends TypeBaseSourceInitialConfig {
  /** Path(s) to file containing external overviews. */
  overviews?: string[];
}

/** Type of server. */
export type TypeOfServer = 'mapserver' | 'geoserver' | 'qgis';

/** Mime/type for GEOJSON */
export const MIME_TYPE_FORMAT_GEOJSON = 'application/geojson';

/** Mime/type for JSON */
export const MIME_TYPE_FORMAT_JSON = 'application/json';

/** Mime/type for GML */
export const MIME_TYPE_FORMAT_GML = 'application/vnd.ogc.gml';

/** Mime/type for XML */
export const MIME_TYPE_FORMAT_APP_XML = 'application/xml';

/** Mime/type for XML */
export const MIME_TYPE_FORMAT_TEXT_XML = 'text/xml';

/** Mime/type for HTML */
export const MIME_TYPE_FORMAT_HTML = 'text/html';

/** Mime/type for GML 3.2 (application) */
export const MIME_TYPE_FORMAT_GML_XML_32 = 'application/gml+xml';

/** Mime/type for GML 3.2.1 (text/xml subtype) */
export const MIME_TYPE_FORMAT_TEXT_XML_GML_321 = 'text/xml; subtype=gml/3.2.1';

/** Mime/type for GML 3.1.1 (text/xml subtype) */
export const MIME_TYPE_FORMAT_TEXT_XML_GML_311 = 'text/xml; subtype=gml/3.1.1';

/** Mime/type for GML 2.1.2 (text/xml subtype) */
export const MIME_TYPE_FORMAT_TEXT_XML_GML_212 = 'text/xml; subtype=gml/2.1.2';

/** Mime/type for Text */
export const MIME_TYPE_FORMAT_TEXT = 'text/plain';

/** Base type from which we derive the source properties for all the vector leaf nodes in the layer tree. */
export interface TypeBaseVectorSourceInitialConfig extends TypeBaseSourceInitialConfig {
  /** Loading strategy to use (all or bbox). */
  strategy?: VectorStrategy;

  /** The projection code of the source. */
  dataProjection?: string; // TODO: ? refactor - from geo map schema types

  /** Settings to use when loading a GeoJSON layer using a POST instead of a GET */
  postSettings?: TypePostSettings; // TODO: ? refactor - from geo map schema types
}

export interface TypeSourceGeoJSONInitialConfig extends TypeBaseVectorSourceInitialConfig {
  geojson?: string;
}

export interface TypeSourceWkbVectorInitialConfig extends TypeBaseVectorSourceInitialConfig {
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

/** Type from which we derive the source properties for all the ESRI dynamic leaf nodes in the layer tree. */
export interface TypeSourceEsriDynamicInitialConfig extends TypeBaseSourceInitialConfig {
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

export type TypeSourceImageInitialConfig =
  TypeSourceImageWmsInitialConfig | TypeSourceImageEsriInitialConfig | TypeSourceImageStaticInitialConfig;

export interface TypeSourceImageStaticInitialConfig extends TypeBaseSourceInitialConfig {
  /** Image extent */
  extent?: Extent;
}

export interface TypeSourceCSVInitialConfig extends TypeBaseVectorSourceInitialConfig {
  /**
   * The separator used in the CSV file.
   * @default ','
   */
  separator?: ',';
}

export interface TypeSourceImageWmsInitialConfig extends TypeBaseSourceInitialConfig {
  /** The type of the remote WMS server. The default value is mapserver. */
  serverType?: TypeOfServer;
  /** Style to apply. Default = '' */
  wmsStyle?: string | string[];
}

export interface TypeSourceImageEsriInitialConfig extends TypeBaseSourceInitialConfig {
  /**
   * The format used by the image layer.
   */
  format?: TypeEsriFormatParameter;
  /**
   * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png and
   * .gif formats support transparency. Default = true.
   */
  transparent?: boolean;
  /**
   * The raster function to be applied to the image layer.
   */
  rasterFunction?: string;
}

/** Initial settings to apply to the GeoView layer at creation time. */
export type TypeLayerInitialSettings = {
  /** Settings for availablity of controls */
  controls?: TypeLayerControls;
  /** The geographic bounding box that contains all the layer's features. The bounds are always stored in latlon EPSG:4326 */
  bounds?: Extent;
  /** The extent that constrains the view. Called with [minX, minY, maxX, maxY] extent coordinates. The extent is always stored in latlon EPSG:4326 */
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
  /** Is visible scale control available for layer. Default = false */
  visibleScale?: boolean;
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
  /** Date format used by the service endpoint for an identify. */
  serviceDateFormatIdentify?: string;
  /** Indicates the temporal mode the dates should be interpreted. */
  serviceDateTemporalMode?: TemporalMode;
  /** Service time zone of the dates */
  serviceDateTimezone?: TimeIANA;
  /** Indicates the format how the dates should be displayed in general */
  displayDateFormat?: TypeDisplayDateFormat;
  /** Indicates the format how the dates should be displayed when shortened. Defaults to displayDateFormat */
  displayDateFormatShort?: TypeDisplayDateFormat;
  /** Indicates the format how the dates should be displayed */
  displayDateTimezone?: TimeIANA;
  /** Flag to include layer in time able function like time slider */
  isTimeAware?: boolean;
  /** Flag to indicate if the layer should be used as basemap. Only one layer can be used as basemap. */
  useAsBasemap?: boolean;

  /**
   * Initial settings to apply to the GeoView layer at creation time.
   * This attribute is allowed only if listOfLayerEntryConfig.length > 1.
   */
  initialSettings?: TypeLayerInitialSettings;

  /** Min and max scales */
  minScale?: number;
  maxScale?: number;

  /** The layer entries to use from the GeoView layer. */
  // TODO: REFACTOR - This array isn't only containing TypeLayerEntryConfig, sometimes it's just an array of strict json objects of
  // TO.DOCONT: either ConfigBaseClassProps and/or even TypeGeoviewLayerConfig(?). It'd be great to change the type here, but it has lots of impacts throughout the codebase.
  // TO.DOCONT: Something like: `(ConfigBaseClass | ConfigBaseClassProps | TypeGeoviewLayerConfig)[]`
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

  /** Should the layer be used as basemap. */
  useAsBasemap?: boolean;
};

export type RCSLayerConfig = {
  /** Type of GeoView layer. */
  geoviewLayerType: typeof CONST_LAYER_ENTRY_TYPES.RCS;

  /** The GeoCore UUID. */
  geoviewLayerId: string;

  /**
   * The display name of the layer (English/French). This overrides the default name coming from the GeoCore API.
   */
  geoviewLayerName?: string;

  /** Initial settings to apply to the GeoCore layer at creation time. */
  initialSettings?: TypeLayerInitialSettings;

  /** The layer entries to use from the GeoCore layer. */
  listOfLayerEntryConfig?: TypeLayerEntryConfig[];

  /** Should the layer be used as basemap. */
  useAsBasemap?: boolean;
};

export type GeoPackageLayerConfig = {
  /** Type of GeoView layer. */
  geoviewLayerType: typeof CONST_LAYER_ENTRY_TYPES.GEOPACKAGE;

  /** The GeoView layer identifier. */
  geoviewLayerId: string;

  /** The path to the GeoPackage */
  metadataAccessPath: string;

  /** The display name of the layer. This overrides the default name coming from the GeoCore API. */
  geoviewLayerName?: string;

  /** Initial settings to apply to the layer at creation time. */
  initialSettings?: TypeLayerInitialSettings;

  /** The layer entries to use from the GeoPackage. */
  listOfLayerEntryConfig?: TypeLayerEntryConfig[];

  /** Should the layer be used as basemap. */
  useAsBasemap?: boolean;
};

export type ShapefileLayerConfig = {
  /** Type of GeoView layer. */
  geoviewLayerType: typeof CONST_LAYER_ENTRY_TYPES.SHAPEFILE;

  /** The GeoView layer identifier. */
  geoviewLayerId: string;

  /** The path to the shapefile */
  metadataAccessPath: string;

  /** The display name of the layer. This overrides the default name coming from the GeoCore API. */
  geoviewLayerName?: string;

  /** Initial settings to apply to the layer at creation time. */
  initialSettings?: TypeLayerInitialSettings;

  /** The layer entries to use from the shapefile. */
  listOfLayerEntryConfig?: TypeLayerEntryConfig[];

  /** Should the layer be used as basemap. */
  useAsBasemap?: boolean;
};

/**
 * Type defining the effective scales of a layer, which are the ones that are actually applied on the map and can differ
 * from the configured ones if the layer is outside of its original configured scales or if the map is outside of them.
 */
export type EffectiveLayerScales = {
  maxScale?: number;
  maxScaleZoomAt?: number;
  minScale?: number;
  minScaleZoomAt?: number;
};

/**
 * Type guard that checks if a given map layer configuration entry is of type GeoCore.
 *
 * @param layerConfigEntryOption - The layer entry config to check
 * @returns True if the layer is a GeoCore layer, narrowing the type to GeoCoreLayerConfig
 */
export const mapConfigLayerEntryIsGeoCore = (layerConfigEntryOption: MapConfigLayerEntry): layerConfigEntryOption is GeoCoreLayerConfig => {
  return layerConfigEntryOption.geoviewLayerType === CONST_LAYER_ENTRY_TYPES.GEOCORE;
};

/**
 * Type guard that checks if a given map layer configuration entry is of type GeoPackage.
 *
 * @param layerConfigEntryOption - The layer entry config to check
 * @returns True if the layer is a GeoPackage layer, narrowing the type to GeoPackageLayerConfig
 */
export const mapConfigLayerEntryIsGeoPackage = (
  layerConfigEntryOption: MapConfigLayerEntry
): layerConfigEntryOption is GeoPackageLayerConfig => {
  return layerConfigEntryOption.geoviewLayerType === CONST_LAYER_ENTRY_TYPES.GEOPACKAGE;
};

/**
 * Type guard that checks if a given map layer configuration entry is of type Shapefile.
 *
 * @param layerConfigEntryOption - The layer entry config to check
 * @returns True if the layer is a Shapefile layer, narrowing the type to ShapefileLayerConfig
 */
export const mapConfigLayerEntryIsShapefile = (
  layerConfigEntryOption: MapConfigLayerEntry
): layerConfigEntryOption is ShapefileLayerConfig => {
  return layerConfigEntryOption.geoviewLayerType === CONST_LAYER_ENTRY_TYPES.SHAPEFILE;
};

/**
 * Type guard that checks if a given map layer configuration entry is of type RCS.
 *
 * @param layerConfigEntryOption - The layer entry config to check
 * @returns True if the layer is a RCS layer, narrowing the type to RCSLayerConfig
 */
export const mapConfigLayerEntryIsRCS = (layerConfigEntryOption: MapConfigLayerEntry): layerConfigEntryOption is RCSLayerConfig => {
  return layerConfigEntryOption.geoviewLayerType === CONST_LAYER_ENTRY_TYPES.RCS;
};

// Special layer configs that don't use TypeGeoviewLayerType
type SpecialLayerConfigs = GeoCoreLayerConfig | RCSLayerConfig | GeoPackageLayerConfig | ShapefileLayerConfig;

export type MapConfigLayerEntry = SpecialLayerConfigs | TypeGeoviewLayerConfig;

/**
 * Temporary? function to serialize a geoview layer configuration to be able to send it to the store.
 *
 * @param geoviewLayerConfig - The geoview layer config to serialize
 * @returns The serialized config as pure JSON
 */
export const serializeTypeGeoviewLayerConfig = (geoviewLayerConfig: MapConfigLayerEntry): TypeGeoviewLayerConfig => {
  // If GeoCore layer entry
  if (mapConfigLayerEntryIsGeoCore(geoviewLayerConfig)) {
    // Serialize
    return {
      geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
      geoviewLayerName: geoviewLayerConfig.geoviewLayerName,
      geoviewLayerType: geoviewLayerConfig.geoviewLayerType,
    } as unknown as TypeGeoviewLayerConfig;
  }

  // If GeoPackage layer entry
  if (mapConfigLayerEntryIsGeoPackage(geoviewLayerConfig)) {
    // Serialize
    return {
      geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
      geoviewLayerName: geoviewLayerConfig.geoviewLayerName,
      geoviewLayerType: geoviewLayerConfig.geoviewLayerType,
      metadataAccessPath: geoviewLayerConfig.metadataAccessPath,
      listOfLayerEntryConfig: geoviewLayerConfig.listOfLayerEntryConfig,
    } as unknown as TypeGeoviewLayerConfig;
  }

  // If Shapefile layer entry
  if (mapConfigLayerEntryIsShapefile(geoviewLayerConfig)) {
    // Serialize
    return {
      geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
      geoviewLayerName: geoviewLayerConfig.geoviewLayerName,
      geoviewLayerType: geoviewLayerConfig.geoviewLayerType,
    } as unknown as TypeGeoviewLayerConfig;
  }

  // If RCS layer entry
  if (mapConfigLayerEntryIsRCS(geoviewLayerConfig)) {
    // Serialize
    return {
      geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
      geoviewLayerName: geoviewLayerConfig.geoviewLayerName,
      geoviewLayerType: geoviewLayerConfig.geoviewLayerType,
      listOfLayerEntryConfig: [],
    } as unknown as TypeGeoviewLayerConfig;
  }

  // Cast
  const geoviewLayerConfigCasted = geoviewLayerConfig;

  // Serialize
  const serializedGeoviewLayerConfig = {
    geoviewLayerId: geoviewLayerConfigCasted.geoviewLayerId,
    geoviewLayerName: geoviewLayerConfigCasted.geoviewLayerName,
    geoviewLayerType: geoviewLayerConfigCasted.geoviewLayerType,
    metadataAccessPath: geoviewLayerConfigCasted.metadataAccessPath,
    serviceDateFormat: geoviewLayerConfigCasted.serviceDateFormat,
    serviceDateFormatIdentify: geoviewLayerConfigCasted.serviceDateFormatIdentify,
    serviceDateTemporalMode: geoviewLayerConfigCasted.serviceDateTemporalMode,
    serviceDateTimezone: geoviewLayerConfigCasted.serviceDateTimezone,
    displayDateFormat: geoviewLayerConfigCasted.displayDateFormat,
    displayDateTimezone: geoviewLayerConfigCasted.displayDateTimezone,
    initialSettings: geoviewLayerConfigCasted.initialSettings,
    isTimeAware: geoviewLayerConfigCasted.isTimeAware,
    listOfLayerEntryConfig: [],
  } as TypeGeoviewLayerConfig;

  // Loop on the LayerEntryConfig to serialize further
  for (let j = 0; j < (geoviewLayerConfig.listOfLayerEntryConfig?.length || 0); j++) {
    // Serialize the TypeLayerEntryConfig
    const serializedLayerEntryConfig = geoviewLayerConfig.listOfLayerEntryConfig[j].toJson<TypeLayerEntryConfig>();

    // Store as serialized
    serializedGeoviewLayerConfig.listOfLayerEntryConfig.push(serializedLayerEntryConfig);
  }

  // Return it
  return serializedGeoviewLayerConfig;
};

/**
 * Represents the legend data for a layer.
 */
export type TypeLegend = {
  /** The GeoView layer type this legend belongs to. */
  type: TypeGeoviewLayerType;

  /** The legend content - vector styles, an HTML canvas, or null. */
  // Layers other than vector layers use the HTMLCanvasElement type for their legend.
  legend: TypeVectorLayerStyles | HTMLCanvasElement | 'AnnotationLayer' | null;

  /** Optional style configuration associated with the legend. */
  styleConfig?: TypeLayerStyleConfig;
};

export type TypeStyleRepresentation = {
  /** The defaultCanvas property is used by Simple styles and default styles when defined in unique value and class
   * break styles.
   */
  defaultCanvas?: HTMLCanvasElement | null;
  /** The arrayOfCanvas property is used by unique value and class break styles. */
  arrayOfCanvas?: (HTMLCanvasElement | null)[];
};

export type TypeVectorLayerStyles = Partial<Record<TypeStyleGeometry, TypeStyleRepresentation>>;

// #region METADATA TYPES - WMS

export type TypeMetadataWMS = {
  /**
   * The ServiceExceptionReport is not part of the WFS capabilities, but it is included here for convenience as it's part of the response when going through the Esri proxy.
   *
   * @deprecated The Esri proxy should be eventually completely replaced via the default configuration. Once it's gone, this can be removed for cleanup.
   */
  ServiceExceptionReport?: unknown;
};

export type TypeMetadataWMSCapabilities = {
  Capability: TypeMetadataWMSCapability;
  Service: TypeMetadataWMSService;
  '@attributes': TypeMetadataWMSAttributes;

  version?: string;
  serverType?: TypeOfServer;
};

export type TypeMetadataWMSAttributes = {
  version?: string;
};

export type TypeStylesWMS = {
  StyledLayerDescriptor: TypeStyledLayerDescriptorWMS;
};

export type TypeStyledLayerDescriptorWMS = {
  NamedLayer: TypeNamedLayerWMS;
};

export type TypeNamedLayerWMS = {
  '#text': string;
  'se:Name': string;
  UserStyle: TypeUserStyleWMS;
};

export type TypeUserStyleWMS = {
  'se:FeatureTypeStyle': TypeFeatureTypeStyleWMS | TypeFeatureTypeStyleWMS[];
};

export type TypeFeatureTypeStyleWMS = {
  'se:Rule': TypeUserStyleRule | TypeUserStyleRule[];
};
export type TypeUserStyleRule = {
  'se:Name'?: string;
  'ogc:Filter'?: TypeUserStyleRuleFilter;
  'se:PointSymbolizer'?: TypeUserStyleSymbolizer | TypeUserStyleSymbolizer[];
  'se:LineSymbolizer'?: TypeUserStyleSymbolizer | TypeUserStyleSymbolizer[];
  'se:PolygonSymbolizer'?: TypeUserStyleSymbolizer | TypeUserStyleSymbolizer[];
  'se:TextSymbolizer'?: unknown;
};

export type TypeUserStyleRuleFilter = {
  'ogc:And'?: TypeUserStyleRuleFilter;
  'ogc:PropertyIsEqualTo'?: TypeUserStyleRuleFilterPropertyDetails;
  'ogc:PropertyIsGreaterThan'?: TypeUserStyleRuleFilterPropertyDetails;
  'ogc:PropertyIsGreaterThanOrEqualTo'?: TypeUserStyleRuleFilterPropertyDetails;
  'ogc:PropertyIsLessThan'?: TypeUserStyleRuleFilterPropertyDetails;
  'ogc:PropertyIsLessThanOrEqualTo'?: TypeUserStyleRuleFilterPropertyDetails;
};

export type TypeUserStyleRuleFilterPropertyDetails = {
  'ogc:PropertyName': string;
  'ogc:Literal': string;
  'ogc:Function'?: TypeUserStyleRuleFilterFunction;
};

export type TypeUserStyleRuleFilterFunction = {
  '@attributes': TypeUserStyleRuleFilterFunctionAttributes;
  'ogc:PropertyName': string;
  'ogc:Literal': string;
};

export type TypeUserStyleRuleFilterFunctionAttributes = {
  name: string;
};

export type TypeUserStyleSymbolizer = {
  'se:Stroke'?: TypeUserStyleParameter;
  'se:Fill'?: TypeUserStyleParameter;
  'se:Graphic'?: TypeUserStyleGraphic;
  'se:VendorOption'?: unknown;
};

export type TypeUserStyleParameter = {
  'se:SvgParameter'?: TypeUserStyleParameterValue[];
  'se:CssParameter'?: TypeUserStyleParameterValue[];
  'se:GraphicStroke'?: TypeUserStyleParameter;
  'se:GraphicFill'?: TypeUserStyleSymbolizer;
  'se:Graphic'?: TypeUserStyleGraphic;
};

export type TypeUserStyleParameterValue = {
  '@attributes'?: TypeUserStyleLineSymbolizerStrokeParameterAttributes;
  '#text'?: string;
  '#value'?: string;
  name?: string;
  Name?: string;
};

export type TypeUserStyleLineSymbolizerStrokeParameterAttributes = {
  n?: string;
  name?: string;
  Name?: string;
};

export type TypeUserStyleGraphic = {
  'se:ExternalGraphic': TypeUserStyleExternalGraphic[] | undefined;
  'se:Mark': TypeUserStyleMark;
  'se:Size': string;
  'se:Rotation': TypeLiteral;
};

export type TypeLiteral = {
  'ogc:Literal': string;
};

export type TypeUserStyleMark = {
  'se:WellKnownName'?: string;
  'se:Fill'?: TypeUserStyleParameter;
  'se:Stroke'?: TypeUserStyleParameter;
};

export type TypeUserStyleExternalGraphic = {
  'se:Format': string;
  'se:OnlineResource': TypeOnlineResourceWMS;
};

export type TypeOnlineResourceWMS = {
  '@attributes': TypeOnlineResourceAttributesWMS;
};

export type TypeOnlineResourceAttributesWMS = {
  'xlink:href': string;
  'xlink:type': string;
};

export type TypeMetadataWMSCapability = {
  Request: TypeMetadataWMSCapabilityRequest;
  Layer: TypeMetadataWMSCapabilityLayer;
};

export type TypeMetadataWMSService = {
  Abstract: string;
  Name: string;
  Title: string;
  KeywordList: TypeMetadataWMSServiceKeyword;
  OnlineResource: TypeOnlineResourceWMS;
  MaxWidth?: number;
  MaxHeight?: number;
};

export type TypeMetadataWMSServiceKeyword = {
  Keyword: string[];
};

export type TypeMetadataWMSCapabilityRequest = {
  GetCapabilities: unknown;
  GetMap: TypeMetadataWMSCapabilityRequestGetMap;
  GetFeatureInfo: TypeMetadataWMSCapabilityRequestFeatureInfo;
  'sld:GetLegendGraphic'?: unknown;
  'sld:DescribeLayer'?: unknown;
  'qgs:GetStyles'?: unknown; // QGIS GetStyles
  'ms:GetStyles'?: unknown; // MapServer GetStyles
};

export type TypeMetadataWMSCapabilityRequestGetMap = {
  DCPType: TypeMetadataWMSCapabilityRequestGetMapDCPType[];
};

export type TypeMetadataWMSCapabilityRequestGetMapDCPType = {
  HTTP: TypeMetadataWMSCapabilityRequestGetMapDCPTypeHTTP;
};

export type TypeMetadataWMSCapabilityRequestGetMapDCPTypeHTTP = {
  Get: TypeMetadataWMSCapabilityRequestGetMapDCPTypeHTTPGet;
};

export type TypeMetadataWMSCapabilityRequestGetMapDCPTypeHTTPGet = {
  OnlineResource: TypeOnlineResourceWMS;
};

export type TypeMetadataWMSCapabilityRequestFeatureInfo = {
  Format: string[];
};

export type TypeMetadataWMSCapabilityLayer = {
  Name?: string;
  Title?: string;
  Layer?: TypeMetadataWMSCapabilityLayer[];
  Abstract?: string;
  BoundingBox?: TypeMetadataWMSCapabilityLayerBBox[];
  EX_GeographicBoundingBox?: TypeMetadataWMSCapabilityLayerEXGeographicBBox;
  MinScaleDenominator?: number;
  MaxScaleDenominator?: number;
  CRS?: string[];
  Style?: TypeMetadataWMSCapabilityLayerStyle[];
  Dimension?: TypeMetadataWMSCapabilityLayerDimension[];
  Attribution?: TypeMetadataWMSCapabilityLayerAttribution;

  '@attributes': {
    queryable?: unknown;
    cascaded?: unknown;
    opaque?: unknown;
    fixedWidth?: unknown;
    fixedHeight?: unknown;
    noSubsets?: unknown;
  };
};

export type TypeMetadataWMSCapabilityLayerBBox = {
  '@attributes': TypeMetadataWMSCapabilityLayerBBoxAttributes;
};

export type TypeMetadataWMSCapabilityLayerBBoxAttributes = {
  CRS: string;
  minx: string;
  miny: string;
  maxx: string;
  maxy: string;
  extent?: number[];
};

export type TypeMetadataWMSCapabilityLayerEXGeographicBBox = {
  northBoundLatitude: string;
  southBoundLatitude: string;
  westBoundLongitude: string;
  eastBoundLongitude: string;
  extent?: number[];
};

export type TypeMetadataWMSCapabilityLayerStyle = {
  Name: string;
  LegendURL: TypeLayerMetadataWMSStyleLegendUrl[];
};

export type TypeMetadataWMSCapabilityLayerAttribution = {
  Title: string;
};

export type TypeMetadataWMSCapabilityLayerDimension = {
  '#text': string;
  '@attributes': TypeMetadataWMSCapabilityLayerDimensionAttribute;
  default?: string;
  multipleValues?: boolean; // string for raw XML attribute (below), boolean for normalized value is intentional
  name?: string;
  units?: string;
  values?: string;
};

export type TypeMetadataWMSCapabilityLayerDimensionAttribute = {
  default: string;
  multipleValues?: string;
  name: string;
  units: string;
};

export type TypeLayerMetadataWMSStyleLegendUrl = {
  Format: string;
  OnlineResource: TypeOnlineResourceWMS;
};

// #endregion METADATA TYPES - WMS

// #region METADATA TYPES - WMTS

export type TypeMetadataWMTS = {
  Capabilities?: TypeMetadataWMTSCapabilities;

  /**
   * The ServiceExceptionReport is not part of the WFS capabilities, but it is included here for convenience as it's part of the response when going through the Esri proxy.
   *
   * @deprecated The Esri proxy should be eventually completely replaced via the default configuration. Once it's gone, this can be removed for cleanup.
   */
  ServiceExceptionReport?: unknown;
};

export type TypeMetadataWMTSCapabilities = {
  'ows:OperationsMetadata': TypeMetadataWMTSOperations;
  Contents: TypeMetadataWMTSContents;
  '@attributes': TypeMetadataWMSAttributes;

  version?: string;
  serverType?: TypeOfServer;
};

export type TypeMetadataWMTSOperations = {
  'ows:Operation': {
    '@attributes': {
      name: string;
    };
    'ows:DCP': {
      'ows:HTTP': {
        'ows:Get': {
          '@attributes': {
            'xlink:href': string;
          };
          'ows:Constraint'?: {
            'ows:AllowedValues': {
              'ows:Value': string | string[];
            };
          };
        };
      };
    };
  }[];
};

export type TypeMetadataWMTSContents = {
  Layer: TypeMetadataWMTSLayer[] | TypeMetadataWMTSLayer;
  TileMatrixSet: TypeWMTSTileMatrixSet[] | TypeWMTSTileMatrixSet;
};

/** Represents the parsed WMTS layer information extracted from the capabilities metadata. */
export type TypeWMTSLayerParsedInfo = {
  Layer: TypeMetadataWMTSLayer;
  TileMatrixSet: TypeWMTSTileMatrixSet;
};

export type TypeMetadataWMTSLayer = {
  'ows:Identifier': string;
  'ows:WGS84BoundingBox'?: {
    'ows:LowerCorner': string | [number, number];
    'ows:UpperCorner': string | [number, number];
  };
  ResourceURL: {
    '@attributes': {
      template: string;
      resourceType: string;
      format: string;
    };
  };
  'ows:Title'?: string;
  'ows:Abstract'?: string;
  Format: string;
  TileMatrixSetLink: TypeTileMatrixSetLink[] | TypeTileMatrixSetLink;
  Style?: TypeMetadataWMTSStyle[] | TypeMetadataWMTSStyle;
};

export type TypeMetadataWMTSStyle = {
  'ows:Identifier': string;
  'ows:Title'?: string;
  '@attributes': Record<string, unknown>;
  LegendURL: TypeOnlineResourceWMS;
};

export type TypeTileMatrixSetLink = {
  TileMatrixSet: string;
};

export type TypeWMTSTileMatrixSet = {
  'ows:Identifier': string;
  'ows:SupportedCRS': string;
  TileMatrix: TypeWMTSTileMatrix[];
};

export type TypeWMTSTileMatrix = {
  'ows:Identifier': string;
  ScaleDenominator: number;
  TopLeftCorner: string | [number, number];
  TileWidth: number;
  TileHeight: number;
  MatrixWidth: number;
  MatrixHeight: number;
};

// #endregion METADATA TYPES - WMTS

// #region METADATA TYPES - WFS

export type WFSJsonResponse = {
  featureTypes: WFSJsonResponseFeatureType[];
};

export type WFSJsonResponseFeatureType = {
  properties: TypeOutfields[];
};

export type TypeMetadataWFS = {
  WFS_Capabilities?: TypeMetadataWFSCapabilities;

  /**
   * The ServiceExceptionReport is not part of the WFS capabilities, but it is included here for convenience as it's part of the response when going through the Esri proxy.
   *
   * @deprecated The Esri proxy should be eventually completely replaced via the default configuration. Once it's gone, this can be removed for cleanup.
   */
  ServiceExceptionReport?: unknown;
};

export type TypeMetadataWFSCapabilities = {
  FeatureTypeList: TypeMetadataWFSFeatureTypeList;
  '@attributes': TypeMetadataWFSAttributes;
  'ows:OperationsMetadata': TypeMetadataWFSOperationMetadata;

  version?: string;
  serverType?: TypeOfServer;
};

export type TypeMetadataWFSFeatureTypeList = {
  FeatureType: TypeMetadataWFSFeatureTypeListFeatureType | TypeMetadataWFSFeatureTypeListFeatureType[];
};

export type TypeMetadataWFSFeatureTypeListFeatureType = {
  Name: string | TypeMetadataWFSTextOnly;
  Title: string | TypeMetadataWFSTextOnly;
  DefaultSRS: string | TypeMetadataWFSTextOnly;
  OutputFormats?: TypeMetadataWFSFeatureTypeListFeatureOutputFormat;
  'ows:WGS84BoundingBox': TypeMetadataWFSFeatureTypeListFeatureTypeBBox;
};

export type TypeMetadataWFSFeatureTypeListFeatureTypeBBox = {
  'ows:LowerCorner': string | TypeMetadataWFSTextOnly;
  'ows:UpperCorner': string | TypeMetadataWFSTextOnly;
};

export type TypeMetadataWFSTextOnly = {
  '#text': string;
};

export type TypeMetadataWFSFeatureTypeListFeatureOutputFormat = {
  Format?: string | (string | TypeMetadataWFSTextOnly)[];
};

export type TypeMetadataWFSAttributes = {
  version?: string;
};

export type TypeMetadataWFSOperationMetadata = {
  'ows:Operation': TypeMetadataWFSOperationMetadataOperation[];
};

export type TypeMetadataWFSOperationMetadataOperation = {
  '@attributes': TypeMetadataWFSAttribute;
  'ows:Parameter': TypeMetadataWFSOperationMetadataOperationParameter | TypeMetadataWFSOperationMetadataOperationParameter[];
};

export type TypeMetadataWFSOperationMetadataOperationParameter = {
  '@attributes': TypeMetadataWFSAttribute;
  'ows:AllowedValues'?: TypeMetadataWFSOperationMetadataOperationParameterValue | TypeMetadataWFSOperationMetadataOperationParameterValue[];
  'ows:Value'?: string | string[] | TypeMetadataWFSTextOnly | TypeMetadataWFSTextOnly[];
};

export type TypeMetadataWFSOperationMetadataOperationParameterValue = {
  'ows:Value': string | string[] | TypeMetadataWFSTextOnly | TypeMetadataWFSTextOnly[];
};

export type TypeMetadataWFSAttribute = {
  name: string;
};

// #endregion METADATA TYPES - WFS

// #region METADATA TYPES - OTHERS

export type TypeMetadataFeatureInfo = {
  Layer: TypeMetadataFeatureInfoLayer;
};

export type TypeMetadataFeatureInfoLayer = {
  Attribute: TypeMetadataFeatureInfoLayerAttributes;
  '@attributes': TypeMetadataFeatureInfoLayerAttribute;
};

export type TypeMetadataFeatureInfoLayerAttributes = {
  '@attributes': TypeMetadataFeatureInfoLayerAttribute;
};

export type TypeMetadataFeatureInfoLayerAttribute = {
  name: string;
  value: unknown;
};

export type TypeMetadataGeoTIFF = {
  id: string;
  bbox: number[];
  properties: TypeMetadataGeoTIFFProperties;
  assets: TypeMetadataGeoTIFFAssets;
};

export type TypeMetadataGeoTIFFProperties = {
  datetime: string;
  'proj:epsg': number;
};

export type TypeMetadataGeoTIFFAssets = {
  [key: string]: TypeMetadataGeoTIFFAsset;
  thumbnail: TypeMetadataGeoTIFFAsset;
};

export type TypeMetadataGeoTIFFAsset = {
  href: string;
  type: string;
};

/** Represents layer metadata as read from an Esri layer service. */
export type TypeLayerMetadataEsri = {
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
  rasterFunctionInfos: TypeMetadataEsriRasterFunctionInfos[];
  timeInfo: TimeDimensionESRI;
  geometryType: string;
  fields: TypeLayerMetadataFields[];

  // Mosaic rules and sorting for ESRI Image Server
  defaultMosaicMethod: string;
  allowedMosaicMethods: string;
  sortField: string;
  sortAscending: boolean;
  sortValue: string;
  mosaicOperator: string;
};

export type TypeLayerMetadataEsriDrawingInfo = {
  renderer: EsriBaseRenderer;
};

export type TypeMetadataEsriRasterFunctionInfos = {
  name: string;
  description: string;
  help: string;
};

/**
 * Type definition for ESRI ImageServer mosaic rule parameters.
 * Controls which raster items are selected from a mosaic dataset.
 * @see https://developers.arcgis.com/rest/services-reference/enterprise/mosaic-rule.htm
 */
export type TypeMosaicRule = {
  /** The mosaic method determines how the mosaic is created from the selected rasters. */
  mosaicMethod: TypeMosaicMethod;

  /** The mosaic operation defines how overlapping pixels are resolved. */
  mosaicOperation?: TypeMosaicOperation;

  /** Field name used for attribute-based mosaic method. */
  sortField?: string;

  /** Value to match against sortField for item selection. */
  sortValue?: string;

  /** Sort order when using attribute-based mosaic. */
  ascending?: boolean;

  /** Object IDs of rasters to lock for display (used with esriMosaicLockRaster). */
  lockRasterIds?: number[];

  /** Viewpoint location for viewpoint-based mosaic method. */
  viewpoint?: {
    x: number;
    y: number;
    spatialReference?: { wkid: number };
  };

  /** WHERE clause to filter rasters in the mosaic. */
  where?: string;

  /** Multidimensional definition for filtering. */
  multidimensionalDefinition?: unknown[];
};

export type TypeMosaicMethod =
  | 'esriMosaicNone'
  | 'esriMosaicCenter'
  | 'esriMosaicNadir'
  | 'esriMosaicViewpoint'
  | 'esriMosaicAttribute'
  | 'esriMosaicLockRaster'
  | 'esriMosaicNorthwest'
  | 'esriMosaicSeamline';

export type TypeMosaicOperation = 'MT_FIRST' | 'MT_LAST' | 'MT_MIN' | 'MT_MAX' | 'MT_MEAN' | 'MT_BLEND' | 'MT_SUM';

export type TypeLayerMetadataEsriExtent = {
  spatialReference: TypeProjection;
  xmin: number;
  xmax: number;
  ymin: number;
  ymax: number;
};

export type TypeLayerMetadataEsriField = {
  name: unknown;
};

export type TypeEsriSpatialReference = {
  wkid: number;
  latestWkid?: number;
  wkt?: string;
};

/** Payload response for a url call to {server_url}/MapServer?f=json. */
export type TypeMetadataEsriDynamic = {
  currentVersion: number;
  serviceDescription: string;
  mapName: string;

  capabilities: string;

  supportsDynamicLayers: boolean;

  layers: TypeMetadataEsriLayerSummary[];
  tables?: TypeMetadataEsriLayerSummary[];

  spatialReference: TypeEsriSpatialReference;
  fullExtent: TypeLayerMetadataEsriExtent;
  initialExtent: TypeLayerMetadataEsriExtent;
};

/** Payload response for a url call to {server_url}/MapServer/{layerId}?f=json. */
export type TypeMetadataEsriDynamicLayer = {
  id: number;
  name: string;
  type: string;

  capabilities: string;

  description?: string;

  geometryType: string;
  displayField: string;
  geometryField?: TypeLayerMetadataEsriField;

  minScale: number;
  maxScale: number;

  defaultVisibility: boolean;

  extent: TypeLayerMetadataEsriExtent;

  spatialReference?: TypeEsriSpatialReference;
  sourceSpatialReference?: TypeEsriSpatialReference;

  maxRecordCount: number;

  fields: TypeLayerMetadataFields[];

  parentLayer?: TypeMetadataEsriLayerSummary;

  drawingInfo?: TypeLayerMetadataEsriDrawingInfo;

  timeInfo?: TimeDimensionESRI;
};

/** Payload response for a url call to {server_url}/FeatureServer?f=json. */
export type TypeMetadataEsriFeature = {
  currentVersion: number;
  serviceDescription: string;

  capabilities: string;

  layers: TypeMetadataEsriLayerSummary[];
  tables: TypeMetadataEsriLayerSummary[];

  maxRecordCount?: number;

  spatialReference?: TypeEsriSpatialReference;

  fullExtent?: TypeLayerMetadataEsriExtent;
  initialExtent?: TypeLayerMetadataEsriExtent;
};

/** Payload response for a url call to {server_url}/FeatureServer/{layerId}?f=json. */
export type TypeMetadataEsriFeatureLayer = {
  id: number;
  name: string;
  type: 'Feature Layer';

  description?: string;

  displayField: string;
  objectIdField: string;
  globalIdField?: string;
  geometryField?: TypeLayerMetadataEsriField;

  geometryType: string;

  spatialReference?: TypeEsriSpatialReference;
  sourceSpatialReference?: TypeEsriSpatialReference;
  extent?: TypeLayerMetadataEsriExtent;

  minScale: number;
  maxScale: number;

  defaultVisibility?: boolean;

  maxRecordCount: number;

  supportsStatistics?: boolean;
  supportsAdvancedQueries?: boolean;
  supportsRollbackOnFailureParameter?: boolean;

  capabilities: string;

  fields: TypeLayerMetadataFields[];

  types?: unknown[];

  templates?: unknown;

  parentLayer?: TypeMetadataEsriLayerSummary;

  drawingInfo?: TypeLayerMetadataEsriDrawingInfo;

  editingInfo?: unknown;

  timeInfo?: TimeDimensionESRI;
};

/** Payload response for a url call to {server_url}/ImageServer?f=json. */
export type TypeMetadataEsriImage = {
  currentVersion: number;

  name: string;
  type?: string;
  serviceDescription?: string;
  description?: string;

  capabilities: string;

  pixelType: string;
  bandCount: number;

  minPixelSizeX?: number;
  minPixelSizeY?: number;
  maxPixelSizeX?: number;
  maxPixelSizeY?: number;

  maxImageHeight?: number;
  maxImageWidth?: number;

  maxRecordCount?: number;

  spatialReference: TypeEsriSpatialReference;
  sourceSpatialReference?: TypeEsriSpatialReference;

  extent: TypeLayerMetadataEsriExtent;
  initialExtent?: TypeLayerMetadataEsriExtent;
  fullExtent?: TypeLayerMetadataEsriExtent;

  fields?: TypeLayerMetadataFields[];

  timeInfo?: TimeDimensionESRI;

  mosaicDatasetInfo?: TypeMetadataEsriMosaicDatasetInfo;

  allowedMosaicMethods?: string;
  defaultMosaicMethod?: string;
  sortField?: string;
  sortValue?: string;
  sortAscending?: boolean;
  mosaicOperator?: string;

  allowedCompressionMethods?: string[];

  rasterFunctionInfos?: TypeMetadataEsriRasterFunctionInfos[];

  defaultResamplingMethod?: string;
};

export type TypeMetadataEsriMosaicDatasetInfo = {
  objectIdField: string;
  globalIdField?: string;

  timeField?: string;

  maxRecordCount?: number;

  supportsTime?: boolean;
  supportsZ?: boolean;
  supportsM?: boolean;
};

export type TypeMetadataEsriRasterFunctionInfo = {
  name: string;
  description?: string;
  help?: string;
};

export type TypeMetadataEsriLayerSummary = {
  id: number;
  name: string;
  parentLayerId: number;
  defaultVisibility: boolean;
  subLayerIds: number[] | null; // Esri's response always includes this property and sets it to null when none
  minScale: number;
  maxScale: number;
  type?: string; // Older ArcGIS servers may not provide a 'type' property (true?)
};

export type TypeLayerMetadataFields = {
  name: string;
  type: string;
  alias: string;
  domain: codedValueType | rangeDomainType;
};

export type TypeMetadataOGCFeature = {
  collections: TypeMetadataOGCFeatureCollection[];
};

export type TypeMetadataOGCFeatureCollection = {
  id: string;
  description: string;
  extent: TypeMetadataOGCFeatureCollectionExtent;
};

export type TypeMetadataOGCFeatureCollectionExtent = {
  spatial: TypeMetadataOGCFeatureCollectionExtentSpatial;
};

export type TypeMetadataOGCFeatureCollectionExtentSpatial = {
  crs: string;
  bbox: number[][];
};

export type TypeLayerMetadataQueryables = {
  properties: TypeLayerMetadataOGC;
};

export type TypeLayerMetadataOGC = {
  [key: string]: TypeLayerMetadataOGCRecord;
};

export type TypeLayerMetadataOGCRecord = {
  type: string;
};

export type TypeMetadataGeoJSON = {
  listOfLayerEntryConfig: TypeLayerEntryShell[];
};

export type TypeMetadataVectorTiles = {
  defaultStyles: string;
  tileInfo: TypeMetadataVectorTilesTileInfo;
  fullExtent: TypeMetadataVectorTilesFullExtent;
  minScale?: number;
  maxScale?: number;
  minZoom?: number;
  maxZoom?: number;
};

export type TypeMetadataVectorTilesTileInfo = {
  spatialReference: TypeProjection;
  origin: TypeMetadataVectorTilesTileInfoOrigin;
  lods: TypeLod[];
  rows: number;
  cols: number;
};

export type TypeLod = {
  resolution: number;
  scale: number;
  level: number;
};

export type TypeMetadataVectorTilesTileInfoOrigin = {
  x: number;
  y: number;
};

export type TypeMetadataVectorTilesFullExtent = {
  spatialReference: TypeProjection;
  xmin: number;
  ymin: number;
  xmax: number;
  ymax: number;
};

// #endregion METADATA TYPES - OTHERS
