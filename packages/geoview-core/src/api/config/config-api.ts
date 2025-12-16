import Ajv from 'ajv';
import addErrors from 'ajv-errors';

import { MapFeatureConfig } from '@/api/config/map-feature-config';
import type {
  TypeBasemapOptions,
  TypeDisplayLanguage,
  TypeInteraction,
  TypeMapFeaturesInstance,
  TypeValidMapComponentProps,
  TypeValidMapCorePackageProps,
  TypeValidMapProjectionCodes,
  TypeZoomAndCenter,
  TypeValidVersions,
  TypeLayerStyleConfig,
} from '@/api/types/map-schema-types';
import {
  DEFAULT_MAP_FEATURE_CONFIG,
  CONFIG_GEOCORE_TYPE,
  CONFIG_GEOPACKAGE_TYPE,
  CONFIG_SHAPEFILE_TYPE,
  MAP_CONFIG_SCHEMA_PATH,
} from '@/api/types/map-schema-types';
import type {
  MapConfigLayerEntry,
  TypeGeoviewLayerConfig,
  TypeInitialGeoviewLayerType,
  TypeLayerEntryConfig,
  TypeStylesWMS,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import { MapConfigError } from '@/core/exceptions/config-exceptions';
import { NotSupportedError } from '@/core/exceptions/core-exceptions';

import { isJsonString, isValidUUID, parseXMLToJson, removeCommentsFromJSON } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { GeoCore } from '@/api/config/geocore';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { UUIDmapConfigReader } from '@/api/config/reader/uuid-config-reader';
import { GeoPackageReader } from '@/api/config/reader/geopackage-reader';
import { ShapefileReader } from '@/api/config/reader/shapefile-reader';

import { LayerApi } from '@/geo/layer/layer';
import { GeoUtilities } from '@/geo/utils/utilities';
import { EsriRenderer } from '@/geo/utils/renderer/esri-renderer';
import { WfsRenderer } from '@/geo/utils/renderer/wfs-renderer';
import { CSV } from '@/geo/layer/geoview-layers/vector/csv';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { GeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { ImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { GeoTIFF } from '@/geo/layer/geoview-layers/raster/geotiff';
import { KML } from '@/geo/layer/geoview-layers/vector/kml';
import { OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { WKB } from '@/geo/layer/geoview-layers/vector/wkb';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';

import schema from '@/core/../../schema.json';

/**
 * The API class that create configuration object. It is used to validate and read the service and layer metadata.
 * @exports
 * @class DefaultConfig
 */
export class ConfigApi {
  /**
   * Attempts to determine the layer type based on the URL format.
   *
   * @param {string} url The URL of the service for which we want to guess the GeoView layer type.
   *
   * @returns {string | undefined} The GeoView layer type or undefined if it cannot be guessed.
   */
  static guessLayerType(url: string): string | undefined {
    if (!url) return undefined;

    const [upperUrl] = url.toUpperCase().split('?');

    if (/\{z\}\/{[xy]}\/{[xy]}/i.test(url)) return CONST_LAYER_TYPES.XYZ_TILES;

    if (upperUrl.endsWith('MAPSERVER') || upperUrl.endsWith('MAPSERVER/')) return CONST_LAYER_TYPES.ESRI_DYNAMIC;

    if (/(?:FEATURESERVER|MAPSERVER(?:\/\d+)+)/i.test(url)) return CONST_LAYER_TYPES.ESRI_FEATURE;

    if (/IMAGESERVER/i.test(url)) return CONST_LAYER_TYPES.ESRI_IMAGE;

    if (/WFS/i.test(url)) return CONST_LAYER_TYPES.WFS;

    if (/.(?:GEO)?JSON(?:$|\?)/i.test(url)) return CONST_LAYER_TYPES.GEOJSON;

    if (upperUrl.endsWith('.GPKG')) return CONFIG_GEOPACKAGE_TYPE;

    if (upperUrl.endsWith('.TIF')) return CONST_LAYER_TYPES.GEOTIFF;

    if (upperUrl.includes('VECTORTILESERVER')) return CONST_LAYER_TYPES.VECTOR_TILES;

    if (isValidUUID(url)) return CONFIG_GEOCORE_TYPE;

    if (/WMS/i.test(url)) return CONST_LAYER_TYPES.WMS;

    if (/.CSV(?:$|\?)/i.test(url)) return CONST_LAYER_TYPES.CSV;

    if (/.KML(?:$|\?)/i.test(url)) return CONST_LAYER_TYPES.KML;

    if (/.(ZIP|SHP)(?:$|\?)/i.test(url)) return CONFIG_SHAPEFILE_TYPE;

    if (upperUrl.includes('COLLECTIONS')) return CONST_LAYER_TYPES.OGC_FEATURE;

    return undefined;
  }

  /** ***************************************************************************************************************************
   * Parses the parameters obtained from a url.
   * @param {string} urlParams The parameters found on the url after the ?.
   * @returns {any} Object containing the parsed params.
   * @static @private
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static #getMapPropsFromUrlParams(urlParams: string): any {
    // Get parameters from path. Ex: x=123&y=456 will get {"x": 123, "z": "456"}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = {};

    if (urlParams !== undefined) {
      const params = urlParams.split('&');

      for (let i = 0; i < params.length; i += 1) {
        const param = params[i].split('=');
        const key = param[0];
        const value = param[1];

        obj[key] = value;
      }
    }

    return obj;
  }

  /**
   * Gets url parameters from url param search string.
   * @param {objStr} objStr the url parameter string.
   * @returns {unknown} an object containing url parameters.
   * @static @private
   */
  static #parseObjectFromUrl(objStr: string): unknown {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const obj: any = {};

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
              obj[key] = true;
            } else if (prop[1] === 'false') {
              obj[key] = false;
            } else {
              obj[key] = value;
            }
          }
        }
      }
    }

    return obj;
  }

  /**
   * Converts the stringMapFeatureConfig to a json object. Comments will be removed from the string.
   * @param {string} stringMapFeatureConfig The map configuration string to convert to JSON format.
   * @returns {MapFeatureConfig | undefined} A JSON map feature configuration object.
   * @static
   * @private
   */
  static #convertStringToJson(stringMapFeatureConfig: string): MapFeatureConfig | undefined {
    // Erase comments in the config file.
    let newStringMapFeatureConfig = removeCommentsFromJSON(stringMapFeatureConfig);

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
   * Gets a map feature config from url parameters.
   * @param {string} urlStringParams The url parameters.
   *
   * @returns {Promise<MapFeatureConfig>} A map feature configuration object generated from url parameters.
   * @static @async
   */
  static async getConfigFromUrl(urlStringParams: string): Promise<MapFeatureConfig> {
    // return the parameters as an object if url contains any params
    const urlParams = ConfigApi.#getMapPropsFromUrlParams(urlStringParams);

    // if user provided any url parameters update
    const jsonConfig = {} as TypeMapFeaturesInstance;

    // update the language if provided from the map configuration.
    const displayLanguage = (urlParams.l as TypeDisplayLanguage) || 'en';

    if (Object.keys(urlParams).length && !urlParams.geoms) {
      // Ex: p=3857&z=4&c=40,-100&l=en&t=dark&b=basemapId:transport,shaded:false,labeled:true&i=dynamic&cp=details-panel,layers-panel&cc=overview-map&keys=12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9

      // get center
      let center: string[] = [];
      if (urlParams.c) center = (urlParams.c as string).split(',');
      if (center.length !== 2)
        center = [
          DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][0].toString(),
          DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][1].toString(),
        ];

      // get zoom
      let zoom = DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![0].toString();
      if (urlParams.z) zoom = urlParams.z as string;

      jsonConfig.map = {
        interaction: urlParams.i as TypeInteraction,
        viewSettings: {
          initialView: {
            zoomAndCenter: [parseInt(zoom, 10), [parseInt(center[0], 10), parseInt(center[1], 10)]] as TypeZoomAndCenter,
          },
          projection: parseInt(urlParams.p as string, 10) as TypeValidMapProjectionCodes,
        },
        basemapOptions: ConfigApi.#parseObjectFromUrl(urlParams.b as string) as TypeBasemapOptions,
        listOfGeoviewLayerConfig: [] as MapConfigLayerEntry[],
      };

      // get layer information from catalog using their uuid's if any passed from url params
      // and store it in the listOfGeoviewLayerConfig of the map.
      if (urlParams.keys) {
        try {
          // Get the GeoView layer configurations from the GeoCore UUIDs provided (urlParams.keys is a CSV string of UUIDs).
          const response = await UUIDmapConfigReader.getGVConfigFromUUIDs(
            DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.geocoreUrl,
            displayLanguage,
            urlParams.keys.toString().split(',')
          );

          // Focus on the layers in the response
          const listOfGeoviewLayerConfig = response.layers;

          // The listOfGeoviewLayerConfig returned by the previous call appended 'rcs.' at the beginning and
          // '.en' or '.fr' at the end of the UUIDs. We want to restore the ids as they were before.
          listOfGeoviewLayerConfig.forEach((layerConfig, i) => {
            listOfGeoviewLayerConfig[i].geoviewLayerId = layerConfig.geoviewLayerId.slice(4, -3);
          });

          // Store the new computed listOfGeoviewLayerConfig in the map.
          jsonConfig.map.listOfGeoviewLayerConfig = listOfGeoviewLayerConfig;
        } catch (error: unknown) {
          // Log the error. The listOfGeoviewLayerConfig returned will be [].
          logger.logError('Failed to get the GeoView layers from url keys', urlParams.keys, error);
        }
      }

      // get core components
      if (urlParams.cc) {
        jsonConfig.components = (urlParams.cc as string).split(',') as TypeValidMapComponentProps[];
      }

      // get core packages if any
      if (urlParams.cp) {
        jsonConfig.corePackages = (urlParams.cp as string).split(',') as TypeValidMapCorePackageProps[];
      }

      // update the version if provided from the map configuration.
      jsonConfig.schemaVersionUsed = urlParams.v as TypeValidVersions | undefined;
    }

    // Trace the detail config read from url
    logger.logTraceDetailed('URL Config - ', jsonConfig);

    return new MapFeatureConfig(jsonConfig);
  }

  /**
   * Gets the default values that are applied to the map feature configuration when the user doesn't provide a value for a field
   * that is covered by a default value.
   * @returns {MapFeatureConfig} The map feature configuration default values.
   * @static
   */
  static getDefaultMapFeatureConfig(): MapFeatureConfig {
    return new MapFeatureConfig(DEFAULT_MAP_FEATURE_CONFIG);
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
   * @param {string | MapFeatureConfig} mapConfig The map feature configuration to validate.
   * @returns {MapFeatureConfig} The validated map feature configuration.
   * @static
   */
  static validateMapConfig(mapConfig: string | MapFeatureConfig): MapFeatureConfig {
    // If the user provided a string config, translate it to a json object because the MapFeatureConfig constructor
    // doesn't accept string config. Note that convertStringToJson returns undefined if the string config cannot
    // be translated to a json object.
    try {
      const providedMapFeatureConfig = typeof mapConfig === 'string' ? ConfigApi.#convertStringToJson(mapConfig) : mapConfig;

      // Validate
      if (!providedMapFeatureConfig) throw new MapConfigError('The string configuration provided cannot be translated to a json object');

      // Validate the map config
      ConfigApi.validateSchema(MAP_CONFIG_SCHEMA_PATH, providedMapFeatureConfig);

      // Validate
      if (!providedMapFeatureConfig.map) throw new MapConfigError('The map property is mandatory');

      // Instanciate the mapFeatureConfig. If an error is detected, a workaround procedure
      // will be executed to try to correct the problem in the best possible way.
      return new MapFeatureConfig(providedMapFeatureConfig);
    } catch (error: unknown) {
      // If we get here, it is because the user provided a string config that cannot be translated to a json object,
      // or the config doesn't have the mandatory map property or the listOfGeoviewLayerConfig is defined but is not
      // an array.
      if (error instanceof MapConfigError) logger.logError(error.message);
      else logger.logError('ConfigApi.validateMapConfig - An error occured', error);
    }

    // Return default map config
    return ConfigApi.getDefaultMapFeatureConfig();
  }

  /**
   * Validates an object against a JSON schema using Ajv.
   * @param {string} schemaPath - The JSON schema path used to retrieve the validator function.
   * @param {object} targetObject - The object to be validated against the schema.
   * @returns {boolean} Returns `true` if validation passes, `false` otherwise.
   */
  static validateSchema(schemaPath: string, targetObject: object): boolean {
    // create a validator object
    const validator = new Ajv({
      strict: false,
      allErrors: true,
    });
    addErrors(validator);

    // initialize validator with schema file
    validator.compile(schema);

    const validate = validator.getSchema(schemaPath);

    if (validate) {
      // validate configuration
      const valid = validate(targetObject);

      // If an error is detected, print it in the logger
      if (!valid) {
        for (let i = 0; i < validate.errors!.length; i += 1) {
          const error = validate.errors![i];
          const { instancePath } = error;
          const path = instancePath.split('/');
          let node = targetObject as Record<string, unknown>;
          for (let j = 1; j < path.length; j++) {
            node = node[path[j]] as Record<string, unknown>;
          }
          logger.logWarning('='.repeat(200), `\nSchemaPath: ${schemaPath}`, '\nSchema error: ', error, '\nObject affected: ', node);
        }
        return false;
      }

      // Log
      logger.logDebug('CONFIG-MAP-VALIDATED', targetObject);
      return true;
    }

    // If the schema is not found, log an error and set the error flag on the target object
    logger.logError(`Cannot find schema ${schemaPath}`);
    return false;
  }

  // #region INITIALIZERS AND PROCESSORS

  /**
   * Converts an ESRI renderer (in stringified JSON format) into a GeoView-compatible layer style configuration.
   * @param {string} rendererAsString - A stringified JSON representation of the ESRI renderer.
   * @returns {TypeLayerStyleConfig | undefined} The corresponding layer style configuration, or `undefined` if parsing or conversion fails.
   */
  static getStyleFromESRIRenderer(rendererAsString: string): TypeLayerStyleConfig | undefined {
    // Redirect
    return EsriRenderer.getStyleFromEsriRenderer(JSON.parse(rendererAsString));
  }

  /**
   * Fetches and returns the WMS Styles content (SLD or XML) for the specified layer(s)
   * from a given WMS service URL.
   * This function ensures that the request URL is properly formatted
   * as a valid WMS `GetStyles` request before fetching the style definition.
   * @param {string} wmsUrl - The base WMS service URL.
   * @param {string} layers - A comma-separated list of WMS layer names to request styles for.
   * @returns {Promise<string>} A promise that resolves to the style definition
   * (typically an XML or SLD string) retrieved from the WMS service.
   */
  static fetchStyleFromWMS(wmsUrl: string, layers: string): Promise<string> {
    // Make sure the URL has necessary information
    const stylesUrl = GeoUtilities.ensureServiceRequestUrlGetStyles(wmsUrl, layers);

    // Redirect
    return GeoUtilities.getWMSServiceString(stylesUrl);
  }

  /**
   * Converts a WMS XML Styles renderer into a GeoView-compatible layer style configuration.
   * @param {string} xmlContent - An XML representation of the WMS renderer.
   * @returns {TypeLayerStyleConfig} The corresponding layer style configuration, or `undefined` if parsing or conversion fails.
   */
  static getStyleFromWMSRenderer(xmlContent: string): TypeLayerStyleConfig {
    // Read styles as json
    const styles = parseXMLToJson<TypeStylesWMS>(xmlContent);

    // Redirect
    // TODO: Send the geometry type to reflect the special case scenario, if we want that (experimental)
    return WfsRenderer.buildLayerStyleInfo(styles, undefined);
  }

  /**
   * Creates and initializes a GeoView layer configuration based on the specified layer type.
   * This method dynamically selects the appropriate layer class (e.g., EsriDynamic, WMS, GeoJSON, etc.)
   * based on the provided `layerType`, and calls its `initGeoviewLayerConfig` method using the
   * supplied ID, name, and URL. If the layer type is not supported, an error is thrown.
   * @param {string} geoviewLayerId - A unique identifier for the GeoView layer.
   * @param {string} geoviewLayerName - The display name of the layer.
   * @param {TypeInitialGeoviewLayerType} layerType - The type of GeoView layer to initialize (e.g., 'esriDynamic', 'ogcWms', 'GeoJSON', etc.).
   * @param {string} layerURL - The URL endpoint associated with the layer (e.g., service URL, file path).
   * @param {TypeDisplayLanguage} language - The language, used for the geocore layer types to know which language to use when extracting layer information.
   * @param {string} mapId - The map id, used for the geocore layer types, to determine the layer id.
   * @param {AbortSignal | undefined} [abortSignal] - Abort signal to handle cancelling of fetch.
   * @returns {Promise<TypeGeoviewLayerConfig>} A Promise of a fully initialized `TypeGeoviewLayerConfig`.
   * @throws {NotSupportedError} If the provided layer type is not recognized or supported.
   */
  static async createInitConfigFromType(
    layerType: TypeInitialGeoviewLayerType,
    geoviewLayerId: string,
    geoviewLayerName: string,
    layerURL: string,
    isTimeAware?: boolean,
    language?: TypeDisplayLanguage,
    mapId?: string,
    abortSignal: AbortSignal | undefined = undefined
  ): Promise<TypeGeoviewLayerConfig> {
    // If working with geoCore
    if (layerType === 'geoCore') {
      // For GeoCore, we build the Config from the Geocore service
      const response = await GeoCore.createLayerConfigFromUUID(layerURL, language || 'en', mapId, undefined, abortSignal);
      const layerConfigFromGeocore = response.config;

      // Get the layer entries that GeoCore has configured
      const layerIdsFromGeocoreEntries = layerConfigFromGeocore.listOfLayerEntryConfig?.map((layerEntry) => layerEntry.layerId);

      // Loop back to create the correct config based on the type
      const layerConfigForGeoview = await ConfigApi.createInitConfigFromType(
        layerConfigFromGeocore.geoviewLayerType,
        layerConfigFromGeocore.geoviewLayerId,
        layerConfigFromGeocore.geoviewLayerName!,
        layerConfigFromGeocore.metadataAccessPath!,
        layerConfigFromGeocore.isTimeAware,
        language,
        mapId,
        abortSignal
      );

      // Tweak the Geoview config based on the response from GeoCore, as the Geoview config might need to be stripped out.
      const checkIfLayerEntryShouldBeIncluded = (listOfLayerEntryConfig: TypeLayerEntryConfig[]): TypeLayerEntryConfig[] => {
        const includedLayerEntryConfigs: TypeLayerEntryConfig[] = [];
        listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          if (layerIdsFromGeocoreEntries.includes(layerEntryConfig.layerId)) includedLayerEntryConfigs.push(layerEntryConfig);
          else if (layerEntryConfig.listOfLayerEntryConfig) {
            const includedLayers = checkIfLayerEntryShouldBeIncluded(layerEntryConfig.listOfLayerEntryConfig);
            if (includedLayers.length) includedLayerEntryConfigs.push(...includedLayers);
          }
        });

        return includedLayerEntryConfigs;
      };

      layerConfigForGeoview.listOfLayerEntryConfig = checkIfLayerEntryShouldBeIncluded(layerConfigForGeoview.listOfLayerEntryConfig);

      // Return
      return layerConfigForGeoview;
    }

    // Depending on the type
    switch (layerType) {
      case 'esriDynamic':
        return EsriDynamic.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'esriImage':
        return EsriImage.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'imageStatic':
        return ImageStatic.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'GeoTIFF':
        return GeoTIFF.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'vectorTiles':
        return VectorTiles.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'ogcWms':
        return WMS.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, false, isTimeAware);
      case 'xyzTiles':
        return XYZTiles.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'CSV':
        return CSV.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'esriFeature':
        return EsriFeature.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'GeoJSON':
        return GeoJSON.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'KML':
        return KML.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'WKB':
        return WKB.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'ogcFeature':
        return OgcFeature.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'ogcWfs':
        return WFS.initGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, isTimeAware);
      case 'GeoPackage':
        // For GeoPackage, we build a WKB config
        return await GeoPackageReader.createLayerConfigFromGeoPackage(
          {
            geoviewLayerId,
            geoviewLayerType: 'GeoPackage',
            metadataAccessPath: layerURL,
          },
          abortSignal
        );
      case 'shapefile':
        // For Shapefile, we build the Config from GeoJson
        return await ShapefileReader.convertShapefileConfigToGeoJson({
          geoviewLayerId,
          geoviewLayerType: 'shapefile',
          metadataAccessPath: layerURL,
        });
      default:
        // Unsupported
        throw new NotSupportedError(`Unsupported layer type ${layerType}`);
    }
  }

  /**
   * Processes the layer to generate a list of ConfigBaseClass objects.
   * @param {TypeInitialGeoviewLayerType} layerType - The layer type
   * @param {string} geoviewLayerId - The geoview layer id
   * @param {string} geoviewLayerName - The geoview layer name
   * @param {string} layerURL - The layer url
   * @param {number[] | string[]} layerIds - The layer ids for each layer entry config.
   * @returns {Promise<ConfigBaseClass[]>} A Promise of a list of ConfigBaseClass objects.
   * @throws {NotSupportedError} If the provided layer type is not recognized or supported.
   */
  static processLayerFromType(
    layerType: TypeInitialGeoviewLayerType,
    geoviewLayerId: string,
    geoviewLayerName: string,
    layerURL: string,
    layerIds: number[] | string[]
  ): Promise<ConfigBaseClass[]> {
    // Depending on the type
    // TODO: Check - Config init - Check, for ALL layers here, if there's a way to better determine the isTimeAware flag, defaults to false, how is it used here?
    switch (layerType) {
      case 'esriDynamic':
        return EsriDynamic.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as number[], false);
      case 'esriImage':
        return EsriImage.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, false);
      case 'GeoTIFF':
        return GeoTIFF.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as string[], false);
      case 'imageStatic':
        // TODO: Check - Config init - Check if there's a way to better determine the source extent to send, defaults to napl-ring-of-fire's extent
        return ImageStatic.processGeoviewLayerConfig(
          geoviewLayerId,
          geoviewLayerName,
          layerURL,
          layerIds as string[],
          false,
          [-87.77486341686723, 51.62285357468582, -84.57727128084842, 53.833354975551075],
          4326
        );
      case 'vectorTiles':
        // TODO: Check - Config init - Check if there's a way to better determine the projection to send, defaults to 'EPSG:3978'
        return VectorTiles.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as string[], false, 'EPSG:3978');
      case 'ogcWms':
        return WMS.processGeoviewLayerConfig(
          geoviewLayerId,
          geoviewLayerName,
          layerURL,
          layerIds as number[],
          false,
          LayerApi.DEBUG_WMS_LAYER_GROUP_FULL_SUB_LAYERS
        );
      case 'xyzTiles':
        return XYZTiles.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as string[], false);
      case 'CSV':
        return CSV.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as string[], false);
      case 'esriFeature':
        return EsriFeature.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as number[], false);
      case 'GeoJSON':
        return GeoJSON.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as string[], false);
      case 'KML':
        return KML.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as string[], false);
      case 'WKB':
        return WKB.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as string[], false);
      case 'ogcFeature':
        return OgcFeature.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as string[], false);
      case 'ogcWfs':
        // TODO: Check - Config init - Check if there's a way to better determine the typeOfServer to send, defaults to 'all'
        return WFS.processGeoviewLayerConfig(geoviewLayerId, geoviewLayerName, layerURL, layerIds as string[], false, 'all', true);
      default:
        // Unsupported
        throw new NotSupportedError(`Unsupported layer type ${layerType}`);
    }
  }

  /**
   * Utility function to serialize to string a TypeGeoviewLayerConfig object.
   * @param {TypeGeoviewLayerConfig} geoviewLayerConfig - The TypeGeoviewLayerConfig to serialize.
   * @returns {string} The serialized TypeGeoviewLayerConfig.
   */
  static serializeGeoviewLayerConfig(geoviewLayerConfig: TypeGeoviewLayerConfig): string {
    // Clone the object
    const cloneConfig = structuredClone(geoviewLayerConfig);

    // For each entry
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cloneConfig.listOfLayerEntryConfig = ConfigApi.#configClassesToLayerEntryConfigs(geoviewLayerConfig.listOfLayerEntryConfig) as any;

    // Serialize it
    return JSON.stringify(cloneConfig, undefined, 2);
  }

  /**
   * Utility function to serialize an array of ConfigBaseClass objects.
   * @param {ConfigBaseClass[]} layerConfigs - The array of ConfigBaseClass objects to serialize.
   * @returns {string} The serialized array of ConfigBaseClass.
   */
  static serializeConfigClasses(layerConfigs: ConfigBaseClass[]): string {
    // Serialize
    const configs = ConfigApi.#configClassesToLayerEntryConfigs(layerConfigs);

    // Serialize it
    return JSON.stringify(configs, undefined, 2);
  }

  /**
   * Utility function to convert an array of ConfigBaseClass objects to a simpler array of JSON objects.
   * @param {ConfigBaseClass[]} layerConfigs - The array of ConfigBaseClass objects to convert to simpler array of JSON objects.
   * @returns {unknown[]} An array of JSON objects.
   */
  static #configClassesToLayerEntryConfigs(layerConfigs: ConfigBaseClass[]): unknown[] {
    // Serialize
    return layerConfigs.map((layerEntry) => layerEntry.toJson());
  }

  /**
   * Utility function to validate a UUID.
   * @param {string} uuid - The uuid to test.
   * @returns {boolean} True if the provided uuid is a valid uuid.
   */
  static isValidUUID(uuid: string): boolean {
    // Redirect to the exported function in utilities
    return isValidUUID(uuid);
  }

  // #endregion INITIALIZERS AND PROCESSORS
}
