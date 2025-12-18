import type { codedValueType, Extent, rangeDomainType, TypeEsriFormatParameter, TypeOutfields } from '@/api/types/map-schema-types';
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
import type { TimeDimensionESRI } from '@/core/utils/date-mgt';
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
  | 'WMS';

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
  | 'vectorTiles'
  | 'WKB'
  | 'xyzTiles';

/** Definition of the geoview layer types accepted by the viewer. */
export type TypeInitialGeoviewLayerType = TypeGeoviewLayerType | 'geoCore' | 'GeoPackage' | 'shapefile' | 'rcs';

/**
 * Definition of the GeoView layer constants
 */
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
};

/** Type used to configure the feature info for a layer. */
export type TypeFeatureInfoLayerConfig = {
  /** Allow querying. */
  queryable?: boolean;
  /**
   * The display field of the layer. If it is not present the viewer will make an attempt to find the first valid
   * field.
   */
  nameField?: string; // TODO: refactor - remove ?
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

// TODO: refactor remove geoCore
/** Type of Style to apply to the GeoView vector layer source at creation time. */
export type TypeLayerEntryType =
  | 'vector'
  | 'vector-tile'
  | 'raster-tile'
  | 'raster-image'
  | 'group'
  | 'geoCore'
  | 'GeoPackage'
  | 'shapefile'
  | 'rcs';

/** The possible layer statuses when processing layer configs */
export type TypeLayerStatus = 'newInstance' | 'registered' | 'processing' | 'processed' | 'loading' | 'loaded' | 'error';

/** The possible strategies when working with vector layers data */
export type VectorStrategy = 'all' | 'bbox';

// Definition of the keys used to create the constants of the GeoView layer
export type LayerEntryTypesKey =
  | 'VECTOR'
  | 'VECTOR_TILE'
  | 'RASTER_TILE'
  | 'RASTER_IMAGE'
  | 'GROUP'
  | 'GEOCORE'
  | 'GEOPACKAGE'
  | 'SHAPEFILE'
  | 'RCS';

/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
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

// TODO: After refactor, use the function in type-guard...
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
  projection?: TypeValidSourceProjectionCodes; // TODO: refactor - remove ?
  /** The crossOrigin attribute if needed to load the data. */
  crossOrigin?: string;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig; // TODO: refactor - from geo map schema type
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

/** Base type from which we derive the source properties for all the vector leaf nodes in the layer tree. */
export interface TypeBaseVectorSourceInitialConfig extends TypeBaseSourceInitialConfig {
  /** Path used to access the data. */
  dataAccessPath?: string;
  /** Maximum number of records to fetch (default: 0). */
  maxRecordCount?: number; // TODO: refactor - remove ?
  /** Filter to apply on features of this layer. */
  layerFilter?: string;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
  /** Loading strategy to use (all or bbox). */
  strategy?: VectorStrategy;
  /** The projection code of the source. */
  dataProjection?: string; // TODO: refactor - from geo map schema types
  /** Settings to use when loading a GeoJSON layer using a POST instead of a GET */
  postSettings?: TypePostSettings; // TODO: refactor - from geo map schema types
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
  /** Maximum number of records to fetch (default: 0). */
  maxRecordCount?: number; // TODO: refactor - remove ?
  /** Filter to apply on features of this layer. */
  layerFilter?: string;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;

  /** The format used by the image layer.
   * @deprecated Seems not used anymore?
   */
  format?: TypeEsriFormatParameter; // TODO: refactor - remove ?

  /**
   * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png
   * and .gif formats support transparency.
   * @deprecated Seems not used anymore?
   */
  transparent?: boolean;

  /**
   * If true, the layer will call the service using its native SRID so that OpenLayers take charge of the reprojection on the map.
   */
  forceServiceProjection?: boolean;
}

export type TypeSourceImageInitialConfig =
  | TypeSourceImageWmsInitialConfig
  | TypeSourceImageEsriInitialConfig
  | TypeSourceImageStaticInitialConfig;

export interface TypeSourceImageStaticInitialConfig extends TypeBaseSourceInitialConfig {
  /** Image extent */
  extent?: Extent;
}

export interface TypeSourceCSVInitialConfig extends TypeBaseVectorSourceInitialConfig {
  separator?: ',';
}

export interface TypeSourceImageWmsInitialConfig extends TypeBaseSourceInitialConfig {
  /** The type of the remote WMS server. The default value is mapserver. */
  serverType?: TypeOfServer;
  /** Style to apply. Default = '' */
  wmsStyle?: string | string[];
}

export interface TypeSourceImageEsriInitialConfig extends TypeBaseSourceInitialConfig {
  /** The format used by the image layer.
   * @deprecated Seems not used anymore?
   */
  format?: TypeEsriFormatParameter;
  /**
   * If true, the image will be exported with the background color of the map set as its transparent color. Only the .png and
   * .gif formats support transparency. Default = true.
   * @deprecated Seems not used anymore?
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
  // TODO: Refactor - This array isn't only containing TypeLayerEntryConfig, sometimes it's just an array of strict json objects of
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
};

export type RCSLayerConfig = {
  /** Type of GeoView layer. */
  geoviewLayerType: typeof CONST_LAYER_ENTRY_TYPES.RCS;

  /** The GeoCore UUID. */
  geoviewLayerId: string;

  /**
   * The display name of the layer (English/French). This overrides the default name coming from the GeoCore API.
   */
  geoviewLayerName?: string | undefined;

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
export const mapConfigLayerEntryIsGeoCore = (layerConfigEntryOption: MapConfigLayerEntry): layerConfigEntryOption is GeoCoreLayerConfig => {
  return layerConfigEntryOption.geoviewLayerType === CONST_LAYER_ENTRY_TYPES.GEOCORE;
};

/**
 * Type guard that checks if a given map layer configuration entry is of type GeoPackage.
 * @param {MapConfigLayerEntry} layerConfigEntryOption - The layer entry config to check
 * @returns {layerConfigEntryOption is GeoPackageLayerConfig} True if the layer is a GeoPackage layer, narrowing the type to GeoPackageLayerConfig.
 */
export const mapConfigLayerEntryIsGeoPackage = (
  layerConfigEntryOption: MapConfigLayerEntry
): layerConfigEntryOption is GeoPackageLayerConfig => {
  return layerConfigEntryOption.geoviewLayerType === CONST_LAYER_ENTRY_TYPES.GEOPACKAGE;
};

/**
 * Type guard that checks if a given map layer configuration entry is of type Shapefile.
 * @param {MapConfigLayerEntry} layerConfigEntryOption - The layer entry config to check
 * @returns {layerConfigEntryOption is ShapefileLayerConfig} True if the layer is a Shapefile layer, narrowing the type to ShapefileLayerConfig.
 */
export const mapConfigLayerEntryIsShapefile = (
  layerConfigEntryOption: MapConfigLayerEntry
): layerConfigEntryOption is ShapefileLayerConfig => {
  return layerConfigEntryOption.geoviewLayerType === CONST_LAYER_ENTRY_TYPES.SHAPEFILE;
};

/**
 * Type guard that checks if a given map layer configuration entry is of type RCS.
 * @param {MapConfigLayerEntry} layerConfigEntryOption - The layer entry config to check
 * @returns {layerConfigEntryOption is RCSLayerConfig} True if the layer is a RCS layer, narrowing the type to RCSLayerConfig.
 */
export const mapConfigLayerEntryIsRCS = (layerConfigEntryOption: MapConfigLayerEntry): layerConfigEntryOption is RCSLayerConfig => {
  return layerConfigEntryOption.geoviewLayerType === CONST_LAYER_ENTRY_TYPES.RCS;
};

// Special layer configs that don't use TypeGeoviewLayerType
type SpecialLayerConfigs = GeoCoreLayerConfig | RCSLayerConfig | GeoPackageLayerConfig | ShapefileLayerConfig;

export type MapConfigLayerEntry = SpecialLayerConfigs | TypeGeoviewLayerConfig;

/**
 * Temporary? function to serialize a geoview layer configuration to be able to send it to the store
 * @param {MapConfigLayerEntry} geoviewLayerConfig - The geoviewlayer config to serialize
 * @returns {MapConfigLayerEntry} The serialized config as pure JSON
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
    externalDateFormat: geoviewLayerConfigCasted.externalDateFormat,
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

export interface TypeMetadataWMSRoot {
  WMS_Capabilities?: TypeMetadataWMS;
  WMT_MS_Capabilities?: TypeMetadataWMS;
}

export interface TypeMetadataWMS {
  Capability: TypeMetadataWMSCapability;
  Service: TypeMetadataWMSService;
  '@attributes': TypeMetadataWMSAttributes;

  version?: string;
  serverType?: TypeOfServer;
}

export interface TypeMetadataWMSAttributes {
  version?: string;
}

export interface TypeStylesWMS {
  StyledLayerDescriptor: TypeStyledLayerDescriptorWMS;
}

export interface TypeStyledLayerDescriptorWMS {
  NamedLayer: TypeNamedLayerWMS;
}

export interface TypeNamedLayerWMS {
  '#text': string;
  'se:Name': string;
  UserStyle: TypeUserStyleWMS;
}

export interface TypeUserStyleWMS {
  'se:FeatureTypeStyle': TypeFeatureTypeStyleWMS | TypeFeatureTypeStyleWMS[];
}

export interface TypeFeatureTypeStyleWMS {
  'se:Rule': TypeUserStyleRule | TypeUserStyleRule[];
}
export interface TypeUserStyleRule {
  'se:Name'?: string;
  'ogc:Filter'?: TypeUserStyleRuleFilter;
  'se:PointSymbolizer'?: TypeUserStyleSymbolizer | TypeUserStyleSymbolizer[];
  'se:LineSymbolizer'?: TypeUserStyleSymbolizer | TypeUserStyleSymbolizer[];
  'se:PolygonSymbolizer'?: TypeUserStyleSymbolizer | TypeUserStyleSymbolizer[];
  'se:TextSymbolizer'?: unknown;
}

export interface TypeUserStyleRuleFilter {
  'ogc:And'?: TypeUserStyleRuleFilter;
  'ogc:PropertyIsEqualTo'?: TypeUserStyleRuleFilterPropertyDetails;
  'ogc:PropertyIsGreaterThan'?: TypeUserStyleRuleFilterPropertyDetails;
  'ogc:PropertyIsGreaterThanOrEqualTo'?: TypeUserStyleRuleFilterPropertyDetails;
  'ogc:PropertyIsLessThan'?: TypeUserStyleRuleFilterPropertyDetails;
  'ogc:PropertyIsLessThanOrEqualTo'?: TypeUserStyleRuleFilterPropertyDetails;
}

export interface TypeUserStyleRuleFilterPropertyDetails {
  'ogc:PropertyName': string;
  'ogc:Literal': string;
  'ogc:Function'?: TypeUserStyleRuleFilterFunction;
}

export interface TypeUserStyleRuleFilterFunction {
  'ogc:PropertyName': string;
  'ogc:Literal': string;
}
export interface TypeUserStyleSymbolizer {
  'se:Stroke'?: TypeUserStyleParameter;
  'se:Fill'?: TypeUserStyleParameter;
  'se:Graphic'?: TypeUserStyleGraphic;
  'se:VendorOption'?: unknown;
}

export interface TypeUserStyleParameter {
  'se:SvgParameter'?: TypeUserStyleParameterValue[];
  'se:CssParameter'?: TypeUserStyleParameterValue[];
  'se:GraphicStroke'?: TypeUserStyleParameter;
  'se:GraphicFill'?: TypeUserStyleSymbolizer;
  'se:Graphic'?: TypeUserStyleGraphic;
}

export interface TypeUserStyleParameterValue {
  '@attributes'?: TypeUserStyleLineSymbolizerStrokeParameterAttributes;
  '#text'?: string;
  '#value'?: string;
  name?: string;
  Name?: string;
}

export interface TypeUserStyleLineSymbolizerStrokeParameterAttributes {
  n?: string;
  name?: string;
  Name?: string;
}

export interface TypeUserStyleGraphic {
  'se:ExternalGraphic': TypeUserStyleExternalGraphic[] | undefined;
  'se:Mark': TypeUserStyleMark;
  'se:Size': string;
  'se:Rotation': TypeLiteral;
}

export interface TypeLiteral {
  'ogc:Literal': string;
}

export interface TypeUserStyleMark {
  'se:WellKnownName'?: string;
  'se:Fill'?: TypeUserStyleParameter;
  'se:Stroke'?: TypeUserStyleParameter;
}

export interface TypeUserStyleExternalGraphic {
  'se:Format': string;
  'se:OnlineResource': TypeOnlineResourceWMS;
}

export interface TypeOnlineResourceWMS {
  '@attributes': TypeOnlineResourceAttributesWMS;
}

export interface TypeOnlineResourceAttributesWMS {
  'xlink:href': string;
  'xlink:type': string;
}

export interface TypeMetadataWMSCapability {
  Request: TypeMetadataWMSCapabilityRequest;
  Layer: TypeMetadataWMSCapabilityLayer;
}

export interface TypeMetadataWMSService {
  Abstract: string;
  Name: string;
  Title: string;
  KeywordList: TypeMetadataWMSServiceKeyword;
  OnlineResource: TypeOnlineResourceWMS;
}

export interface TypeMetadataWMSServiceKeyword {
  Keyword: string[];
}

export interface TypeMetadataWMSCapabilityRequest {
  GetCapabilities: unknown;
  GetMap: TypeMetadataWMSCapabilityRequestGetMap;
  GetFeatureInfo: TypeMetadataWMSCapabilityRequestFeatureInfo;
  'sld:GetLegendGraphic'?: unknown;
  'sld:DescribeLayer'?: unknown;
  'qgs:GetStyles'?: unknown; // QGIS GetStyles
  'ms:GetStyles'?: unknown; // MapServer GetStyles
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
  OnlineResource: TypeOnlineResourceWMS;
}

export interface TypeMetadataWMSCapabilityRequestFeatureInfo {
  Format: string[];
}

export interface TypeMetadataWMSCapabilityLayer {
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
}

export interface TypeMetadataWMSCapabilityLayerBBox {
  '@attributes': TypeMetadataWMSCapabilityLayerBBoxAttributes;
}

export interface TypeMetadataWMSCapabilityLayerBBoxAttributes {
  CRS: string;
  minx: string;
  miny: string;
  maxx: string;
  maxy: string;
  extent?: number[];
}

export interface TypeMetadataWMSCapabilityLayerEXGeographicBBox {
  northBoundLatitude: string;
  southBoundLatitude: string;
  westBoundLongitude: string;
  eastBoundLongitude: string;
  extent?: number[];
}

export interface TypeMetadataWMSCapabilityLayerStyle {
  Name: string;
  LegendURL: TypeLayerMetadataWMSStyleLegendUrl[];
}

export interface TypeMetadataWMSCapabilityLayerAttribution {
  Title: string;
}

export interface TypeMetadataWMSCapabilityLayerDimension {
  '#text': string;
  '@attributes': TypeMetadataWMSCapabilityLayerDimensionAttribute;
  default?: string;
  name?: string;
  units?: string;
  values?: string;
}

export interface TypeMetadataWMSCapabilityLayerDimensionAttribute {
  default: string;
  name: string;
  units: string;
}

export interface TypeLayerMetadataWMSStyleLegendUrl {
  Format: string;
  OnlineResource: TypeOnlineResourceWMS;
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

export interface TypeMetadataGeoTIFF {
  id: string;
  bbox: number[];
  properties: TypeMetadataGeoTIFFProperties;
  assets: TypeMetadataGeoTIFFAssets;
}

export interface TypeMetadataGeoTIFFProperties {
  datetime: string;
  'proj:epsg': number;
}

export interface TypeMetadataGeoTIFFAssets {
  [key: string]: TypeMetadataGeoTIFFAsset;
  thumbnail: TypeMetadataGeoTIFFAsset;
}

export interface TypeMetadataGeoTIFFAsset {
  href: string;
  type: string;
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
  geometryType: string;
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
  properties: TypeOutfields[];
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
  Name: string | TypeMetadataWFSTextOnly;
  Title: string | TypeMetadataWFSTextOnly;
  DefaultSRS: string | TypeMetadataWFSTextOnly;
  OutputFormats?: TypeMetadataWFSFeatureTypeListFeatureOutputFormat;
  'ows:WGS84BoundingBox': TypeMetadataWFSFeatureTypeListFeatureTypeBBox;
}

export interface TypeMetadataWFSFeatureTypeListFeatureTypeBBox {
  'ows:LowerCorner': string | TypeMetadataWFSTextOnly;
  'ows:UpperCorner': string | TypeMetadataWFSTextOnly;
}

export interface TypeMetadataWFSTextOnly {
  '#text': string;
}

export interface TypeMetadataWFSFeatureTypeListFeatureOutputFormat {
  Format?: string | (string | TypeMetadataWFSTextOnly)[];
}

export interface TypeMetadataWFSAttributes {
  version?: string;
}

export interface TypeMetadataWFSOperationMetadata {
  'ows:Operation': TypeMetadataWFSOperationMetadataOperation[];
}

export interface TypeMetadataWFSOperationMetadataOperation {
  '@attributes': TypeMetadataWFSAttribute;
  'ows:Parameter': TypeMetadataWFSOperationMetadataOperationParameter | TypeMetadataWFSOperationMetadataOperationParameter[];
}

export interface TypeMetadataWFSOperationMetadataOperationParameter {
  '@attributes': TypeMetadataWFSAttribute;
  'ows:AllowedValues'?: TypeMetadataWFSOperationMetadataOperationParameterValue | TypeMetadataWFSOperationMetadataOperationParameterValue[];
  'ows:Value'?: string | string[] | TypeMetadataWFSTextOnly | TypeMetadataWFSTextOnly[];
}

export interface TypeMetadataWFSOperationMetadataOperationParameterValue {
  'ows:Value': string | string[] | TypeMetadataWFSTextOnly | TypeMetadataWFSTextOnly[];
}

export interface TypeMetadataWFSAttribute {
  name: string;
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
