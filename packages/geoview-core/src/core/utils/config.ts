/* eslint-disable no-console, no-underscore-dangle */

import { Coordinate } from 'ol/coordinate';

import axios, { AxiosResponse } from 'axios';

import Ajv from 'ajv';

import { TypeJsonObject, TypeJsonValue, Cast, TypeJsonArray } from '../types/global-types';
import { generateId, isJsonString } from './utilities';

import { api } from '../../app';

import { snackbarMessagePayload } from '../../api/events/payloads/snackbar-message-payload';
import { EVENT_NAMES } from '../../api/events/event-types';

import schema from '../../../schema.json';
import {
  TypeGeoviewLayerConfig,
  TypeInteraction,
  TypeLocalizedLanguages,
  TypeMapCorePackages,
  TypeMapSchemaProps,
  TypeValidProjectionCodes,
  TypeValidVersions,
  VALID_LOCALIZED_LANGUAGES,
  VALID_VERSIONS,
} from '../../geo/map/map-types';
import { TypeBasemapOptions } from '../../geo/layer/basemap/basemap-types';
import {
  TypeImageLayerEntryConfig,
  TypeSourceImageEsriInitialConfig,
  TypeSourceImageWmsInitialConfig,
} from '../../geo/layer/geoview-layers/schema-types';
import { CONST_LAYER_TYPES } from '../../geo/layer/geoview-layers/abstract-geoview-layers';
import { TypeEsriDynamicLayerConfig } from '../../geo/layer/geoview-layers/raster/esri-dynamic';
import { TypeEsriFeatureLayerConfig } from '../../geo/layer/geoview-layers/vector/esri-feature';
import { TypeWMSLayerConfig } from '../../geo/layer/geoview-layers/raster/wms';
import { TypeSourceWFSVectorInitialConfig, TypeWFSLayerConfig, TypeWFSLayerEntryConfig } from '../../geo/layer/geoview-layers/vector/wfs';
import {
  TypeOgcFeatureLayerConfig,
  TypeOgcFeatureLayerEntryConfig,
  TypeSourceOgcFeatureInitialConfig,
} from '../../geo/layer/geoview-layers/vector/ogc-feature';
import { TypeGeoJSONLayerConfig } from '../../geo/layer/geoview-layers/vector/geojson';
import { TypeXYZTilesConfig } from '../../geo/layer/geoview-layers/raster/xyz-tiles';

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

  private displayLanguage: TypeLocalizedLanguages;

  private defaultLanguage: TypeLocalizedLanguages = 'en-CA';

  private mapConfigVersion: TypeValidVersions = '2.0';

  private defaultVersion = '2.0' as TypeValidVersions;

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
    suportedLanguages: ['en-CA', 'fr-CA'],
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
    this.displayLanguage = this.defaultLanguage;
  }

  /**
   * Generate layer configs from uuid request result
   *
   * @param {TypeJsonObject} result the uuid request result
   * @returns {TypeArrayOfLayerEntryConfig} layers parsed from uuid result
   */
  static getLayerConfigFromUUID = (result: AxiosResponse<TypeJsonObject>): TypeGeoviewLayerConfig[] => {
    const layers: TypeGeoviewLayerConfig[] = [];

    if (result && result.data) {
      for (let i = 0; i < result.data.length; i++) {
        const data = result.data[i];

        if (data && data.layers && data.layers.length > 0) {
          const layer = data.layers[0];

          if (layer) {
            const { geoviewLayerType, layerEntries, name, url, id } = layer;

            const isFeature = (url as string).indexOf('FeatureServer') > -1;

            if (geoviewLayerType === CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
              const layerConfig: TypeEsriDynamicLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    geoviewLayerParent: layerConfig,
                    info: { layerId: item.index },
                    layerEntryType: 'image',
                    source: { sourceType: 'ESRI' } as TypeSourceImageEsriInitialConfig,
                  } as TypeImageLayerEntryConfig;
                }),
              } as TypeEsriDynamicLayerConfig;
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
                  geoviewLayerType: CONST_LAYER_TYPES.ESRI_FEATURE,
                } as TypeEsriFeatureLayerConfig;
                layers.push(layerConfig);
              }
            } else if (geoviewLayerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
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
                geoviewLayerType,
              } as TypeEsriFeatureLayerConfig;
              layers.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.WMS) {
              const layerConfig: TypeWMSLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    geoviewLayerParent: layerConfig,
                    info: { layerId: item.id },
                    layerEntryType: 'image',
                    source: { sourceType: 'WMS' } as TypeSourceImageWmsInitialConfig,
                  } as TypeImageLayerEntryConfig;
                }),
              } as TypeWMSLayerConfig;
              layers.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.WFS) {
              const layerConfig: TypeWFSLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    geoviewLayerParent: layerConfig,
                    info: { layerId: item.id },
                    layerEntryType: 'vector',
                    source: { format: 'WFS' } as TypeSourceWFSVectorInitialConfig,
                  } as TypeWFSLayerEntryConfig;
                }),
              } as TypeWFSLayerConfig;
              layers.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.OGC_FEATURE) {
              const layerConfig: TypeOgcFeatureLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
                layerEntries: (layerEntries as TypeJsonArray).map((item) => {
                  return {
                    geoviewLayerParent: layerConfig,
                    info: { layerId: item.id },
                    layerEntryType: 'vector',
                    source: { format: 'featureAPI' } as TypeSourceOgcFeatureInitialConfig,
                  } as TypeOgcFeatureLayerEntryConfig;
                }),
              } as TypeOgcFeatureLayerConfig;
              layers.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.GEOJSON) {
              const layerConfig: TypeGeoJSONLayerConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
              } as TypeGeoJSONLayerConfig;
              layers.push(layerConfig);
            } else if (geoviewLayerType === CONST_LAYER_TYPES.XYZ_TILES) {
              const layerConfig: TypeXYZTilesConfig = {
                id,
                name: {
                  en: name,
                  fr: name,
                },
                accessPath: {
                  en: url,
                  fr: url,
                },
                geoviewLayerType,
              } as TypeXYZTilesConfig;
              layers.push(layerConfig);
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
  private async getUrlMapConfig(): Promise<TypeMapSchemaProps | undefined> {
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

      let layers: TypeGeoviewLayerConfig[] = [];

      // get layer information from catalog using their uuid's if any passed from url params
      if (urlParams.keys) {
        const requestUrl = `${catalogUrl}/${this.displayLanguage.split('-')[0]}/${urlParams.keys}`;

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
          viewSettings: {
            zoom: parseInt(urlParams.z as TypeJsonValue as string, 10),
            center: [parseInt(center[0], 10), parseInt(center[1], 10)],
            projection: parseInt(urlParams.p as string, 10) as TypeValidProjectionCodes,
          },
          basemapOptions,
          geoviewLayerList: layers,
          extraOptions: {},
        },
        suportedLanguages: ['en-CA', 'fr-CA'],
        corePackages,
        version: this.defaultVersion,
      };

      // update the language if provided from the map configuration.
      const displayLanguage = urlParams.l as TypeJsonValue as TypeLocalizedLanguages;
      if (displayLanguage) this.displayLanguage = this.validateLanguage(displayLanguage);

      // update the version if provided from the map configuration.
      const mapConfigVersion = urlParams.l as TypeJsonValue as TypeValidVersions;
      if (mapConfigVersion) this.mapConfigVersion = this.validateVersion(mapConfigVersion);
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

    const displayLanguage: TypeLocalizedLanguages = this.mapElement.getAttribute('displayLanguage') as TypeLocalizedLanguages;

    // update the language if provided from the map configuration.
    if (displayLanguage) this.displayLanguage = this.validateLanguage(displayLanguage);

    const mapConfigVersion: TypeValidVersions = this.mapElement.getAttribute('displayLanguage') as TypeValidVersions;

    // update the version if provided from the map configuration.
    if (mapConfigVersion) this.mapConfigVersion = this.validateVersion(mapConfigVersion);

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

    const displayLanguage = this.mapElement.getAttribute('displayLanguage') as TypeLocalizedLanguages;

    // update the language if provided from the map configuration.
    if (displayLanguage) this.displayLanguage = this.validateLanguage(displayLanguage);

    const mapConfigVersion: TypeValidVersions = this.mapElement.getAttribute('displayLanguage') as TypeValidVersions;

    // update the version if provided from the map configuration.
    if (mapConfigVersion) this.mapConfigVersion = this.validateVersion(mapConfigVersion);

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

    const displayLanguage = this.mapElement.getAttribute('displayLanguage') as TypeLocalizedLanguages;

    // update language if provided from map element
    if (displayLanguage) this.displayLanguage = this.validateLanguage(displayLanguage);

    const mapConfigVersion: TypeValidVersions = this.mapElement.getAttribute('displayLanguage') as TypeValidVersions;

    // update the version if provided from the map configuration.
    if (mapConfigVersion) this.mapConfigVersion = this.validateVersion(mapConfigVersion);

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

        mapConfigProps = { ...this.validate(configObj), mapId: this.id, displayLanguage: this.displayLanguage as TypeLocalizedLanguages };
      } else {
        mapConfigProps = {
          ...this.validate(configObj),
          mapId: this.id,
          displayLanguage: this.displayLanguage as TypeLocalizedLanguages,
        };
      }
    } else {
      mapConfigProps = { ...this._config, mapId: this.id, displayLanguage: this.displayLanguage as TypeLocalizedLanguages };
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
    const urlParamsConfig = await this.getUrlMapConfig();

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

        mapConfigProps = { ...this.validate(configObj), mapId: this.id, displayLanguage: this.displayLanguage as TypeLocalizedLanguages };
      } else {
        mapConfigProps = {
          ...this.validate(configObj),
          mapId: this.id,
          displayLanguage: this.displayLanguage as TypeLocalizedLanguages,
        };
      }
    } else {
      mapConfigProps = { ...this._config, mapId: this.id, displayLanguage: this.displayLanguage as TypeLocalizedLanguages };
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
    const projection = this.validateProjection(
      Number(tmpConfig.map.viewSettings.projection) as TypeValidProjectionCodes
    ) as TypeValidProjectionCodes;
    const basemapOptions = this.validateBasemap(projection, tmpConfig.map.basemapOptions);
    const center = this.validateCenter(projection, tmpConfig.map.viewSettings.center) as [number, number];
    const zoom = this.validateZoom(Number(tmpConfig.map.viewSettings.zoom));

    // recreate the prop object to remove unwanted items and check if same as original. Log the modifications
    const validConfig: TypeMapSchemaProps = {
      map: {
        basemapOptions,
        viewSettings: {
          zoom,
          center,
          projection,
        },
        interaction: tmpConfig.map.interaction,
        geoviewLayerList: tmpConfig.map.geoviewLayerList,
        extraOptions: tmpConfig.map.extraOptions,
      },
      theme: tmpConfig.theme,
      components: tmpConfig.components,
      corePackages: tmpConfig.corePackages,
      suportedLanguages: tmpConfig.suportedLanguages,
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

    if (inConfig.map.viewSettings.projection !== validConfig.map.viewSettings.projection) {
      console.log(
        `- map: ${this.id} - Invalid projection ${inConfig.map.viewSettings.projection} replaced by ${validConfig.map.viewSettings.projection} -`
      );
    }

    if (inConfig.map.viewSettings.zoom !== validConfig.map.viewSettings.zoom) {
      console.log(
        `- map: ${this.id} - Invalid zoom level ${inConfig.map.viewSettings.zoom} replaced by ${validConfig.map.viewSettings.zoom} -`
      );
    }

    if (JSON.stringify(inConfig.map.viewSettings.center) !== JSON.stringify(validConfig.map.viewSettings.center)) {
      console.log(
        `- map: ${this.id} - Invalid center ${inConfig.map.viewSettings.center} replaced by ${validConfig.map.viewSettings.center}`
      );
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
  private validateProjection(projection: TypeValidProjectionCodes): number {
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
        : this._config.map.viewSettings.center[0];
    const y =
      !Number.isNaN(yVal) && yVal > this._center[projection].lat[0] && yVal < this._center[projection].lat[1]
        ? yVal
        : this._config.map.viewSettings.center[1];

    return [x, y];
  }

  /**
   * Validate zoom level
   * @param {number} zoom provided zoom level
   * @returns {number} valid zoom level
   */
  private validateZoom(zoom: number): number {
    return !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : this._config.map.viewSettings.zoom;
  }

  /**
   * Validate map config language.
   * @param {TypeLocalizedLanguages} displayLanguage provided language
   * @returns {TypeLocalizedLanguages} valid language
   */
  private validateLanguage(displayLanguage: TypeLocalizedLanguages): TypeLocalizedLanguages {
    if (!VALID_LOCALIZED_LANGUAGES.includes(displayLanguage)) {
      console.log(`- map: ${this.id} - Invalid display language ${displayLanguage} replaced by ${this.defaultLanguage} -`);
      return this.defaultLanguage;
    }

    return displayLanguage;
  }

  /**
   * Validate map version.
   * @param {TypeValidVersions} version provided version
   * @returns {TypeValidVersions} valid version
   */
  private validateVersion(version: TypeValidVersions): TypeValidVersions {
    if (!VALID_VERSIONS.includes(version)) {
      console.log(`- map: ${this.id} - Invalid version ${version} replaced by ${this.defaultVersion} -`);
      return this.defaultVersion;
    }

    return version;
  }
}
