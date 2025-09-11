import { codedValueType, Extent, rangeDomainType, TypeEsriFormatParameter, TypeOutfields } from '@/api/types/map-schema-types';
import {
  AbstractBaseLayerEntryConfig,
  AbstractBaseLayerEntryConfigProps,
} from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { ConfigBaseClass, ConfigBaseClassProps, TypeLayerEntryShell } from '@/api/config/validation-classes/config-base-class';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { ImageStaticLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { XYZTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import {
  VectorTilesLayerEntryConfig,
  VectorTilesLayerEntryConfigProps,
} from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { CsvLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { GeoPackageLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geopackage-layer-config-entry';
import { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { WfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { TypeEsriDynamicLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { TypeEsriImageLayerConfig } from '@/geo/layer/geoview-layers/raster/esri-image';
import { TypeImageStaticLayerConfig } from '@/geo/layer/geoview-layers/raster/image-static';
import { TypeVectorTilesConfig } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { TypeWMSLayerConfig } from '@/geo/layer/geoview-layers/raster/wms';
import { TypeXYZTilesConfig } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { TypeCSVLayerConfig } from '@/geo/layer/geoview-layers/vector/csv';
import { TypeEsriFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { TypeGeoJSONLayerConfig } from '@/geo/layer/geoview-layers/vector/geojson';
import { TypeGeoPackageLayerConfig } from '@/geo/layer/geoview-layers/vector/geopackage';
import { TypeOgcFeatureLayerConfig } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { TypeWkbLayerConfig } from '@/geo/layer/geoview-layers/vector/wkb';
import { TypeWFSLayerConfig } from '@/geo/layer/geoview-layers/vector/wfs';
import { TypeProjection } from '@/geo/utils/projection';
import { TimeDimensionESRI } from '@/core/utils/date-mgt';
import { EsriBaseRenderer } from '@/geo/utils/renderer/esri-renderer';

/** Definition of the keys used to create the constants of the GeoView layer */
type LayerTypesKey =
  | 'CSV'
  | 'ESRI_DYNAMIC'
  | 'ESRI_FEATURE'
  | 'ESRI_IMAGE'
  | 'IMAGE_STATIC'
  | 'GEOJSON'
  | 'GEOPACKAGE'
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
  | 'GeoPackage'
  | 'imageStatic'
  | 'ogcFeature'
  | 'ogcWfs'
  | 'ogcWms'
  | 'vectorTiles'
  | 'WKB'
  | 'xyzTiles';

/** Definition of the geoview layer types accepted by the viewer. */
export type TypeInitialGeoviewLayerType = TypeGeoviewLayerType | 'geoCore' | 'shapefile';

/**
 * Definition of the GeoView layer constants
 */
export const CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType> = {
  CSV: 'CSV',
  ESRI_DYNAMIC: 'esriDynamic',
  ESRI_FEATURE: 'esriFeature',
  ESRI_IMAGE: 'esriImage',
  IMAGE_STATIC: 'imageStatic',
  GEOJSON: 'GeoJSON',
  GEOPACKAGE: 'GeoPackage',
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
  queryable: boolean;
  /**
   * The display field of the layer. If it is not present the viewer will make an attempt to find the first valid
   * field.
   */
  nameField?: string; // TODO: refactor - remove ?
  /** The list of fields to be displayed by the UI. */
  outfields?: TypeOutfields[]; // TODO: refactor - remove ?
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

export interface TypeSourceOgcFeatureInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'featureAPI';
}

export interface TypeSourceWFSVectorInitialConfig extends TypeVectorSourceInitialConfig {
  format: 'WFS';
}

/** Definition of the post settings type needed when the GeoView GeoJSON layers need to use a POST instead of a GET. */
export type TypePostSettings = { header?: Record<string, string>; data: unknown };

// TODO: refactor remove geoCore
/** Type of Style to apply to the GeoView vector layer source at creation time. */
export type TypeLayerEntryType = 'vector' | 'vector-tile' | 'raster-tile' | 'raster-image' | 'group' | 'geoCore' | 'shapefile';

/** The possible layer statuses when processing layer configs */
export type TypeLayerStatus = 'newInstance' | 'registered' | 'processing' | 'processed' | 'loading' | 'loaded' | 'error';

/** The possible strategies when working with vector layers data */
export type VectorStrategy = 'all' | 'bbox';

// Definition of the keys used to create the constants of the GeoView layer
export type LayerEntryTypesKey = 'VECTOR' | 'VECTOR_TILE' | 'RASTER_TILE' | 'RASTER_IMAGE' | 'GROUP' | 'GEOCORE' | 'SHAPEFILE';

/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
export const CONST_GEOVIEW_SCHEMA_BY_TYPE: Record<TypeGeoviewLayerType, string> = {
  CSV: 'TypeVectorLayerEntryConfig',
  imageStatic: 'TypeImageStaticLayerEntryConfig',
  esriDynamic: 'TypeEsriDynamicLayerEntryConfig',
  esriFeature: 'TypeVectorLayerEntryConfig',
  esriImage: 'TypeEsriImageLayerEntryConfig',
  GeoJSON: 'TypeVectorLayerEntryConfig',
  GeoPackage: 'TypeVectorLayerEntryConfig',
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
  CONST_LAYER_TYPES.OGC_FEATURE,
  CONST_LAYER_TYPES.WFS,
  CONST_LAYER_TYPES.WKB,
  CONST_LAYER_TYPES.GEOPACKAGE,
];

// TODO: After refactor, use the function in type-guard...
export const CONST_LAYER_ENTRY_TYPES: Record<LayerEntryTypesKey, TypeLayerEntryType> = {
  VECTOR: 'vector',
  VECTOR_TILE: 'vector-tile',
  RASTER_TILE: 'raster-tile',
  RASTER_IMAGE: 'raster-image',
  GROUP: 'group',
  GEOCORE: 'geoCore',
  SHAPEFILE: 'shapefile',
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
  maxRecordCount?: number; // TODO: refactor - remove ?
  /** Filter to apply on features of this layer. */
  layerFilter?: string;
  /** The feature format used by the XHR feature loader when url is set. */
  format?: TypeVectorSourceFormats;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
  /** Loading strategy to use (all or bbox). */
  strategy?: VectorStrategy;
  /** The projection code of the source. Default value is EPSG:4326. */
  dataProjection?: string; // TODO: refactor - from geo map schema types
  /** Settings to use when loading a GeoJSON layer using a POST instead of a GET */
  postSettings?: TypePostSettings; // TODO: refactor - from geo map schema types
}

/** Type from which we derive the source properties for all the Wfs leaf nodes in the layer tree. */
export type TypeSourceWfsInitialConfig = TypeBaseVectorSourceInitialConfig;

/** Initial settings to apply to the GeoView vector layer source at creation time. */
export interface TypeVectorSourceInitialConfig extends TypeBaseVectorSourceInitialConfig {
  /** The character used to separate columns of csv file. */
  separator?: string;
  /** The feature format used by the XHR feature loader when url is set. */
  format?: TypeVectorSourceFormats; // TODO: refactor - from geo map schema type
}

export interface TypeSourceGeoJSONInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'GeoJSON';
  geojson?: string;
}

export interface TypeSourceWkbVectorInitialConfig extends Omit<TypeVectorSourceInitialConfig, 'format'> {
  format: 'WKB';
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
export type TypeVectorSourceFormats = 'GeoJSON' | 'EsriJSON' | 'KML' | 'WFS' | 'featureAPI' | 'GeoPackage' | 'CSV' | 'MVT' | 'WKB';

/** Type from which we derive the source properties for all the ESRI dynamic leaf nodes in the layer tree. */
export interface TypeSourceEsriDynamicInitialConfig extends TypeBaseSourceInitialConfig {
  /** Maximum number of records to fetch (default: 0). */
  maxRecordCount?: number; // TODO: refactor - remove ?
  /** Filter to apply on features of this layer. */
  layerFilter?: string;
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. */
  featureInfo?: TypeFeatureInfoLayerConfig;
  /** The format used by the image layer. */
  format?: TypeEsriFormatParameter; // TODO: refactor - remove ?
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
  // TODO: Bug - The geoviewLayerName doesn't override the name from GeoCore. Fix this.
  // TO.DOCONT: On type we should have the initial setting as well. This is to override the information from service.
  // TO.DOCONT: I think it is working with other type of layer. Now having geocore not a layer type anymore, we should be able to overrides.
  // TO.DOCONT: For this we will need a little trick because when we create the config the setting are set at the root level and in our config it will take it from the layerID.
  // TO.DOCONT: There is refactor to do to make this work for all layer type. Global setting should be cascade to child of the root layer.
  geoviewLayerName: string | undefined;

  /** Initial settings to apply to the GeoCore layer at creation time. */
  initialSettings?: TypeLayerInitialSettings;

  /** The layer entries to use from the GeoCore layer. */
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
 * Type guard that checks if a given map layer configuration entry is of type Shapefile.
 * @param {MapConfigLayerEntry} layerConfigEntryOption - The layer entry config to check
 * @returns {layerConfigEntryOption is ShapefileLayerConfig} True if the layer is a Shapefile layer, narrowing the type to ShapefileLayerConfig.
 */
export const mapConfigLayerEntryIsShapefile = (
  layerConfigEntryOption: MapConfigLayerEntry
): layerConfigEntryOption is ShapefileLayerConfig => {
  return layerConfigEntryOption.geoviewLayerType === CONST_LAYER_ENTRY_TYPES.SHAPEFILE;
};

export type MapConfigLayerEntry = TypeGeoviewLayerConfig | GeoCoreLayerConfig | ShapefileLayerConfig;

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

  // If Shapefile layer entry
  if (mapConfigLayerEntryIsShapefile(geoviewLayerConfig)) {
    // Serialize
    return {
      geoviewLayerId: geoviewLayerConfig.geoviewLayerId,
      geoviewLayerName: geoviewLayerConfig.geoviewLayerName,
      geoviewLayerType: geoviewLayerConfig.geoviewLayerType,
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

export type TypeSourceImageInitialConfig =
  | TypeSourceImageWmsInitialConfig
  | TypeSourceImageEsriInitialConfig
  | TypeSourceImageStaticInitialConfig;

export interface TypeSourceImageStaticInitialConfig extends Omit<TypeBaseSourceInitialConfig, 'featureInfo'> {
  /** Definition of the feature information structure that will be used by the getFeatureInfo method. We only use queryable and
   * it must be set to false if specified.
   */
  featureInfo?: { queryable: false };
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

export const layerEntryIsGroupLayer = (verifyIfLayer: ConfigClassOrType): verifyIfLayer is GroupLayerEntryConfig => {
  return verifyIfLayer?.entryType === CONST_LAYER_ENTRY_TYPES.GROUP;
};

export const layerConfigIsEsriDynamicFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriDynamicLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC;
};

export const layerEntryIsEsriDynamicFromConfig = (
  verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps
): verifyIfLayer is EsriDynamicLayerEntryConfig => {
  return layerConfigIsEsriDynamicFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsEsriImageFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriImageLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_IMAGE;
};

export const layerEntryIsEsriImageFromConfig = (
  verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps
): verifyIfLayer is EsriImageLayerEntryConfig => {
  return layerConfigIsEsriImageFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsImageStaticFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeImageStaticLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.IMAGE_STATIC;
};

export const layerEntryIsImageStaticFromConfig = (
  verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps
): verifyIfLayer is ImageStaticLayerEntryConfig => {
  return layerConfigIsImageStaticFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsVectorTilesFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeVectorTilesConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.VECTOR_TILES;
};

export const layerEntryIsVectorTileFromConfig = (
  verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps
): verifyIfLayer is VectorTilesLayerEntryConfig => {
  return layerConfigIsVectorTilesFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsOgcWmsFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWMSLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.WMS;
};

export const layerEntryIsOgcWmsFromConfig = (
  verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps
): verifyIfLayer is OgcWmsLayerEntryConfig => {
  return layerConfigIsOgcWmsFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsXYZTilesFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeXYZTilesConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES;
};

export const layerEntryIsXYZTilesFromConfig = (
  verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps
): verifyIfLayer is XYZTilesLayerEntryConfig => {
  return layerConfigIsXYZTilesFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsCSVFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeCSVLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.CSV;
};

export const layerEntryIsCSVFromConfig = (verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps): verifyIfLayer is CsvLayerEntryConfig => {
  return layerConfigIsCSVFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsWKBFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWkbLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.WKB;
};

export const layerEntryIsWKBFromConfig = (verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps): verifyIfLayer is WkbLayerEntryConfig => {
  return layerConfigIsWKBFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsEsriFeatureFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeEsriFeatureLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE;
};

export const layerEntryIsEsriFeatureFromConfig = (
  verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps
): verifyIfLayer is EsriFeatureLayerEntryConfig => {
  return layerConfigIsEsriFeatureFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsGeoJSONFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeGeoJSONLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.GEOJSON;
};

export const layerEntryIsGeoJSONFromConfig = (
  verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps
): verifyIfLayer is GeoJSONLayerEntryConfig => {
  return layerConfigIsGeoJSONFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsGeoPackageFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeGeoPackageLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.GEOPACKAGE;
};

export const layerEntryIsGeoPackageFromConfig = (
  verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps
): verifyIfLayer is GeoPackageLayerEntryConfig => {
  return layerConfigIsGeoPackageFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsOgcFeatureFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeOgcFeatureLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE;
};

export const layerEntryIsOgcFeatureFromConfig = (
  verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps
): verifyIfLayer is OgcFeatureLayerEntryConfig => {
  return layerConfigIsOgcFeatureFromType(verifyIfLayer?.geoviewLayerConfig);
};

export const layerConfigIsWFSFromType = (verifyIfLayer: TypeGeoviewLayerConfig): verifyIfLayer is TypeWFSLayerConfig => {
  return verifyIfLayer?.geoviewLayerType === CONST_LAYER_TYPES.WFS;
};

export const layerEntryIsWFSFromConfig = (verifyIfLayer: ConfigBaseClass | ConfigBaseClassProps): verifyIfLayer is WfsLayerEntryConfig => {
  return layerConfigIsWFSFromType(verifyIfLayer?.geoviewLayerConfig);
};

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
  Name?: string; // Sometimes not present
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
