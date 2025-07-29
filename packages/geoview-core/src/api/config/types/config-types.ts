/**
 * General Json type
 */
export type { AnySchemaObject } from 'ajv';

// TODO: Remove GEOCORE after refactor
// Definition of the keys used to create the constants of the GeoView layer
export type LayerEntryTypesKey = 'VECTOR' | 'VECTOR_TILE' | 'RASTER_TILE' | 'RASTER_IMAGE' | 'GROUP' | 'GEOCORE' | 'SHAPEFILE';

// Definition of the keys used to create the constants of the GeoView layer
export type LayerTypesKey =
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
  | 'WMS';
