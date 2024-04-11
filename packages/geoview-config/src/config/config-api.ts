/* eslint-disable no-underscore-dangle, no-param-reassign */
// We have a lot of private function with functions with dangle and many reassigns. We keep it global...
import Ajv from 'ajv';
import { AnyValidateFunction } from 'ajv/dist/types';

import { getLocalizedMessage, replaceParams } from '../utilities';
import { logger } from '../logger';
import { ConfigBaseClass } from './types/classes/layer-tree-config/config-base-class';
import {
  VALID_BASEMAP_ID,
  CONST_LAYER_TYPES,
  CONFIG_GEOCORE_URL,
  CONFIG_GEOLOCATOR_URL,
  CONST_GEOVIEW_SCHEMA_BY_TYPE,
} from './types/config-constants';
import { Cast, TypeGeoviewLayerType, TypeJsonObject, toJsonObject } from './types/config-types';
import {
  TypeDisplayLanguage,
  TypeValidMapProjectionCodes,
  TypeBasemapId,
  TypeBasemapOptions,
  TypeValidVersions,
  VALID_VERSIONS,
  VALID_PROJECTION_CODES,
  Extent,
  TypeListOfLocalizedLanguages,
  TypeLocalizedString,
} from './types/map-schema-types';
import { layerEntryIsGroupLayer } from './types/type-guards';
import { MapFeaturesConfig } from './types/classes/map-features-config';
import schema from '../../schema.json';
import { AbstractGeoviewLayerConfig } from './types/classes/geoview-config/abstract-geoview-layer-config';

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
// ******************************************************************************************************************************
export class ConfigApi {
  /** default configuration if provided configuration is missing or wrong */
  #defaultMapFeaturesConfig = new MapFeaturesConfig(
    toJsonObject({
      map: {
        interaction: 'dynamic',
        viewSettings: {
          zoom: 4,
          center: [-100, 60],
          projection: 3978,
          enableRotation: true,
          rotation: 0,
        },
        basemapOptions: {
          basemapId: 'transport',
          shaded: true,
          labeled: true,
        },
        listOfGeoviewLayerConfig: [],
        extraOptions: {},
      },
      theme: 'dark',
      components: [],
      appBar: { tabs: { core: ['geolocator'] } },
      navBar: ['zoom', 'fullscreen', 'home'],
      corePackages: [],
      overviewMap: undefined,
      serviceUrls: {
        geocoreUrl: CONFIG_GEOCORE_URL,
        geolocator: CONFIG_GEOLOCATOR_URL,
      },
      displayLanguage: 'en',
      triggerReadyCallback: false,
      suportedLanguages: ['en', 'fr'],
      schemaVersionUsed: '1.0',
    })
  );

  // valid basemap ids
  private _basemapId: Record<TypeValidMapProjectionCodes, TypeBasemapId[]> = {
    3857: VALID_BASEMAP_ID,
    3978: VALID_BASEMAP_ID,
  };

  // valid shaded basemap values for each projection
  private _basemapShaded: Record<TypeValidMapProjectionCodes, boolean[]> = {
    3857: [true, false],
    3978: [true, false],
  };

  // valid labeled basemap values for each projection
  private _basemaplabeled: Record<TypeValidMapProjectionCodes, boolean[]> = {
    3857: [true, false],
    3978: [true, false],
  };

  // valid center levels from each projection
  private _center: Record<TypeValidMapProjectionCodes, Record<string, number[]>> = {
    3857: { lat: [-90, 90], long: [-180, 180] },
    3978: { lat: [40, 90], long: [-140, 40] },
  };

  /** ***************************************************************************************************************************
   * Get map features configuration object.
   *
   * @returns {MapFeaturesConfig} The map features configuration.
   */
  get defaultMapFeaturesConfig(): MapFeaturesConfig {
    return this.#defaultMapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Validate basemap options.
   * @param {TypeValidMapProjectionCodes} projection The projection code of the basemap.
   * @param {TypeBasemapOptions} basemapOptions The basemap options to validate.
   *
   * @returns {TypeBasemapOptions} A valid basemap options.
   */
  validateBasemap(projection?: TypeValidMapProjectionCodes, basemapOptions?: TypeBasemapOptions): TypeBasemapOptions {
    if (projection && basemapOptions) {
      const basemapId = this._basemapId[projection].includes(basemapOptions.basemapId)
        ? basemapOptions.basemapId
        : this.#defaultMapFeaturesConfig.map.basemapOptions.basemapId;
      const shaded = this._basemapShaded[projection].includes(basemapOptions.shaded)
        ? basemapOptions.shaded
        : this.#defaultMapFeaturesConfig.map.basemapOptions.shaded;
      const labeled = this._basemaplabeled[projection].includes(basemapOptions.labeled)
        ? basemapOptions.labeled
        : this.#defaultMapFeaturesConfig.map.basemapOptions.labeled;

      return { basemapId, shaded, labeled };
    }
    return this.#defaultMapFeaturesConfig.map.basemapOptions;
  }

  /** ***************************************************************************************************************************
   * Validate map version.
   * @param {TypeValidVersions} version The version to validate.
   *
   * @returns {TypeValidVersions} A valid version.
   */
  validateVersion(version?: TypeValidVersions): TypeValidVersions {
    return version && VALID_VERSIONS.includes(version) ? version : this.#defaultMapFeaturesConfig.schemaVersionUsed!;
  }

  /** ***************************************************************************************************************************
   * Validate zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private validateZoom(zoom?: number): number {
    return zoom && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : this.#defaultMapFeaturesConfig.map.viewSettings.zoom;
  }

  /** ***************************************************************************************************************************
   * Validate min zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private validateMinZoom(zoom?: number): number | undefined {
    return zoom && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : undefined;
  }

  /** ***************************************************************************************************************************
   * Validate max zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private validateMaxZoom(zoom?: number): number | undefined {
    return zoom && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : undefined;
  }

  /** ***************************************************************************************************************************
   * Validate projection.
   * @param {TypeValidMapProjectionCodes} projection The projection to validate.
   *
   * @returns {TypeValidMapProjectionCodes} A valid projection.
   */
  private validateProjection(projection?: TypeValidMapProjectionCodes): TypeValidMapProjectionCodes {
    return projection && VALID_PROJECTION_CODES.includes(projection)
      ? projection
      : this.#defaultMapFeaturesConfig.map.viewSettings.projection;
  }

  /** ***************************************************************************************************************************
   * Validate the center.
   * @param {TypeValidMapProjectionCodes} projection The projection used by the map.
   * @param {[number, number]} center The map center to validate.
   *
   * @returns {[number, number]} A valid map center.
   */
  private validateCenter(projection?: TypeValidMapProjectionCodes, center?: [number, number]): [number, number] {
    if (projection && center) {
      const xVal = Number(center[0]);
      const yVal = Number(center[1]);

      const x =
        !Number.isNaN(xVal) && xVal > this._center[projection].long[0] && xVal < this._center[projection].long[1]
          ? xVal
          : this.#defaultMapFeaturesConfig.map.viewSettings.center[0];
      const y =
        !Number.isNaN(yVal) && yVal > this._center[projection].lat[0] && yVal < this._center[projection].lat[1]
          ? yVal
          : this.#defaultMapFeaturesConfig.map.viewSettings.center[1];

      return [x, y];
    }
    return this.#defaultMapFeaturesConfig.map.viewSettings.center;
  }

  /** ***************************************************************************************************************************
   * Validate the extent.
   * @param {TypeValidMapProjectionCodes} projection The projection used by the map.
   * @param {[number, number, number, number]} extent The map extent to valdate.
   * @param {[number, number]} center The map extent to validate.
   *
   * @returns {[number, number, number, number]} A valid map extent.
   */
  private validateExtent(
    projection: TypeValidMapProjectionCodes,
    extent: [number, number, number, number],
    center: [number, number]
  ): Extent | undefined {
    if (projection && extent) {
      const [extentMinX, extentMinY, extentMaxX, extentMaxY] = extent;
      const minX = !Number.isNaN(extentMinX) && extentMinX < center[0] ? extentMinX : this._center[projection].long[0];
      const minY = !Number.isNaN(extentMinY) && extentMinY < center[1] ? extentMinY : this._center[projection].lat[0];
      const maxX = !Number.isNaN(extentMaxX) && extentMaxX > center[0] ? extentMaxX : this._center[projection].long[1];
      const maxY = !Number.isNaN(extentMaxY) && extentMaxY > center[1] ? extentMaxY : this._center[projection].lat[1];

      return [minX, minY, maxX, maxY] as Extent;
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Print a trace to help locate schema errors.
   * @param {AnyValidateFunction<unknown>} validate The Ajv validator.
   * @param {any} objectAffected Object that was validated.
   */
  private printSchemaError(validate: AnyValidateFunction<unknown>, objectAffected: unknown) {
    for (let i = 0; i < validate.errors!.length; i += 1) {
      const error = validate.errors![i];
      const { instancePath } = error;
      const path = instancePath.split('/');
      let node = objectAffected as TypeJsonObject;
      for (let j = 1; j < path.length; j += 1) {
        node = node[path[j]];
      }
      logger.logWarning('='.repeat(200), 'Schema error: ', error, 'Object affected: ', node);
    }
  }

  /** ***************************************************************************************************************************
   * Validate the configuration of the map features against the TypeMapFeaturesInstance defined in the schema.
   * @param {MapFeaturesConfig} mapFeaturesConfigToValidate The map features configuration to validate.
   * @param {Ajv} validator The schema validator to use.
   *
   * @returns {MapFeaturesConfig} A valid map features configuration.
   */
  private IsValidTypeMapFeaturesInstance(mapFeaturesConfigToValidate: MapFeaturesConfig, validator: Ajv): boolean {
    const schemaPath = 'https://cgpv/schema#/definitions/TypeMapFeaturesInstance';
    const validate = validator.getSchema(schemaPath);

    if (!validate) {
      const message = replaceParams([schemaPath], getLocalizedMessage('validation.schema.wrongPath', 'en'));
      logger.logWarning(`- ${message}`);
      return false;
    }

    // validate configuration
    const valid = validate({ ...mapFeaturesConfigToValidate });

    if (!valid) {
      this.printSchemaError(validate, mapFeaturesConfigToValidate);
      return false;
    }
    return true;
  }

  /** ***************************************************************************************************************************
   * Validate the configuration of the map features against the TypeMapFeaturesInstance defined in the schema.
   * @param {TypeGeoviewLayerType} geoviewLayerType The GeoView layer type to validate.
   * @param {TypeListOfLayerEntryConfig} listOfLayerEntryConfig The list of layer entry configurations to validate.
   * @param {Ajv} validator The schema validator to use.
   *
   * @returns {MapFeaturesConfig} A valid map features configuration.
   */
  private IsValidTypeListOfLayerEntryConfig(
    geoviewLayerType: TypeGeoviewLayerType,
    listOfLayerEntryConfig: ConfigBaseClass[],
    validator: Ajv
  ): boolean {
    const layerSchemaPath = `https://cgpv/schema#/definitions/${CONST_GEOVIEW_SCHEMA_BY_TYPE[geoviewLayerType]}`;
    const groupSchemaPath = `https://cgpv/schema#/definitions/TypeLayerGroupEntryConfig`;

    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      const schemaPath = layerEntryIsGroupLayer(listOfLayerEntryConfig[i] as ConfigBaseClass) ? groupSchemaPath : layerSchemaPath;
      const validate = validator.getSchema(schemaPath);

      if (!validate) {
        const message = replaceParams([schemaPath], getLocalizedMessage('validation.schema.wrongPath', 'en'));
        logger.logWarning(`- ${message}`);
        return false;
      }
      // validate configuration
      const valid = validate(listOfLayerEntryConfig[i]);

      if (!valid) {
        this.printSchemaError(validate, listOfLayerEntryConfig[i]);
        return false;
      }
    }

    for (let i = 0; i < listOfLayerEntryConfig.length; i++) {
      const layerEntryConfig = listOfLayerEntryConfig[i];
      if (
        layerEntryIsGroupLayer(layerEntryConfig) &&
        !this.IsValidTypeListOfLayerEntryConfig(geoviewLayerType, layerEntryConfig.listOfLayerEntryConfig!, validator)
      )
        return false;
    }
    return true;
  }

  /** ***************************************************************************************************************************
   * Validate the map features configuration.
   * @param {MapFeaturesConfig} mapFeaturesConfigToValidate The map features configuration to validate.
   *
   * @returns {MapFeaturesConfig} A valid map features configuration.
   */
  validateMapConfigAgainstSchema(mapFeaturesConfigToValidate: MapFeaturesConfig): MapFeaturesConfig {
    let validMapFeaturesConfig = mapFeaturesConfigToValidate;

    // create a validator object
    const validator = new Ajv({
      strict: false,
      allErrors: false,
    });

    // initialize validator with schema file
    validator.compile(schema);

    let isValid = this.IsValidTypeMapFeaturesInstance(mapFeaturesConfigToValidate, validator);
    for (let i = 0; i < mapFeaturesConfigToValidate.map.listOfGeoviewLayerConfig.length && isValid; i++) {
      // If not GeoCore, validate the geoview configuration with the schema.
      // GeoCore doesn't have schema validation as part of the routine below, because they're not a TypeGeoviewLayerType anymore
      // TODO: Verify if the following test will be used when we will code the geocore type
      // eslint-disable-next-line no-lone-blocks
      /* if (!mapConfigLayerEntryIsGeoCore(mapFeaturesConfigToValidate.map.listOfGeoviewLayerConfig[i])) */ {
        const gvLayerConfig = mapFeaturesConfigToValidate.map.listOfGeoviewLayerConfig[i];
        isValid = this.IsValidTypeListOfLayerEntryConfig(gvLayerConfig.geoviewLayerType, gvLayerConfig.listOfLayerEntryConfig, validator);
      }
    }

    if (!isValid) validMapFeaturesConfig = this.adjustMapConfiguration(mapFeaturesConfigToValidate);

    this.processLocalizedString(validMapFeaturesConfig.suportedLanguages, validMapFeaturesConfig.map.listOfGeoviewLayerConfig);
    this.doExtraValidation(validMapFeaturesConfig.map.listOfGeoviewLayerConfig);

    return validMapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Validate and adjust the list of GeoView layer configuration.
   * @param {TypeListOfLocalizedLanguages} suportedLanguages The list of supported languages.
   * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of GeoView layer configuration to adjust and
   * validate.
   */
  validateListOfGeoviewLayerConfig(
    suportedLanguages: TypeListOfLocalizedLanguages,
    listOfGeoviewLayerConfig?: AbstractGeoviewLayerConfig[]
  ): void {
    this.processLocalizedString(suportedLanguages, listOfGeoviewLayerConfig);
    this.doExtraValidation(listOfGeoviewLayerConfig);
  }

  /** ***************************************************************************************************************************
   * Do extra validation that schema can not do.
   * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry The list of Map Config Layer Entry configuration to adjust and
   * validate.
   */
  private doExtraValidation(listOfMapConfigLayerEntry?: AbstractGeoviewLayerConfig[]) {
    if (listOfMapConfigLayerEntry) {
      listOfMapConfigLayerEntry
        // TODO: Decide what to do with geocore
        // .filter((geoviewLayerConfig) => !mapConfigLayerEntryIsGeoCore(geoviewLayerConfig))
        .forEach((geoviewLayerConfig) => {
          // The default value for geoviewLayerConfig.initialSettings.visible is true.
          if (!geoviewLayerConfig.initialSettings) geoviewLayerConfig.initialSettings = { states: { visible: true } };
          switch (geoviewLayerConfig.geoviewLayerType) {
            case CONST_LAYER_TYPES.CSV:
            case CONST_LAYER_TYPES.GEOJSON:
            case CONST_LAYER_TYPES.XYZ_TILES:
            case CONST_LAYER_TYPES.VECTOR_TILES:
            case CONST_LAYER_TYPES.GEOPACKAGE:
            case CONST_LAYER_TYPES.IMAGE_STATIC:
              this.geoviewLayerIdIsMandatory(geoviewLayerConfig);
              break;
            case CONST_LAYER_TYPES.ESRI_DYNAMIC:
            case CONST_LAYER_TYPES.ESRI_FEATURE:
            case CONST_LAYER_TYPES.ESRI_IMAGE:
            case CONST_LAYER_TYPES.OGC_FEATURE:
            case CONST_LAYER_TYPES.WFS:
            case CONST_LAYER_TYPES.WMS:
              this.geoviewLayerIdIsMandatory(geoviewLayerConfig);
              this.metadataAccessPathIsMandatory(geoviewLayerConfig);
              break;
            default:
              throw new Error('Your not supposed to end here. There is a problem with the schema validator.');
          }
        });
    }
  }

  /** ***************************************************************************************************************************
   * Verify that the metadataAccessPath has a value.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig The GeoView layer configuration to validate.
   */
  private metadataAccessPathIsMandatory(geoviewLayerConfig: AbstractGeoviewLayerConfig) {
    if (!geoviewLayerConfig.metadataAccessPath) {
      throw new Error(
        `metadataAccessPath is mandatory for GeoView layer ${geoviewLayerConfig.geoviewLayerId} of type ${geoviewLayerConfig.geoviewLayerType}.`
      );
    }
  }

  /** ***************************************************************************************************************************
   * Verify that the geoviewLayerId has a value.
   * @param {AbstractGeoviewLayerConfig} geoviewLayerConfig The GeoView layer configuration to validate.
   */
  private geoviewLayerIdIsMandatory(geoviewLayerConfig: AbstractGeoviewLayerConfig) {
    if (!geoviewLayerConfig.geoviewLayerId) {
      throw new Error(`geoviewLayerId is mandatory for GeoView layer of type ${geoviewLayerConfig.geoviewLayerType}.`);
    }
  }

  /** ***************************************************************************************************************************
   * Synchronize the English and French strings.
   * @param {TypeLocalizedString} localizedString The localized string to synchronize the en and fr string.
   * @param {TypeDisplayLanguage} sourceKey The source's key.
   * @param {TypeDisplayLanguage} destinationKey The destination's key.
   *
   * @returns {MapFeaturesConfig} A valid JSON configuration object.
   */
  private SynchronizeLocalizedString(
    localizedString: TypeLocalizedString,
    sourceKey: TypeDisplayLanguage,
    destinationKey: TypeDisplayLanguage
  ) {
    localizedString[destinationKey] = localizedString[sourceKey];
  }

  /** ***************************************************************************************************************************
   * Adjust the map features configuration localized strings according to the suported languages array content.
   * @param {TypeListOfLocalizedLanguages} suportedLanguages The list of supported languages.
   * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry The list of Map Config Layer Entry configuration to adjust according
   * to the suported languages array content.
   */
  private processLocalizedString(
    suportedLanguages: TypeListOfLocalizedLanguages,
    listOfMapConfigLayerEntry?: AbstractGeoviewLayerConfig[]
  ): void {
    if (suportedLanguages.includes('en') && suportedLanguages.includes('fr') && listOfMapConfigLayerEntry) {
      const validateLocalizedString = (config: TypeJsonObject) => {
        if (typeof config === 'object') {
          Object.keys(config).forEach((key) => {
            if (!key.startsWith('_') && typeof config[key] === 'object') {
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
      const propagateLocalizedString = (config: TypeJsonObject) => {
        if (typeof config === 'object') {
          Object.keys(config).forEach((key) => {
            if (!key.startsWith('_') && typeof config[key] === 'object') {
              // Leaving the commented line here in case a developer needs to quickly uncomment it again to troubleshoot
              // logger.logDebug(`Key=${key}`, config[key]);
              if (config?.[key]?.en || config?.[key]?.fr)
                this.SynchronizeLocalizedString(Cast<TypeLocalizedString>(config[key]), sourceKey, destinationKey);
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

  /** ***************************************************************************************************************************
   * Adjust the map features configuration to make it valid.
   * @param {MapFeaturesConfig} config The map features configuration to adjust.
   *
   * @returns {MapFeaturesConfig} A valid JSON configuration object.
   */
  private adjustMapConfiguration(mapFeaturesConfigToAdjuste: MapFeaturesConfig): MapFeaturesConfig {
    // merge default and provided configuration in a temporary object.
    const tempMapFeaturesConfig = new MapFeaturesConfig(
      toJsonObject({
        ...this.#defaultMapFeaturesConfig,
        ...mapFeaturesConfigToAdjuste,
      })
    );

    // do validation for every pieces
    const projection = this.validateProjection(tempMapFeaturesConfig?.map?.viewSettings?.projection);
    const center = this.validateCenter(projection, tempMapFeaturesConfig?.map?.viewSettings?.center);
    const zoom = this.validateZoom(tempMapFeaturesConfig?.map?.viewSettings?.zoom);
    const basemapOptions = this.validateBasemap(projection, tempMapFeaturesConfig?.map?.basemapOptions);
    const schemaVersionUsed = this.validateVersion(tempMapFeaturesConfig.schemaVersionUsed);
    const minZoom = this.validateMinZoom(tempMapFeaturesConfig?.map?.viewSettings?.minZoom);
    const maxZoom = this.validateMaxZoom(tempMapFeaturesConfig?.map?.viewSettings?.maxZoom);
    const extent = tempMapFeaturesConfig?.map?.viewSettings?.extent
      ? this.validateExtent(projection, tempMapFeaturesConfig?.map?.viewSettings?.extent as [number, number, number, number], center)
      : undefined;

    // recreate the prop object to remove unwanted items and check if same as original. Log the modifications
    const validMapFeaturesConfig = new MapFeaturesConfig(
      toJsonObject({
        map: {
          basemapOptions,
          viewSettings: {
            zoom,
            center,
            projection,
            minZoom,
            maxZoom,
            extent,
          },
          highlightColor: tempMapFeaturesConfig.map.highlightColor,
          interaction: tempMapFeaturesConfig.map.interaction,
          listOfGeoviewLayerConfig: tempMapFeaturesConfig.map.listOfGeoviewLayerConfig,
          extraOptions: tempMapFeaturesConfig.map.extraOptions,
        },
        theme: tempMapFeaturesConfig.theme,
        components: tempMapFeaturesConfig.components,
        corePackages: tempMapFeaturesConfig.corePackages,
        suportedLanguages: tempMapFeaturesConfig.suportedLanguages,
        navBar: tempMapFeaturesConfig.navBar,
        appBar: tempMapFeaturesConfig.appBar,
        footerBar: tempMapFeaturesConfig.footerBar,
        overviewMap: tempMapFeaturesConfig.overviewMap,
        externalPackages: tempMapFeaturesConfig.externalPackages,
        schemaVersionUsed,
        serviceUrls: tempMapFeaturesConfig.serviceUrls,
      })
    );
    this.logModifs(tempMapFeaturesConfig, validMapFeaturesConfig);

    return validMapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Log modifications made to configuration by the validator.
   * @param {MapFeaturesConfig} inputMapFeaturesConfig input config.
   * @param {MapFeaturesConfig} validMapFeaturesConfig valid config.
   */
  private logModifs(inputMapFeaturesConfig: MapFeaturesConfig, validMapFeaturesConfig: MapFeaturesConfig): void {
    // eslint-disable-next-line array-callback-return
    Object.keys(inputMapFeaturesConfig).map((key) => {
      if (!(key in validMapFeaturesConfig)) {
        logger.logWarning(`- Key '${key}' is invalid -`);
      }
    });

    if (inputMapFeaturesConfig?.map?.viewSettings?.projection !== validMapFeaturesConfig.map.viewSettings.projection) {
      logger.logWarning(
        `- Invalid projection code ${inputMapFeaturesConfig?.map?.viewSettings?.projection} replaced by ${validMapFeaturesConfig.map.viewSettings.projection} -`
      );
    }

    if (inputMapFeaturesConfig?.map?.viewSettings?.zoom !== validMapFeaturesConfig.map.viewSettings.zoom) {
      logger.logWarning(
        `- Invalid zoom level ${inputMapFeaturesConfig?.map?.viewSettings?.zoom} replaced by ${validMapFeaturesConfig.map.viewSettings.zoom} -`
      );
    }

    if (
      JSON.stringify(inputMapFeaturesConfig?.map?.viewSettings?.center) !== JSON.stringify(validMapFeaturesConfig.map.viewSettings.center)
    ) {
      logger.logWarning(
        `- Invalid center ${inputMapFeaturesConfig?.map?.viewSettings?.center} replaced by ${validMapFeaturesConfig.map.viewSettings.center}`
      );
    }

    if (JSON.stringify(inputMapFeaturesConfig?.map?.basemapOptions) !== JSON.stringify(validMapFeaturesConfig.map.basemapOptions)) {
      logger.logWarning(
        `- Invalid basemap options ${JSON.stringify(inputMapFeaturesConfig?.map?.basemapOptions)} replaced by ${JSON.stringify(
          validMapFeaturesConfig.map.basemapOptions
        )} -`
      );
    }
  }
}
