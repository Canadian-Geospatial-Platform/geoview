import Ajv from 'ajv';
import addErrors from 'ajv-errors';
import cloneDeep from 'lodash/cloneDeep';

import schema from '@/core/../../schema.json';
import { MapFeatureConfig } from '@/api/config/types/classes/map-feature-config';
import { logger } from '@/core/utils/logger';

/**
 * Validate a section of the configuration against the schema identified by the schema path.
 *
 * @param {string} schemaPath The path to the schema section to use for the validation.
 * @param {object} targetObject The map feature configuration to validate.
 *
 * @returns {boolean} A boolean indicating that the schema section is valid (true) or invalide (false).
 */
export function isvalidComparedToInputSchema(schemaPath: string, targetObject: object): boolean {
  // create a validator object
  const validator = new Ajv({
    strict: false,
    allErrors: true,
  });
  addErrors(validator);

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
        logger.logWarning('='.repeat(200), `\nSchemaPath: ${schemaPath}`, '\nSchema error: ', error, '\nObject affected: ', node);
      }
      return false;
    }
    return true;
  }

  // If the schema is not found, log an error and set the error flag on the target object
  logger.logError(`Cannot find schema ${schemaPath}`);
  (targetObject as MapFeatureConfig)?.setErrorDetectedFlag?.();
  return false;
}

/**
 * Validate a section of the configuration against the schema identified by the schema path.
 * The internal schema is used internally by the viewer when we instanciate or modify a configuration object
 * to make sure nothing has been broken and prove that the GeoView metadata are conform.
 *
 * Since the useInternalSchema is never provided by the users and set internally before the
 * validation call, we use it as a flag to indicate we want to use the internal schema type
 * for the schema validation.
 *
 * The addInternalFlag must be set to true when we want to validate a GeoView layer or a sublayer.
 * All other types have the same definition for the input and internal schemas.
 *
 * @param {string} schemaPath The path to the schema section to use for the validation.
 * @param {object} targetObject The map feature configuration to validate.
 * @param {boolean} useInternalSchema Adds useInternalSchema flag to the object to be validated.
 *
 * @returns {boolean} A boolean indicating that the schema section is valid (true) or invalide (false).
 */
export function isvalidComparedToInternalSchema(schemaPath: string, targetObject: object, useInternalSchema: boolean = false): boolean {
  // The clone operation copies only the public properties, no private using #.
  const targetObjectToValidate: object = cloneDeep(targetObject);
  if (useInternalSchema) Object.assign(targetObjectToValidate, { useInternalSchema });
  return isvalidComparedToInputSchema(schemaPath, targetObjectToValidate);
}
