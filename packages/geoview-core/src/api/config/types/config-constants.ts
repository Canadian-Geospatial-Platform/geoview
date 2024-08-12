// TODO: When we are done with the config extraction, do a review of all the constants, types and utilities to
// TO.DOCONT: remove code duplication.

import { Cast, LayerEntryTypesKey, LayerTypesKey } from '@config/types/config-types';
import { MapFeatureConfig } from '@config/types/classes/map-feature-config';
import {
  TypeBasemapId,
  TypeDisplayLanguage,
  TypeDisplayTheme,
  TypeInteraction,
  TypeLayerEntryType,
  TypeValidMapProjectionCodes,
  TypeValidVersions,
  TypeGeoviewLayerType,
} from '@config/types/map-schema-types';

/** The default geocore url */
export const CV_CONFIG_GEOCORE_URL = 'https://geocore.api.geo.ca';

/** The default geolocator url */
export const CV_CONFIG_GEOLOCATOR_URL = 'https://geolocator.api.geo.ca?keys=geonames,nominatim,locate';

/** The default geolocator url */
export const CV_CONFIG_PROXY_URL = 'https://maps.canada.ca/wmsproxy/ws/wmsproxy/executeFromProxy';

export const CV_CONFIG_GEOCORE_TYPE = 'geoCore';

// Constants for the layer config types
export const CV_CONST_SUB_LAYER_TYPES: Record<LayerEntryTypesKey, TypeLayerEntryType> = {
  VECTOR: 'vector',
  VECTOR_TILE: 'vector-tile',
  RASTER_TILE: 'raster-tile',
  RASTER_IMAGE: 'raster-image',
  GROUP: 'group',
};

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
  CSV: 'https://cgpv/schema#/definitions/VectorLayerEntryConfig',
  ESRI_DYNAMIC: 'https://cgpv/schema#/definitions/EsriDynamicLayerEntryConfig',
  ESRI_FEATURE: 'https://cgpv/schema#/definitions/EsriFeatureLayerEntryConfig',
  ESRI_IMAGE: 'https://cgpv/schema#/definitions/EsriImageLayerEntryConfig',
  IMAGE_STATIC: 'https://cgpv/schema#/definitions/ImageStaticLayerEntryConfig',
  GEOJSON: 'https://cgpv/schema#/definitions/VectorLayerEntryConfig',
  GEOPACKAGE: 'https://cgpv/schema#/definitions/VectorLayerEntryConfig',
  XYZ_TILES: 'https://cgpv/schema#/definitions/TileLayerEntryConfig',
  VECTOR_TILES: 'Thttps://cgpv/schema#/definitions/TileLayerEntryConfig',
  OGC_FEATURE: 'https://cgpv/schema#/definitions/VectorLayerEntryConfig',
  WFS: 'https://cgpv/schema#/definitions/VectorLayerEntryConfig',
  WMS: 'https://cgpv/schema#/definitions/OgcWmsLayerEntryConfig',
};

export const CV_GEOVIEW_SCHEMA_PATH: Record<LayerTypesKey, string> = {
  CSV: '',
  ESRI_DYNAMIC: 'https://cgpv/schema#/definitions/EsriDynamicLayerConfig',
  ESRI_FEATURE: 'https://cgpv/schema#/definitions/EsriFeatureLayerConfig',
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
export const CV_MAP_CONFIG_SCHEMA_PATH = 'https://cgpv/schema#/definitions/MapFeatureConfig';
export const CV_LAYER_GROUP_SCHEMA_PATH = 'https://cgpv/schema#/definitions/GroupLayerEntryConfig';

/** Array of schema versions accepted by the viewer. */
export const ACCEPTED_SCHEMA_VERSIONS: TypeValidVersions[] = ['1.0'];

/** Constante mainly use for language validation. */
export const VALID_DISPLAY_LANGUAGE: TypeDisplayLanguage[] = ['en', 'fr'];

/** Array of valid geoview themes. */
export const VALID_DISPLAY_THEME: TypeDisplayTheme[] = ['dark', 'light', 'geo.ca'];

/** Constante mainly use for interaction validation. */
export const VALID_INTERACTION: TypeInteraction[] = ['static', 'dynamic'];

/** Constant mainly used to test if a TypeValidMapProjectionCodes variable is a valid projection codes. */
export const VALID_PROJECTION_CODES = [3978, 3857];

/**
 *  Definition of the basemap options type.
 */
export const CV_VALID_BASEMAP_ID: TypeBasemapId[] = ['transport', 'osm', 'simple', 'nogeom', 'shaded', 'imagery'];

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
export const CV_VALID_MAP_CENTER: Record<TypeValidMapProjectionCodes, Record<string, number[]>> = {
  3857: { lat: [-90, 90], long: [-180, 180] },
  3978: { lat: [40, 90], long: [-140, 40] },
};

// extents and center for each projection
export const CV_MAP_EXTENTS: Record<TypeValidMapProjectionCodes, number[]> = {
  3857: [-170, 35, -20, 84],
  3978: [-135, 25, -50, 89],
};
export const CV_MAP_CENTER: Record<TypeValidMapProjectionCodes, number[]> = {
  3857: [-90, 55],
  3978: [-90, 60],
};

/**
 *  Definition of the MapFeatureConfig default values. All the default values that applies to the map feature configuration are
 * defined here.
 */
// TODO: Revise default values.
// GV: The Cast operation doesn't create a real MapFeatureConfig instance because methods are missing.
// GV: We do that only to create an object that has the default values who can be accessed using the instance property names.
export const CV_DEFAULT_MAP_FEATURE_CONFIG = Cast<MapFeatureConfig>({
  map: {
    basemapOptions: {
      basemapId: 'transport',
      shaded: true,
      labeled: true,
    },
    interaction: 'dynamic',
    listOfGeoviewLayerConfig: [],
    highlightColor: 'black',
    viewSettings: {
      initialView: {
        zoomAndCenter: [3.5, CV_MAP_CENTER[3978]],
      },
      enableRotation: true,
      rotation: 0,
      minZoom: 0,
      maxZoom: 50,
      maxExtent: CV_MAP_EXTENTS[3978],
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
  overviewMap: { hideOnZoom: 0 },
  externalPackages: [],
  serviceUrls: {
    geocoreUrl: CV_CONFIG_GEOCORE_URL,
    geolocator: CV_CONFIG_GEOLOCATOR_URL,
    proxyUrl: CV_CONFIG_PROXY_URL,
  },
  globalSettings: { canRemoveSublayers: true },
  schemaVersionUsed: '1.0',
});

/**
 *  Definition of the initial settings default values.
 */
export const CV_DEFAULT_LAYER_INITIAL_SETTINGS = {
  controls: {
    highlight: true,
    hover: true,
    opacity: true,
    query: false,
    remove: true,
    table: true,
    visibility: true,
    zoom: true,
  },
  states: {
    visible: true,
    opacity: 1,
    hoverable: true,
    queryable: false,
  },
};

/**
 * Definition of the default order of the tabs inside appbar
 */
export const CV_DEFAULT_APPBAR_TABS_ORDER = [
  'geolocator',
  'aoi-panel',
  'custom-legend-panel',
  'legend',
  'layers',
  'details',
  'data-table',
  'basemap-panel',
  'guide',
];

export const CV_DEFAULT_APPBAR_CORE = {
  GEOLOCATOR: 'geolocator',
  EXPORT: 'export',
  GUIDE: 'guide',
  DETAILS: 'details',
  LEGEND: 'legend',
  DATA_TABLE: 'data-table',
  LAYERS: 'layers',
} as const;
