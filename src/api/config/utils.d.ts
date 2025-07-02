import { TypeGeoviewLayerType, TypeLayerEntryType } from '@/api/config/types/map-schema-types';
type NewType = TypeGeoviewLayerType;
/**
 * Definition of the GeoView layer entry types for each type of Geoview layer
 */
export declare const convertLayerTypeToEntry: (layerType: NewType) => TypeLayerEntryType;
/**
 * Validate a section of the configuration against the schema identified by the schema path.
 *
 * @param {string} schemaPath The path to the schema section to use for the validation.
 * @param {object} targetObject The map feature configuration to validate.
 *
 * @returns {boolean} A boolean indicating that the schema section is valid (true) or invalide (false).
 */
export declare function isvalidComparedToInputSchema(schemaPath: string, targetObject: object): boolean;
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
export declare function isvalidComparedToInternalSchema(schemaPath: string, targetObject: object, useInternalSchema?: boolean): boolean;
export {};
//# sourceMappingURL=utils.d.ts.map