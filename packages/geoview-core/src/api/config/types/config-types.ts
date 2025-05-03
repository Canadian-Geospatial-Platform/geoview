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
export type { AnySchemaObject } from 'ajv';

// TODO: REFACTOR (BIG): We should get rid of these types: TypeJsonValue, TypeJsonObject and TypeJsonArray which
// TO.DOCONT: have 3 problems and is a source of many issues througout our code base:

// TO.DOCONT: 1) Self-referential:
// TO.DOCONT: TypeJsonValue and TypeJsonObject are defined as objects which values are also TypeJsonObject — it’s infinitely recursive without
// TO.DOCONT: a base case, and makes no sense for real JSON data (e.g., strings, numbers, arrays, etc.).
// TO.DOCONT: 2) Unsafe intersection:
// TO.DOCONT: TypeJsonValue & TypeJsonObject[] and TypeJsonValue & {...} create intersections that are not meaningful.
// TO.DOCONT: They just mask the 'any' keword or confuse TypeScript into thinking a value is more constrained than it really is — when it's not.
// TO.DOCONT: 3) An 'any' in disguise:
// TO.DOCONT: This pattern was likely invented to avoid ESLint warnings like no-explicit-any without providing any meaningful type safety.
// TO.DOCONT: We should use 'unknown' and 'any' honestly and explicitely in the codebase.

// TO.DOCONT: Alternatively, if we do want to maintain the concept, we could replace those types with the following types.
// TO.DOCONT: export type JsonPrimitive = string | number | boolean | null;
// TO.DOCONT: export type JsonValue = JsonPrimitive | JsonArray | JsonObject;
// TO.DOCONT: export interface JsonObject {
// TO.DOCONT:   [key: string]: JsonValue;
// TO.DOCONT: }
// TO.DOCONT: export type JsonArray = JsonValue[];

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

// TODO: Remove GEOCORE after refactor
// Definition of the keys used to create the constants of the GeoView layer
export type LayerEntryTypesKey = 'VECTOR' | 'VECTOR_TILE' | 'RASTER_TILE' | 'RASTER_IMAGE' | 'GROUP' | 'GEOCORE';

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
