/**
 * Cast a variable to a different type
 *
 * @param {unkown} p a variable to cast to
 *
 * @returns the casted variable as the new type
 */
export function Cast<TargetType = never>(p: unknown): TargetType {
  return p as TargetType;
}

/**
 * General Json type
 */
/**
 * Type used for a value within a json object
 */
export type TypeJsonValue = null | string | number | boolean | TypeJsonObject[] | { [key: string]: TypeJsonObject };

/**
 * Type used for an array of objects
 */
export type TypeJsonArray = TypeJsonValue & TypeJsonObject[];

/**
 * Type used for a json object
 */
export type TypeJsonObject = TypeJsonValue & { [key: string]: TypeJsonObject };

/**
 * Convert a type of a variable to json object
 *
 * @param {unkown} p an object to convert its type to a json object
 *
 * @returns the variable with the type converted to a json object
 */
export function toJsonObject(p: unknown): TypeJsonObject {
  if (!(p instanceof Object) || p instanceof Array) {
    throw new Error(`Can't convert parameter to TypeJsonObject! typeof = ${typeof p}`);
  }

  return p as TypeJsonObject;
}

// Definition of the keys used to create the constants of the GeoView layer
export type LayerEntryTypesKey = 'VECTOR' | 'VECTOR_TILE' | 'RASTER_TILE' | 'RASTER_IMAGE' | 'GROUP';

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

/**
 * Type of GeoView layers
 */
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
  | 'xyzTiles';
