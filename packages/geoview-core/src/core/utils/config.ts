/* eslint-disable no-console, no-underscore-dangle */

import { Coordinate } from 'ol/coordinate';

import axios, { AxiosResponse } from 'axios';

import Ajv from 'ajv';

import {
/*
  TypeDynamicLayer,
  TypeDynamicLayerEntry,
  TypeFeatureLayer,
  TypeWMSLayerConfig,
  TypeOgcLayerEntry,
  TypeWFSLayer,
  TypeOgcFeatureLayer,
  TypeGeoJSONLayer,
  TypeXYZTiles,
*/
  TypeJsonObject,
  TypeJsonValue,
  Cast,
  CONST_LAYER_TYPES,
  TypeJsonArray,
  TypeDynamicLayerConfig,
  TypeEsriFeatureLayerConfig,
  TypeWMSLayerConfig,
} from '../types/cgpv-types';
import { generateId, isJsonString } from './utilities';

import { api } from '../../app';

import { snackbarMessagePayload } from '../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../api/events/event';

import schema from '../../../schema.json';
import {
  TypeGeoviewLayerConfig,
  TypeInteraction,
  TypeLocalizedLanguages,
  TypeMapCorePackages,
  TypeMapSchemaProps,
  TypeValidProjectionCodes,
} from '../../geo/map/map-types';
import { TypeBasemapOptions } from '../../geo/layer/basemap/basemap-types';
import { TypeImageLayerConfig, TypeArrayOfLayerConfig, TypeSourceImageEsriInitialConfig, TypeSourceImageWmsInitialConfig } from '../../geo/layer/geoview-layers/schema-types';

export const catalogUrl = 'https://maps.canada.ca/geonetwork/srv/api/v2/docs';

/**
 * Class to handle configuration validation. Will validate every item for structure and valid values. If error found, will replace by default values
 * and sent a message in the console for developers to know something went wrong
 *
 * @exports
 * @class Config
 */
export class Config {
  // map id
  private id: string;

  private mapElement: Element;

  private language: string;

  private defaultLanguage = 'en-CA';

  // default config if provided configuration is missing or wrong
  private _config: TypeMapSchemaProps = {
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
      geoviewLayerList: [],
      extraOptions: {},
    },
    theme: 'dark',
    components: ['appbar', 'navbar', 'north-arrow', 'overview-map'],
    corePackages: [],
    languages: ['en', 'fr'],
    version: '2.0',
  };

  // validations values
  private _projections: TypeValidProjectionCodes[] = [3857, 3978];

  // valid basemap ids
  private _basemapId: Record<number, string[]> = {
    3857: ['transport', 'simple', 'osm', 'shaded', 'nogeom'],
    3978: ['transport', 'simple', 'osm', 'shaded', 'nogeom'],
  };

  // valid shaded basemap values for each projection
  private _basemapShaded: Record<number, boolean[]> = {
    3857: [true, false],
    3978: [true, false],
  };

  // valid labeled basemap values for each projection
  private _basemaplabeled: Record<number, boolean[]> = {
    3857: [true, false],
    3978: [true, false],
  };

  // valid center levels from each projection
  private _center: Record<number, Record<string, number[]>> = {
    3857: { lat: [-90, 90], long: [-180, 180] },
    3978: { lat: [40, 90], long: [-140, 40] },
  };

  // valid languages
  private _languages = ['en-CA', 'fr-CA'];

  /**
   * Get map configuration object
   */
  get configuration(): TypeMapSchemaProps {
    return this._config;
  }

  /**
   * Create the validation object
   * @param {Element} mapElement the map element
   */
  constructor(mapElement: Element) {
    this.mapElement = mapElement;

    // set default map id
    this.id = generateId();

    // set default language
    this.language = this.defaultLanguage;
  }

  /**
   * Generate layer configs from uuid request result
   *
   * @param {TypeJsonObject} result the uuid request result
   * @returns {TypeArrayOfLayerConfig} layers parsed from uuid result
   */
  static getLayerConfigFromUUID = (result: AxiosResponse<TypeJsonObject>): TypeArrayOfLayerConfig => {
    const layers: TypeGeoviewLayerConfig[] = [];

    if (result && result.data) {
      for (let i = 0; i < result.data.length; i++) {
        const data = result.data[i];

        if (data && data.layers && data.layers.length > 0) {
          const layer = data.layers[0];

          if (layer) {
            const { layerType, layerEntries, name, url, id } = layer;

            const isFeature = (url as string).indexOf('FeatureServer') > -1;

            if (layerType === CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
              const layerConfig: TypeDynamicLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                layerType,
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    geoviewLayerParent: layerConfig,
                    info: { layerId: item.index },
                    layerType: 'image',
                    source: { sourceType: 'ESRI' } as TypeSourceImageEsriInitialConfig,
                  } as TypeImageLayerConfig;
                }),
              } as TypeDynamicLayerConfig;
              layers.push(layerConfig);
            } else if (isFeature) {
              for (let j = 0; j < layerEntries.length; j++) {
                const featureUrl = `${url}/${layerEntries[j].index}`;
                const layerConfig: TypeEsriFeatureLayerConfig = {
                  id,
                  name: {
                    en: name,
                    fr: name,
                  },
                  accessPath: {
                    en: featureUrl,
                    fr: featureUrl,
                  },
                  layerType: CONST_LAYER_TYPES.ESRI_FEATURE,
                } as TypeEsriFeatureLayerConfig;
                layers.push(layerConfig);
              }
            } else if (layerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
              const layerConfig: TypeEsriFeatureLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                layerType,
              } as TypeEsriFeatureLayerConfig;
              layers.push(layerConfig);
            } else if (layerType === CONST_LAYER_TYPES.WMS) {
              const layerConfig: TypeEsriFeatureLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                layerType,
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    geoviewLayerParent: layerConfig,
                    info: { layerId: item.id },
                    layerType: 'image',
                    source: { sourceType: 'WMS' } as TypeSourceImageWmsInitialConfig,
                  } as TypeImageLayerConfig;
                }),
              } as TypeWMSLayerConfig;
              layers.push(layerConfig);
            } else if (layerType === CONST_LAYER_TYPES.WFS) {
              layers.push({
                id,
                name: {
                  en: name,
                  fr: name,
                },
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    id: item.id,
                  } as TypeOgcLayerEntry;
                }),
                url: {
                  en: url,
                  fr: url,
                },
                layerType,
              } as TypeWFSLayer);
            } else if (layerType === CONST_LAYER_TYPES.OGC_FEATURE) {
              layers.push({
                id,
                name: {
                  en: name,
                  fr: name,
                },
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    id: item.id,
                  } as TypeOgcLayerEntry;
                }),
                url: {
                  en: url,
                  fr: url,
                },
                layerType,
              } as TypeOgcFeatureLayer);
            } else if (layerType === CONST_LAYER_TYPES.GEOJSON) {
              layers.push({
                id,
                name: {
                  en: name,
                  fr: name,
                },
                url: {
                  en: url,
                  fr: url,
                },
                layerType,
              } as TypeGeoJSONLayer);
            } else if (layerType === CONST_LAYER_TYPES.XYZ_TILES) {
              layers.push({
                id,
                name: {
                  en: name,
                  fr: name,
                },
                url: {
                  en: url,
                  fr: url,
                },
                layerType,
              } as TypeXYZTiles);
            }
          }
        }
      }
    }

    return layers;
  };

  /**
   * Get map config from url parameters
   *
   * @returns {TypeMapSchemaProps | undefined} a config object generated from url parameters
   */
  private async getUrlParamsConfig(): Promise<TypeMapSchemaProps | undefined> {
    // create a new config object
    let configObj: TypeMapSchemaProps | undefined;

    // get search parameters from url
    const locationSearch = window.location.search;

    // return the parameters as an object if url contains any params
    const urlParams = this.getMapPropsFromUrlParams(locationSearch);

    // if user provided any url parameters update
    if (Object.keys(urlParams).length && !urlParams.geoms) {
      // Ex: ?p=3857&z=4&c=40,-100&l=en-CA&t=dark&b={id:transport,shaded:false,labeled:true}&i=dynamic&cp=details-panel,layers-panel,overview-map&keys=12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9

      let center = (urlParams.c as string).split(',');
      if (!center) center = ['0', '0'];

      const basemapOptions = Cast<TypeBasemapOptions>(this.parseObjectFromUrl(urlParams.b as string));

      let layers: TypeArrayOfLayerConfig = [];

      // get layer information from catalog using their uuid's if any passed from url params
      if (urlParams.keys) {
        const requestUrl = `${catalogUrl}/${this.language.split('-')[0]}/${urlParams.keys}`;

        const result = await axios.get<TypeJsonObject>(requestUrl);

        layers = Config.getLayerConfigFromUUID(result);
      }

      // get core packages if any
      let corePackages: TypeMapCorePackages = [];

      if (urlParams.cp) {
        corePackages = (urlParams.cp as string).split(',') as TypeMapCorePackages;
      }

      configObj = {
        map: {
          interaction: urlParams.i as TypeInteraction,
          view: {
            zoom: parseInt(urlParams.z as TypeJsonValue as string, 10),
            center: [parseInt(center[0], 10), parseInt(center[1], 10)],
            projection: parseInt(urlParams.p as string, 10) as TypeValidProjectionCodes,
          },
          basemapOptions,
          layers,
          extraOptions: {},
        },
        languages: ['en', 'fr'],
        corePackages,
      };

      // update language if provided from params
      const language = urlParams.l as TypeJsonValue as TypeLocalizedLanguages;
      if (language) this.language = this.validateLanguage(language);
    }

    return configObj;
  }

  /**
   * Get the config object from inline map element div
   *
   * @returns {TypeMapSchemaProps | undefined} the generated config object from inline map element
   */
  private getInlintDivConfig(): TypeMapSchemaProps | undefined {
    // create a new config object
    let configObj: TypeMapSchemaProps | undefined;

    const language = this.mapElement.getAttribute('data-lang');

    // update language if provided from map element
    if (language) this.language = this.validateLanguage(language);

    let configObjStr = this.mapElement.getAttribute('data-config');

    if (configObjStr && configObjStr !== '') {
      configObjStr = configObjStr.replace(/'/g, '"').replace(/(?:[A-Za-zàâçéèêëîïôûùüÿñæœ_.])"(?=[A-Za-zàâçéèêëîïôûùüÿñæœ_.])/g, "\\\\'");

      if (!isJsonString(configObjStr)) {
        console.log(`- map: ${this.id} - Invalid JSON configuration object, using default -`);
      } else {
        configObj = { ...JSON.parse(configObjStr) };
      }
    } else {
      console.log(`- map: ${this.id} - Empty JSON configuration object, using default -`);
    }

    return configObj;
  }

  /**
   * Get the config object from json file
   *
   * @returns {TypeMapSchemaProps | undefined} the generated config object from json file
   */
  private async getJsonFileConfig(): Promise<TypeMapSchemaProps | undefined> {
    // create a new config object
    let configObj: TypeMapSchemaProps | undefined;

    const language = this.mapElement.getAttribute('data-lang');

    // update language if provided from map element
    if (language) this.language = this.validateLanguage(language);

    const configUrl = this.mapElement.getAttribute('data-config-url');

    // check config url
    if (configUrl && configUrl !== '') {
      try {
        const res = await fetch(configUrl);

        const configData = await res.json();

        configObj = { ...configData };
      } catch (error) {
        console.log(`- map: ${this.id} - Invalid config url provided -`);
      }
    }

    return configObj;
  }

  /**
   * Get map config from a function call
   *
   * @param {TypeMapSchemaProps} configObj config object passed in the function
   * @returns {TypeMapSchemaProps} a valid map config
   */
  getMapConfigFromFunc(configObj: TypeMapSchemaProps): TypeMapSchemaProps | undefined {
    let mapConfigProps: TypeMapSchemaProps | undefined;

    // get the id from the map element
    const mapId = this.mapElement.getAttribute('id');

    // update map id if provided in map element
    if (mapId) this.id = mapId;

    const language = this.mapElement.getAttribute('data-lang');

    // update language if provided from map element
    if (language) this.language = this.validateLanguage(language);

    if (configObj) {
      // create a validator object
      const validator = new Ajv({
        strict: false,
        allErrors: true,
      });

      // initialize validator with schema file
      const validate = validator.compile(schema);

      // validate configuration
      const valid = validate({ ...configObj });

      if (!valid && validate.errors && validate.errors.length) {
        for (let j = 0; j < validate.errors.length; j += 1) {
          const error = validate.errors[j];
          console.log(error);

          setTimeout(() => {
            const errorMessage = `Map ${mapId}: ${error.instancePath} ${error.message} - ${JSON.stringify(error.params)}`;

            api.event.emit(
              snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
                type: 'string',
                value: errorMessage,
              })
            );
          }, 2000);
        }

        mapConfigProps = { ...this.validate(configObj), id: this.id, language: this.language as 'en-CA' | 'fr-CA' };
      } else {
        mapConfigProps = {
          ...this.validate(configObj),
          id: this.id,
          language: this.language as 'en-CA' | 'fr-CA',
        };
      }
    } else {
      mapConfigProps = { ...this._config, id: this.id, language: this.language as 'en-CA' | 'fr-CA' };
    }

    return mapConfigProps;
  }

  /**
   * Initialize a map config from either inline div, url params, json file
   *
   * @returns {TypeMapSchemaProps} the initialized valid map config
   */
  async initializeMapConfig(): Promise<TypeMapSchemaProps | undefined> {
    let mapConfigProps: TypeMapSchemaProps | undefined;

    // get the id from the map element
    const mapId = this.mapElement.getAttribute('id');

    // update map id if provided in map element
    if (mapId) this.id = mapId;

    // create a new config object to store provided config by user
    let configObj: TypeMapSchemaProps | undefined;

    // check if inline div config has been passed
    const inlineDivConfig = this.getInlintDivConfig();

    // use inline config if provided
    if (inlineDivConfig) configObj = { ...inlineDivConfig };

    // check if a config file url is provided
    const jsonFileConfig = await this.getJsonFileConfig();

    if (jsonFileConfig) configObj = { ...jsonFileConfig };

    // get the value that will check if any url params passed will override existing map
    const shared = this.mapElement.getAttribute('data-shared');

    // check if config params have been passed
    const urlParamsConfig = await this.getUrlParamsConfig();

    // use the url params config if provided
    if (urlParamsConfig && shared === 'true') configObj = { ...urlParamsConfig };

    // if config has been provided by user then validate it
    if (configObj) {
      // create a validator object
      const validator = new Ajv({
        strict: false,
        allErrors: true,
      });

      // initialize validator with schema file
      const validate = validator.compile(schema);

      // validate configuration
      const valid = validate({ ...configObj });

      if (!valid && validate.errors && validate.errors.length) {
        for (let j = 0; j < validate.errors.length; j += 1) {
          const error = validate.errors[j];
          console.log(error);

          setTimeout(() => {
            const errorMessage = `Map ${mapId}: ${error.instancePath} ${error.message} - ${JSON.stringify(error.params)}`;

            api.event.emit(
              snackbarMessagePayload(EVENT_NAMES.SNACKBAR.EVENT_SNACKBAR_OPEN, mapId, {
                type: 'string',
                value: errorMessage,
              })
            );
          }, 2000);
        }

        mapConfigProps = { ...this.validate(configObj), id: this.id, language: this.language as 'en-CA' | 'fr-CA' };
      } else {
        mapConfigProps = {
          ...this.validate(configObj),
          id: this.id,
          language: this.language as 'en-CA' | 'fr-CA',
        };
      }
    } else {
      mapConfigProps = { ...this._config, id: this.id, language: this.language as 'en-CA' | 'fr-CA' };
    }

    return mapConfigProps;
  }

  /**
   * Parse the search parameters passed from a url
   *
   * @param {string} configParams a search string passed from the url "?..."
   * @returns {Object} object containing the parsed params
   */
  private getMapPropsFromUrlParams(configParams: string): TypeJsonObject {
    // get parameters from path. Ex: ?z=4 will get {"z": "123"}
    const data = configParams.split('?')[1];
    const obj: TypeJsonObject = {};

    if (data !== undefined) {
      const params = data.split('&');

      for (let i = 0; i < params.length; i += 1) {
        const param = params[i].split('=');
        const key = param[0];
        const value = param[1] as TypeJsonValue;

        obj[key] = Cast<TypeJsonObject>(value);
      }
    }

    return obj;
  }

  /**
   * Get url parameters from url param search string
   *
   * @param {objStr} objStr the url parameters string
   * @returns {TypeJsonObject} an object containing url parameters
   */
  private parseObjectFromUrl(objStr: string): TypeJsonObject {
    const obj: TypeJsonObject = {};

    if (objStr && objStr.length) {
      // get the text in between { }
      const objStrPropRegex = /(?:[{_.])(.*?)(?=[}_.])/g;

      const objStrProps = objStr.match(objStrPropRegex);

      if (objStrProps && objStrProps.length) {
        const objProps = objStrProps[0].split(',');

        if (objProps) {
          for (let i = 0; i < objProps.length; i += 1) {
            const prop = objProps[i].split(':');
            if (prop && prop.length) {
              const key: string = prop[0];
              const value: string = prop[1];

              if (prop[1] === 'true') {
                obj[key] = Cast<TypeJsonObject>(true);
              } else if (prop[1] === 'false') {
                obj[key] = Cast<TypeJsonObject>(false);
              } else {
                obj[key] = Cast<TypeJsonObject>(value);
              }
            }
          }
        }
      }
    }

    return obj;
  }

  /**
   * Validate the configuration file
   * @param {TypeMapSchemaProps} config configuration object to validate
   * @returns {TypeMapSchemaProps} valid JSON configuration object
   */
  private validate(config: TypeMapSchemaProps): TypeMapSchemaProps {
    // merge default and provided configuration
    const tmpConfig: TypeMapSchemaProps = {
      ...this._config,
      ...config,
    };

    // do validation for every pieces
    // TODO: if the config becomes too complex, need to break down.... try to maintain config simple
    const projection = this.validateProjection(Number(tmpConfig.map.view.projection)) as TypeValidProjectionCodes;
    const basemapOptions = this.validateBasemap(projection, tmpConfig.map.basemapOptions);
    const center = this.validateCenter(projection, tmpConfig.map.view.center) as [number, number];
    const zoom = this.validateZoom(Number(tmpConfig.map.view.zoom));

    // recreate the prop object to remove unwanted items and check if same as original. Log the modifications
    const validConfig: TypeMapSchemaProps = {
      map: {
        basemapOptions,
        view: {
          zoom,
          center,
          projection,
        },
        extraOptions: tmpConfig.map.extraOptions,
        interaction: tmpConfig.map.interaction,
        layers: tmpConfig.map.layers,
        extraOptions: tmpConfig.map.extraOptions,
      },
      theme: tmpConfig.theme,
      components: tmpConfig.components,
      corePackages: tmpConfig.corePackages,
      languages: tmpConfig.languages,
      appBar: tmpConfig.appBar,
      externalPackages: tmpConfig.externalPackages,
      version: '2.0',
    };
    this.logModifs(tmpConfig, validConfig);

    return validConfig;
  }

  /**
   * Log modifications made to configuration by the validator
   * @param {TypeMapSchemaProps} inConfig input config
   * @param {TypeMapSchemaProps} validConfig valid config
   */
  private logModifs(inConfig: TypeMapSchemaProps, validConfig: TypeMapSchemaProps): void {
    // eslint-disable-next-line array-callback-return
    Object.keys(inConfig).map((key) => {
      if (!(key in validConfig)) {
        console.log(`- map: ${this.id} - Key '${key}' is invalid -`);
      }
    });

    if (inConfig.map.view.projection !== validConfig.map.view.projection) {
      console.log(
        `- map: ${this.id} - Invalid projection ${inConfig.map.view.projection} replaced by ${validConfig.map.view.projection} -`
      );
    }

    if (inConfig.map.view.zoom !== validConfig.map.view.zoom) {
      console.log(`- map: ${this.id} - Invalid zoom level ${inConfig.map.view.zoom} replaced by ${validConfig.map.view.zoom} -`);
    }

    if (JSON.stringify(inConfig.map.view.center) !== JSON.stringify(validConfig.map.view.center)) {
      console.log(`- map: ${this.id} - Invalid center ${inConfig.map.view.center} replaced by ${validConfig.map.view.center}`);
    }

    if (JSON.stringify(inConfig.map.basemapOptions) !== JSON.stringify(validConfig.map.basemapOptions)) {
      console.log(
        `- map: ${this.id} - Invalid basemap options ${JSON.stringify(inConfig.map.basemapOptions)} replaced by ${JSON.stringify(
          validConfig.map.basemapOptions
        )} -`
      );
    }
  }

  /**
   * Validate projection
   * @param {number} projection provided projection
   * @returns {number} valid projection
   */
  private validateProjection(projection: number): number {
    return this._projections.includes(projection) ? projection : 3978;
  }

  /**
   * Validate basemap options
   * @param {number} projection valid projection
   * @param {TypeBasemapOptions} basemapOptions basemap options
   * @returns {TypeBasemapOptions} valid basemap options
   */
  private validateBasemap(projection: number, basemapOptions: TypeBasemapOptions): TypeBasemapOptions {
    const id = this._basemapId[projection].includes(basemapOptions.id)
      ? basemapOptions.id
      : (this._basemapId[projection][0] as 'nogeom' | 'osm' | 'simple' | 'transport');

    const shaded = this._basemapShaded[projection].includes(basemapOptions.shaded)
      ? basemapOptions.shaded
      : this._basemapShaded[projection][0];
    const labeled = this._basemaplabeled[projection].includes(basemapOptions.labeled)
      ? basemapOptions.labeled
      : this._basemaplabeled[projection][0];

    return { id, shaded, labeled };
  }

  /**
   * Validate the center
   * @param {number} projection valid projection
   * @param {Coordinate} center center of the map
   * @returns {Coordinate} valid center of the map
   */
  private validateCenter(projection: number, center: Coordinate): Coordinate {
    const xVal = Number(center[0]);
    const yVal = Number(center[1]);

    const x =
      !Number.isNaN(xVal) && xVal > this._center[projection].long[0] && xVal < this._center[projection].long[1]
        ? xVal
        : this._config.map.view.center[0];
    const y =
      !Number.isNaN(yVal) && yVal > this._center[projection].lat[0] && yVal < this._center[projection].lat[1]
        ? yVal
        : this._config.map.view.center[1];

    return [x, y];
  }

  /**
   * Validate zoom level
   * @param {number} zoom provided zoom level
   * @returns {number} valid zoom level
   */
  private validateZoom(zoom: number): number {
    return !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : this._config.map.view.zoom;
  }

  /**
   * Validate map language
   * @param {string} language provided language
   * @returns {string} valid language
   */
  private validateLanguage(language: string): string {
    if (!this._languages.includes(language)) {
      console.log(`- map: ${this.id} - Invalid language ${language} replaced by ${this.defaultLanguage} -`);
      return this.defaultLanguage;
    }

    return language;
  }
}
