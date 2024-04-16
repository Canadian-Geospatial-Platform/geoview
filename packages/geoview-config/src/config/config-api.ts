/* eslint-disable no-underscore-dangle, no-param-reassign */
import { logger } from 'geoview-core/src/core/utils/logger';
import {
  CV_CONST_LAYER_TYPES,
  CV_DEFAULT_MAP_FEATURES_CONFIG,
  CV_BASEMAP_ID,
  CV_BASEMAP_SHADED,
  CV_BASEMAP_LABEL,
  CV_MAP_CENTER,
} from './types/config-constants';
import { Cast, TypeJsonArray, TypeJsonObject, TypeJsonValue, toJsonObject } from './types/config-types';
import {
  TypeDisplayLanguage,
  TypeValidMapProjectionCodes,
  TypeBasemapId,
  TypeBasemapOptions,
  TypeValidVersions,
  VALID_VERSIONS,
  VALID_PROJECTION_CODES,
  Extent,
  TypeLocalizedString,
} from './types/map-schema-types';
import { MapFeaturesConfig } from './types/classes/map-features-config';

// ******************************************************************************************************************************
// ******************************************************************************************************************************
/** *****************************************************************************************************************************
 * A class to define the default values of a GeoView map configuration and validation methods for the map config attributes.
 * @exports
 * @class DefaultConfig
 */
// ******************************************************************************************************************************
export class ConfigApi {
  /** ***************************************************************************************************************************
   * Get map features configuration object.
   *
   * @returns {MapFeaturesConfig} The map features configuration.
   */
  static get defaultMapFeaturesConfig(): MapFeaturesConfig {
    return new MapFeaturesConfig(JSON.stringify(CV_DEFAULT_MAP_FEATURES_CONFIG));
  }

  /** ***************************************************************************************************************************
   * Validate basemap options.
   * @param {TypeValidMapProjectionCodes} projection The projection code of the basemap.
   * @param {TypeBasemapOptions} basemapOptions The basemap options to validate.
   *
   * @returns {TypeBasemapOptions} A valid basemap options.
   */
  static validateBasemap(projection?: TypeValidMapProjectionCodes, basemapOptions?: TypeJsonObject): TypeBasemapOptions {
    if (projection && basemapOptions) {
      const basemapId = CV_BASEMAP_ID[projection].includes(basemapOptions.basemapId as TypeBasemapId)
        ? basemapOptions.basemapId
        : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.basemapOptions.basemapId;
      const shaded = CV_BASEMAP_SHADED[projection].includes(basemapOptions.shaded as boolean)
        ? basemapOptions.shaded
        : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.basemapOptions.shaded;
      const labeled = CV_BASEMAP_LABEL[projection].includes(basemapOptions.labeled as boolean)
        ? basemapOptions.labeled
        : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.basemapOptions.labeled;

      return { basemapId, shaded, labeled } as TypeBasemapOptions;
    }
    return CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.basemapOptions;
  }

  /** ***************************************************************************************************************************
   * Validate map version.
   * @param {TypeValidVersions} version The version to validate.
   *
   * @returns {TypeValidVersions} A valid version.
   */
  static validateVersion(version?: TypeJsonValue): TypeValidVersions {
    return version && VALID_VERSIONS.includes(version as TypeValidVersions)
      ? (version as TypeValidVersions)
      : CV_DEFAULT_MAP_FEATURES_CONFIG.schemaVersionUsed!;
  }

  /** ***************************************************************************************************************************
   * Validate zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private static validateZoom(zoom?: number): number {
    return zoom && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.viewSettings.zoom;
  }

  /** ***************************************************************************************************************************
   * Validate min zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private static validateMinZoom(zoom?: number): number | undefined {
    return zoom && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : undefined;
  }

  /** ***************************************************************************************************************************
   * Validate max zoom level.
   * @param {number} zoom The zoom level to validate.
   *
   * @returns {number} A valid zoom level.
   */
  private static validateMaxZoom(zoom?: number): number | undefined {
    return zoom && !Number.isNaN(zoom) && zoom >= 0 && zoom <= 18 ? zoom : undefined;
  }

  /** ***************************************************************************************************************************
   * Validate projection.
   * @param {TypeValidMapProjectionCodes} projection The projection to validate.
   *
   * @returns {TypeValidMapProjectionCodes} A valid projection.
   */
  private static validateProjection(projection?: TypeValidMapProjectionCodes): TypeValidMapProjectionCodes {
    return projection && VALID_PROJECTION_CODES.includes(projection)
      ? projection
      : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.viewSettings.projection;
  }

  /** ***************************************************************************************************************************
   * Validate the center.
   * @param {TypeValidMapProjectionCodes} projection The projection used by the map.
   * @param {[number, number]} center The map center to validate.
   *
   * @returns {[number, number]} A valid map center.
   */
  private static validateCenter(projection?: TypeValidMapProjectionCodes, center?: TypeJsonArray): [number, number] {
    const { gvMap } = CV_DEFAULT_MAP_FEATURES_CONFIG;
    if (center) {
      if (projection) {
        const xVal = Number(center[0]);
        const yVal = Number(center[1]);

        const x =
          !Number.isNaN(xVal) && xVal > CV_MAP_CENTER[projection].long[0] && xVal < CV_MAP_CENTER[projection].long[1]
            ? xVal
            : gvMap.viewSettings.center[0];
        const y =
          !Number.isNaN(yVal) && yVal > CV_MAP_CENTER[projection].lat[0] && yVal < CV_MAP_CENTER[projection].lat[1]
            ? yVal
            : gvMap.viewSettings.center[1];

        return [x, y];
      }
    } else {
      return [gvMap.viewSettings.center[0] as number, gvMap.viewSettings.center[1] as number];
    }
    return gvMap.viewSettings.center;
  }

  /** ***************************************************************************************************************************
   * Validate the extent.
   * @param {TypeValidMapProjectionCodes} projection The projection used by the map.
   * @param {[number, number, number, number]} extent The map extent to valdate.
   * @param {[number, number]} center The map extent to validate.
   *
   * @returns {[number, number, number, number]} A valid map extent.
   */
  private static validateExtent(
    projection: TypeValidMapProjectionCodes,
    extent: TypeJsonArray,
    center: [number, number]
  ): Extent | undefined {
    if (projection && extent && extent.length === 4) {
      const [extentMinX, extentMinY, extentMaxX, extentMaxY] = extent;
      const minX = !Number.isNaN(extentMinX) && (extentMinX as number) < center[0] ? extentMinX : CV_MAP_CENTER[projection].long[0];
      const minY = !Number.isNaN(extentMinY) && (extentMinY as number) < center[1] ? extentMinY : CV_MAP_CENTER[projection].lat[0];
      const maxX = !Number.isNaN(extentMaxX) && (extentMaxX as number) > center[0] ? extentMaxX : CV_MAP_CENTER[projection].long[1];
      const maxY = !Number.isNaN(extentMaxY) && (extentMaxY as number) > center[1] ? extentMaxY : CV_MAP_CENTER[projection].lat[1];

      return [minX, minY, maxX, maxY] as Extent;
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Validate and adjust the list of GeoView layer configuration.
   * @param {TypeListOfLocalizedLanguages} suportedLanguages The list of supported languages.
   * @param {TypeListOfGeoviewLayerConfig} listOfGeoviewLayerConfig The list of GeoView layer configuration to adjust and
   * validate.
   */
  static validateListOfGeoviewLayerConfig(suportedLanguages: TypeJsonArray, listOfGeoviewLayerConfig?: TypeJsonArray): void {
    ConfigApi.processLocalizedString(suportedLanguages, listOfGeoviewLayerConfig);
    ConfigApi.doExtraValidation(listOfGeoviewLayerConfig);
  }

  /** ***************************************************************************************************************************
   * Do extra validation that schema can not do.
   * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry The list of Map Config Layer Entry configuration to adjust and
   * validate.
   */
  private static doExtraValidation(listOfMapConfigLayerEntry?: TypeJsonArray): void {
    if (listOfMapConfigLayerEntry) {
      listOfMapConfigLayerEntry
        // TODO: Decide what to do with geocore
        // .filter((geoviewLayerConfig) => !mapConfigLayerEntryIsGeoCore(geoviewLayerConfig))
        .forEach((geoviewLayerConfig) => {
          // The default value for geoviewLayerConfig.initialSettings.visible is true.
          if (!geoviewLayerConfig.initialSettings) geoviewLayerConfig.initialSettings = { states: toJsonObject({ visible: true }) };
          switch (geoviewLayerConfig.geoviewLayerType) {
            case CV_CONST_LAYER_TYPES.CSV:
            case CV_CONST_LAYER_TYPES.GEOJSON:
            case CV_CONST_LAYER_TYPES.XYZ_TILES:
            case CV_CONST_LAYER_TYPES.VECTOR_TILES:
            case CV_CONST_LAYER_TYPES.GEOPACKAGE:
            case CV_CONST_LAYER_TYPES.IMAGE_STATIC:
              ConfigApi.geoviewLayerIdIsMandatory(geoviewLayerConfig);
              break;
            case CV_CONST_LAYER_TYPES.ESRI_DYNAMIC:
            case CV_CONST_LAYER_TYPES.ESRI_FEATURE:
            case CV_CONST_LAYER_TYPES.ESRI_IMAGE:
            case CV_CONST_LAYER_TYPES.OGC_FEATURE:
            case CV_CONST_LAYER_TYPES.WFS:
            case CV_CONST_LAYER_TYPES.WMS:
              ConfigApi.geoviewLayerIdIsMandatory(geoviewLayerConfig);
              ConfigApi.metadataAccessPathIsMandatory(geoviewLayerConfig);
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
  private static metadataAccessPathIsMandatory(geoviewLayerConfig: TypeJsonObject): void {
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
  private static geoviewLayerIdIsMandatory(geoviewLayerConfig: TypeJsonObject): void {
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
  private static SynchronizeLocalizedString(
    localizedString: TypeLocalizedString,
    sourceKey: TypeDisplayLanguage,
    destinationKey: TypeDisplayLanguage
  ): void {
    localizedString[destinationKey] = localizedString[sourceKey];
  }

  /** ***************************************************************************************************************************
   * Adjust the map features configuration localized strings according to the suported languages array content.
   * @param {TypeListOfLocalizedLanguages} suportedLanguages The list of supported languages.
   * @param {MapConfigLayerEntry[]} listOfMapConfigLayerEntry The list of Map Config Layer Entry configuration to adjust according
   * to the suported languages array content.
   */
  private static processLocalizedString(suportedLanguages: TypeJsonArray, listOfMapConfigLayerEntry?: TypeJsonArray): void {
    const EN = 'en' as TypeJsonObject;
    const FR = 'fr' as TypeJsonObject;
    if (suportedLanguages?.includes(EN) && suportedLanguages?.includes(FR) && listOfMapConfigLayerEntry) {
      const validateLocalizedString = (config: TypeJsonObject): void => {
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
      listOfMapConfigLayerEntry.forEach((geoviewLayerConfig) => validateLocalizedString(geoviewLayerConfig));
      return;
    }

    let sourceKey: TypeDisplayLanguage;
    let destinationKey: TypeDisplayLanguage;
    if (suportedLanguages?.includes(EN)) {
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
            if (!key.startsWith('_') && typeof config[key] === 'object') {
              // Leaving the commented line here in case a developer needs to quickly uncomment it again to troubleshoot
              // logger.logDebug(`Key=${key}`, config[key]);
              if (config?.[key]?.en || config?.[key]?.fr)
                ConfigApi.SynchronizeLocalizedString(Cast<TypeLocalizedString>(config[key]), sourceKey, destinationKey);
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
  private static adjustMapConfiguration(mapFeaturesConfigToAdjuste: TypeJsonObject): TypeJsonObject {
    // merge default and provided configuration in a temporary object.
    const tempMapFeaturesConfig = toJsonObject({
      ...CV_DEFAULT_MAP_FEATURES_CONFIG,
      ...(mapFeaturesConfigToAdjuste as object),
    });

    const mapViewSettings = tempMapFeaturesConfig?.gvMap.viewSettings;
    // do validation for every pieces
    const projection = ConfigApi.validateProjection(mapViewSettings?.projection as TypeValidMapProjectionCodes);
    const center = ConfigApi.validateCenter(projection, mapViewSettings?.viewSettings?.center as TypeJsonArray);
    const zoom = ConfigApi.validateZoom(mapViewSettings?.zoom as number);
    const basemapOptions = ConfigApi.validateBasemap(projection, mapViewSettings?.basemapOptions as TypeJsonObject);
    const schemaVersionUsed = ConfigApi.validateVersion(mapViewSettings?.schemaVersionUsed);
    const minZoom = ConfigApi.validateMinZoom(mapViewSettings?.viewSettings?.minZoom as number);
    const maxZoom = ConfigApi.validateMaxZoom(mapViewSettings?.viewSettings?.maxZoom as number);
    const extent = mapViewSettings?.extent
      ? ConfigApi.validateExtent(projection, mapViewSettings?.extent as TypeJsonArray, center)
      : undefined;

    // recreate the prop object to remove unwanted items and check if same as original. Log the modifications
    const mapFeatures = tempMapFeaturesConfig.gvMap;
    const validMapFeaturesConfig = toJsonObject({
      gvMap: {
        basemapOptions,
        viewSettings: {
          zoom,
          center,
          projection,
          minZoom,
          maxZoom,
          extent,
        },
        highlightColor: mapFeatures.highlightColor,
        interaction: mapFeatures.interaction,
        listOfGeoviewLayerConfig: mapFeatures.listOfGeoviewLayerConfig,
        extraOptions: mapFeatures.extraOptions,
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
    });
    ConfigApi.logModifs(tempMapFeaturesConfig, validMapFeaturesConfig);

    return validMapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Log modifications made to configuration by the validator.
   * @param {MapFeaturesConfig} inputMapFeaturesConfig input config.
   * @param {MapFeaturesConfig} validMapFeaturesConfig valid config.
   */
  private static logModifs(inputMapFeaturesConfig: TypeJsonObject, validMapFeaturesConfig: TypeJsonObject): void {
    const inputMapFeatures = inputMapFeaturesConfig?.gvMap;
    const validMapMapFeatures = inputMapFeaturesConfig?.gvMap;
    Object.keys(inputMapFeaturesConfig).forEach((key) => {
      if (!(key in validMapFeaturesConfig)) {
        logger.logWarning(`- Key '${key}' is invalid -`);
      }
    });

    if (inputMapFeatures.viewSettings?.projection !== validMapMapFeatures.viewSettings.projection) {
      logger.logWarning(
        `- Invalid projection code ${inputMapFeatures.viewSettings?.projection} replaced by ${validMapMapFeatures.viewSettings.projection} -`
      );
    }

    if (inputMapFeatures.viewSettings?.zoom !== validMapMapFeatures.viewSettings.zoom) {
      logger.logWarning(
        `- Invalid zoom level ${inputMapFeatures.viewSettings?.zoom} replaced by ${validMapMapFeatures.viewSettings.zoom} -`
      );
    }

    if (JSON.stringify(inputMapFeatures.viewSettings?.center) !== JSON.stringify(validMapMapFeatures.viewSettings.center)) {
      logger.logWarning(`- Invalid center ${inputMapFeatures.viewSettings?.center} replaced by ${validMapMapFeatures.viewSettings.center}`);
    }

    if (JSON.stringify(inputMapFeatures.basemapOptions) !== JSON.stringify(validMapMapFeatures.basemapOptions)) {
      logger.logWarning(
        `- Invalid basemap options ${JSON.stringify(inputMapFeatures.basemapOptions)} replaced by ${JSON.stringify(
          validMapMapFeatures.basemapOptions
        )} -`
      );
    }
  }

  static getMapConfig(jsonStringMapConfig: string): Promise<MapFeaturesConfig | undefined> {
    // Return the config
    return Promise.resolve(new MapFeaturesConfig(jsonStringMapConfig));
  }
}
