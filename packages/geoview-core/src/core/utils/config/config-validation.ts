/* eslint-disable no-underscore-dangle, no-param-reassign */
// We have a lot of private function with functions with dangle and many reassigns. We keep it global...
// TODO: refactor - clean the code to minimize esLint warning

import Ajv from 'ajv';
import { AnyValidateFunction } from 'ajv/dist/types';

import defaultsDeep from 'lodash/defaultsDeep';

import { TypeDisplayLanguage, TypeLocalizedString } from '@config/types/map-schema-types';
// import { layerEntryIsGroupLayer } from '@config/types/type-guards';

import { geoviewEntryIsWMS } from '@/geo/layer/geoview-layers/raster/wms';
import { geoviewEntryIsImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { geoviewEntryIsXYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { geoviewEntryIsVectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { geoviewEntryIsEsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { geoviewEntryIsEsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { geoviewEntryIsWFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { geoviewEntryIsOgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { geoviewEntryIsGeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { geoviewEntryIsCSV } from '@/geo/layer/geoview-layers/vector/csv';
import { geoviewEntryIsGeoPackage } from '@/geo/layer/geoview-layers/vector/geopackage';
import {
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  MapConfigLayerEntry,
  mapConfigLayerEntryIsGeoCore,
  layerEntryIsGroupLayer,
} from '@/geo/map/map-schema-types';
import { Cast, toJsonObject, TypeJsonObject } from '@/core/types/global-types';
import { CONST_GEOVIEW_SCHEMA_BY_TYPE, CONST_LAYER_TYPES, TypeGeoviewLayerType } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { geoviewEntryIsEsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { logger } from '@/core/utils/logger';

import { generateId, replaceParams, getLocalizedMessage } from '@/core/utils/utilities';
import schema from '../../../../schema.json';
import { WfsLayerEntryConfig } from './validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from './validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { CsvLayerEntryConfig } from './validation-classes/vector-validation-classes/csv-layer-entry-config';
import { VectorTilesLayerEntryConfig } from './validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';
import { GeoJSONLayerEntryConfig } from './validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from './validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { GeoPackageLayerEntryConfig } from './validation-classes/vector-validation-classes/geopackage-layer-config-entry';
import { XYZTilesLayerEntryConfig } from './validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { OgcWmsLayerEntryConfig } from './validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { ImageStaticLayerEntryConfig } from './validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { EsriDynamicLayerEntryConfig } from './validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { EsriImageLayerEntryConfig } from './validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { GroupLayerEntryConfig } from './validation-classes/group-layer-entry-config';
import { api } from '@/app';

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
// ******************************************************************************************************************************
export class ConfigValidation {
  /** The map ID associated to the configuration. If it is undefined, a unique value will be generated and assign to it. */
  #mapId: string;

  // The map language
  displayLanguage: TypeDisplayLanguage;

  /** ***************************************************************************************************************************
   * The ConfigValidation class constructor used to instanciate an object of this type.
   *
   * @returns {ConfigValidation} A ConfigValidation instance.
   */
  constructor(language: TypeDisplayLanguage) {
    this.#mapId = generateId();
    this.displayLanguage = language;
  }

  /** ***************************************************************************************************************************
   * Get mapId value.
   *
   * @returns {string} The ID of the Geoview map.
   */
  get mapId(): string {
    return this.#mapId;
  }

  /** ***************************************************************************************************************************
   * Set mapId value.
   * @param {string} mapId - The ID of the Geoview map.
   */
  set mapId(mapId: string) {
    this.#mapId = mapId;
  }

  /** ***************************************************************************************************************************
   * Print a trace to help locate schema errors.
   * @param {AnyValidateFunction<unknown>} validate - The Ajv validator.
   * @param {unknown} objectAffected - Object that was validated.
   * @private
   */
  #printSchemaError(validate: AnyValidateFunction<unknown>, objectAffected: unknown): void {
    for (let i = 0; i < validate.errors!.length; i += 1) {
      const error = validate.errors![i];
      const { instancePath } = error;
      const path = instancePath.split('/');
      let node = objectAffected as TypeJsonObject;
      for (let j = 1; j < path.length; j += 1) {
        node = node[path[j]];
      }
      logger.logWarning(this.mapId, '='.repeat(200), 'Schema error: ', this.mapId, error, 'Object affected: ', this.mapId, node);
    }
  }

  /** ***************************************************************************************************************************
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
    validator: Ajv
  ): boolean {
    const layerSchemaPath = `https://cgpv/schema#/definitions/${CONST_GEOVIEW_SCHEMA_BY_TYPE[geoviewLayerType]}`;
    const groupSchemaPath = `https://cgpv/schema#/definitions/TypeLayerGroupEntryConfig`;

    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      const schemaPath = layerEntryIsGroupLayer(listOfLayerEntryConfig[i]) ? groupSchemaPath : layerSchemaPath;
      const validate = validator.getSchema(schemaPath);

      if (!validate) {
        // TODO: refactor - remove setTimeout (dont know what it is used for)
        setTimeout(() => {
          const message = replaceParams([schemaPath], getLocalizedMessage('validation.schema.wrongPath', 'en'));
          logger.logWarning(`- Map ${this.mapId}: ${message}`);
          // TODO: config should not push message to map... only to console and as return value.. map will be responsible to throw notification
          api.maps[this.mapId].notifications.showError('validation.schema.wrongPath', [schemaPath]);
        }, 2000);
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
        !this.#isValidTypeListOfLayerEntryConfig(geoviewLayerType, listOfLayerEntryConfig[i].listOfLayerEntryConfig!, validator)
      )
        return false;
    }
    return true;
  }

  /** ***************************************************************************************************************************
   * Validate the map features configuration.
   * @param {TypeMapFeaturesConfig} mapFeaturesConfigToValidate - The map features configuration to validate.
   *
   * @returns {TypeMapFeaturesConfig} A valid map features configuration.
   */
  validateMapConfigAgainstSchema(listOfGeoviewLayerConfig: MapConfigLayerEntry[]): MapConfigLayerEntry[] {
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
      if (!mapConfigLayerEntryIsGeoCore(listOfGeoviewLayerConfig[i])) {
        const gvLayerConfigCasted = listOfGeoviewLayerConfig[i] as TypeGeoviewLayerConfig;
        isValid = this.#isValidTypeListOfLayerEntryConfig(
          gvLayerConfigCasted.geoviewLayerType,
          gvLayerConfigCasted.listOfLayerEntryConfig,
          validator
        );
      }
    }

    ConfigValidation.#processLocalizedString([this.displayLanguage], listOfGeoviewLayerConfig);
    ConfigValidation.#doExtraValidation(listOfGeoviewLayerConfig);

    return listOfGeoviewLayerConfig;
  }

  /** ***************************************************************************************************************************
   * Validate and adjust the list of GeoView layer configuration.
   * @param {TypeGeoviewLayerConfig[]} listOfGeoviewLayerConfig - The list of GeoView layer configuration to adjust and
   * validate.
   */
  static validateListOfGeoviewLayerConfig(language: TypeDisplayLanguage, listOfGeoviewLayerConfig?: TypeGeoviewLayerConfig[]): void {
    // TODO: refactor - We will only support these 3 bilingual fields: geoviewLayerName, metadataAccessPath and layerName after the refactor.
    // TODO: New config validation classes should already support this.
    ConfigValidation.#processLocalizedString([language], listOfGeoviewLayerConfig);
    ConfigValidation.#doExtraValidation(listOfGeoviewLayerConfig);
  }

  /** ***************************************************************************************************************************
   * Do extra validation that schema can not do.
   * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry - The list of Map Config Layer Entry configuration to adjust and
   * validate.
   * @private
   */
  static #doExtraValidation(listOfMapConfigLayerEntry?: MapConfigLayerEntry[]): void {
    if (listOfMapConfigLayerEntry) {
      listOfMapConfigLayerEntry
        .filter((geoviewLayerConfig) => !mapConfigLayerEntryIsGeoCore(geoviewLayerConfig))
        .forEach((geoviewLayerConfig) => {
          // The default value for geoviewLayerConfig.initialSettings.visible is true.
          const geoviewLayerConfigCasted = geoviewLayerConfig as TypeGeoviewLayerConfig;
          if (!geoviewLayerConfigCasted.initialSettings) geoviewLayerConfigCasted.initialSettings = { states: { visible: true } };
          switch (geoviewLayerConfig.geoviewLayerType) {
            case CONST_LAYER_TYPES.CSV:
            case CONST_LAYER_TYPES.GEOJSON:
            case CONST_LAYER_TYPES.XYZ_TILES:
            case CONST_LAYER_TYPES.VECTOR_TILES:
            case CONST_LAYER_TYPES.GEOPACKAGE:
            case CONST_LAYER_TYPES.IMAGE_STATIC:
              ConfigValidation.#geoviewLayerIdIsMandatory(geoviewLayerConfigCasted);
              ConfigValidation.#processLayerEntryConfig(geoviewLayerConfigCasted, geoviewLayerConfigCasted.listOfLayerEntryConfig);
              break;
            case CONST_LAYER_TYPES.ESRI_DYNAMIC:
            case CONST_LAYER_TYPES.ESRI_FEATURE:
            case CONST_LAYER_TYPES.ESRI_IMAGE:
            case CONST_LAYER_TYPES.OGC_FEATURE:
            case CONST_LAYER_TYPES.WFS:
            case CONST_LAYER_TYPES.WMS:
              ConfigValidation.#geoviewLayerIdIsMandatory(geoviewLayerConfigCasted);
              ConfigValidation.#metadataAccessPathIsMandatory(geoviewLayerConfigCasted);
              ConfigValidation.#processLayerEntryConfig(geoviewLayerConfigCasted, geoviewLayerConfigCasted.listOfLayerEntryConfig);
              break;
            default:
              throw new Error('Your not supposed to end here. There is a problem with the schema validator.');
          }
        });
    }
  }

  /** ***************************************************************************************************************************
   * Verify that the metadataAccessPath has a value.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration to validate.
   * @private
   */
  static #metadataAccessPathIsMandatory(geoviewLayerConfig: TypeGeoviewLayerConfig): void {
    if (!geoviewLayerConfig.metadataAccessPath) {
      throw new Error(
        `metadataAccessPath is mandatory for GeoView layer ${geoviewLayerConfig.geoviewLayerId} of type ${geoviewLayerConfig.geoviewLayerType}.`
      );
    }
  }

  /** ***************************************************************************************************************************
   * Verify that the geoviewLayerId has a value.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration to validate.
   * @private
   */
  static #geoviewLayerIdIsMandatory(geoviewLayerConfig: TypeGeoviewLayerConfig): void {
    if (!geoviewLayerConfig.geoviewLayerId) {
      throw new Error(`geoviewLayerId is mandatory for GeoView layer of type ${geoviewLayerConfig.geoviewLayerType}.`);
    }
  }

  /** ***************************************************************************************************************************
   * Process recursively the layer entries to create layers and layer groups.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The GeoView layer configuration to adjust and validate.
   * @param {TypeLayerEntryConfig[]} listOfLayerEntryConfig - The list of layer entry configurations to process.
   * @param {TypeGeoviewLayerConfig | GroupLayerEntryConfig} parentLayerConfig - The parent layer configuration of all the
   * layer entry configurations found in the list of layer entries.
   * @private
   */
  static #processLayerEntryConfig(
    geoviewLayerConfig: TypeGeoviewLayerConfig,
    listOfLayerEntryConfig: TypeLayerEntryConfig[],
    parentLayerConfig?: GroupLayerEntryConfig
  ): void {
    listOfLayerEntryConfig.forEach((layerConfig: TypeLayerEntryConfig, i: number) => {
      // links the entry to its GeoView layer config.
      layerConfig.geoviewLayerConfig = geoviewLayerConfig;
      // links the entry to its parent layer configuration.
      layerConfig.parentLayerConfig = parentLayerConfig;
      // layerConfig.initialSettings attributes that are not defined inherits parent layer settings that are defined.
      layerConfig.initialSettings = defaultsDeep(
        layerConfig.initialSettings,
        layerConfig.parentLayerConfig?.initialSettings || layerConfig.geoviewLayerConfig?.initialSettings
      );

      if (layerEntryIsGroupLayer(layerConfig)) {
        // We must set the parents of all elements in the group.
        ConfigValidation.#recursivelySetChildParent(geoviewLayerConfig, [layerConfig], parentLayerConfig);
        const parent = new GroupLayerEntryConfig(layerConfig as GroupLayerEntryConfig);
        listOfLayerEntryConfig[i] = parent;
        ConfigValidation.#processLayerEntryConfig(geoviewLayerConfig, parent.listOfLayerEntryConfig, parent);
      } else if (geoviewEntryIsWMS(layerConfig)) {
        listOfLayerEntryConfig[i] = new OgcWmsLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsImageStatic(layerConfig)) {
        listOfLayerEntryConfig[i] = new ImageStaticLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsXYZTiles(layerConfig)) {
        listOfLayerEntryConfig[i] = new XYZTilesLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsVectorTiles(layerConfig)) {
        listOfLayerEntryConfig[i] = new VectorTilesLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsEsriDynamic(layerConfig)) {
        listOfLayerEntryConfig[i] = new EsriDynamicLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsEsriFeature(layerConfig)) {
        listOfLayerEntryConfig[i] = new EsriFeatureLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsEsriImage(layerConfig)) {
        listOfLayerEntryConfig[i] = new EsriImageLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsWFS(layerConfig)) {
        listOfLayerEntryConfig[i] = new WfsLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsOgcFeature(layerConfig)) {
        listOfLayerEntryConfig[i] = new OgcFeatureLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsGeoPackage(layerConfig)) {
        listOfLayerEntryConfig[i] = new GeoPackageLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsGeoJSON(layerConfig)) {
        listOfLayerEntryConfig[i] = new GeoJSONLayerEntryConfig(layerConfig);
      } else if (geoviewEntryIsCSV(layerConfig)) {
        listOfLayerEntryConfig[i] = new CsvLayerEntryConfig(layerConfig);
      } else {
        // Unknown
        logger.logWarning('Unknown layer entry config type', layerConfig);
      }
    });
  }

  /** ***************************************************************************************************************************
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
        ConfigValidation.#recursivelySetChildParent(
          geoviewLayerConfig,
          layerConfig.listOfLayerEntryConfig!,
          layerConfig as GroupLayerEntryConfig
        );
    });
  }

  /** ***************************************************************************************************************************
   * Synchronize the English and French strings.
   * @param {TypeLocalizedString} localizedString - The localized string to synchronize the en and fr string.
   * @param {TypeDisplayLanguage} sourceKey - The source's key.
   * @param {TypeDisplayLanguage} destinationKey - The destination's key.
   * @private
   */
  static #synchronizeLocalizedString(
    localizedString: TypeLocalizedString,
    sourceKey: TypeDisplayLanguage,
    destinationKey: TypeDisplayLanguage
  ): void {
    localizedString[destinationKey] = localizedString[sourceKey];
  }

  /** ***************************************************************************************************************************
   * Adjust the map features configuration localized strings according to the supported languages array content.
   * @param {TypeListOfLocalizedLanguages} suportedLanguages - The list of supported languages.
   * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry - The list of Map Config Layer Entry configuration to adjust according
   * to the supported languages array content.
   * @private
   */
  static #processLocalizedString(suportedLanguages: TypeDisplayLanguage[], listOfMapConfigLayerEntry?: MapConfigLayerEntry[]): void {
    if (suportedLanguages.includes('en') && suportedLanguages.includes('fr') && listOfMapConfigLayerEntry) {
      const validateLocalizedString = (config: TypeJsonObject): void => {
        if (typeof config === 'object') {
          Object.keys(config).forEach((key) => {
            if (!key.startsWith('_') && config[key] !== null && typeof config[key] === 'object') {
              if (config?.[key]?.en || config?.[key]?.fr) {
                // delete empty localized strings
                if (!config[key].en && !config[key].fr) delete config[key];
                else if (!config[key].en || !config[key].fr) {
                  throw new Error('When you support both languages, you must set all en and fr properties of localized strings.');
                }
              }
              // Avoid the 'geoviewLayerConfig' and 'parentLayerConfig' properties because they loop on themself and cause a
              // stack overflow error.
              else if (!['geoviewLayerConfig', 'parentLayerConfig'].includes(key)) validateLocalizedString(config[key]);
            }
          });
        }
      };
      listOfMapConfigLayerEntry.forEach((geoviewLayerConfig) => validateLocalizedString(toJsonObject(geoviewLayerConfig)));
      return;
    }

    let sourceKey: TypeDisplayLanguage;
    let destinationKey: TypeDisplayLanguage;
    if (suportedLanguages.includes('en')) {
      sourceKey = 'en';
      destinationKey = 'fr';
    } else {
      sourceKey = 'fr';
      destinationKey = 'en';
    }

    if (listOfMapConfigLayerEntry) {
      const propagateLocalizedString = (config: TypeJsonObject): void => {
        if (typeof config === 'object') {
          Object.keys(config).forEach((key) => {
            if (!key.startsWith('_') && config[key] !== null  && typeof config[key] === 'object') {
              // Leaving the commented line here in case a developer needs to quickly uncomment it again to troubleshoot
              // logger.logDebug(`Key=${key}`, config[key]);
              if (config?.[key]?.en || config?.[key]?.fr)
                ConfigValidation.#synchronizeLocalizedString(Cast<TypeLocalizedString>(config[key]), sourceKey, destinationKey);
              // Avoid the 'geoviewLayerConfig' and 'parentLayerConfig' properties because they loop on themself and cause a
              // stack overflow error.
              else if (!['geoviewLayerConfig', 'parentLayerConfig'].includes(key)) propagateLocalizedString(config[key]);
            }
          });
        }
      };
      listOfMapConfigLayerEntry.forEach((geoviewLayerConfig) => propagateLocalizedString(toJsonObject(geoviewLayerConfig)));
    }
  }
}
