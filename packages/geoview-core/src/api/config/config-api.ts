import {
  CV_DEFAULT_MAP_FEATURE_CONFIG,
  CV_CONFIG_GEOCORE_TYPE,
  CV_CONFIG_SHAPEFILE_TYPE,
  CV_CONST_LAYER_TYPES,
} from '@/api/config/types/config-constants';
import { MapFeatureConfig } from '@/api/config/types/classes/map-feature-config';
import {
  MapConfigLayerEntry,
  TypeBasemapOptions,
  TypeDisplayLanguage,
  TypeInteraction,
  TypeMapFeaturesInstance,
  TypeValidMapComponentProps,
  TypeValidMapCorePackageProps,
  TypeValidMapProjectionCodes,
  TypeZoomAndCenter,
} from '@/api/config/types/map-schema-types';
import { MapConfigError } from '@/api/config/types/classes/config-exceptions';
import { formatError } from '@/core/exceptions/core-exceptions';

import { isJsonString, isValidUUID, removeCommentsFromJSON } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { UUIDmapConfigReader } from '@/core/utils/config/reader/uuid-config-reader';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import {
  AbstractGeoViewLayer,
  LayerConfigCreatedEvent,
  LayerGroupCreatedEvent,
  LayerGVCreatedEvent,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { ImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { GeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { CSV } from '@/geo/layer/geoview-layers/vector/csv';

/**
 * The API class that create configuration object. It is used to validate and read the service and layer metadata.
 * @exports
 * @class DefaultConfig
 */
export class ConfigApi {
  // GV: The following property was created only for debugging purpose. They allow developers to inspect the
  // GV: content or call the methods of the last instance created by the corresponding ConfigApi call.

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

    if (isValidUUID(url)) return CV_CONFIG_GEOCORE_TYPE;

    if (/WMS/i.test(url)) return CV_CONST_LAYER_TYPES.WMS;

    if (/.CSV(?:$|\?)/i.test(url)) return CV_CONST_LAYER_TYPES.CSV;

    if (/.(ZIP|SHP)(?:$|\?)/i.test(url)) return CV_CONFIG_SHAPEFILE_TYPE;

    if (upperUrl.includes('COLLECTIONS')) return CV_CONST_LAYER_TYPES.OGC_FEATURE;

    return undefined;
  }

  /** ***************************************************************************************************************************
   * Parse the parameters obtained from a url.
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
   * Get url parameters from url param search string.
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
   * Convert the stringMapFeatureConfig to a json object. Comments will be removed from the string.
   * @param {string} stringMapFeatureConfig The map configuration string to convert to JSON format.
   * @returns {MapFeatureConfig | undefined} A JSON map feature configuration object.
   * @private
   */
  static convertStringToJson(stringMapFeatureConfig: string): MapFeatureConfig | undefined {
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
          CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][0].toString(),
          CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][1].toString(),
        ];

      // get zoom
      let zoom = CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![0].toString();
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
            CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls.geocoreUrl,
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
      jsonConfig.schemaVersionUsed = urlParams.v as '1.0' | undefined;
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
    return new MapFeatureConfig(CV_DEFAULT_MAP_FEATURE_CONFIG);
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
    const providedMapFeatureConfig = typeof mapConfig === 'string' ? ConfigApi.convertStringToJson(mapConfig)! : mapConfig;

    try {
      // If the user provided a valid string config with the mandatory map property, process geocore layers to translate them to their GeoView layers
      if (!providedMapFeatureConfig) throw new MapConfigError('The string configuration provided cannot be translated to a json object');
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
      const defaultMapConfig = ConfigApi.getDefaultMapFeatureConfig();
      defaultMapConfig.setErrorDetectedFlag();
      return defaultMapConfig;
    }
  }

  // #region EXPERIMENTAL

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createEsriDynamicConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = EsriDynamic.createEsriDynamicLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://maps-cartes.ec.gc.ca/arcgis/rest/services/CESI/MapServer',
      false,
      [{ id: 4, index: 4 }],
      {}
    );

    // Create the class from geoview-layers package
    const myLayer = new EsriDynamic(layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createEsriImageConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = EsriImage.createEsriImageLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://www5.agr.gc.ca/atlas/rest/services/app_agclimate_agclimat/agclimate_tx/ImageServer',
      false
    );

    // Create the class from geoview-layers package
    const myLayer = new EsriImage(layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createImageStaticConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = ImageStatic.createImageStaticLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://datacube-prod-data-public.s3.ca-central-1.amazonaws.com/store/imagery/aerial/napl/napl-ring-of-fire',
      false,
      [{ id: 'napl-ring-of-fire-1954-08-07-60k-thumbnail.png' }]
    );

    // Create the class from geoview-layers package
    const myLayer = new ImageStatic(layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createVectorTilesConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = VectorTiles.createVectorTilesLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://tiles.arcgis.com/tiles/HsjBaDykC1mjhXz9/arcgis/rest/services/CBMT_CBCT_3978_V_OSM/VectorTileServer',
      false,
      [{ id: 'CBMT_CBCT_3978_V_OSM' }]
    );

    // Create the class from geoview-layers package
    const myLayer = new VectorTiles(layerConfig, 'EPSG:3978');

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createWMSConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = WMS.createWMSLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://maps-cartes.services.geo.ca/server_serveur/services/NRCan/CER_Assessments_EN/MapServer/WMSServer',
      'mapserver',
      false,
      [{ id: '0' }]
    );

    // Create the class from geoview-layers package
    const myLayer = new WMS(layerConfig, false);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createXYZTilesConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = XYZTiles.createXYZTilesLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer',
      false,
      [{ id: '0' }]
    );

    // Create the class from geoview-layers package
    const myLayer = new XYZTiles(layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createCSVFeatureConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = CSV.createCSVLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://canadian-geospatial-platform.github.io/geoview/public/datasets/csv-files',
      false,
      [{ id: 'NPRI-INRP_WaterEau_MediaGroupMilieu_2022' }]
    );

    // Create the class from geoview-layers package
    const myLayer = new CSV(layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createEsriFeatureConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = EsriFeature.createEsriFeatureLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://services.arcgis.com/V6ZHFr6zdgNZuVG0/ArcGIS/rest/services/Toronto_Neighbourhoods/FeatureServer',
      false,
      [{ id: 0, index: 0 }]
    );

    // Create the class from geoview-layers package
    const myLayer = new EsriFeature(layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createGeoJsonLayerConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = GeoJSON.createGeoJsonLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://canadian-geospatial-platform.github.io/geoview/public/datasets/geojson/metadata.meta',
      false,
      [{ id: 'polygons.json' }]
    );

    // Create the class from geoview-layers package
    const myLayer = new GeoJSON(layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createOGCFeatureConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = OgcFeature.createOgcFeatureLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://b6ryuvakk5.execute-api.us-east-1.amazonaws.com/dev',
      false,
      [{ id: 'lakes' }]
    );

    // Create the class from geoview-layers package
    const myLayer = new OgcFeature(layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Experimental approach to use our Geoview-Layers classes from the ConfigAPI
   * @returns A Promise with the layer configuration
   * @experimental
   */
  // TODO: REFACTOR CONFIG API
  static createWFSConfig(): Promise<ConfigBaseClass[]> {
    // Create the Layer config
    const layerConfig = WFS.createWfsFeatureLayerConfig(
      'gvLayerID',
      'Some Name',
      'https://ahocevar.com/geoserver/wfs?REQUEST=GetCapabilities&VERSION=2.0.0&SERVICE=WFS',
      false,
      [{ id: 'usa:states' }]
    );

    // Create the class from geoview-layers package
    const myLayer = new WFS(layerConfig);

    // Process it
    return ConfigApi.#processConfig(myLayer);
  }

  /**
   * Processes a Layer Config by calling 'createGeoViewLayers' on the provided layer.
   * @param {AbstractGeoViewLayer} layer - The layer to use to process the configuration
   * @returns {Promise<ConfigBaseClass>} The promise of a generated ConfigBaseClass.
   * @private
   */
  static #processConfig(layer: AbstractGeoViewLayer): Promise<ConfigBaseClass[]> {
    // Create a promise that the layer config will be created
    const promise = new Promise<ConfigBaseClass[]>((resolve, reject) => {
      // Register a handler when the layer config has been created for this config
      layer.onLayerConfigCreated((geoviewLayer: AbstractGeoViewLayer, event: LayerConfigCreatedEvent) => {
        // A Layer Config was created
        logger.logDebug('Config created', event.config);
      });

      // (Extra) Register a handler when a Group layer has been created for this config
      layer.onLayerGroupCreated((geoviewLayer: AbstractGeoViewLayer, event: LayerGroupCreatedEvent) => {
        // A Group Layer was created
        logger.logDebug('Group Layer created', event.layer);
      });

      // (Extra) Register a handler when a GV layer has been created for this config
      layer.onLayerGVCreated((geoviewLayer: AbstractGeoViewLayer, event: LayerGVCreatedEvent) => {
        // A GV Layer was created
        logger.logDebug('GV Layer created', event.layer);
      });

      // Start the geoview-layers config process
      layer
        .createGeoViewLayers()
        .then((configs) => {
          // If no errors
          if (layer.layerLoadError.length === 0) {
            // Resolve with the configurations
            resolve(configs);
          } else {
            // Errors happened
            // If only one, throw as-is
            if (layer.layerLoadError.length === 1) throw layer.layerLoadError[0];
            // Throw them all inside an AggregateError
            layer.throwAggregatedLayerLoadErrors();
          }
        })
        .catch((error: unknown) => {
          // Reject
          reject(formatError(error));
        });
    });

    // Return the promise
    return promise;
  }

  // #endregion Experimental
}
