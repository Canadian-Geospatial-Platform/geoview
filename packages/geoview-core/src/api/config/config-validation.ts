/* eslint-disable no-param-reassign */
// We have a lot of reassigns. We keep it global...
// TODO: refactor - clean the code to minimize esLint warning

import Ajv from 'ajv';
import { AnyValidateFunction } from 'ajv/dist/types';

import defaultsDeep from 'lodash/defaultsDeep';

import { TypeDisplayLanguage } from '@/api/types/map-schema-types';

import {
  CONST_LAYER_TYPES,
  CONST_GEOVIEW_SCHEMA_BY_TYPE,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  MapConfigLayerEntry,
  mapConfigLayerEntryIsGeoCore,
  mapConfigLayerEntryIsGeoPackage,
  mapConfigLayerEntryIsShapefile,
  layerEntryIsGroupLayer,
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

import { generateId } from '@/core/utils/utilities';
import schema from '@/core/../../schema.json';
import { ConfigBaseClass } from './validation-classes/config-base-class';
import { CsvLayerEntryConfig } from './validation-classes/vector-validation-classes/csv-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from './validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from './validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriImageLayerEntryConfig } from './validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { GeoJSONLayerEntryConfig } from './validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { ImageStaticLayerEntryConfig } from './validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from './validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { OgcWmsLayerEntryConfig } from './validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { VectorTilesLayerEntryConfig } from './validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { WfsLayerEntryConfig } from './validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { WkbLayerEntryConfig } from './validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { XYZTilesLayerEntryConfig } from './validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { GroupLayerEntryConfig } from './validation-classes/group-layer-entry-config';

import { LayerMetadataAccessPathMandatoryError, LayerMissingGeoviewLayerIdError } from '@/core/exceptions/layer-exceptions';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';

/**
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
export class ConfigValidation {
  /** The map ID associated to the configuration. If it is undefined, a unique value will be generated and assign to it. */
  #mapId: string;

  // The map language
  displayLanguage: TypeDisplayLanguage;

  /**
   * The ConfigValidation class constructor used to instanciate an object of this type.
   */
  constructor(language: TypeDisplayLanguage) {
    this.#mapId = generateId();
    this.displayLanguage = language;
  }

  /**
   * Get mapId value.
   *
   * @returns {string} The ID of the Geoview map.
   */
  get mapId(): string {
    return this.#mapId;
  }

  /**
   * Set mapId value.
   * @param {string} mapId - The ID of the Geoview map.
   */
  set mapId(mapId: string) {
    this.#mapId = mapId;
  }

  /**
   * Print a trace to help locate schema errors.
   * @param {AnyValidateFunction<unknown>} validate - The Ajv validator.
   * @param {TypeLayerEntryConfig} objectAffected - Object that was validated.
   * @private
   */
  #printSchemaError(validate: AnyValidateFunction<unknown>, objectAffected: TypeLayerEntryConfig): void {
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
      logger.logWarning(this.mapId, '='.repeat(200), 'Schema error: ', this.mapId, error, 'Object affected: ', this.mapId, node);
    }
  }

  /**
   * Validate the configuration of the map features against the TypeMapFeaturesInstance defined in the schema.
   * @param {TypeGeoviewLayerType} geoviewLayerType - The GeoView layer type to validate.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entry configurations to validate.
   * @param {Ajv} validator - The schema validator to use.
   *
   * @returns {TypeMapFeaturesConfig} A valid map features configuration.
   * @private
   */
  #isValidTypeListOfLayerEntryConfig(
    geoviewLayerType: TypeGeoviewLayerType,
    listOfLayerEntryConfig: TypeLayerEntryConfig[],
    validator: Ajv,
    onErrorCallback: ErrorCallbackDelegate
  ): boolean {
    const layerSchemaPath = `https://cgpv/schema#/definitions/${CONST_GEOVIEW_SCHEMA_BY_TYPE[geoviewLayerType]}`;
    const groupSchemaPath = `https://cgpv/schema#/definitions/TypeLayerGroupEntryConfig`;

    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      const schemaPath = layerEntryIsGroupLayer(listOfLayerEntryConfig[i]) ? groupSchemaPath : layerSchemaPath;
      const validate = validator.getSchema(schemaPath);

      if (!validate) {
        // Callback about the error
        onErrorCallback('validation.schema.wrongPath', [schemaPath]);
        return false;
      }

      // validate configuration
      const valid = validate(listOfLayerEntryConfig[i]);

      if (!valid) {
        this.#printSchemaError(validate, listOfLayerEntryConfig[i]);
        return false;
      }
    }

    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      if (
        layerEntryIsGroupLayer(listOfLayerEntryConfig[i]) &&
        !this.#isValidTypeListOfLayerEntryConfig(
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
   */
  validateLayersConfigAgainstSchema(
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
        isValid = this.#isValidTypeListOfLayerEntryConfig(
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
   * @param {MapConfigLayerEntry[]} listOfGeoviewLayerConfig - The list of GeoView layer configuration to adjust and
   * validate.
   */
  static validateListOfGeoviewLayerConfig(listOfGeoviewLayerConfig?: MapConfigLayerEntry[]): void {
    ConfigValidation.#doExtraValidation(listOfGeoviewLayerConfig);
  }

  /**
   * Do extra validation that schema can not do.
   * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry - The list of Map Config Layer Entry configuration to adjust and
   * validate.
   * @private
   */
  static #doExtraValidation(listOfMapConfigLayerEntry?: MapConfigLayerEntry[]): void {
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
      listOfMapConfigLayerEntry.length = 0;
      listOfMapConfigLayerEntry.push(...validConfigs);
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
      layerConfig.geoviewLayerConfig = geoviewLayerConfig;
      // links the entry to its parent layer configuration.
      layerConfig.parentLayerConfig = parentLayerConfig;
      // layerConfig.initialSettings attributes that are not defined inherits parent layer settings that are defined.

      // Handle Zoom and Scale levels before default merge of settings
      if (layerConfig.initialSettings?.minZoom) {
        layerConfig.initialSettings.minZoom = Math.max(
          layerConfig.initialSettings.minZoom,
          parentLayerConfig?.initialSettings?.minZoom || 0
        );
      }

      if (layerConfig.initialSettings?.maxZoom) {
        layerConfig.initialSettings.maxZoom = Math.min(
          layerConfig.initialSettings.maxZoom,
          parentLayerConfig?.initialSettings?.maxZoom || 23
        );
      }

      // Make sure visible is set so it is not overridden by parent layer
      if (!layerConfig.initialSettings) layerConfig.initialSettings = { states: { visible: true } };
      if (!layerConfig.initialSettings.states) layerConfig.initialSettings.states = { visible: true };
      if (layerConfig.initialSettings?.states?.visible !== false) layerConfig.initialSettings.states.visible = true;

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

      // Merge the rest of parent and child settings
      layerConfig.initialSettings = defaultsDeep(
        layerConfig.initialSettings,
        layerConfig.parentLayerConfig?.initialSettings || layerConfig.geoviewLayerConfig?.initialSettings
      );

      if (layerEntryIsGroupLayer(layerConfig)) {
        // We must set the parents of all elements in the group.
        ConfigValidation.#recursivelySetChildParent(geoviewLayerConfig, [layerConfig], parentLayerConfig);
        const parent = new GroupLayerEntryConfig(layerConfig);
        listOfLayerEntryConfig[i] = parent;
        ConfigValidation.#processLayerEntryConfig(geoviewLayerConfig, parent.listOfLayerEntryConfig, parent);
      } else if (layerEntryIsOgcWmsFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new OgcWmsLayerEntryConfig(layerConfig);
      } else if (layerEntryIsImageStaticFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new ImageStaticLayerEntryConfig(layerConfig);
      } else if (layerEntryIsXYZTilesFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new XYZTilesLayerEntryConfig(layerConfig);
      } else if (layerEntryIsVectorTileFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new VectorTilesLayerEntryConfig(layerConfig);
      } else if (layerEntryIsEsriDynamicFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new EsriDynamicLayerEntryConfig(layerConfig);
      } else if (layerEntryIsEsriFeatureFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new EsriFeatureLayerEntryConfig(layerConfig);
      } else if (layerEntryIsEsriImageFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new EsriImageLayerEntryConfig(layerConfig);
      } else if (layerEntryIsWFSFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new WfsLayerEntryConfig(layerConfig);
      } else if (layerEntryIsOgcFeatureFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new OgcFeatureLayerEntryConfig(layerConfig);
      } else if (layerEntryIsGeoJSONFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new GeoJSONLayerEntryConfig(layerConfig);
      } else if (layerEntryIsCSVFromConfig(layerConfig)) {
        listOfLayerEntryConfig[i] = new CsvLayerEntryConfig(layerConfig);
      } else if (layerEntryIsWKBFromConfig(layerConfig)) {
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
      layerConfig.parentLayerConfig = parentLayerConfig;
      layerConfig.geoviewLayerConfig = geoviewLayerConfig;
      if (layerEntryIsGroupLayer(layerConfig))
        ConfigValidation.#recursivelySetChildParent(geoviewLayerConfig, layerConfig.listOfLayerEntryConfig, layerConfig);
    });
  }
}

export type ErrorCallbackDelegate = (errorKey: string, params: string[]) => void;
