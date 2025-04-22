import cloneDeep from 'lodash/cloneDeep';

import { CV_DEFAULT_MAP_FEATURE_CONFIG, CV_CONFIG_GEOCORE_TYPE, CV_CONST_LAYER_TYPES } from '@/api/config/types/config-constants';
import { TypeJsonValue, TypeJsonObject, toJsonObject, TypeJsonArray, Cast } from '@/api/config/types/config-types';
import { MapFeatureConfig } from '@/api/config/types/classes/map-feature-config';
import { UUIDmapConfigReader } from '@/api/config/uuid-config-reader';
import {
  AbstractGeoviewLayerConfig,
  EntryConfigBaseClass,
  TypeDisplayLanguage,
  TypeGeoviewLayerType,
  TypeLayerStyleConfig,
} from '@/api/config/types/map-schema-types';
import { MapConfigError } from '@/api/config/types/classes/config-exceptions';

import { generateId, isJsonString, removeCommentsFromJSON } from '@/core/utils/utilities';
import { Fetch } from '@/core/utils/fetch-helper';
import { logger } from '@/core//utils/logger';
import { createStyleUsingEsriRenderer, EsriBaseRenderer } from '@/api/config/esri-renderer-parser';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { AbstractGeoViewLayer, LayerConfigCreatedEvent } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { GeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { CSV } from '@/geo/layer/geoview-layers/vector/csv';
import { WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { ImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { formatError } from '@/core/exceptions/core-exceptions';

/**
 * The API class that create configuration object. It is used to validate and read the service and layer metadata.
 * @exports
 * @class DefaultConfig
 */
export class ConfigApi {
  // GV: The two following properties was created only for debugging purpose. They allow developers to inspect the
  // GV: content or call the methods of the last instance created by the corresponding ConfigApi call.
  /** Static property that contains the last object instanciated by the ConfigApi.getLayerConfig call */
  static lastLayerConfigCreated?: AbstractGeoviewLayerConfig;

  /** Static property that contains the last object instanciated by the ConfigApi.createMapConfig call */
  static lastMapConfigCreated?: MapFeatureConfig;

  // TODO: Temporary property that will be deleted when the ConfigApi development is done. Set it to true for normal execution. */
  static devMode = false;

  /** ***************************************************************************************************************************
   * Function used to validate the GeoCore UUIDs.
   *
   * @param {string} uuid The UUID to validate.
   *
   * @returns {boolean} Returns true if the UUID respect the format.
   * @static
   */
  static isValidUUID(uuid: string): boolean {
    const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return regex.test(uuid);
  }

  /** ***************************************************************************************************************************
   * Attempt to determine the layer type based on the URL format.
   *
   * @param {string} url The URL of the service for which we want to guess the GeoView layer type.
   *
   * @returns {string | undefined} The GeoView layer type or undefined if it cannot be guessed.
   */
  static guessLayerType(url: string): string | undefined {
    if (!url) return undefined;

    const [upperUrl] = url.toUpperCase().split('?');

    if (/\{z\}\/{[xy]}\/{[xy]}/i.test(url)) return CV_CONST_LAYER_TYPES.XYZ_TILES;

    if (upperUrl.endsWith('MAPSERVER') || upperUrl.endsWith('MAPSERVER/')) return CV_CONST_LAYER_TYPES.ESRI_DYNAMIC;

    if (/(?:FEATURESERVER|MAPSERVER(?:\/\d+)+)/i.test(url)) return CV_CONST_LAYER_TYPES.ESRI_FEATURE;

    if (/IMAGESERVER/i.test(url)) return CV_CONST_LAYER_TYPES.ESRI_IMAGE;

    if (/WFS/i.test(url)) return CV_CONST_LAYER_TYPES.WFS;

    if (/.(?:GEO)?JSON(?:$|\?)/i.test(url)) return CV_CONST_LAYER_TYPES.GEOJSON;

    if (upperUrl.endsWith('.GPKG')) return CV_CONST_LAYER_TYPES.GEOPACKAGE;

    if (upperUrl.includes('VECTORTILESERVER')) return CV_CONST_LAYER_TYPES.VECTOR_TILES;

    if (ConfigApi.isValidUUID(url)) return CV_CONFIG_GEOCORE_TYPE;

    if (/WMS/i.test(url)) return CV_CONST_LAYER_TYPES.WMS;

    if (/.CSV(?:$|\?)/i.test(url)) return CV_CONST_LAYER_TYPES.CSV;

    if (upperUrl.includes('COLLECTIONS')) return CV_CONST_LAYER_TYPES.OGC_FEATURE;

    return undefined;
  }

  /** ***************************************************************************************************************************
   * Parse the parameters obtained from a url.
   *
   * @param {string} urlParams The parameters found on the url after the ?.
   *
   * @returns {TypeJsonObject} Object containing the parsed params.
   * @static @private
   */
  static #getMapPropsFromUrlParams(urlParams: string): TypeJsonObject {
    // Get parameters from path. Ex: x=123&y=456 will get {"x": 123, "z": "456"}
    const obj: TypeJsonObject = {};

    if (urlParams !== undefined) {
      const params = urlParams.split('&');

      for (let i = 0; i < params.length; i += 1) {
        const param = params[i].split('=');
        const key = param[0];
        const value = param[1] as TypeJsonValue;

        obj[key] = value as TypeJsonObject;
      }
    }

    return obj;
  }

  /**
   * Get url parameters from url param search string.
   *
   * @param {objStr} objStr the url parameter string.
   *
   * @returns {TypeJsonObject} an object containing url parameters.
   * @static @private
   */
  static #parseObjectFromUrl(objStr: string): TypeJsonObject {
    const obj: TypeJsonObject = {};

    if (objStr && objStr.length) {
      // first { is kept with regex, remove
      const objProps = objStr.split(',');

      if (objProps) {
        for (let i = 0; i < objProps.length; i += 1) {
          const prop = objProps[i].split(':');
          if (prop && prop.length) {
            const key: string = prop[0];
            const value: string = prop[1];

            if (prop[1] === 'true') {
              obj[key] = true as TypeJsonObject;
            } else if (prop[1] === 'false') {
              obj[key] = false as TypeJsonObject;
            } else {
              obj[key] = value as TypeJsonObject;
            }
          }
        }
      }
    }

    return obj;
  }

  /**
   * Convert the stringMapFeatureConfig to a json object. Comments will be removed from the string.
   * @param {string} stringMapFeatureConfig The map configuration string to convert to JSON format.
   *
   * @returns {TypeJsonObject} A JSON map feature configuration object.
   * @private
   */
  static #convertStringToJson(stringMapFeatureConfig: string): TypeJsonObject | undefined {
    // Erase comments in the config file.
    let newStringMapFeatureConfig = removeCommentsFromJSON(stringMapFeatureConfig as string);

    // If you want to use quotes in your JSON string, write \&quot or escape it using a backslash;
    // First, replace apostrophes not preceded by a backslash with quotes
    newStringMapFeatureConfig = newStringMapFeatureConfig.replace(/(?<!\\)'/gm, '"');
    // Then, replace apostrophes preceded by a backslash with a single apostrophe
    newStringMapFeatureConfig = newStringMapFeatureConfig.replace(/\\'/gm, "'");

    if (isJsonString(newStringMapFeatureConfig)) {
      // Create the config
      return JSON.parse(newStringMapFeatureConfig);
    }
    return undefined;
  }

  /**
   * Get a map feature config from url parameters.
   * @param {string} urlStringParams The url parameters.
   *
   * @returns {Promise<MapFeatureConfig>} A map feature configuration object generated from url parameters.
   * @static @async
   */
  static async getConfigFromUrl(urlStringParams: string): Promise<MapFeatureConfig> {
    // return the parameters as an object if url contains any params
    const urlParams = ConfigApi.#getMapPropsFromUrlParams(urlStringParams);

    // if user provided any url parameters update
    const jsonConfig = {} as TypeJsonObject;

    // update the language if provided from the map configuration.
    const displayLanguage = (urlParams.l as TypeDisplayLanguage) || 'en';

    if (Object.keys(urlParams).length && !urlParams.geoms) {
      // Ex: p=3857&z=4&c=40,-100&l=en&t=dark&b=basemapId:transport,shaded:false,labeled:true&i=dynamic&cp=details-panel,layers-panel&cc=overview-map&keys=12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9

      // get center
      let center: string[] = [];
      if (urlParams.c) center = (urlParams.c as string).split(',');
      if (center.length !== 2)
        center = [
          CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][0]!.toString(),
          CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][1].toString(),
        ];

      // get zoom
      let zoom = CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![0].toString();
      if (urlParams.z) zoom = urlParams.z as string;

      jsonConfig.map = {
        interaction: urlParams.i as TypeJsonObject,
        viewSettings: {
          initialView: {
            zoomAndCenter: [parseInt(zoom, 10), [parseInt(center[0], 10), parseInt(center[1], 10)]] as TypeJsonObject,
          },
          projection: parseInt(urlParams.p as string, 10) as TypeJsonObject,
        },
        basemapOptions: ConfigApi.#parseObjectFromUrl(urlParams.b as string),
        listOfGeoviewLayerConfig: Cast<TypeJsonObject>([]),
      };

      // get layer information from catalog using their uuid's if any passed from url params
      // and store it in the listOfGeoviewLayerConfig of the map.
      if (urlParams.keys) {
        try {
          // Get the GeoView layer configurations from the GeoCore UUIDs provided (urlParams.keys is a CSV string of UUIDs).
          const listOfGeoviewLayerConfig = await UUIDmapConfigReader.getGVConfigFromUUIDs(
            CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.geocoreUrl,
            displayLanguage,
            urlParams.keys.toString().split(',')
          );

          // The listOfGeoviewLayerConfig returned by the previous call appended 'rcs.' at the beginning and
          // '.en' or '.fr' at the end of the UUIDs. We want to restore the ids as they were before.
          listOfGeoviewLayerConfig.forEach((layerConfig, i) => {
            (listOfGeoviewLayerConfig[i].geoviewLayerId as string) = (layerConfig.geoviewLayerId as string).slice(4, -3);
          });

          // Store the new computed listOfGeoviewLayerConfig in the map.
          (jsonConfig.map.listOfGeoviewLayerConfig as TypeJsonObject[]) = listOfGeoviewLayerConfig;
        } catch (error: unknown) {
          // Log the error. The listOfGeoviewLayerConfig returned will be [].
          logger.logError('Failed to get the GeoView layers from url keys', urlParams.keys, error);
        }
      }

      // get core components
      if (urlParams.cc) {
        (jsonConfig.components as TypeJsonArray) = (urlParams.cc as string).split(',') as TypeJsonArray;
      }

      // get core packages if any
      if (urlParams.cp) {
        (jsonConfig.corePackages as TypeJsonArray) = (urlParams.cp as string).split(',') as TypeJsonArray;
      }

      // update the version if provided from the map configuration.
      jsonConfig.schemaVersionUsed = urlParams.v as TypeJsonObject;
    }

    // Trace the detail config read from url
    logger.logTraceDetailed('URL Config - ', jsonConfig);

    return new MapFeatureConfig(jsonConfig);
  }

  /**
   * Get the default values that are applied to the map feature configuration when the user doesn't provide a value for a field
   * that is covered by a default value.
   * @returns {MapFeatureConfig} The map feature configuration default values.
   * @static
   */
  static getDefaultMapFeatureConfig(): MapFeatureConfig {
    return new MapFeatureConfig(toJsonObject(CV_DEFAULT_MAP_FEATURE_CONFIG));
  }

  /**
   * Convert one layer config or an array of GeoCore layer config to their GeoView equivalents. The method returns undefined
   * and log an error in the console if a GeoCore layer cannot be converted. When the input/output type is an array, it is
   * possible to filter out the undefined values.
   *
   * @param {TypeDisplayLanguage} language The language language to use for the conversion.
   * @param {TypeJsonArray | TypeJsonObject} config Configuration to process.
   * @param {string} geocoreUrl Optional GeoCore server URL.
   * @param {boolean} filterUndefinedValues Flag indicating that we want to filter undefined values when the return type is an array..
   *
   * @returns {Promise<TypeJsonArray>} The resulting configurations or undefined if there is an error.
   * @static @private
   */
  static async convertGeocoreToGeoview(
    language: TypeDisplayLanguage,
    config: TypeJsonArray | TypeJsonObject,
    geocoreUrl?: string,
    filterUndefinedValues: boolean = true
  ): Promise<TypeJsonArray | TypeJsonObject | undefined> {
    // convert the JSON object to a JSON array. We want to process a single type.
    const listOfGeoviewLayerConfig = Array.isArray(config) ? config : [config];

    // Get the geocore URL from the config, otherwise use the default URL.
    const geocoreServerUrl = geocoreUrl || CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.geocoreUrl;

    // Filter all geocore layers and convert the result into an array of unique geoviewLayerId.
    const geocoreArrayOfKeys = Array.from(
      new Set(
        listOfGeoviewLayerConfig
          .filter((layerConfig) => layerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE)
          .map<string>((geocoreLayer) => geocoreLayer.geoviewLayerId as string)
      )
    );

    // If the listOfGeoviewLayerConfig contains GeoCore layers, process them.
    if (geocoreArrayOfKeys.length) {
      try {
        // Get the GeoView configurations using the array of GeoCore identifiers.
        const arrayOfJsonConfig = await UUIDmapConfigReader.getGVConfigFromUUIDs(geocoreServerUrl, language, geocoreArrayOfKeys);

        // replace the GeoCore layers by the GeoView layers returned by the server.
        // If a geocore layer cannot be found in the array of layers returned by the server, we leave it as is in
        // the listOfGeoviewLayerConfig.
        let newListOfGeoviewLayerConfig = listOfGeoviewLayerConfig.map((layerConfig) => {
          if (layerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE) {
            const jsonConfigFound = arrayOfJsonConfig.find((jsonConfig) => {
              // Remove the duplicate tag from the ID so it will match
              const geocoreId = (layerConfig.geoviewLayerId as string).split(':')[0];
              return jsonConfig.geoviewLayerId === `rcs.${geocoreId}.${language}`;
            });
            if (jsonConfigFound) {
              // take a clone in case the ID is a duplicate so the config can be re-used
              const newConfig = cloneDeep(jsonConfigFound);
              newConfig.geoviewLayerId = layerConfig.geoviewLayerId;
              newConfig.isGeocore = true as TypeJsonObject; // We want to remember that the origin is GeoCore.
              return newConfig;
            }
          }
          return layerConfig;
        }) as TypeJsonArray;

        // Print a message to display the layer identifier in error and if the input config is an array and the
        // filterUndefinedValues flag is true, filter out the erroneous GeoCore layers.
        newListOfGeoviewLayerConfig = newListOfGeoviewLayerConfig.filter((layerConfig) => {
          if (layerConfig.geoviewLayerType === CV_CONFIG_GEOCORE_TYPE) {
            logger.logError(`Unable to convert GeoCore layer (Id=${layerConfig.geoviewLayerId}).`);
            // if the config input type is an array and the filterUndefinedValues is on
            return !(filterUndefinedValues || !Array.isArray(config)); // Delete the layer entry
          }
          return true; // Keep the layer
        });

        // return the result according to the config type
        return Array.isArray(config) ? newListOfGeoviewLayerConfig : newListOfGeoviewLayerConfig[0];
      } catch (error: unknown) {
        logger.logError('Failed to process the array of GeoCore layers', geocoreArrayOfKeys, geocoreUrl, error);
      }
    } else return config;
    return undefined;
  }

  /**
   * This method validates the configuration of map elements using the json string or json object supplied by the user.
   * The returned value is a configuration object initialized only from the configuration passed as a parameter.
   * Validation of the configuration based on metadata and application of default values is not performed here,
   * but will be done later using another method.
   *
   * If the configuration is unreadable or generates a fatal error, the default configuration will be returned with
   * the error flag raised and an error message logged in the console. When configuration processing is possible, if
   * errors are detected, the configuration will be corrected to the best of our ability to avoid crashing the viewer,
   * and all changes made will be logged in the console.
   *
   * @param {string | TypeJsonObject} mapConfig The map feature configuration to validate.
   * @returns {MapFeatureConfig} The validated map feature configuration.
   * @static
   */
  static validateMapConfig(mapConfig: string | TypeJsonObject): MapFeatureConfig {
    // If the user provided a string config, translate it to a json object because the MapFeatureConfig constructor
    // doesn't accept string config. Note that convertStringToJson returns undefined if the string config cannot
    // be translated to a json object.
    const providedMapFeatureConfig: TypeJsonObject | undefined =
      typeof mapConfig === 'string' ? ConfigApi.#convertStringToJson(mapConfig as string) : (mapConfig as TypeJsonObject);

    try {
      // If the user provided a valid string config with the mandatory map property, process geocore layers to translate them to their GeoView layers
      if (!providedMapFeatureConfig) throw new MapConfigError('The string configuration provided cannot be translated to a json object');
      if (!providedMapFeatureConfig.map) throw new MapConfigError('The map property is mandatory');

      // Instanciate the mapFeatureConfig. If an error is detected, a workaround procedure
      // will be executed to try to correct the problem in the best possible way.
      ConfigApi.lastMapConfigCreated = new MapFeatureConfig(providedMapFeatureConfig!);
    } catch (error: unknown) {
      // If we get here, it is because the user provided a string config that cannot be translated to a json object,
      // or the config doesn't have the mandatory map property or the listOfGeoviewLayerConfig is defined but is not
      // an array.
      if (error instanceof MapConfigError) logger.logError(error.message);
      else logger.logError('ConfigApi.validateMapConfig - An error occured', error);
      const defaultMapConfig = ConfigApi.getDefaultMapFeatureConfig();
      defaultMapConfig.setErrorDetectedFlag();
      ConfigApi.lastMapConfigCreated = defaultMapConfig;
    }
    return ConfigApi.lastMapConfigCreated;
  }

  /**
   * Create the map feature configuration instance using the json string or the json object provided by the user.
   * All GeoCore entries found in the config are translated to their corresponding Geoview configuration.
   *
   * @param {string | TypeJsonObject} mapConfig The map feature configuration to instanciate.
   * @param {TypeDisplayLanguage} language The language of the map feature config we want to produce.
   *
   * @returns {Promise<MapFeatureConfig>} The map feature configuration Promise.
   * @static
   */
  // GV: GeoCore layers are processed here, well before the schema validation. The aim is to get rid of these layers in
  // GV: favor of their GeoView equivalent as soon as possible. Processing is based on the JSON representation of the config,
  // GV: and requires a minimum of validation to ensure that the configuration of GeoCore layers is valid.
  static async createMapConfig(mapConfig: string | TypeJsonObject, language: TypeDisplayLanguage): Promise<MapFeatureConfig> {
    // If the user provided a string config, translate it to a json object because the MapFeatureConfig constructor
    // doesn't accept string config. Note that convertStringToJson returns undefined if the string config cannot
    // be translated to a json object.
    const providedMapFeatureConfig: TypeJsonObject | undefined =
      // We clone to prevent modifications from leaking back to the user object.
      typeof mapConfig === 'string' ? ConfigApi.#convertStringToJson(mapConfig as string) : (cloneDeep(mapConfig) as TypeJsonObject);

    try {
      // If the user provided a valid string config with the mandatory map property, process geocore layers to translate them to their GeoView layers
      if (!providedMapFeatureConfig) throw new MapConfigError('The string configuration provided cannot be translated to a json object');
      if (!providedMapFeatureConfig.map) throw new MapConfigError('The map property is mandatory');
      providedMapFeatureConfig.map.listOfGeoviewLayerConfig = (providedMapFeatureConfig.map.listOfGeoviewLayerConfig ||
        []) as TypeJsonObject;

      const inputLength = providedMapFeatureConfig.map.listOfGeoviewLayerConfig.length;
      providedMapFeatureConfig.map.listOfGeoviewLayerConfig = (await ConfigApi.convertGeocoreToGeoview(
        language,
        providedMapFeatureConfig.map.listOfGeoviewLayerConfig as TypeJsonArray,
        providedMapFeatureConfig?.serviceUrls?.geocoreUrl as string
      )) as TypeJsonObject;
      const errorDetected = inputLength !== providedMapFeatureConfig.map.listOfGeoviewLayerConfig.length;

      // Instanciate the mapFeatureConfig. If an error is detected, a workaround procedure
      // will be executed to try to correct the problem in the best possible way.
      ConfigApi.lastMapConfigCreated = new MapFeatureConfig(providedMapFeatureConfig!);
      if (errorDetected) ConfigApi.lastMapConfigCreated.setErrorDetectedFlag();
    } catch (error: unknown) {
      // If we get here, it is because the user provided a string config that cannot be translated to a json object,
      // or the config doesn't have the mandatory map property or the listOfGeoviewLayerConfig is defined but is not
      // an array.
      if (error instanceof MapConfigError) logger.logError(error.message);
      else logger.logError('ConfigApi.createMapConfig - An error occured', error);
      const defaultMapConfig = ConfigApi.getDefaultMapFeatureConfig();
      defaultMapConfig.setErrorDetectedFlag();
      ConfigApi.lastMapConfigCreated = defaultMapConfig;
    }
    return ConfigApi.lastMapConfigCreated;
  }

  /**
   * Create the layer configuration instance using the layer access string and layer type provided by the user.
   *
   * @param {string} serviceAccessString The service access string (a URL or a layer identifier).
   * @param {TypeGeoviewLayerType | CV_CONFIG_GEOCORE_TYPE} layerType The GeoView layer type or 'geoCore'.
   * @param {TypeJsonArray} listOfLayerId Optionnal list of layer ids (default []).
   * @param {TypeDisplayLanguage} language Optional display language (default: en).
   *
   * @returns {AbstractGeoviewLayerConfig | undefined} The layer configuration or undefined if there is an error.
   * @static
   */
  // GV: GeoCore layers are processed here, well before the schema validation. The aim is to get rid of these layers in
  // GV: favor of their GeoView equivalent as soon as possible.
  static async createLayerConfig(
    serviceAccessString: string,
    layerType: TypeGeoviewLayerType | typeof CV_CONFIG_GEOCORE_TYPE,
    listOfLayerId: TypeJsonArray = [],
    language: TypeDisplayLanguage = 'en'
  ): Promise<AbstractGeoviewLayerConfig | undefined> {
    let geoviewLayerConfig: TypeJsonObject | undefined;

    // If the layerType is a GeoCore, we translate it to its GeoView configuration.
    if (layerType === CV_CONFIG_GEOCORE_TYPE) {
      try {
        const layerConfig = { geoviewLayerId: serviceAccessString, geoviewLayerType: layerType };
        geoviewLayerConfig = (await ConfigApi.convertGeocoreToGeoview(language, toJsonObject(layerConfig))) as TypeJsonObject;
        // if the conversion returned an undefined GeoView configuration or throw an error,
        // we return undefined to signal that we cannot create the GeoView layer.
        if (!geoviewLayerConfig) return undefined;
      } catch (error: unknown) {
        // Log error
        logger.logError(`Unable to convert GeoCore layer (Id=${serviceAccessString}).`, error);
        return undefined;
      }
    } else {
      // Create a GeoView Json configuration object.
      geoviewLayerConfig = toJsonObject({
        geoviewLayerId: generateId(),
        geoviewLayerName: language === 'en' ? 'unknown' : 'inconnue',
        geoviewLayerType: layerType,
        metadataAccessPath: serviceAccessString,
        listOfLayerEntryConfig: listOfLayerId.map((layerId) => {
          return { layerId };
        }),
      });
    }

    // Create the GeoView layer configuration instance and validate it against the schema.
    ConfigApi.lastLayerConfigCreated = MapFeatureConfig.nodeFactory(geoviewLayerConfig);
    return ConfigApi.lastLayerConfigCreated;
  }

  /**
   * Create the layer tree from the service metadata. If an error is detected, throw an error.
   * When listOfLayerId is [], then the entire metadata layer tree is returned.
   *
   * @param {string} serviceAccessString The service access string (a URL or a layer identifier).
   * @param {TypeGeoviewLayerType | CV_CONFIG_GEOCORE_TYPE} layerType The GeoView layer type or 'geoCore'.
   * @param {TypeJsonArray} listOfLayerId Optionnal list of layer ids (default []).
   * @param {TypeDisplayLanguage} language Optional display language (default: en).
   *
   * @returns {EntryConfigBaseClass[]} The metadata layer tree.
   * @static
   */
  static async createMetadataLayerTree(
    serviceAccessString: string,
    layerType: TypeGeoviewLayerType,
    listOfLayerId: TypeJsonArray = [],
    language: TypeDisplayLanguage = 'en'
  ): Promise<EntryConfigBaseClass[]> {
    // GV: TEMPORARY SECTION TO BE DELETED WHEN ALL LAYER TYPES ARE IMPLEMENTED
    // GV: THE CODE IN THIS SECTION IS NOT PERMANANT BECAUSE THE CORRESPONDING
    // GV: GEOVIEW LAYER CLASSES HAVE NOT YET BEEN IMPLEMENTED.
    // GV: BEGINNING OF TEMPORARY SECTION
    let jsonData: TypeJsonObject;
    switch (layerType) {
      case 'ogcFeature':
        jsonData = await Fetch.fetchJsonAsObject(`${serviceAccessString}?f=json`);
        if (jsonData.collections)
          return (jsonData.collections as TypeJsonArray).map((layer) => {
            return Cast<EntryConfigBaseClass>({
              layerId: layer.id,
              layerName: layer.title,
            });
          });
        if (jsonData.id)
          return [
            Cast<EntryConfigBaseClass>({
              layerId: jsonData.id,
              layerName: jsonData.title,
            }),
          ];
        return [];
        break;
      case 'CSV':
      case 'xyzTiles':
      case 'imageStatic':
      case 'vectorTiles':
      case 'GeoPackage':
        return [];
        break;
      default:
        break;
    }

    // GV: END OF TEMPORARY SECTION

    const geoviewLayerConfig = await ConfigApi.createLayerConfig(serviceAccessString, layerType, [], language);

    if (geoviewLayerConfig && !geoviewLayerConfig.getErrorDetectedFlag()) {
      // set layer tree creation filter (only the layerIds specified will be retained).
      // If an empty Array [] is used, the layer tree will be built using the service metadata.
      geoviewLayerConfig.setMetadataLayerTree(
        Cast<EntryConfigBaseClass[]>(
          listOfLayerId.map((layerId) => {
            return { layerId };
          })
        )
      );

      await geoviewLayerConfig.fetchServiceMetadata();
      if (!geoviewLayerConfig.getErrorDetectedFlag()) return geoviewLayerConfig.getMetadataLayerTree()!;
    }
    throw new MapConfigError('Unable to build metadata layer tree.');
  }

  /**
   * Returns the ESRI Renderer as a Style Config
   * @param {string} input The input renderer to be converted to a GeoView Style
   * @returns {TypeLayerStyleConfig} The converted style
   */
  static getStyleFromESRIRenderer(input: string): TypeLayerStyleConfig | undefined {
    const renderer = this.#convertStringToJson(input);
    if (renderer) {
      return createStyleUsingEsriRenderer(renderer as unknown as EsriBaseRenderer);
    }
    return undefined;
  }

  // #region Experimental

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createEsriDynamicConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = EsriDynamic.createEsriDynamicLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/MapServer',
      false,
      [{ index: '4' }] as unknown as TypeJsonArray,
      {}
    );

    // Create the class from geoview-layers package
    const myLayer = new EsriDynamic('mapId', layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createEsriImageConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = EsriImage.createEsriImageLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://www5.agr.gc.ca/atlas/rest/services/app_agclimate_agclimat/agclimate_tx/ImageServer',
      false
    );

    // Create the class from geoview-layers package
    const myLayer = new EsriImage('mapId', layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createImageStaticConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = ImageStatic.createImageStaticLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://datacube-prod-data-public.s3.ca-central-1.amazonaws.com/store/imagery/aerial/napl/napl-ring-of-fire',
      false,
      [{ id: 'napl-ring-of-fire-1954-08-07-60k-thumbnail.png' }] as unknown as TypeJsonArray
    );

    // Create the class from geoview-layers package
    const myLayer = new ImageStatic('mapId', layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createVectorTilesConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = VectorTiles.createVectorTilesLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://tiles.arcgis.com/tiles/HsjBaDykC1mjhXz9/arcgis/rest/services/CBMT_CBCT_3978_V_OSM/VectorTileServer',
      false,
      [{ id: 'CBMT_CBCT_3978_V_OSM' }] as unknown as TypeJsonArray
    );

    // Create the class from geoview-layers package
    const myLayer = new VectorTiles('mapId', layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createWMSConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = WMS.createWMSLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://maps-cartes.services.geo.ca/server_serveur/services/NRCan/CER_Assessments_EN/MapServer/WMSServer',
      'mapserver',
      false,
      [{ id: '0' }] as unknown as TypeJsonArray,
      {}
    );

    // Create the class from geoview-layers package
    const myLayer = new WMS('mapId', layerConfig, false);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createXYZTilesConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = XYZTiles.createXYZTilesLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
      false,
      [{ id: '0' }] as unknown as TypeJsonArray
    );

    // Create the class from geoview-layers package
    const myLayer = new XYZTiles('mapId', layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createCSVFeatureConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = CSV.createCSVLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://canadian-geospatial-platform.github.io/geoview/public/datasets/csv-files',
      false,
      [{ id: 'NPRI-INRP_WaterEau_MediaGroupMilieu_2022' }] as unknown as TypeJsonArray
    );

    // Create the class from geoview-layers package
    const myLayer = new CSV('mapId', layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createEsriFeatureConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = EsriFeature.createEsriFeatureLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/Toronto_Neighbourhoods/FeatureServer',
      false,
      [{ index: '0' }] as unknown as TypeJsonArray
    );

    // Create the class from geoview-layers package
    const myLayer = new EsriFeature('mapId', layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createGeoJsonLayerConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = GeoJSON.createGeoJsonLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://canadian-geospatial-platform.github.io/geoview/public/datasets/geojson/metadata.meta',
      false,
      [{ id: 'polygons.json' }] as unknown as TypeJsonArray
    );

    // Create the class from geoview-layers package
    const myLayer = new GeoJSON('mapId', layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createOGCFeatureConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = OgcFeature.createOgcFeatureLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://b6ryuvakk5.execute-api.us-east-1.amazonaws.com/dev',
      false,
      [{ id: 'lakes' }] as unknown as TypeJsonArray
    );

    // Create the class from geoview-layers package
    const myLayer = new OgcFeature('mapId', layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createWFSConfig(): Promise<ConfigBaseClass> {
    // Create the Layer config
    const layerConfig = WFS.createWfsFeatureLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://ahocevar.com/geoserver/wfs?REQUEST=GetCapabilities&VERSION=2.0.0&SERVICE=WFS',
      false,
      [{ id: 'usa:states' }] as unknown as TypeJsonArray
    );

    // Create the class from geoview-layers package
    const myLayer = new WFS('mapId', layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Processes a Layer Config by calling 'createGeoViewLayers' on the provided layer.
   * @param {AbstractGeoViewLayer} layer - The layer to use to process the configuration
   * @returns {Promise<ConfigBaseClass>} The promise of a generated ConfigBaseClass.
   * @private
   */
  static #processConfig(layer: AbstractGeoViewLayer): Promise<ConfigBaseClass> {
    // Create a promise that the layer config will be created
    const promise = new Promise<ConfigBaseClass>((resolve, reject) => {
      // Register a handler when the layer config has been created for this config
      layer.onLayerConfigCreated((geoviewLayer: AbstractGeoViewLayer, event: LayerConfigCreatedEvent) => {
        // Get the aggregated errors if any
        const aggregatedError = geoviewLayer.aggregateLayerLoadErrors();

        // If no errors
        if (!aggregatedError) {
          // Resolve
          resolve(event.config);
        } else {
          // Log the config the process managed to do, though there were some errors
          logger.logDebug(
            'The following error happened processing the configuration. Through the errors, the configuration is the following',
            event.config
          );

          // Reject
          reject(aggregatedError);
        }
      });

      // Start the geoview-layers config process which will trigger LayerConfigCreated at some point
      layer.createGeoViewLayers().catch((error) => {
        // Reject
        reject(formatError(error));
      });
    });

    // Return the promise
    return promise;
  }

  // #endregion Experimental
}
