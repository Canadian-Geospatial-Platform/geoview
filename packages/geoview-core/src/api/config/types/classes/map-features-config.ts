// import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

import {
  TypeAppBarProps,
  TypeDisplayLanguage,
  TypeDisplayTheme,
  TypeExternalPackages,
  TypeFooterBarProps,
  TypeListOfLocalizedLanguages,
  TypeMapComponents,
  TypeMapConfig,
  TypeMapCorePackages,
  TypeNavBarProps,
  TypeOverviewMapProps,
  TypeServiceUrls,
} from '@config/types/map-schema-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriDynamicLayerConfig } from '@config/types/classes/geoview-config/raster-config/esri-dynamic-config';
import { Cast, TypeJsonArray, TypeJsonObject, toJsonObject } from '@config/types/config-types';
import { EsriFeatureLayerConfig } from '@config/types/classes/geoview-config/vector-config/esri-feature-config';
import { CV_CONST_LAYER_TYPES, CV_DEFAULT_MAP_FEATURES_CONFIG, CV_MAP_CONFIG_SCHEMA_PATH } from '@config/types/config-constants';
import { validateAgainstSchema } from '@config/utils';
import { isJsonString, removeCommentsFromJSON } from '@/core/utils/utilities';
import { logger } from '@/core//utils/logger';

/** ******************************************************************************************************************************
 *  Definition of the map feature instance according to what is specified in the schema.
 */
export class MapFeaturesConfig {
  /** The language used when interacting with this instance of MapFeaturesConfig. */
  #language;

  /** Flag used to indicate that errors were detected in the config provided. */
  #errorDetected = false;

  /** map configuration. */
  gvMap: TypeMapConfig;

  /** Service URLs. */
  serviceUrls: TypeServiceUrls;

  /** Display theme, default = geo.ca. */
  theme?: TypeDisplayTheme;

  /** Nav bar properies. */
  navBar?: TypeNavBarProps;

  /** App bar properies. */
  appBar?: TypeAppBarProps;

  /** Footer bar properies. */
  footerBar?: TypeFooterBarProps;

  /** Overview map properies. */
  overviewMap?: TypeOverviewMapProps;

  /** Map components. */
  components?: TypeMapComponents;

  /** List of core packages. */
  corePackages?: TypeMapCorePackages;

  /** List of external packages. */
  externalPackages?: TypeExternalPackages;

  /**
   * ISO 639-1 code indicating the languages supported by the configuration file. It will use value(s) provided here to
   * access bilangual configuration nodes. For value(s) provided here, each bilingual configuration node MUST provide a value.
   * */
  suportedLanguages: TypeListOfLocalizedLanguages;

  /**
   * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
   * this version of the viewer.
   */
  schemaVersionUsed?: '1.0';

  /** ***************************************************************************************************************************
   * The class constructor
   * @param {string | TypeJsonObject} providedMapConfig The map features configuration to instantiate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   *
   * @returns {MapFeaturesConfig} The map features configuration instance.
   */
  // GV: This class cannot be instanciated using its constructor. The static method getInstance must be used.
  // GV: # cannot be used to declare a private constructor. The 'private' keyword must be used. Also, a constructor cannot
  // GV: return a promise. That's the reason why we need the getInstance which can do that.
  private constructor(providedMapFeaturesConfig: string | TypeJsonObject, language: TypeDisplayLanguage) {
    const clonedMapConfig = this.#getClonedJsonMapConfig(providedMapFeaturesConfig);
    this.#language = language;

    // set map configuration
    this.gvMap = Cast<TypeMapConfig>(clonedMapConfig.gvMap);
    // this.gvMap.listOfGeoviewLayerConfig = [];
    // Initialize map features properties
    this.serviceUrls = Cast<TypeServiceUrls>(clonedMapConfig.serviceUrls);
    this.theme = Cast<TypeDisplayTheme>(clonedMapConfig.theme);
    this.navBar = Cast<TypeNavBarProps>(clonedMapConfig.navBar);
    this.appBar = Cast<TypeAppBarProps>(clonedMapConfig.appBar);
    this.footerBar = Cast<TypeFooterBarProps>(clonedMapConfig.footerBar);
    this.overviewMap = Cast<TypeOverviewMapProps>(clonedMapConfig.overviewMap);
    this.components = Cast<TypeMapComponents>(clonedMapConfig.components);
    this.corePackages = Cast<TypeMapCorePackages>(clonedMapConfig.corePackages);
    this.externalPackages = Cast<TypeExternalPackages>(clonedMapConfig.externalPackages);
    this.suportedLanguages = Cast<TypeListOfLocalizedLanguages>(clonedMapConfig.suportedLanguages);
    this.schemaVersionUsed = '1.0';
  }

  /** ***************************************************************************************************************************
   * Method used to instanciate a MapFeaturesConfig object. The interaction with the instance will use the provided language.
   * The language associated to a configuration can be changed using the setConfigLanguage.
   * @param {string | TypeJsonObject} providedMapConfig The map features configuration to instantiate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   *
   * @returns {MapFeaturesConfig} The map features configuration instance.
   */
  static async getInstance(providedMapFeaturesConfig: string | TypeJsonObject, language: TypeDisplayLanguage): Promise<MapFeaturesConfig> {
    const mapFeaturesConfig = new MapFeaturesConfig(providedMapFeaturesConfig, language);
    const listOfGeoviewLayerConfig = Cast<TypeJsonArray>(mapFeaturesConfig.gvMap.listOfGeoviewLayerConfig || []);
    /** List of GeoView Layers in the order which they should be added to the map. */
    const promisesOfGeoviewLayers: Promise<AbstractGeoviewLayerConfig | undefined>[] = [];
    listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => {
      promisesOfGeoviewLayers.push(MapFeaturesConfig.nodeFactory(geoviewLayerConfig, language, mapFeaturesConfig));
    });
    const promisedAllSettled = await Promise.allSettled(promisesOfGeoviewLayers);
    mapFeaturesConfig.gvMap.listOfGeoviewLayerConfig = promisedAllSettled
      .map((geoviewLayer) => {
        return geoviewLayer.status === 'fulfilled' && geoviewLayer.value ? geoviewLayer.value : undefined;
      })
      .filter((geoviewLayer) => {
        return geoviewLayer;
      }) as AbstractGeoviewLayerConfig[];

    validateAgainstSchema(CV_MAP_CONFIG_SCHEMA_PATH, mapFeaturesConfig);
    return mapFeaturesConfig;
  }

  /** ***************************************************************************************************************************
   * Get a clone of the JSON representation and convert "map" property to "gvMap".
   *
   * @param {string | TypeJsonObject} providedMapFeaturesConfig The map features configuration to initialize.
   *
   * @returns {TypeJsonObject} the initialized map features configuration.
   */
  #getClonedJsonMapConfig(providedMapFeaturesConfig: string | TypeJsonObject): TypeJsonObject {
    if (providedMapFeaturesConfig) {
      const mapFeaturesConfig = cloneDeep(providedMapFeaturesConfig) as TypeJsonObject;
      const jsonMapFeaturesConfig =
        typeof mapFeaturesConfig === 'string'
          ? this.#getJsonMapFeaturesConfig(mapFeaturesConfig as TypeJsonObject)
          : (mapFeaturesConfig as TypeJsonObject);
      // GV: User's schema has a property named "map" which conflicts with the map function of the "Array" type. We need to rename it.
      // GV: To be able to delete the map property after having transfered it in gvMap, we must set jsonMapConfig's properties
      // GV: as optional otherwise we have an typescript error saying we cannot delete jsonMapConfig.map because it is not optional
      if (!('gvMap' in jsonMapFeaturesConfig)) {
        // We rename the map property to avoid conflict with the map function associated to Arrays
        jsonMapFeaturesConfig.gvMap = { ...(jsonMapFeaturesConfig.map as object) };
        delete (jsonMapFeaturesConfig as Partial<TypeJsonObject>).map;
      }
      return jsonMapFeaturesConfig as TypeJsonObject;
    }
    this.#errorDetected = true;
    return toJsonObject(CV_DEFAULT_MAP_FEATURES_CONFIG);
  }

  /** ***************************************************************************************************************************
   * Convert the stringMapFeaturesConfig to a jsonMapFeaturesConfig. Comments will be removed from the string.
   * @param {TypeJsonObject} stringMapFeaturesConfig The map configuration string to convert to JSON format.
   *
   * @returns {TypeJsonObject} A JSON map features configuration object.
   * @private
   */
  #getJsonMapFeaturesConfig(stringMapFeaturesConfig: TypeJsonObject): TypeJsonObject {
    // Erase comments in the config file.
    let newStringMapFeaturesConfig = removeCommentsFromJSON(stringMapFeaturesConfig as string);

    // If you want to use quotes in your JSON string, write \&quot or escape it using a backslash;
    // First, replace apostrophes not preceded by a backslash with quotes
    newStringMapFeaturesConfig = newStringMapFeaturesConfig.replace(/(?<!\\)'/gm, '"');
    // Then, replace apostrophes preceded by a backslash with a single apostrophe
    newStringMapFeaturesConfig = newStringMapFeaturesConfig.replace(/\\'/gm, "'");

    if (isJsonString(newStringMapFeaturesConfig)) {
      // Create the config
      return JSON.parse(newStringMapFeaturesConfig);
    }
    this.#errorDetected = true;
    return toJsonObject(CV_DEFAULT_MAP_FEATURES_CONFIG);
  }

  /**
   * The getter method that returns the isValid property (true when the map features config is valid).
   *
   * @returns {boolean} The isValid property associated to map features config.
   */
  get isValid(): boolean {
    return !this.#errorDetected;
  }

  /**
   * The getter method that returns the jsonString property of the map features config.
   *
   * @returns {TypeLayerEntryType} The jsonString property associated to map features config.
   */
  get jsonString(): string {
    return this.indentedJsonString(undefined);
  }

  /**
   * The getter method that returns the indentedJsonString property of the map features config.
   *
   * @returns {TypeLayerEntryType} The indentedJsonString property associated to map features config.
   */
  indentedJsonString(indent: number | undefined = 2): string {
    return JSON.stringify(
      this,
      (key, value) => {
        if (value?.en && value?.fr) return value[this.#language];
        return value;
      },
      indent
    );
  }

  /**
   * Methode used to propagate the error flag to the MapFeaturesConfig instance.
   */
  propagateError(): void {
    this.#errorDetected = true;
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class
   * based on the GeoView layer type needed.
   *
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   * @param {MapFeaturesConfig} mapFeaturesConfig An optional mapFeatureConfig instance if the layer is part of it.
   *
   * @returns {AbstractGeoviewLayerConfig | undefined} The GeoView layer instance or undefined if there is an error.
   */
  static nodeFactory(
    nodeConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    mapFeaturesConfig?: MapFeaturesConfig
  ): Promise<AbstractGeoviewLayerConfig | undefined> {
    switch (nodeConfig.geoviewLayerType) {
      // case CONST_LAYER_TYPES.CSV:
      //   return new CsvLayerConfig(nodeConfig);
      case CV_CONST_LAYER_TYPES.ESRI_DYNAMIC:
        return EsriDynamicLayerConfig.getInstance(nodeConfig, language, mapFeaturesConfig);
      case CV_CONST_LAYER_TYPES.ESRI_FEATURE:
        return EsriFeatureLayerConfig.getInstance(nodeConfig, language, mapFeaturesConfig);
      // case CONST_LAYER_TYPES.ESRI_IMAGE:
      //   return new EsriImageLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.GEOJSON:
      //   return new GeojsonLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.GEOPACKAGE:
      //   return new GeopackageLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.XYZ_TILES:
      //   return new XyzLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.VECTOR_TILES:
      //   return new VectorTileLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.OGC_FEATURE:
      //   return new OgcFeatureLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.WFS:
      //   return new WfsLayerConfig(nodeConfig);
      // case CONST_LAYER_TYPES.WMS:
      //   return new WmsLayerConfig(nodeConfig);
      default:
        logger.logError(`Invalid GeoView layerType (${nodeConfig.asd}).`);
    }
    return Promise.resolve(undefined);
  }
}
