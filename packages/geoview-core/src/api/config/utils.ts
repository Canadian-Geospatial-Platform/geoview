import Ajv from 'ajv';

import { CV_CONST_SUB_LAYER_TYPES, CV_CONST_LAYER_TYPES } from '@config/types/config-constants';
import { TypeGeoviewLayerType, TypeJsonArray, TypeJsonObject } from '@config/types/config-types';
import { TypeLayerEntryType, TypeLayerInitialSettings, TypeLocalizedString } from '@config/types/map-schema-types';
import schema from '@config/types/config-validation-schema.json';
import { ConfigBaseClass } from '@config/types/classes/sub-layer-config/config-base-class';
import { MapFeaturesConfig } from '@config/types/classes/map-features-config';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { layerEntryIsGroupLayer } from '@config/types/type-guards';
import { GroupLayerEntryConfig } from '@config/types/classes/sub-layer-config/group-layer-entry-config';
import { AbstractBaseLayerEntryConfig } from '@config/types/classes/sub-layer-config/abstract-base-layer-entry-config';
import { logger } from '@/core/utils/logger';

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
export function isvalidComparedToSchema(schemaPath: string, targetObject: object): boolean {
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
    const valid = validate(targetObject);

    // If an error is detected, print it in the logger
    if (!valid) {
      for (let i = 0; i < validate.errors!.length; i += 1) {
        const error = validate.errors![i];
        const { instancePath } = error;
        const path = instancePath.split('/');
        let node = targetObject as Record<string, unknown>;
        for (let j = 1; j < path.length; j++) {
          node = node[path[j]] as Record<string, unknown>;
        }
        logger.logWarning('='.repeat(200), '\nSchema error: ', error, '\nObject affected: ', node);
      }
      (targetObject as MapFeaturesConfig | ConfigBaseClass)?.propagateError?.();
      return false;
    }
    return true;
  }
  logger.logError(`Cannot find schema ${schemaPath}`);
  (targetObject as MapFeaturesConfig | ConfigBaseClass)?.propagateError?.();
  return false;
}

/** ***************************************************************************************************************************
 * Normalize the localized string parameter. If a language is set and the other is not, the undefined language is set to
 * the value of the other.
 * @param {TypeLocalizedString | TypeJsonObject} localizedString The localized string to normalize.
 *
 * @returns {TypeLocalizedString} A normalized localized string.
 */
export function normalizeLocalizedString(localizedString: TypeLocalizedString | TypeJsonObject): TypeLocalizedString | undefined {
  if (localizedString) {
    // GV: param reassign is needed since we want both properties 'en' and 'fr' to be set.
    // GV: If only one is set, we use the value of the other one
    // eslint-disable-next-line no-param-reassign
    if ('en' in localizedString && !('fr' in localizedString)) localizedString.fr = localizedString.en;
    // eslint-disable-next-line no-param-reassign
    if ('fr' in localizedString && !('en' in localizedString)) localizedString.en = localizedString.fr;
    return localizedString as TypeLocalizedString;
  }
  return undefined;
}

/**
 * Create the list of layer entries using the configuration provided.
 *
 * @param {TypeJsonObject} listOfJsonLayerConfig The list of layer entries to create.
 * @param {TypeLayerInitialSettings} initialSettings The initial settings inherited.
 * @param {AbstractGeoviewLayerConfig | undefined} geoviewInstance The GeoView instance that owns the sub layer.
 *
 * @returns {ConfigBaseClass[]} The array of sub layer instances.
 */
export async function getListOfLayerEntryConfig(
  listOfJsonLayerConfig: TypeJsonObject,
  initialSettings: TypeLayerInitialSettings,
  geoviewInstance: AbstractGeoviewLayerConfig
): Promise<ConfigBaseClass[]> {
  const listOfLayerEntryConfig = (listOfJsonLayerConfig || []) as TypeJsonArray;
  const promisesOfsubLayers: Promise<ConfigBaseClass | undefined>[] = [];
  listOfLayerEntryConfig.forEach((subLayerConfig) => {
    if (layerEntryIsGroupLayer(subLayerConfig)) {
      promisesOfsubLayers.push(GroupLayerEntryConfig.getInstance(subLayerConfig, initialSettings, geoviewInstance));
    } else {
      promisesOfsubLayers.push(AbstractBaseLayerEntryConfig.getInstance(subLayerConfig, initialSettings, geoviewInstance));
    }
  });
  const promisedAllSettled = await Promise.allSettled(promisesOfsubLayers);
  return promisedAllSettled
    .map((node) => {
      return node.status === 'fulfilled' && node.value ? node.value : undefined;
    })
    .filter((node) => {
      return node;
    }) as ConfigBaseClass[];
}
