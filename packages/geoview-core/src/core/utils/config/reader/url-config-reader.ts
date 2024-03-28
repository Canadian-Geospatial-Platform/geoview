import { TypeBasemapOptions } from '@/geo/layer/basemap/basemap-types';
import {
  TypeListOfGeoviewLayerConfig,
  TypeInteraction,
  TypeMapCorePackages,
  TypeValidMapProjectionCodes,
  TypeValidVersions,
  TypeDisplayLanguage,
  TypeMapComponents,
} from '@/geo/map/map-schema-types';
import { Cast, TypeJsonObject, TypeJsonValue, TypeMapFeaturesConfig } from '@/core/types/global-types';
import { UUIDmapConfigReader } from './uuid-config-reader';
import { ConfigValidation } from '@/core/utils/config/config-validation';
import { logger } from '@/core/utils/logger';
import { replaceParams } from '@/core/utils/utilities';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

/**
 * A class to process GeoView map features configuration from a URL.
 * @exports
 * @class URLmapConfigReader
 */
export class URLmapConfigReader {
  /**
   * Parse the search parameters passed from a url
   *
   * @param {string} urlPath A url path with parameters "?..."
   * @returns {TypeJsonObject} Object containing the parsed params.
   */
  private static getMapPropsFromUrlParams(urlPath: string): TypeJsonObject {
    // get parameters from path. Ex: ?z=4 will get {"z": "123"}
    const data = urlPath.split('?')[1];
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
  private static parseObjectFromUrl(objStr: string): TypeJsonObject {
    const obj: TypeJsonObject = {};

    if (objStr && objStr.length) {
      // get the text in between { }
      const objStrPropRegex = /(?:[{_.])(.*?)(?=[}_.])/g;

      const objStrProps = objStr.match(objStrPropRegex);

      if (objStrProps && objStrProps.length) {
        // first { is kept with regex, remove
        const objProps = objStrProps[0].replace(/{/g, '').split(',');

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
   * Get map config from url parameters
   * @param {string} mapId the map ID of the GeoView map.
   *
   * @returns {Promise<TypeMapFeaturesConfig | undefined>} A map features configuration object generated from url parameters
   */
  static async getMapFeaturesConfig(mapId: string): Promise<TypeMapFeaturesConfig | undefined> {
    // instanciate the configValidation object used to validate map config attributes and define default values.
    const configValidation = new ConfigValidation();

    // create a new config object
    let mapConfig: TypeMapFeaturesConfig | undefined;

    // get search parameters from url
    const locationSearch = window.location.search;

    // return the parameters as an object if url contains any params
    const urlParams = this.getMapPropsFromUrlParams(locationSearch);

    // if user provided any url parameters update
    if (Object.keys(urlParams).length && !urlParams.geoms) {
      // Ex: ?p=3857&z=4&c=40,-100&l=en&t=dark&b={basemapId:transport,shaded:false,labeled:true}&i=dynamic&cp=details-panel,layers-panel&cc=overview-map&keys=12acd145-626a-49eb-b850-0a59c9bc7506,ccc75c12-5acc-4a6a-959f-ef6f621147b9

      // update the language if provided from the map configuration.
      let displayLanguage = urlParams.l as TypeDisplayLanguage;
      if (displayLanguage) displayLanguage = configValidation.validateDisplayLanguage(displayLanguage);

      // update the version if provided from the map configuration.
      let schemaVersionUsed = urlParams.v as TypeValidVersions;
      if (schemaVersionUsed) schemaVersionUsed = configValidation.validateVersion(schemaVersionUsed);

      let center;
      if (urlParams.c) center = (urlParams.c as string).split(',');
      if (!center) center = ['-100', '60'];

      const basemapOptions = Cast<TypeBasemapOptions>(this.parseObjectFromUrl(urlParams.b as string));

      let listOfGeoviewLayerConfig: TypeListOfGeoviewLayerConfig = [];

      // get layer information from catalog using their uuid's if any passed from url params
      if (urlParams.keys) {
        try {
          // Get the layers config
          const promise = UUIDmapConfigReader.getGVConfigFromUUIDs(
            configValidation.defaultMapFeaturesConfig.serviceUrls.geocoreUrl,
            displayLanguage.split('-')[0],
            urlParams.keys.toString().split(',')
          );
          listOfGeoviewLayerConfig = (await promise).layers;
        } catch (error) {
          // Log
          logger.logError('Failed to get the GeoView layers from url keys', urlParams.keys, error);
          const message = replaceParams(
            [error as TypeJsonValue, mapId],
            MapEventProcessor.getLocalizedMessage(mapId, 'validation.layer.loadfailed')
          );
          // TODO: config should not push message to map... only to console and as return value.. map will be responsible to throw notification
          MapEventProcessor.showError(mapId, message);
        }
      }

      // get core components
      let components: TypeMapComponents = [];
      if (urlParams.cc) {
        components = (urlParams.cc as string).split(',') as TypeMapComponents;
      }

      // get core packages if any
      let corePackages: TypeMapCorePackages = [];

      if (urlParams.cp) {
        corePackages = (urlParams.cp as string).split(',') as TypeMapCorePackages;
      }

      mapConfig = {
        mapId,
        map: {
          interaction: urlParams.i as TypeInteraction,
          viewSettings: {
            zoom: parseInt(urlParams.z as TypeJsonValue as string, 10),
            center: [parseInt(center[0], 10), parseInt(center[1], 10)],
            projection: parseInt(urlParams.p as string, 10) as TypeValidMapProjectionCodes,
          },
          basemapOptions,
          listOfGeoviewLayerConfig,
          extraOptions: {},
        },
        serviceUrls: {
          geocoreUrl: configValidation.defaultMapFeaturesConfig.serviceUrls.geocoreUrl,
        },
        components,
        corePackages,
        suportedLanguages: ['en', 'fr'],
        schemaVersionUsed,
      };
    }

    // Trace the detail config read from url
    logger.logTraceDetailed('URL Config - ', mapId, mapConfig);

    return mapConfig;
  }
}
