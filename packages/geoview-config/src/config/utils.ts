import Ajv from 'ajv';
import { logger } from 'geoview-core/src/core/utils/logger';
import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LAYER_TYPES } from './types/config-constants';
import { TypeGeoviewLayerType, TypeJsonObject } from './types/config-types';
import { TypeLayerEntryType } from './types/map-schema-types';

import schema from '../../schema.json';
import { ConfigBaseClass } from './types/classes/sub-layer-config/config-base-class';
import { MapFeaturesConfig } from './types/classes/map-features-config';

type NewType = TypeGeoviewLayerType;

/**
 * Definition of the GeoView layer entry types for each type of Geoview layer
 */
export const convertLayerTypeToEntry = (layerType: NewType): TypeLayerEntryType => {
  switch (layerType) {
    case CV_CONST_LAYER_TYPES.CSV:
    case CV_CONST_LAYER_TYPES.GEOJSON:
    case CV_CONST_LAYER_TYPES.GEOPACKAGE:
    case CV_CONST_LAYER_TYPES.OGC_FEATURE:
    case CV_CONST_LAYER_TYPES.WFS:
    case CV_CONST_LAYER_TYPES.ESRI_FEATURE:
      return CV_CONST_SUB_LAYER_TYPES.VECTOR;

    case CV_CONST_LAYER_TYPES.IMAGE_STATIC:
    case CV_CONST_LAYER_TYPES.ESRI_DYNAMIC:
    case CV_CONST_LAYER_TYPES.ESRI_IMAGE:
    case CV_CONST_LAYER_TYPES.WMS:
      return CV_CONST_SUB_LAYER_TYPES.RASTER_IMAGE;
    case CV_CONST_LAYER_TYPES.XYZ_TILES:
    case CV_CONST_LAYER_TYPES.VECTOR_TILES:
      return CV_CONST_SUB_LAYER_TYPES.RASTER_TILE;
    default:
      // Throw unsupported error
      throw new Error(`Unsupported layer type ${layerType} to convert to layer entry`);
  }
};

/** ***************************************************************************************************************************
 * Validate the map features configuration.
 * @param {MapFeaturesConfig} mapFeaturesConfigToValidate The map features configuration to validate.
 *
 * @returns {MapFeaturesConfig} A valid map features configuration.
 */
export function validateAgainstSchema(
  ConfigToValidate: TypeJsonObject,
  schemaPath: string,
  targetObject?: MapFeaturesConfig | ConfigBaseClass
): boolean {
  // create a validator object
  const validator = new Ajv({
    strict: false,
    allErrors: false,
  });

  // initialize validator with schema file
  validator.compile(schema);

  const validate = validator.getSchema(schemaPath);

  if (validate) {
    // validate configuration
    const valid = validate(ConfigToValidate);

    // If an error is detected, print it in the logger
    if (!valid) {
      for (let i = 0; i < validate.errors!.length; i += 1) {
        const error = validate.errors![i];
        const { instancePath } = error;
        const path = instancePath.split('/');
        let node = ConfigToValidate;
        for (let j = 1; j < path.length; j++) {
          node = node[path[j]];
        }
        logger.logWarning('='.repeat(200), 'Schema error: ', error, 'Object affected: ', node);
      }
      targetObject?.propagateError?.();
      return false;
    }
    return true;
  }
  logger.logError(`Cannot find schema ${schemaPath}`);
  targetObject?.propagateError?.();
  return false;
}
