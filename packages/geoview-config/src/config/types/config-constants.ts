import { AbstractGeoviewLayerConfig } from './classes/geoview-config/abstract-geoview-layer-config';
import { LayerEntryTypesKey, LayerTypesKey, TypeGeoviewLayerType } from './config-types';
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
  TypeValidVersions,
  TypeViewSettings,
} from './map-schema-types';

/** The default geocore url */
export const CONFIG_GEOCORE_URL = 'https://geocore-stage.api.geo.ca';

/** The default geolocator url */
export const CONFIG_GEOLOCATOR_URL = 'https://geolocator.api.geo.ca?keys=geonames,nominatim,locate';

// Constants for the layer config types
export const CONST_LAYER_ENTRY_TYPES: Record<LayerEntryTypesKey, TypeLayerEntryType> = {
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
export type TypeGeoviewLayerTypeWithGeoCore = TypeGeoviewLayerType | typeof CONST_LAYER_ENTRY_TYPES.GEOCORE;

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
  WMS: 'ogcWms',
};

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
};

/** ******************************************************************************************************************************
 *  Definition of the basemap options type.
 */
export const VALID_BASEMAP_ID: TypeBasemapId[] = ['transport', 'osm', 'simple', 'nogeom', 'shaded'];

/** ******************************************************************************************************************************
 *  Definition of the MapFeaturesConfig default values.
 */
export const DEFAULT_MAP_FEATURES_CONFIG = {
  gvMap: {
    interaction: 'dynamic' as TypeInteraction,
    viewSettings: {
      zoom: 4,
      center: [-100, 60],
      projection: 3978,
      enableRotation: true,
      rotation: 0,
      states: {
        highlight: true,
        hover: true,
        opacity: true,
        query: true,
        remove: true,
        table: true,
        visibility: true,
        zoom: true,
      },
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
    geocoreUrl: CONFIG_GEOCORE_URL,
    geolocator: CONFIG_GEOLOCATOR_URL,
  } as TypeServiceUrls,
  schemaVersionUsed: '1.0' as TypeValidVersions,
};
