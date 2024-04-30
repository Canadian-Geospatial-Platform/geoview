import cloneDeep from 'lodash/cloneDeep';
import defaultsDeep from 'lodash/defaultsDeep';

import {
  Extent,
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
  TypeValidVersions,
  VALID_PROJECTION_CODES,
  VALID_VERSIONS,
} from '@config/types/map-schema-types';
import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriDynamicLayerConfig } from '@config/types/classes/geoview-config/raster-config/esri-dynamic-config';
import { Cast, TypeJsonArray, TypeJsonObject, toJsonObject } from '@config/types/config-types';
import { EsriFeatureLayerConfig } from '@config/types/classes/geoview-config/vector-config/esri-feature-config';
import {
  CV_BASEMAP_ID,
  CV_BASEMAP_LABEL,
  CV_BASEMAP_SHADED,
  CV_CONST_LAYER_TYPES,
  CV_DEFAULT_MAP_FEATURES_CONFIG,
  CV_MAP_CENTER,
  CV_MAP_CONFIG_SCHEMA_PATH,
} from '@config/types/config-constants';
import { isvalidComparedToSchema } from '@config/utils';
import { isJsonString, removeCommentsFromJSON } from '@/core/utils/utilities';
import { logger } from '@/core//utils/logger';

/** ******************************************************************************************************************************
 *  Definition of the map feature instance according to what is specified in the schema.
 */
export class MapFeaturesConfig {
  /** The language used when interacting with this instance of MapFeaturesConfig. */
  #language;

  /** Original copy of the geoview layer configuration provided by the user. */
  #originalgeoviewLayerConfig: TypeJsonObject;

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
   *
   * A copy of the original configuration is kept to identify which fields were left empty by the user. This information will be
   * useful after reading the metadata to determine whether a default value should be applied.
   *
   * @param {string | TypeJsonObject} providedMapConfig The map features configuration to instantiate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   *
   * @returns {MapFeaturesConfig} The map features configuration instance.
   */
  constructor(providedMapFeaturesConfig: string | TypeJsonObject, language: TypeDisplayLanguage) {
    // Convert string to JSON object. Also transfer map property to gvMap.
    const jsonConfig = this.#getJsonMapFeaturesConfig(providedMapFeaturesConfig);
    this.#originalgeoviewLayerConfig = cloneDeep(jsonConfig);
    this.#language = language;

    // set map configuration
    if (jsonConfig.gvMap)
      (jsonConfig.gvMap.listOfGeoviewLayerConfig as TypeJsonArray) = (jsonConfig.gvMap.listOfGeoviewLayerConfig || []) as TypeJsonArray;
    this.gvMap = Cast<TypeMapConfig>(defaultsDeep(jsonConfig.gvMap, CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap));
    this.gvMap.listOfGeoviewLayerConfig = (jsonConfig.gvMap.listOfGeoviewLayerConfig as TypeJsonArray)
      .map((geoviewLayerConfig) => {
        return MapFeaturesConfig.nodeFactory(geoviewLayerConfig, language, this);
      })
      .filter((geoviewLayerInstance) => {
        return geoviewLayerInstance;
      }) as AbstractGeoviewLayerConfig[];
    this.serviceUrls = Cast<TypeServiceUrls>(defaultsDeep(jsonConfig.serviceUrls, CV_DEFAULT_MAP_FEATURES_CONFIG.serviceUrls));
    this.theme = (jsonConfig.theme || CV_DEFAULT_MAP_FEATURES_CONFIG.theme) as TypeDisplayTheme;
    this.navBar = [...((jsonConfig.navBar || CV_DEFAULT_MAP_FEATURES_CONFIG.navBar) as TypeNavBarProps)];
    this.appBar = Cast<TypeAppBarProps>(defaultsDeep(jsonConfig.appBar, CV_DEFAULT_MAP_FEATURES_CONFIG.appBar));
    this.footerBar = Cast<TypeFooterBarProps>(defaultsDeep(jsonConfig.footerBar, CV_DEFAULT_MAP_FEATURES_CONFIG.footerBar));
    this.overviewMap = Cast<TypeOverviewMapProps>(defaultsDeep(jsonConfig.overviewMap, CV_DEFAULT_MAP_FEATURES_CONFIG.overviewMap));
    this.components = [...((jsonConfig.components || CV_DEFAULT_MAP_FEATURES_CONFIG.components) as TypeMapComponents)];
    this.corePackages = [...((jsonConfig.corePackages || CV_DEFAULT_MAP_FEATURES_CONFIG.corePackages) as TypeMapCorePackages)];
    this.externalPackages = [...((jsonConfig.externalPackages || CV_DEFAULT_MAP_FEATURES_CONFIG.externalPackages) as TypeExternalPackages)];
    this.suportedLanguages = [
      ...((jsonConfig.suportedLanguages || CV_DEFAULT_MAP_FEATURES_CONFIG.supportedLanguages) as TypeListOfLocalizedLanguages),
    ];
    this.schemaVersionUsed = (jsonConfig.schemaVersionUsed as TypeValidVersions) || CV_DEFAULT_MAP_FEATURES_CONFIG.schemaVersionUsed;
    this.#errorDetected = this.#errorDetected || !isvalidComparedToSchema(CV_MAP_CONFIG_SCHEMA_PATH, this);
    if (this.#errorDetected) this.#makeMapConfigValid();
  }

  /** ***************************************************************************************************************************
   * Method used to instanciate a MapFeaturesConfig object. The interaction with the instance will use the provided language.
   * The language associated to a configuration can be changed using the setConfigLanguage.
   * @param {string | TypeJsonObject} providedMapConfig The map features configuration to instantiate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map features configuration.
   *
   * @returns {MapFeaturesConfig} The map features configuration instance.
   * /
  static async getInstance(providedMapFeaturesConfig: string | TypeJsonObject, language: TypeDisplayLanguage): Promise<MapFeaturesConfig> {
    const mapFeaturesConfig = new MapFeaturesConfig(providedMapFeaturesConfig, language);
    const listOfGeoviewLayerConfig = Cast<TypeJsonArray>(mapFeaturesConfig.gvMap.listOfGeoviewLayerConfig || []);
    /** List of GeoView Layers in the order which they should be added to the map. * /
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
   * Get the JSON representation and convert "map" property to "gvMap".
   *
   * @param {string | TypeJsonObject} providedMapFeaturesConfig The map features configuration to initialize.
   *
   * @returns {TypeJsonObject} the initialized map features configuration.
   */
  #getJsonMapFeaturesConfig(providedMapFeaturesConfig: string | TypeJsonObject): TypeJsonObject {
    if (providedMapFeaturesConfig) {
      // const mapFeaturesConfig = cloneDeep(providedMapFeaturesConfig) as TypeJsonObject;
      const jsonMapFeaturesConfig =
        typeof providedMapFeaturesConfig === 'string'
          ? this.#getJsonRepresentation(providedMapFeaturesConfig as TypeJsonObject)
          : (providedMapFeaturesConfig as TypeJsonObject);
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
   * Convert the stringMapFeaturesConfig to a json object. Comments will be removed from the string.
   * @param {TypeJsonObject} stringMapFeaturesConfig The map configuration string to convert to JSON format.
   *
   * @returns {TypeJsonObject} A JSON map features configuration object.
   * @private
   */
  #getJsonRepresentation(stringMapFeaturesConfig: TypeJsonObject): TypeJsonObject {
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
  ): AbstractGeoviewLayerConfig | undefined {
    switch (nodeConfig.geoviewLayerType) {
      // case CONST_LAYER_TYPES.CSV:
      //   return new CsvLayerConfig(nodeConfig);
      case CV_CONST_LAYER_TYPES.ESRI_DYNAMIC:
        return new EsriDynamicLayerConfig(nodeConfig, language, mapFeaturesConfig);
      case CV_CONST_LAYER_TYPES.ESRI_FEATURE:
        return new EsriFeatureLayerConfig(nodeConfig, language, mapFeaturesConfig);
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
    return undefined;
  }

  /** ***************************************************************************************************************************
   * Adjust the map features configuration to make it valid.
   * @private
   */
  #makeMapConfigValid(): void {
    // Do validation for all pieces
    this.gvMap.viewSettings.projection =
      this.gvMap.viewSettings.projection && VALID_PROJECTION_CODES.includes(this.gvMap.viewSettings.projection)
        ? this.gvMap.viewSettings.projection
        : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.viewSettings.projection;

    this.#validateCenter();

    // zoom cannot be undefined because udefined values were set with default values.
    const zoom = this.gvMap.viewSettings.initialView!.zoomAndCenter![0];
    this.gvMap.viewSettings.initialView!.zoomAndCenter![0] =
      !Number.isNaN(zoom) && zoom >= 0 && zoom <= 28
        ? zoom
        : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.viewSettings.initialView!.zoomAndCenter![0];

    this.#validateBasemap();

    this.schemaVersionUsed = VALID_VERSIONS.includes(this.schemaVersionUsed!)
      ? this.schemaVersionUsed
      : CV_DEFAULT_MAP_FEATURES_CONFIG.schemaVersionUsed!;

    const minZoom = this.gvMap.viewSettings.minZoom!;
    this.gvMap.viewSettings.minZoom =
      !Number.isNaN(minZoom) && minZoom >= 0 && minZoom <= 50 ? minZoom : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.viewSettings.minZoom;

    const maxZoom = this.gvMap.viewSettings.maxZoom!;
    this.gvMap.viewSettings.maxZoom =
      !Number.isNaN(maxZoom) && maxZoom >= 0 && maxZoom <= 50 ? maxZoom : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.viewSettings.maxZoom;

    this.#validateMaxExtent();

    this.#logModifs();
  }

  /** ***************************************************************************************************************************
   * Validate the center.
   * @private
   */
  #validateCenter(): void {
    // center and projection cannot be undefined because udefined values were set with default values.
    const xVal = this.gvMap.viewSettings.initialView!.zoomAndCenter![1][0];
    const yVal = this.gvMap.viewSettings.initialView!.zoomAndCenter![1][1];
    const { projection } = this.gvMap.viewSettings;

    this.gvMap.viewSettings.initialView!.zoomAndCenter![1][0] =
      !Number.isNaN(xVal) && xVal > CV_MAP_CENTER[projection].long[0] && xVal < CV_MAP_CENTER[projection].long[1]
        ? xVal
        : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.viewSettings.initialView!.zoomAndCenter![1][0];
    this.gvMap.viewSettings.initialView!.zoomAndCenter![1][1] =
      !Number.isNaN(yVal) && yVal > CV_MAP_CENTER[projection].lat[0] && yVal < CV_MAP_CENTER[projection].lat[1]
        ? yVal
        : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.viewSettings.initialView!.zoomAndCenter![1][1];
  }

  /** ***************************************************************************************************************************
   * Validate basemap options.
   * @private
   */
  #validateBasemap(): void {
    // basemapOptions and projection cannot be undefined because udefined values were set with default values.
    const { projection } = this.gvMap.viewSettings;
    const { basemapOptions } = this.gvMap;

    this.gvMap.basemapOptions.basemapId = CV_BASEMAP_ID[projection].includes(basemapOptions.basemapId)
      ? basemapOptions.basemapId
      : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.basemapOptions.basemapId;
    this.gvMap.basemapOptions.shaded = CV_BASEMAP_SHADED[projection].includes(basemapOptions.shaded)
      ? basemapOptions.shaded
      : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.basemapOptions.shaded;
    this.gvMap.basemapOptions.labeled = CV_BASEMAP_LABEL[projection].includes(basemapOptions.labeled)
      ? basemapOptions.labeled
      : CV_DEFAULT_MAP_FEATURES_CONFIG.gvMap.basemapOptions.labeled;
  }

  /** ***************************************************************************************************************************
   * Validate the maxExtent property.
   * @private
   */
  #validateMaxExtent(): void {
    const { projection } = this.gvMap.viewSettings;
    const center = this.gvMap.viewSettings.initialView!.zoomAndCenter![1];
    const maxExtent = this.gvMap.viewSettings.maxExtent!;
    // TODO: Which one do we want, the commented one or the next one?
    // const [extentMinX, extentMinY, extentMaxX, extentMaxY] = getMinOrMaxExtents(maxExtent, CV_MAP_EXTENTS[projection], 'min');
    const [extentMinX, extentMinY, extentMaxX, extentMaxY] = maxExtent;

    const minX = !Number.isNaN(extentMinX) && extentMinX < center[0] ? extentMinX : CV_MAP_CENTER[projection].long[0];
    const minY = !Number.isNaN(extentMinY) && extentMinY < center[1] ? extentMinY : CV_MAP_CENTER[projection].lat[0];
    const maxX = !Number.isNaN(extentMaxX) && extentMaxX > center[0] ? extentMaxX : CV_MAP_CENTER[projection].long[1];
    const maxY = !Number.isNaN(extentMaxY) && extentMaxY > center[1] ? extentMaxY : CV_MAP_CENTER[projection].lat[1];

    this.gvMap.viewSettings.maxExtent! = [minX, minY, maxX, maxY] as Extent;
  }

  /** ***************************************************************************************************************************
   * Log modifications made to configuration by the validator.
   * @private
   */
  #logModifs(): void {
    Object.keys(this.#originalgeoviewLayerConfig).forEach((key) => {
      if (!(key in this)) {
        logger.logWarning(`- Key '${key}' is invalid -`);
      }
    });

    if (this.#originalgeoviewLayerConfig?.gvMap?.viewSettings?.projection !== this.gvMap.viewSettings.projection) {
      logger.logWarning(
        `- Invalid projection code ${this.#originalgeoviewLayerConfig?.gvMap?.viewSettings?.projection} replaced by ${
          this.gvMap.viewSettings.projection
        } -`
      );
    }

    if (
      this.#originalgeoviewLayerConfig?.gvMap?.viewSettings?.initialView?.zoomAndCenter &&
      this.gvMap.viewSettings.initialView?.zoomAndCenter &&
      this.#originalgeoviewLayerConfig?.gvMap?.viewSettings?.initialView?.zoomAndCenter[0] !==
        this.gvMap.viewSettings.initialView?.zoomAndCenter[0]
    ) {
      logger.logWarning(
        `- Invalid zoom level ${this.#originalgeoviewLayerConfig?.gvMap?.viewSettings?.initialView?.zoomAndCenter[0]} 
        replaced by ${this.gvMap.viewSettings.initialView?.zoomAndCenter[0]} -`
      );
    }

    const originalZoomAndCenter = this.#originalgeoviewLayerConfig?.gvMap?.viewSettings?.initialView?.zoomAndCenter;
    if (
      originalZoomAndCenter &&
      Array.isArray(originalZoomAndCenter) &&
      (originalZoomAndCenter as TypeJsonArray).length === 2 &&
      Array.isArray(originalZoomAndCenter[1]) &&
      (originalZoomAndCenter[1] as TypeJsonArray).length === 2 &&
      Cast<[number, number]>(originalZoomAndCenter[1]) !== this.gvMap.viewSettings.initialView!.zoomAndCenter![1]
    ) {
      logger.logWarning(
        `- Invalid center ${originalZoomAndCenter[1]} 
        replaced by ${this.gvMap.viewSettings.initialView!.zoomAndCenter![1]}`
      );
    }

    if (JSON.stringify(this.#originalgeoviewLayerConfig?.gvMap?.basemapOptions) !== JSON.stringify(this.gvMap.basemapOptions)) {
      logger.logWarning(
        `- Invalid basemap options ${JSON.stringify(this.#originalgeoviewLayerConfig?.gvMap?.basemapOptions)} replaced by ${JSON.stringify(
          this.gvMap.basemapOptions
        )} -`
      );
    }
  }
}
