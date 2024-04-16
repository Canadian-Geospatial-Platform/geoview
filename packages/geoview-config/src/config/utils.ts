import i18n from 'i18next';

import Ajv from 'ajv';
import { replaceParams } from '../utilities';
import { logger } from '../logger';
import { CONST_LAYER_ENTRY_TYPES, CONST_LAYER_TYPES } from './types/config-constants';
import { TypeGeoviewLayerType, TypeJsonObject } from './types/config-types';
import { TypeDisplayLanguage, TypeLayerEntryType } from './types/map-schema-types';

import schema from '../../schema.json';
import { ConfigBaseClass } from './types/classes/layer-tree-config/config-base-class';
import { MapFeaturesConfig } from './types/classes/map-features-config';

type NewType = TypeGeoviewLayerType;

/**
 * Definition of the GeoView layer entry types for each type of Geoview layer
 */
export const convertLayerTypeToEntry = (layerType: NewType): TypeLayerEntryType => {
  switch (layerType) {
    case CONST_LAYER_TYPES.CSV:
    case CONST_LAYER_TYPES.GEOJSON:
    case CONST_LAYER_TYPES.GEOPACKAGE:
    case CONST_LAYER_TYPES.OGC_FEATURE:
    case CONST_LAYER_TYPES.WFS:
    case CONST_LAYER_TYPES.ESRI_FEATURE:
      return CONST_LAYER_ENTRY_TYPES.VECTOR;

    case CONST_LAYER_TYPES.IMAGE_STATIC:
    case CONST_LAYER_TYPES.ESRI_DYNAMIC:
    case CONST_LAYER_TYPES.ESRI_IMAGE:
    case CONST_LAYER_TYPES.WMS:
      return CONST_LAYER_ENTRY_TYPES.RASTER_IMAGE;
    case CONST_LAYER_TYPES.XYZ_TILES:
    case CONST_LAYER_TYPES.VECTOR_TILES:
      return CONST_LAYER_ENTRY_TYPES.RASTER_TILE;
    default:
      // Throw unsupported error
      throw new Error(`Unsupported layer type ${layerType} to convert to layer entry`);
  }
};

/**
 * Return proper language Geoview localized values from map i18n instance
 *
 * @param {string} mapId the map to get the i18n
 * @param {string} localizedKey localize key to get
 * @returns {string} message with values replaced
 */
export function getLocalizedMessage(localizedKey: string, language: TypeDisplayLanguage): string {
  const trans = i18n.getFixedT(language);
  return trans(localizedKey);
}

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
  const message = replaceParams([schemaPath], getLocalizedMessage('validation.schema.wrongPath', 'en'));
  logger.logError(`- ${message}`);
  targetObject?.propagateError?.();
  return false;
}
