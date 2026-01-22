import Ajv from 'ajv';
import type { AnyValidateFunction } from 'ajv/dist/types';

import type {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  MapConfigLayerEntry,
  TypeGeoviewLayerType,
  ConfigClassOrType,
} from '@/api/types/layer-schema-types';
import {
  CONST_LAYER_TYPES,
  CONST_GEOVIEW_SCHEMA_BY_TYPE,
  mapConfigLayerEntryIsGeoCore,
  mapConfigLayerEntryIsGeoPackage,
  mapConfigLayerEntryIsShapefile,
  mapConfigLayerEntryIsRCS,
} from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';

import schema from '@/core/../../schema.json';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { CsvLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { GeoTIFFLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';
import { ImageStaticLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { KmlLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/kml-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { VectorTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { XYZTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import type { GroupLayerEntryConfigProps } from '@/api/config/validation-classes/group-layer-entry-config';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';

import { LayerMetadataAccessPathMandatoryError, LayerMissingGeoviewLayerIdError } from '@/core/exceptions/layer-exceptions';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';
import { deepClone, deepMerge } from '@/core/utils/utilities';

/**
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
export class ConfigValidation {
  /**
   * Print a trace to help locate schema errors.
   * @param {AnyValidateFunction<unknown>} validate - The Ajv validator.
   * @param {unknown} objectAffected - Object that was validated.
   * @return {void}
   * @static
   * @private
   */
  static #printSchemaError(validate: AnyValidateFunction<unknown>, objectAffected: unknown): void {
    for (let i = 0; i < validate.errors!.length; i += 1) {
      const error = validate.errors![i];
      const { instancePath } = error;
      const path = instancePath.split('/');
      let node = objectAffected;
      for (let j = 1; j < path.length; j += 1) {
        // Node can be any type, use any and be cautious
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        node = (node as any)[path[j]];
      }
      logger.logWarning('Schema error: ', error, 'Object affected: ', node);
    }
  }

  /**
   * Validate the configuration of the map features against the TypeMapFeaturesInstance defined in the schema.
   * @param {TypeGeoviewLayerType} geoviewLayerType - The GeoView layer type to validate.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entry configurations to validate.
   * @param {Ajv} validator - The schema validator to use.
   * @return {TypeMapFeaturesConfig} A valid map features configuration.
   * @static
   * @private
   */
  static #isValidTypeListOfLayerEntryConfig(
    geoviewLayerType: TypeGeoviewLayerType,
    listOfLayerEntryConfig: TypeLayerEntryConfig[],
    validator: Ajv,
    onErrorCallback: ErrorCallbackDelegate
  ): boolean {
    const layerSchemaPath = `https://cgpv/schema#/definitions/${CONST_GEOVIEW_SCHEMA_BY_TYPE[geoviewLayerType]}`;
    const groupSchemaPath = `https://cgpv/schema#/definitions/TypeLayerGroupEntryConfig`;

    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      const schemaPath = ConfigBaseClass.getClassOrTypeEntryTypeIsGroup(listOfLayerEntryConfig[i]) ? groupSchemaPath : layerSchemaPath;
      const validate = validator.getSchema(schemaPath);

      if (!validate) {
        // Callback about the error
        onErrorCallback('validation.schema.wrongPath', [schemaPath]);
        return false;
      }

      // validate configuration
      const valid = validate(listOfLayerEntryConfig[i]);

      if (!valid) {
        ConfigValidation.#printSchemaError(validate, listOfLayerEntryConfig[i]);
        return false;
      }
    }

    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      if (
        ConfigBaseClass.getClassOrTypeEntryTypeIsGroup(listOfLayerEntryConfig[i]) &&
        !ConfigValidation.#isValidTypeListOfLayerEntryConfig(
          geoviewLayerType,
          listOfLayerEntryConfig[i].listOfLayerEntryConfig,
          validator,
          onErrorCallback
        )
      )
        return false;
    }
    return true;
  }

  /**
   * Validate the map features configuration.
   * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The map features configuration to validate.
   * @return {MapConfigLayerEntry[]} A valid map features configuration.
   * @static
   */
  static validateLayersConfigAgainstSchema(
    listOfGeoviewLayerConfig: MapConfigLayerEntry[],
    onErrorCallback: ErrorCallbackDelegate
  ): MapConfigLayerEntry[] {
    // create a validator object
    const validator = new Ajv({
      strict: false,
      allErrors: false,
    });

    // initialize validator with schema file
    validator.compile(schema);

    let isValid = true; //  this.#isValidTypeMapFeaturesInstance(mapFeaturesConfigToValidate, validator);
    for (let i = 0; i < listOfGeoviewLayerConfig.length && isValid; i++) {
      // If not GeoCore, validate the geoview configuration with the schema.
      // GeoCore doesn't have schema validation as part of the routine below, because they're not a TypeGeoviewLayerType anymore
      if (
        !mapConfigLayerEntryIsGeoCore(listOfGeoviewLayerConfig[i]) &&
        !mapConfigLayerEntryIsShapefile(listOfGeoviewLayerConfig[i]) &&
        !mapConfigLayerEntryIsGeoPackage(listOfGeoviewLayerConfig[i]) &&
        !mapConfigLayerEntryIsRCS(listOfGeoviewLayerConfig[i])
      ) {
        const gvLayerConfigCasted = listOfGeoviewLayerConfig[i] as TypeGeoviewLayerConfig;
        isValid = ConfigValidation.#isValidTypeListOfLayerEntryConfig(
          gvLayerConfigCasted.geoviewLayerType,
          gvLayerConfigCasted.listOfLayerEntryConfig,
          validator,
          onErrorCallback
        );
      }
    }

    ConfigValidation.validateListOfGeoviewLayerConfig(listOfGeoviewLayerConfig);

    return listOfGeoviewLayerConfig;
  }

  /**
   * Validate and adjust the list of GeoView layer configuration.
   * Errors, when expected, are logged and not thrown so that each MapConfigLayerEntry can be processed independently.
   * @param {MapConfigLayerEntry[]} [listOfMapConfigLayerEntry] - The list of GeoView layer configuration to adjust and validate.
   * @return {void}
   * @static
   */
  static validateListOfGeoviewLayerConfig(listOfMapConfigLayerEntry?: MapConfigLayerEntry[]): void {
    if (listOfMapConfigLayerEntry) {
      // Track only valid entries
      const validConfigs: typeof listOfMapConfigLayerEntry = [];

      // Loop on each geoview layer config
      listOfMapConfigLayerEntry.forEach((geoviewLayerConfig) => {
        if (
          mapConfigLayerEntryIsGeoCore(geoviewLayerConfig) ||
          mapConfigLayerEntryIsShapefile(geoviewLayerConfig) ||
          mapConfigLayerEntryIsGeoPackage(geoviewLayerConfig) ||
          mapConfigLayerEntryIsRCS(geoviewLayerConfig)
        ) {
          // As-is we keep it
          validConfigs.push(geoviewLayerConfig);
        } else {
          try {
            // Validate the geoview layer config, will throw an exception when invalid
            ConfigValidation.#validateGeoviewLayerConfig(geoviewLayerConfig);

            // Process the layer entry config
            ConfigValidation.#processLayerEntryConfig(geoviewLayerConfig, geoviewLayerConfig.listOfLayerEntryConfig);

            // Add it as a valid entry
            validConfigs.push(geoviewLayerConfig);
          } catch (error: unknown) {
            // An error happened with a geoview layer config, log and continue with the others
            GeoViewError.logError(error);
          }
        }
      });
      // We're done processing the listOfMapConfigLayerEntry and we only have valid ones in the validConfigs list
      // Repopulate the original array
      listOfMapConfigLayerEntry.splice(0, listOfMapConfigLayerEntry.length, ...validConfigs);
    }
  }

  /**
   * Validates a GeoView layer configuration object and throws descriptive
   * errors when required properties are missing or invalid.
   * Validation rules:
   *  - `geoviewLayerId` must always be defined.
   *  - For specific layer types (ESRI Dynamic, ESRI Feature, ESRI Image,
   *    OGC Feature, WFS, WMS), the `metadataAccessPath` property is mandatory.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration object to validate.
   * @return {void}
   * @throws {LayerMissingGeoviewLayerIdError} When `geoviewLayerId` is missing.
   * @throws {LayerMetadataAccessPathMandatoryError} When `metadataAccessPath` is missing.
   * @private
   * @static
   */
  static #validateGeoviewLayerConfig(geoviewLayerConfig: TypeGeoviewLayerConfig): void {
    // Validate the geoview layer id
    if (!geoviewLayerConfig.geoviewLayerId) {
      throw new LayerMissingGeoviewLayerIdError(geoviewLayerConfig.geoviewLayerType);
    }

    // Depending on the geoview layer type
    switch (geoviewLayerConfig.geoviewLayerType) {
      case CONST_LAYER_TYPES.ESRI_DYNAMIC:
      case CONST_LAYER_TYPES.ESRI_FEATURE:
      case CONST_LAYER_TYPES.ESRI_IMAGE:
      case CONST_LAYER_TYPES.OGC_FEATURE:
      case CONST_LAYER_TYPES.WFS:
      case CONST_LAYER_TYPES.WMS:
        // Validate the metadata access path
        if (!geoviewLayerConfig.metadataAccessPath) {
          throw new LayerMetadataAccessPathMandatoryError(
            geoviewLayerConfig.geoviewLayerId,
            geoviewLayerConfig.geoviewLayerType,
            geoviewLayerConfig.geoviewLayerName
          );
        }
        break;
      default:
        // All good
        break;
    }
  }

  /**
   * Process recursively the layer entries to create layers and layer groups.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration to adjust and validate.
   * @param {ConfigClassOrType[]} listOfLayerEntryConfig - The list of layer entry configurations to process.
   * @param {GroupLayerEntryConfig} [parentLayerConfig] - The parent layer configuration of all the layer entry configurations found in the list of layer entries.
   * @return {void}
   * @private
   * @static
   */
  static #processLayerEntryConfig(
    geoviewLayerConfig: TypeGeoviewLayerConfig,
    listOfLayerEntryConfig: ConfigClassOrType[],
    parentLayerConfig?: GroupLayerEntryConfig
  ): void {
    listOfLayerEntryConfig.forEach((layerConfig, i: number) => {
      // Link the entry to its GeoView layer config.
      ConfigBaseClass.setClassOrTypeGeoviewLayerConfig(layerConfig, geoviewLayerConfig);

      // Link the entry to its parent layer configuration if any
      ConfigBaseClass.setClassOrTypeParentLayerConfig(layerConfig, parentLayerConfig);

      // layerConfig.initialSettings attributes that are not defined inherits parent layer settings that are defined.
      const initialSettings = ConfigBaseClass.getClassOrTypeInitialSettings(layerConfig);

      // Get the parent initial settings
      const parentInitialSettings = ConfigBaseClass.getClassOrTypeInitialSettings(parentLayerConfig);

      // If the minZoom is set, validate it with the parent
      if (initialSettings?.minZoom !== undefined) {
        // Validate the minZoom value
        initialSettings.minZoom = Math.max(initialSettings.minZoom, parentInitialSettings?.minZoom || 0);
      }

      // If the maxZoom is set, validate it with the parent
      if (initialSettings?.maxZoom !== undefined) {
        // Validate the maxZoom value
        initialSettings.maxZoom = Math.min(initialSettings.maxZoom, parentInitialSettings?.maxZoom || 23);
      }

      // If the minScale is set, validate it with the parent
      const minScale = ConfigBaseClass.getClassOrTypeMinScale(layerConfig);
      if (minScale !== undefined) {
        // Set the min scale
        ConfigBaseClass.setClassOrTypeMinScale(
          layerConfig,
          Math.min(minScale, ConfigBaseClass.getClassOrTypeMinScale(parentLayerConfig) || Infinity)
        );
      }

      // If the minScale is set, validate it with the parent
      const maxScale = ConfigBaseClass.getClassOrTypeMaxScale(layerConfig);
      if (maxScale !== undefined) {
        // Set the max scale
        ConfigBaseClass.setClassOrTypeMaxScale(
          layerConfig,
          Math.max(maxScale, ConfigBaseClass.getClassOrTypeMaxScale(parentLayerConfig) || 0)
        );
      }

      // If there's a parent initial settings
      if (parentInitialSettings) {
        // Clone the parent properties
        const parentInitialSettingsClone = deepClone(parentInitialSettings);
        // Delete the visible property, because we don't want it to interfere with the layer initial settings when we merge
        delete parentInitialSettingsClone.states?.visible;

        // Merge the rest of parent and child settings
        ConfigBaseClass.setClassOrTypeInitialSettings(layerConfig, deepMerge(parentInitialSettingsClone, initialSettings));
      }

      // Get the properties to be able to create the config object
      const layerConfigProps = ConfigBaseClass.getClassOrTypeLayerEntryProps(layerConfig);

      if (ConfigBaseClass.getClassOrTypeEntryTypeIsGroup(layerConfig)) {
        // We must set the parents of all elements in the group.
        ConfigValidation.#recursivelySetChildParent(geoviewLayerConfig, [layerConfig], parentLayerConfig);
        const parent = new GroupLayerEntryConfig(layerConfigProps as GroupLayerEntryConfigProps);
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = parent;
        ConfigValidation.#processLayerEntryConfig(geoviewLayerConfig, parent.listOfLayerEntryConfig, parent);
      } else if (OgcWmsLayerEntryConfig.isClassOrTypeWMS(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new OgcWmsLayerEntryConfig(layerConfigProps);
      } else if (GeoTIFFLayerEntryConfig.isClassOrTypeGeoTIFF(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new GeoTIFFLayerEntryConfig(layerConfigProps);
      } else if (ImageStaticLayerEntryConfig.isClassOrTypeImageStatic(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new ImageStaticLayerEntryConfig(layerConfigProps);
      } else if (XYZTilesLayerEntryConfig.isClassOrTypeXYZTiles(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new XYZTilesLayerEntryConfig(layerConfigProps);
      } else if (VectorTilesLayerEntryConfig.isClassOrTypeVectorTiles(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new VectorTilesLayerEntryConfig(layerConfigProps);
      } else if (EsriDynamicLayerEntryConfig.isClassOrTypeEsriDynamic(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new EsriDynamicLayerEntryConfig(layerConfigProps);
      } else if (EsriFeatureLayerEntryConfig.isClassOrTypeEsriFeature(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new EsriFeatureLayerEntryConfig(layerConfigProps);
      } else if (EsriImageLayerEntryConfig.isClassOrTypeEsriImage(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new EsriImageLayerEntryConfig(layerConfigProps);
      } else if (OgcWfsLayerEntryConfig.isClassOrTypeWFSLayer(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new OgcWfsLayerEntryConfig(layerConfigProps);
      } else if (OgcFeatureLayerEntryConfig.isClassOrTypeOGCLayer(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new OgcFeatureLayerEntryConfig(layerConfigProps);
      } else if (GeoJSONLayerEntryConfig.isClassOrTypeGeoJSON(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new GeoJSONLayerEntryConfig(layerConfigProps);
      } else if (KmlLayerEntryConfig.isClassOrTypeKMLLayer(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new KmlLayerEntryConfig(layerConfigProps);
      } else if (CsvLayerEntryConfig.isClassOrTypeCSV(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new CsvLayerEntryConfig(layerConfigProps);
      } else if (WkbLayerEntryConfig.isClassOrTypeWKBLayer(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new WkbLayerEntryConfig(layerConfigProps);
      } else {
        // Unsupported layer type
        throw new NotSupportedError(`Unsupported layer entry config type '${ConfigBaseClass.getClassOrTypeSchemaTag(layerConfig)}`);
      }
    });
  }

  /**
   * Process recursively the layer entries to set the parents of each entries.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration.
   * @param {ConfigClassOrType[]} listOfLayerEntryConfig - The list of layer entry configurations to process.
   * @param {GroupLayerEntryConfig} [parentLayerConfig] - The parent layer configuration of all the layer configurations found in the list of layer entries.
   * @return {void}
   * @private
   * @static
   */
  static #recursivelySetChildParent(
    geoviewLayerConfig: TypeGeoviewLayerConfig,
    listOfLayerEntryConfig: ConfigClassOrType[],
    parentLayerConfig?: GroupLayerEntryConfig
  ): void {
    // If there's no parent to set, return
    if (!parentLayerConfig) return;

    listOfLayerEntryConfig.forEach((layerConfig) => {
      ConfigBaseClass.setClassOrTypeParentLayerConfig(layerConfig, parentLayerConfig);
      if (ConfigBaseClass.getClassOrTypeEntryTypeIsGroup(layerConfig))
        ConfigValidation.#recursivelySetChildParent(geoviewLayerConfig, layerConfig.listOfLayerEntryConfig, layerConfig);
    });
  }
}

export type ErrorCallbackDelegate = (errorKey: string, params: string[]) => void;
