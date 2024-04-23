// TODO: When we are done with the config extraction, do a review of all the constants, types and utilities to
// TODOCONT: remove code duplication.

import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { LayerEntryTypesKey, LayerTypesKey, TypeGeoviewLayerType } from '@config/types/config-types';
import {
  TypeAppBarProps,
  TypeBasemapId,
  TypeBasemapOptions,
  TypeDisplayTheme,
  TypeInteraction,
  TypeLayerEntryType,
  TypeMapConfig,
  TypeNavBarProps,
  TypeOverviewMapProps,
  TypeServiceUrls,
  TypeValidMapProjectionCodes,
  TypeValidVersions,
  TypeViewSettings,
} from '@config/types/map-schema-types';

/** The default geocore url */
export const CV_CONFIG_GEOCORE_URL = 'https://geocore-stage.api.geo.ca';

/** The default geolocator url */
export const CV_CONFIG_GEOLOCATOR_URL = 'https://geolocator.api.geo.ca?keys=geonames,nominatim,locate';

// Constants for the layer config types
export const CV_CONST_SUB_LAYER_TYPES: Record<LayerEntryTypesKey, TypeLayerEntryType> = {
  VECTOR: 'vector',
  VECTOR_TILE: 'vector-tile',
  VECTOR_HEATMAP: 'vector-heatmap',
  RASTER_TILE: 'raster-tile',
  RASTER_IMAGE: 'raster-image',
  GROUP: 'group',
  GEOCORE: 'geoCore',
};

/**
 * This type is created to only be used when validating the configuration schema types.
 * Indeed, GeoCore is not an official Abstract Geoview Layer, but it can be used in schema types.
 */
export type TypeGeoviewLayerTypeWithGeoCore = TypeGeoviewLayerType | typeof CV_CONST_SUB_LAYER_TYPES.GEOCORE;

/**
 * Definition of the GeoView layer constants
 */
export const CV_CONST_LAYER_TYPES: Record<LayerTypesKey, TypeGeoviewLayerType> = {
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
  WMS: 'ogcWms',
};

/**
 * Definition of the sub schema to use for each type of Geoview layer
 */
export const CV_CONST_GEOVIEW_SCHEMA_BY_TYPE: Record<LayerTypesKey, string> = {
  CSV: 'TypeVectorLayerEntryConfig',
  ESRI_DYNAMIC: 'TypeEsriDynamicLayerEntryConfig',
  ESRI_FEATURE: 'TypeVectorLayerEntryConfig',
  ESRI_IMAGE: 'TypeEsriImageLayerEntryConfig',
  IMAGE_STATIC: 'TypeImageStaticLayerEntryConfig',
  GEOJSON: 'TypeVectorLayerEntryConfig',
  GEOPACKAGE: 'TypeVectorLayerEntryConfig',
  XYZ_TILES: 'TypeTileLayerEntryConfig',
  VECTOR_TILES: 'TypeTileLayerEntryConfig',
  OGC_FEATURE: 'TypeVectorLayerEntryConfig',
  WFS: 'TypeVectorLayerEntryConfig',
  WMS: 'TypeOgcWmsLayerEntryConfig',
};

export const CV_SCHEMA_PATH: Record<LayerTypesKey, string> = {
  CSV: '',
  ESRI_DYNAMIC: 'https://cgpv/schema#/definitions/TypeEsriDynamicLayerEntryConfig',
  ESRI_FEATURE: 'https://cgpv/schema#/definitions/TypeVectorLayerEntryConfig',
  ESRI_IMAGE: '',
  IMAGE_STATIC: '',
  GEOJSON: '',
  GEOPACKAGE: '',
  XYZ_TILES: '',
  VECTOR_TILES: '',
  OGC_FEATURE: '',
  WFS: '',
  WMS: '',
};
export const CV_MAP_CONFIG_SCHEMA_PATH = 'https://cgpv/schema#/definitions/TypeMapFeaturesInstance';
export const CV_LAYER_GROUP_SCHEMA_PATH = 'https://cgpv/schema#/definitions/TypeLayerGroupEntryConfig';

/** ******************************************************************************************************************************
 *  Definition of the basemap options type.
 */
export const CV_VALID_BASEMAP_ID: TypeBasemapId[] = ['transport', 'osm', 'simple', 'nogeom', 'shaded'];

/** default configuration if provided configuration is missing or wrong */
// valid basemap ids
export const CV_BASEMAP_ID: Record<TypeValidMapProjectionCodes, TypeBasemapId[]> = {
  3857: CV_VALID_BASEMAP_ID,
  3978: CV_VALID_BASEMAP_ID,
};

// valid shaded basemap values for each projection
export const CV_BASEMAP_SHADED: Record<TypeValidMapProjectionCodes, boolean[]> = {
  3857: [true, false],
  3978: [true, false],
};

// valid labeled basemap values for each projection
export const CV_BASEMAP_LABEL: Record<TypeValidMapProjectionCodes, boolean[]> = {
  3857: [true, false],
  3978: [true, false],
};

// valid center levels from each projection
export const CV_MAP_CENTER: Record<TypeValidMapProjectionCodes, Record<string, number[]>> = {
  3857: { lat: [-90, 90], long: [-180, 180] },
  3978: { lat: [40, 90], long: [-140, 40] },
};

/** ******************************************************************************************************************************
 *  Definition of the MapFeaturesConfig default values.
 */
export const CV_DEFAULT_MAP_FEATURES_CONFIG = {
  gvMap: {
    interaction: 'dynamic' as TypeInteraction,
    viewSettings: {
      zoom: 4,
      center: [-100, 60],
      projection: 3978,
      enableRotation: true,
      rotation: 0,
    } as TypeViewSettings,
    basemapOptions: {
      basemapId: 'transport',
      shaded: true,
      labeled: true,
    } as TypeBasemapOptions,
    listOfGeoviewLayerConfig: [] as AbstractGeoviewLayerConfig[],
    extraOptions: {},
  } as TypeMapConfig,
  theme: 'dark' as TypeDisplayTheme,
  components: [],
  appBar: { tabs: { core: ['geolocator'] } } as TypeAppBarProps,
  navBar: ['zoom', 'fullscreen', 'home'] as TypeNavBarProps,
  corePackages: [],
  overviewMap: undefined as TypeOverviewMapProps | undefined,
  serviceUrls: {
    geocoreUrl: CV_CONFIG_GEOCORE_URL,
    geolocator: CV_CONFIG_GEOLOCATOR_URL,
  } as TypeServiceUrls,
  schemaVersionUsed: '1.0' as TypeValidVersions,
};
export const CV_DEFAULT_INITIAL_SETTINGS = {
  controls: {
    highlight: true,
    hover: true,
    opacity: true,
    query: true,
    remove: true,
    table: true,
    visibility: true,
    zoom: true,
  },
};
