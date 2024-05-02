// TODO: When we are done with the config extraction, do a review of all the constants, types and utilities to
// TODOCONT: remove code duplication.

import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { LayerEntryTypesKey, LayerTypesKey, TypeGeoviewLayerType } from '@config/types/config-types';
import {
  TypeAppBarProps,
  TypeBasemapId,
  TypeBasemapOptions,
  TypeDisplayTheme,
  TypeExternalPackages,
  TypeFooterBarProps,
  TypeInteraction,
  TypeLayerEntryType,
  TypeListOfLocalizedLanguages,
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
export const CV_CONST_LEAF_LAYER_SCHEMA_PATH: Record<LayerTypesKey, string> = {
  CSV: 'https://cgpv/schema#/definitions/TypeVectorLayerEntryConfig',
  ESRI_DYNAMIC: 'https://cgpv/schema#/definitions/TypeEsriDynamicLayerEntryConfig',
  ESRI_FEATURE: 'https://cgpv/schema#/definitions/TypeVectorLayerEntryConfig',
  ESRI_IMAGE: 'https://cgpv/schema#/definitions/TypeEsriImageLayerEntryConfig',
  IMAGE_STATIC: 'https://cgpv/schema#/definitions/TypeImageStaticLayerEntryConfig',
  GEOJSON: 'https://cgpv/schema#/definitions/TypeVectorLayerEntryConfig',
  GEOPACKAGE: 'https://cgpv/schema#/definitions/TypeVectorLayerEntryConfig',
  XYZ_TILES: 'https://cgpv/schema#/definitions/TypeTileLayerEntryConfig',
  VECTOR_TILES: 'Thttps://cgpv/schema#/definitions/ypeTileLayerEntryConfig',
  OGC_FEATURE: 'https://cgpv/schema#/definitions/TypeVectorLayerEntryConfig',
  WFS: 'https://cgpv/schema#/definitions/TypeVectorLayerEntryConfig',
  WMS: 'https://cgpv/schema#/definitions/TypeOgcWmsLayerEntryConfig',
};

export const CV_GEOVIEW_SCHEMA_PATH: Record<LayerTypesKey, string> = {
  CSV: '',
  ESRI_DYNAMIC: 'https://cgpv/schema#/definitions/TypeGeoviewLayerConfig',
  ESRI_FEATURE: 'https://cgpv/schema#/definitions/TypeGeoviewLayerConfig',
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

// extents for each projection
export const CV_MAP_EXTENTS: Record<TypeValidMapProjectionCodes, number[]> = {
  3857: [-150, 38, -40, 84],
  3978: [-125, 30, -60, 89],
};

/** ******************************************************************************************************************************
 *  Definition of the MapFeaturesConfig default values.
 */
export const CV_DEFAULT_MAP_FEATURES_CONFIG = {
  gvMap: {
    interaction: 'dynamic' as TypeInteraction,
    viewSettings: {
      initialView: {
        zoomAndCenter: [3.5, [-90, 60]],
      },
      enableRotation: true,
      rotation: 0,
      minZoom: 0,
      maxZoom: 50,
      maxExtent: [-125, 30, -60, 89],
      projection: 3978,
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
  components: ['north-arrow', 'overview-map'],
  appBar: { tabs: { core: ['geolocator'] } } as TypeAppBarProps,
  footerBar: {} as TypeFooterBarProps,
  navBar: ['zoom', 'fullscreen', 'home'] as TypeNavBarProps,
  corePackages: [],
  overviewMap: undefined as TypeOverviewMapProps | undefined,
  externalPackages: [] as TypeExternalPackages,
  serviceUrls: {
    geocoreUrl: CV_CONFIG_GEOCORE_URL,
    geolocator: CV_CONFIG_GEOLOCATOR_URL,
  } as TypeServiceUrls,
  supportedLanguages: ['en', 'fr'] as TypeListOfLocalizedLanguages,
  schemaVersionUsed: '1.0' as TypeValidVersions,
};
export const CV_DEFAULT_LAYER_INITIAL_SETTINGS = {
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
