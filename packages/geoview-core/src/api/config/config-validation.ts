import Ajv from 'ajv';
import { AnyValidateFunction } from 'ajv/dist/types';

import defaultsDeep from 'lodash/defaultsDeep';

import {
  CONST_LAYER_TYPES,
  CONST_GEOVIEW_SCHEMA_BY_TYPE,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  MapConfigLayerEntry,
  mapConfigLayerEntryIsGeoCore,
  mapConfigLayerEntryIsGeoPackage,
  mapConfigLayerEntryIsShapefile,
  TypeGeoviewLayerType,
  layerEntryIsEsriFeatureFromConfig,
  layerEntryIsEsriDynamicFromConfig,
  layerEntryIsEsriImageFromConfig,
  layerEntryIsImageStaticFromConfig,
  layerEntryIsVectorTileFromConfig,
  layerEntryIsOgcWmsFromConfig,
  layerEntryIsXYZTilesFromConfig,
  layerEntryIsCSVFromConfig,
  layerEntryIsGeoJSONFromConfig,
  layerEntryIsOgcFeatureFromConfig,
  layerEntryIsWFSFromConfig,
  layerEntryIsWKBFromConfig,
  ConfigClassOrType,
} from '@/api/types/layer-schema-types';
import { logger } from '@/core/utils/logger';

import schema from '@/core/../../schema.json';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { CsvLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { ImageStaticLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { VectorTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { WfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { XYZTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';

import { LayerMetadataAccessPathMandatoryError, LayerMissingGeoviewLayerIdError } from '@/core/exceptions/layer-exceptions';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';

/**
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
export class ConfigValidation {
  /**
   * Print a trace to help locate schema errors.
   * @param {AnyValidateFunction<unknown>} validate - The Ajv validator.
   * @param {TypeLayerEntryConfig} objectAffected - Object that was validated.
   * @static
   * @private
   */
  static #printSchemaError(validate: AnyValidateFunction<unknown>, objectAffected: TypeLayerEntryConfig): void {
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
   *
   * @returns {TypeMapFeaturesConfig} A valid map features configuration.
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
   * @returns {MapConfigLayerEntry[]} A valid map features configuration.
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
        !mapConfigLayerEntryIsGeoPackage(listOfGeoviewLayerConfig[i])
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
   * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry - The list of GeoView layer configuration to adjust and
   * validate.
   */
  static validateListOfGeoviewLayerConfig(listOfMapConfigLayerEntry?: MapConfigLayerEntry[]): void {
    if (listOfMapConfigLayerEntry) {
      // Track only valid entries
      const validConfigs: typeof listOfMapConfigLayerEntry = [];

      listOfMapConfigLayerEntry.forEach((geoviewLayerConfig) => {
        if (
          mapConfigLayerEntryIsGeoCore(geoviewLayerConfig) ||
          mapConfigLayerEntryIsShapefile(geoviewLayerConfig) ||
          mapConfigLayerEntryIsGeoPackage(geoviewLayerConfig)
        ) {
          // As-is we keep it
          validConfigs.push(geoviewLayerConfig);
        } else {
          try {
            // The default value for geoviewLayerConfig.initialSettings.visible is true.
            const geoviewLayerConfigCasted = geoviewLayerConfig;
            if (!geoviewLayerConfigCasted.initialSettings) geoviewLayerConfigCasted.initialSettings = { states: { visible: true } };

            // Validate the geoview layer id
            ConfigValidation.#geoviewLayerIdIsMandatory(geoviewLayerConfigCasted);

            // Depending on the geoview layer type
            switch (geoviewLayerConfig.geoviewLayerType) {
              case CONST_LAYER_TYPES.ESRI_DYNAMIC:
              case CONST_LAYER_TYPES.ESRI_FEATURE:
              case CONST_LAYER_TYPES.ESRI_IMAGE:
              case CONST_LAYER_TYPES.OGC_FEATURE:
              case CONST_LAYER_TYPES.WFS:
              case CONST_LAYER_TYPES.WMS:
                ConfigValidation.#metadataAccessPathIsMandatory(geoviewLayerConfigCasted);
                break;
              default:
                // All good
                break;
            }

            // Process the layer entry config
            ConfigValidation.#processLayerEntryConfig(geoviewLayerConfigCasted, geoviewLayerConfigCasted.listOfLayerEntryConfig);

            // Add it as a valid entry
            validConfigs.push(geoviewLayerConfigCasted);
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
   * Verify that the metadataAccessPath has a value.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration to validate.
   * @private
   */
  static #metadataAccessPathIsMandatory(geoviewLayerConfig: TypeGeoviewLayerConfig): void {
    if (!geoviewLayerConfig.metadataAccessPath) {
      throw new LayerMetadataAccessPathMandatoryError(
        geoviewLayerConfig.geoviewLayerId,
        geoviewLayerConfig.geoviewLayerType,
        geoviewLayerConfig.geoviewLayerName
      );
    }
  }

  /**
   * Verify that the geoviewLayerId has a value.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration to validate.
   * @private
   */
  static #geoviewLayerIdIsMandatory(geoviewLayerConfig: TypeGeoviewLayerConfig): void {
    if (!geoviewLayerConfig.geoviewLayerId) {
      throw new LayerMissingGeoviewLayerIdError(geoviewLayerConfig.geoviewLayerType);
    }
  }

  /**
   * Process recursively the layer entries to create layers and layer groups.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration to adjust and validate.
   * @param {ConfigClassOrType[]} listOfLayerEntryConfig - The list of layer entry configurations to process.
   * @param {TypeGeoviewLayerConfig | GroupLayerEntryConfig} parentLayerConfig - The parent layer configuration of all the
   * layer entry configurations found in the list of layer entries.
   * @private
   */
  static #processLayerEntryConfig(
    geoviewLayerConfig: TypeGeoviewLayerConfig,
    listOfLayerEntryConfig: ConfigClassOrType[],
    parentLayerConfig?: GroupLayerEntryConfig
  ): void {
    listOfLayerEntryConfig.forEach((layerConfig, i: number) => {
      // links the entry to its GeoView layer config.
      // eslint-disable-next-line no-param-reassign
      layerConfig.geoviewLayerConfig = geoviewLayerConfig;
      // links the entry to its parent layer configuration.
      // eslint-disable-next-line no-param-reassign
      layerConfig.parentLayerConfig = parentLayerConfig;

      // layerConfig.initialSettings attributes that are not defined inherits parent layer settings that are defined.
      let initialSettings = ConfigBaseClass.getClassOrTypeInitialSettings(layerConfig);
      if (!initialSettings.states) {
        // TODO: Refactor - Check if we should really provide a states { visible: true } by default here? Because
        // TO.DOCONT: doing so makes it impossible when the metadata is processed to know if the visible: true was originally undefined or if it was intentionally configured as such.
        // TO.DOCONT: Later, all the code sees is that the config specifies states with visible: true
        ConfigBaseClass.setClassOrTypeInitialSettings(layerConfig, { states: { visible: true } });
        // Reget it to make sure the chain of updates works
        initialSettings = ConfigBaseClass.getClassOrTypeInitialSettings(layerConfig);
      }

      if (initialSettings.states?.visible === undefined) {
        ConfigBaseClass.setClassOrTypeInitialSettings(layerConfig, {
          states: { ...initialSettings.states, visible: true },
        });
        // Reget it to make sure the chain of updates works
        initialSettings = ConfigBaseClass.getClassOrTypeInitialSettings(layerConfig);
      }

      // Get the parent initial settings
      const parentInitialSettings = ConfigBaseClass.getClassOrTypeInitialSettings(parentLayerConfig);

      // Handle minZoom before default merge of settings
      if (initialSettings?.minZoom) {
        // Validate the minZoom value
        const minZoom = Math.max(initialSettings.minZoom, parentInitialSettings?.minZoom || 0);

        // Update the minZoom initial settings
        ConfigBaseClass.setClassOrTypeInitialSettings(layerConfig, { ...initialSettings, minZoom });
        // Reget it to make sure the chain of updates works
        initialSettings = ConfigBaseClass.getClassOrTypeInitialSettings(layerConfig);
      }

      // Handle maxZoom before default merge of settings
      if (initialSettings?.maxZoom) {
        // Validate the maxZoom value
        const maxZoom = Math.min(initialSettings.maxZoom, parentInitialSettings?.maxZoom || 23);

        // Update the maxZoom initial settings
        ConfigBaseClass.setClassOrTypeInitialSettings(layerConfig, { ...initialSettings, maxZoom });
        // Reget it to make sure the chain of updates works
        initialSettings = ConfigBaseClass.getClassOrTypeInitialSettings(layerConfig);
      }

      // Merge the rest of parent and child settings
      ConfigBaseClass.setClassOrTypeInitialSettings(
        layerConfig,
        defaultsDeep(initialSettings, parentInitialSettings || layerConfig.geoviewLayerConfig?.initialSettings)
      );

      const minScale = ConfigBaseClass.getClassOrTypeMinScale(layerConfig);
      if (minScale) {
        // Set the min scale
        ConfigBaseClass.setClassOrTypeMinScale(layerConfig, Math.min(minScale, parentLayerConfig?.getMinScale() || Infinity));
      }

      const maxScale = ConfigBaseClass.getClassOrTypeMaxScale(layerConfig);
      if (maxScale) {
        // Set the max scale
        ConfigBaseClass.setClassOrTypeMaxScale(layerConfig, Math.max(maxScale, parentLayerConfig?.getMaxScale() || 0));
      }

      if (ConfigBaseClass.getClassOrTypeEntryTypeIsGroup(layerConfig)) {
        // We must set the parents of all elements in the group.
        ConfigValidation.#recursivelySetChildParent(geoviewLayerConfig, [layerConfig], parentLayerConfig);
        const parent = new GroupLayerEntryConfig(layerConfig);
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = parent;
        ConfigValidation.#processLayerEntryConfig(geoviewLayerConfig, parent.listOfLayerEntryConfig, parent);
      } else if (layerEntryIsOgcWmsFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new OgcWmsLayerEntryConfig(layerConfig);
      } else if (layerEntryIsImageStaticFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new ImageStaticLayerEntryConfig(layerConfig);
      } else if (layerEntryIsXYZTilesFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new XYZTilesLayerEntryConfig(layerConfig);
      } else if (layerEntryIsVectorTileFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new VectorTilesLayerEntryConfig(layerConfig);
      } else if (layerEntryIsEsriDynamicFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new EsriDynamicLayerEntryConfig(layerConfig);
      } else if (layerEntryIsEsriFeatureFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new EsriFeatureLayerEntryConfig(layerConfig);
      } else if (layerEntryIsEsriImageFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new EsriImageLayerEntryConfig(layerConfig);
      } else if (layerEntryIsWFSFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new WfsLayerEntryConfig(layerConfig);
      } else if (layerEntryIsOgcFeatureFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new OgcFeatureLayerEntryConfig(layerConfig);
      } else if (layerEntryIsGeoJSONFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new GeoJSONLayerEntryConfig(layerConfig);
      } else if (layerEntryIsCSVFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new CsvLayerEntryConfig(layerConfig);
      } else if (layerEntryIsWKBFromConfig(layerConfig)) {
        // eslint-disable-next-line no-param-reassign
        listOfLayerEntryConfig[i] = new WkbLayerEntryConfig(layerConfig);
      } else {
        // Unsupported layer type
        throw new NotSupportedError(`Unsupported layer entry config type '${layerConfig.geoviewLayerConfig?.geoviewLayerType}'`);
      }
    });
  }

  /**
   * Process recursively the layer entries to set the parents of each entries.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entry configurations to process.
   * @param {GroupLayerEntryConfig} parentLayerConfig - The parent layer configuration of all the
   * layer configurations found in the list of layer entries.
   * @private
   */
  static #recursivelySetChildParent(
    geoviewLayerConfig: TypeGeoviewLayerConfig,
    listOfLayerEntryConfig: TypeLayerEntryConfig[],
    parentLayerConfig?: GroupLayerEntryConfig
  ): void {
    listOfLayerEntryConfig.forEach((layerConfig) => {
      // eslint-disable-next-line no-param-reassign
      layerConfig.parentLayerConfig = parentLayerConfig;
      // eslint-disable-next-line no-param-reassign
      layerConfig.geoviewLayerConfig = geoviewLayerConfig;
      if (ConfigBaseClass.getClassOrTypeEntryTypeIsGroup(layerConfig))
        ConfigValidation.#recursivelySetChildParent(geoviewLayerConfig, layerConfig.listOfLayerEntryConfig, layerConfig);
    });
  }
}

export type ErrorCallbackDelegate = (errorKey: string, params: string[]) => void;
