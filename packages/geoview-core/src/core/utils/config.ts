/* eslint-disable no-console, no-underscore-dangle */
import { LatLngTuple } from 'leaflet';

import axios from 'axios';

import Ajv from 'ajv';

import {
  TypeDynamicLayer,
  TypeDynamicLayerEntry,
  TypeFeatureLayer,
  TypeWMSLayer,
  TypeWMSLayerEntry,
  TypeWFSLayer,
  TypeOgcFeatureLayer,
  TypeGeoJSONLayer,
  TypeXYZTiles,
  TypeMapCorePackages,
  TypeMapSchemaProps,
  TypeMapConfigProps,
  TypeBasemapOptions,
  TypeJsonObject,
  TypeJsonValue,
  TypeLocalizedLanguages,
  Cast,
  TypeInteraction,
  TypeLayerConfig,
  CONST_LAYER_TYPES,
} from '../types/cgpv-types';
import { generateId } from './utilities';

import schema from '../../../schema.json';

const catalogUrl = 'https://maps.canada.ca/geonetwork/srv/api/v2/docs';

/**
 * Class to handle configuration validation. Will validate every item for structure and valid values. If error found, will replace by default values
 * and sent a message in the console for developers to know something went wrong
 *
 * @exports
 * @class
 */
export class Config {
  // map id
  private id: string;

  private mapElement: Element;

  private language: string;

  // default config if provided configuration is missing or wrong
  private _config: TypeMapSchemaProps = {
    map: {
      interaction: 'dynamic',
      initialView: {
        zoom: 4,
        center: [60, -100],
      },
      projection: 3978,
      basemapOptions: {
        id: 'transport',
        shaded: true,
        labeled: true,
      },
      layers: [],
      controls: {
        selectBox: true,
        boxZoom: true,
      },
    },
    theme: 'dark',
    components: ['appbar', 'navbar', 'northArrow'],
    corePackages: ['overview-map'],
    languages: ['en-CA', 'fr-CA'],
    extraOptions: {},
  };

  // validations values
  private _projections: number[] = [3857, 3978];

  private _basemapId: Record<number, string[]> = {
    3857: ['transport'],
    3978: ['transport', 'simple', 'shaded'],
  };

  private _basemapShaded: Record<number, boolean[]> = {
    3857: [false],
    3978: [true, false],
  };

  private _basemaplabeled: Record<number, boolean[]> = {
    3857: [true, false],
    3978: [true, false],
  };

  private _center: Record<number, Record<string, number[]>> = {
    3857: { lat: [-90, 90], long: [-180, 180] },
    3978: { lat: [40, 90], long: [-140, 40] },
  };

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
    this.language = 'en-US';

    // this._config = config !== '' && isJsonString(config) ? this.validate(config) : this._config;

    // if (config === '' || !isJsonString(config)) console.log(`- map: ${id} - Invalid or empty JSON configuration object, using default -`);
  }

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

      let center = (urlParams.c as TypeJsonValue as string).split(',');
      if (!center) center = ['0', '0'];

      const basemapOptions = Cast<TypeBasemapOptions>(this.parseObjectFromUrl(urlParams.b as string));

      const layers: TypeLayerConfig[] = [];

      // get layer information from catalog using their uuid's if any passed from url params
      if (urlParams.keys) {
        const requestUrl = `${catalogUrl}/${this.language.split('-')[0]}/${urlParams.keys}`;

        const result = await axios.get(requestUrl);

        if (result && result.data) {
          for (let i = 0; i < result.data.length; i++) {
            const data = result.data[i];

            if (data && data.layers && data.layers.length > 0) {
              const layer = data.layers[0];

              if (layer) {
                const { layerType, layerEntries, name, url, id } = layer;

                const isFeature = url.indexOf('FeatureServer') > -1;

                if (layerType === CONST_LAYER_TYPES.ESRI_DYNAMIC && !isFeature) {
                  layers.push(
                    Cast<TypeDynamicLayer>({
                      id,
                      name: {
                        en: name,
                        fr: name,
                      },
                      layerEntries: layerEntries.map((item: TypeDynamicLayerEntry) => {
                        return {
                          index: item.index,
                        };
                      }),
                      url: {
                        en: url,
                        fr: url,
                      },
                      layerType,
                    })
                  );
                } else if (isFeature) {
                  for (let j = 0; j < layerEntries.length; j++) {
                    const featureUrl = `${url}/${layerEntries[j].index}`;
                    layers.push(
                      Cast<TypeFeatureLayer>({
                        id,
                        name: {
                          en: name,
                          fr: name,
                        },
                        url: {
                          en: featureUrl,
                          fr: featureUrl,
                        },
                        layerType: CONST_LAYER_TYPES.ESRI_FEATURE,
                      })
                    );
                  }
                } else if (layerType === CONST_LAYER_TYPES.ESRI_FEATURE) {
                  layers.push(
                    Cast<TypeFeatureLayer>({
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
                    })
                  );
                } else if (layerType === CONST_LAYER_TYPES.WMS) {
                  layers.push(
                    Cast<TypeWMSLayer>({
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
                      layerEntries: layerEntries.map((item: TypeWMSLayerEntry) => {
                        return {
                          id: item.id,
                        };
                      }),
                    })
                  );
                } else if (layerType === CONST_LAYER_TYPES.WFS) {
                } else if (layerType === CONST_LAYER_TYPES.OGC_FEATURE) {
                } else if (layerType === CONST_LAYER_TYPES.GEOJSON) {
                } else if (layerType === CONST_LAYER_TYPES.XYZTiles) {
                }
              }
            }
          }
        }
      }

      // get core packages if any
      let corePackages: TypeMapCorePackages[] = [];

      if (urlParams.cp) {
        corePackages = (urlParams.cp as string).split(',') as TypeMapCorePackages[];
      }

      configObj = {
        map: {
          interaction: urlParams.i as TypeInteraction,
          initialView: {
            zoom: parseInt(urlParams.z as TypeJsonValue as string, 10),
            center: [parseInt(center[0], 10), parseInt(center[1], 10)],
          },
          projection: parseInt(urlParams.p as TypeJsonValue as '3978' | '3857', 10),
          basemapOptions,
          layers,
        },
        languages: ['en-CA', 'fr-CA'],
        corePackages,
        extraOptions: {},
      };

      // update language if provided from params
      const language = urlParams.l as TypeJsonValue as TypeLocalizedLanguages;
      if (language) this.language = language;
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
    if (language) this.language = language;

    let configObjStr = this.mapElement.getAttribute('data-config');

    if (configObjStr) {
      configObjStr = configObjStr.replace(/'/g, '"').replace(/(?<=[A-Za-zàâçéèêëîïôûùüÿñæœ_.])"(?=[A-Za-zàâçéèêëîïôûùüÿñæœ_.])/g, "\\\\'");

      configObj = { ...JSON.parse(configObjStr) };
    }

    return configObj;
  }

  async initializeMapConfig(): Promise<TypeMapConfigProps | undefined> {
    let mapConfigProps: TypeMapConfigProps | undefined;

    // get the id from the map element
    const mapId = this.mapElement.getAttribute('id');

    // update map id if provided in map element
    if (mapId) this.id = mapId;

    // get the value that will check if any url params passed will override existing map
    const shared = this.mapElement.getAttribute('data-shared');

    // create a new config object to store provided config by user
    let configObj: TypeMapSchemaProps | undefined;

    // check if inline div config has been passed
    const inlineDivConfig = this.getInlintDivConfig();

    // use inline config if provided
    if (inlineDivConfig) configObj = { ...inlineDivConfig };

    // check if config params have been passed
    const urlParamsConfig = await this.getUrlParamsConfig();

    // use the url params config if provided
    if (urlParamsConfig && shared === 'true') configObj = { ...urlParamsConfig };

    console.log(configObj);

    // if config has been provided by user then validate it
    if (configObj) {
      // create a validator object
      const validator = new Ajv({
        strict: false,
      });

      // initialize validator with schema file
      const validate = validator.compile(schema);

      // validate configuration
      const valid = validate({ ...configObj });

      if (!valid && validate.errors && validate.errors.length) {
        for (let j = 0; j < validate.errors.length; j += 1) {
          const error = validate.errors[j];
          console.log(error);
          // api.event.emit(EVENT_NAMES.EVENT_SNACKBAR_OPEN, null, {
          //   message: {
          //     type: 'key',
          //     value: error.message,
          //     params: [mapId],
          //   },
          // });
        }
      } else {
        mapConfigProps = {
          ...configObj,
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

  private parseObjectFromUrl(objStr: string): TypeJsonObject {
    const obj: TypeJsonObject = {};

    if (objStr && objStr.length) {
      // get the text in between { }
      const objStrPropRegex = /(?<=[{_.])(.*?)(?=[}_.])/g;

      const objStrProps = objStr.match(objStrPropRegex);

      if (objStrProps && objStrProps.length) {
        const objProps = objStrProps[0].split(',');

        if (objProps) {
          for (let i = 0; i < objProps.length; i += 1) {
            const prop = objProps[i].split(':');
            if (prop && prop.length) {
              const key = prop[0] as string;
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
   * @param {JSON} config JSON configuration object
   * @returns {TypeMapSchemaProps} valid JSON configuration object
   */
  private validate(config: string): TypeMapSchemaProps {
    // merge default and provided configuration
    const tmpConfig: TypeMapSchemaProps = {
      ...this._config,
      ...JSON.parse(config),
    };

    // do validation for every pieces
    // TODO: if the config becomes too complex, need to break down.... try to maintain config simple
    const projection = this.validateProjection(Number(tmpConfig.map.projection));
    const basemapOptions = this.validateBasemap(projection, tmpConfig.map.basemapOptions);
    const center = this.validateCenter(projection, tmpConfig.map.initialView.center);
    const zoom = this.validateZoom(Number(tmpConfig.map.initialView.zoom));

    // recreate the prop object to remove unwanted items and check if same as original. Log the modifications
    const validConfig: TypeMapSchemaProps = {
      map: {
        basemapOptions,
        initialView: {
          zoom,
          center,
        },
        interaction: tmpConfig.map.interaction,
        projection,
        controls: tmpConfig.map.controls,
        layers: tmpConfig.map.layers,
      },
      theme: tmpConfig.theme,
      corePackages: tmpConfig.corePackages,
      languages: tmpConfig.languages,
      extraOptions: tmpConfig.extraOptions,
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

    if (inConfig.map.projection !== validConfig.map.projection) {
      console.log(`- map: ${this.id} - Invalid projection ${inConfig.map.projection} replaced by ${validConfig.map.projection} -`);
    }

    if (inConfig.map.initialView.zoom !== validConfig.map.initialView.zoom) {
      console.log(
        `- map: ${this.id} - Invalid zoom level ${inConfig.map.initialView.zoom} replaced by ${validConfig.map.initialView.zoom} -`
      );
    }

    if (JSON.stringify(inConfig.map.initialView.center) !== JSON.stringify(validConfig.map.initialView.center)) {
      console.log(
        `- map: ${this.id} - Invalid center ${inConfig.map.initialView.center} replaced by ${validConfig.map.initialView.center} -`
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
      : (this._basemapId[projection][0] as 'shaded' | 'simple' | 'transport');

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
   * @param {LatLngTuple} center center of the map
   * @returns {LatLngTuple} valid center of the map
   */
  private validateCenter(projection: number, center: LatLngTuple): LatLngTuple {
    const xVal = Number(center[1]);
    const yVal = Number(center[0]);

    const x =
      !Number.isNaN(xVal) && xVal > this._center[projection].long[0] && xVal < this._center[projection].long[1]
        ? xVal
        : this._config.map.initialView.center[1];
    const y =
      !Number.isNaN(yVal) && yVal > this._center[projection].lat[0] && yVal < this._center[projection].lat[1]
        ? yVal
        : this._config.map.initialView.center[0];

    return [y, x];
  }

  /**
   * Validate zoom level
   * @param {number} zoom provided zoom level
   * @returns {number} valid zoom level
   */
  private validateZoom(zoom: number): number {
    return !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : 4;
  }

  /**
   * Validate map language
   * @param {string} language provided language
   * @returns {string} valid language
   */
  private validateLanguage(language: string): string {
    return this._languages.includes(language) ? language : this._languages[0];
  }
}
