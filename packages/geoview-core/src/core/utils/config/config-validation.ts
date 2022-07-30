/* eslint-disable no-console, no-underscore-dangle */
import Ajv from 'ajv';

import { generateId } from '../utilities';
import { snackbarMessagePayload } from '../../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../../api/events/event-types';

import schema from '../../../../schemav2.json';
import { api } from '../../../app';
import { TypeBasemapId, TypeBasemapOptions, VALID_BASEMAP_ID } from '../../../geo/layer/basemap/basemap-types';
import {
  TypeLocalizedLanguages,
  TypeMapFeaturesConfig,
  TypeProjectionCodes,
  TypeValidVersions,
  VALID_LOCALIZED_LANGUAGES,
  VALID_PROJECTION_CODES,
  VALID_VERSIONS,
} from '../../../geo/map/map-types';

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
  private _mapId: string;

  /** The language that will be used to display the GeoView layer. */
  private _displayLanguage: TypeLocalizedLanguages;

  /** default configuration if provided configuration is missing or wrong */
  private _defaultMapFeaturesConfig: TypeMapFeaturesConfig = {
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
        id: 'transport',
        shaded: true,
        labeled: true,
      },
      listOfGeoviewLayerConfig: [],
      extraOptions: {},
    },
    theme: 'dark',
    components: ['appbar', 'navbar', 'north-arrow', 'overview-map'],
    corePackages: [],
    displayLanguage: 'en-CA',
    suportedLanguages: ['en-CA', 'fr-CA'],
    versionUsed: '1.0',
  };

  // valid basemap ids
  private _basemapId: Record<TypeProjectionCodes, TypeBasemapId[]> = {
    3857: VALID_BASEMAP_ID,
    3978: VALID_BASEMAP_ID,
  };

  // valid shaded basemap values for each projection
  private _basemapShaded: Record<TypeProjectionCodes, boolean[]> = {
    3857: [true, false],
    3978: [true, false],
  };

  // valid labeled basemap values for each projection
  private _basemaplabeled: Record<TypeProjectionCodes, boolean[]> = {
    3857: [true, false],
    3978: [true, false],
  };

  // valid center levels from each projection
  private _center: Record<TypeProjectionCodes, Record<string, number[]>> = {
    3857: { lat: [-90, 90], long: [-180, 180] },
    3978: { lat: [40, 90], long: [-140, 40] },
  };

  /** ***************************************************************************************************************************
   * The ConfigValidation class constructor used to instanciate an object of this type.
   * @param {string} mapId The map ID associated to the configuration. If it is undefined, a unique value will be generated and
   * assign to it.
   * @param {TypeLocalizedLanguages} displayLanguage  The language that will be used to display the GeoView layer.
   */
  constructor() {
    this._mapId = generateId();
    this._displayLanguage = this._defaultMapFeaturesConfig.displayLanguage!;
  }

  /** ***************************************************************************************************************************
   * Get map features configuration object.
   *
   * @returns {TypeMapFeaturesConfig} The map features configuration.
   */
  get defaultMapFeaturesConfig(): TypeMapFeaturesConfig {
    return this._defaultMapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Get mapId value.
   *
   * @returns {string} The ID of the Geoview map.
   */
  get mapId(): string {
    return this._mapId;
  }

  /** ***************************************************************************************************************************
   * Set mapId value.
   * @param {string} mapId The ID of the Geoview map.
   */
  set mapId(mapId: string) {
    this._mapId = mapId;
  }

  /** ***************************************************************************************************************************
   * Get displayLanguage value.
   *
   * @returns {TypeLocalizedLanguages} The display language of the Geoview map.
   */
  get displayLanguage(): TypeLocalizedLanguages {
    return this._displayLanguage;
  }

  /** ***************************************************************************************************************************
   * Set displayLanguage value.
   * @param {TypeLocalizedLanguages} displayLanguage The display language of the Geoview map.
   */
  set displayLanguage(displayLanguage: TypeLocalizedLanguages) {
    this._displayLanguage = this.validateLanguage(displayLanguage);
  }

  /** ***************************************************************************************************************************
   * Validate basemap options.
   * @param {TypeProjectionCodes} projection The projection code of the basemap.
   * @param {TypeBasemapOptions} basemapOptions The basemap options to validate.
   *
   * @returns {TypeBasemapOptions} A valid basemap options.
   */
  validateBasemap(projection?: TypeProjectionCodes, basemapOptions?: TypeBasemapOptions): TypeBasemapOptions {
    if (typeof projection !== 'undefined' && basemapOptions) {
      const id = this._basemapId[projection].includes(basemapOptions.id)
        ? basemapOptions.id
        : this._defaultMapFeaturesConfig.map.basemapOptions.id;
      const shaded = this._basemapShaded[projection].includes(basemapOptions.shaded)
        ? basemapOptions.shaded
        : this._defaultMapFeaturesConfig.map.basemapOptions.shaded;
      const labeled = this._basemaplabeled[projection].includes(basemapOptions.labeled)
        ? basemapOptions.labeled
        : this._defaultMapFeaturesConfig.map.basemapOptions.labeled;

      return { id, shaded, labeled };
    }
    return this._defaultMapFeaturesConfig.map.basemapOptions;
  }

  /** ***************************************************************************************************************************
   * Validate map version.
   * @param {TypeValidVersions} version The version to validate.
   *
   * @returns {TypeValidVersions} A valid version.
   */
  validateVersion(version?: TypeValidVersions): TypeValidVersions {
    return typeof version === 'undefined' || !VALID_VERSIONS.includes(version) ? this._defaultMapFeaturesConfig.versionUsed! : version;
  }

  /** ***************************************************************************************************************************
   * Validate map config language.
   * @param {TypeLocalizedLanguages} language The language to validate.
   *
   * @returns {TypeLocalizedLanguages} A valid language.
   */
  validateLanguage(language?: TypeLocalizedLanguages): TypeLocalizedLanguages {
    if (typeof language === 'undefined' || !VALID_LOCALIZED_LANGUAGES.includes(language)) {
      console.log(
        `- map: ${this.mapId} - Invalid display language code ${language} replaced by ${this._defaultMapFeaturesConfig.displayLanguage} -`
      );
      return this._defaultMapFeaturesConfig.displayLanguage!;
    }
    return language;
  }

  /** ***************************************************************************************************************************
   * Validate zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private validateZoom(zoom?: number): number {
    return typeof zoom === 'undefined' || Number.isNaN(zoom) || zoom < 0 || zoom > 18
      ? this._defaultMapFeaturesConfig.map.viewSettings.zoom
      : zoom;
  }

  /** ***************************************************************************************************************************
   * Validate projection.
   * @param {TypeProjectionCodes} projection The projection to validate.
   *
   * @returns {TypeProjectionCodes} A valid projection.
   */
  private validateProjection(projection?: TypeProjectionCodes): TypeProjectionCodes {
    return typeof projection === 'undefined' || !VALID_PROJECTION_CODES.includes(projection)
      ? this._defaultMapFeaturesConfig.map.viewSettings.projection
      : projection;
  }

  /** ***************************************************************************************************************************
   * Validate the center.
   * @param {TypeProjectionCodes} projection The projection used by the map.
   * @param {Coordinate} center The map center to valdate.
   *
   * @returns {Coordinate} A valid map center.
   */
  private validateCenter(projection?: TypeProjectionCodes, center?: [number, number]): [number, number] {
    if (typeof projection !== 'undefined' && center) {
      const xVal = Number(center[0]);
      const yVal = Number(center[1]);

      const x =
        !Number.isNaN(xVal) && xVal > this._center[projection].long[0] && xVal < this._center[projection].long[1]
          ? xVal
          : this._defaultMapFeaturesConfig.map.viewSettings.center[0];
      const y =
        !Number.isNaN(yVal) && yVal > this._center[projection].lat[0] && yVal < this._center[projection].lat[1]
          ? yVal
          : this._defaultMapFeaturesConfig.map.viewSettings.center[1];

      return [x, y];
    }
    return this._defaultMapFeaturesConfig.map.viewSettings.center;
  }

  /** ***************************************************************************************************************************
   * Validate the map features configuration.
   * @param {mapFeaturesConfigToValidate} projection The map features configuration to validate.
   *
   * @returns {Coordinate} A valid map features configuration.
   */
  validateMapConfigAgainstSchema(mapFeaturesConfigToValidate?: TypeMapFeaturesConfig): TypeMapFeaturesConfig {
    let validMapFeaturesConfig: TypeMapFeaturesConfig | undefined;

    // if config has been provided by user then validate it
    if (mapFeaturesConfigToValidate) {
      // create a validator object
      const validator = new Ajv({
        strict: false,
        allErrors: true,
      });

      // initialize validator with schema file
      const validate = validator.compile(schema);

      // validate configuration
      const valid = validate({ ...mapFeaturesConfigToValidate });

      if (!valid && validate.errors && validate.errors.length) {
        for (let j = 0; j < validate.errors.length; j += 1) {
          const error = validate.errors[j];
          console.log(this.mapId, error);
          console.log(mapFeaturesConfigToValidate);

          setTimeout(() => {
            const errorMessage = `Map ${this.mapId}: ${error.instancePath} ${error.message} - ${JSON.stringify(error.params)}`;

            api.event.emit(
              snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, this.mapId, {
                type: 'string',
                value: errorMessage,
              })
            );
          }, 2000);
        }

        validMapFeaturesConfig = {
          ...this.adjustMapConfiguration(mapFeaturesConfigToValidate),
          mapId: this.mapId,
          displayLanguage: this._displayLanguage as TypeLocalizedLanguages,
        };
      } else {
        validMapFeaturesConfig = {
          ...this.adjustMapConfiguration(mapFeaturesConfigToValidate),
          mapId: this.mapId,
          displayLanguage: this._displayLanguage as TypeLocalizedLanguages,
        };
      }
    } else {
      validMapFeaturesConfig = {
        ...this._defaultMapFeaturesConfig,
        mapId: this.mapId,
        displayLanguage: this._displayLanguage as TypeLocalizedLanguages,
      };
    }

    return validMapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Adjust the map features configuration to make it valid.
   * @param {TypeMapFeaturesConfig} config The map features configuration to adjust.
   *
   * @returns {TypeMapFeaturesConfig} A valid JSON configuration object.
   */
  private adjustMapConfiguration(mapFeaturesConfigToAdjuste: TypeMapFeaturesConfig): TypeMapFeaturesConfig {
    // merge default and provided configuration in a temporary object.
    const tempMapFeaturesConfig: TypeMapFeaturesConfig = {
      ...this._defaultMapFeaturesConfig,
      ...mapFeaturesConfigToAdjuste,
    };

    // do validation for every pieces
    const projection = this.validateProjection(tempMapFeaturesConfig?.map?.viewSettings?.projection);
    const center = this.validateCenter(projection, tempMapFeaturesConfig?.map?.viewSettings?.center);
    const zoom = this.validateZoom(tempMapFeaturesConfig?.map?.viewSettings?.zoom);
    const basemapOptions = this.validateBasemap(projection, tempMapFeaturesConfig?.map?.basemapOptions);
    const versionUsed = this.validateVersion(tempMapFeaturesConfig.versionUsed);

    // recreate the prop object to remove unwanted items and check if same as original. Log the modifications
    const validMapFeaturesConfig: TypeMapFeaturesConfig = {
      map: {
        basemapOptions,
        viewSettings: {
          zoom,
          center,
          projection,
        },
        interaction: tempMapFeaturesConfig.map.interaction,
        listOfGeoviewLayerConfig: tempMapFeaturesConfig.map.listOfGeoviewLayerConfig,
        extraOptions: tempMapFeaturesConfig.map.extraOptions,
      },
      theme: tempMapFeaturesConfig.theme,
      components: tempMapFeaturesConfig.components,
      corePackages: tempMapFeaturesConfig.corePackages,
      suportedLanguages: tempMapFeaturesConfig.suportedLanguages,
      displayLanguage: this._displayLanguage,
      appBar: tempMapFeaturesConfig.appBar,
      externalPackages: tempMapFeaturesConfig.externalPackages,
      versionUsed,
    };
    this.logModifs(tempMapFeaturesConfig, validMapFeaturesConfig);

    return validMapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Log modifications made to configuration by the validator.
   * @param {TypeMapFeaturesConfig} inputMapFeaturesConfig input config.
   * @param {TypeMapFeaturesConfig} validMapFeaturesConfig valid config.
   */
  private logModifs(inputMapFeaturesConfig: TypeMapFeaturesConfig, validMapFeaturesConfig: TypeMapFeaturesConfig): void {
    // eslint-disable-next-line array-callback-return
    Object.keys(inputMapFeaturesConfig).map((key) => {
      if (!(key in validMapFeaturesConfig)) {
        console.log(`- map: ${this.mapId} - Key '${key}' is invalid -`);
      }
    });

    if (inputMapFeaturesConfig?.map?.viewSettings?.projection !== validMapFeaturesConfig.map.viewSettings.projection) {
      console.log(
        `- map: ${this.mapId} - Invalid projection code ${inputMapFeaturesConfig?.map?.viewSettings?.projection} replaced by ${validMapFeaturesConfig.map.viewSettings.projection} -`
      );
    }

    if (inputMapFeaturesConfig?.map?.viewSettings?.zoom !== validMapFeaturesConfig.map.viewSettings.zoom) {
      console.log(
        `- map: ${this.mapId} - Invalid zoom level ${inputMapFeaturesConfig?.map?.viewSettings?.zoom} replaced by ${validMapFeaturesConfig.map.viewSettings.zoom} -`
      );
    }

    if (
      JSON.stringify(inputMapFeaturesConfig?.map?.viewSettings?.center) !== JSON.stringify(validMapFeaturesConfig.map.viewSettings.center)
    ) {
      console.log(
        `- map: ${this.mapId} - Invalid center ${inputMapFeaturesConfig?.map?.viewSettings?.center} replaced by ${validMapFeaturesConfig.map.viewSettings.center}`
      );
    }

    if (JSON.stringify(inputMapFeaturesConfig?.map?.basemapOptions) !== JSON.stringify(validMapFeaturesConfig.map.basemapOptions)) {
      console.log(
        `- map: ${this.mapId} - Invalid basemap options ${JSON.stringify(
          inputMapFeaturesConfig?.map?.basemapOptions
        )} replaced by ${JSON.stringify(validMapFeaturesConfig.map.basemapOptions)} -`
      );
    }
  }
}
