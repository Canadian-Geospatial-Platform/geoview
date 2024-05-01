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
  CV_DEFAULT_MAP_FEATURE_CONFIG,
  CV_MAP_CENTER,
  CV_MAP_CONFIG_SCHEMA_PATH,
} from '@config/types/config-constants';
import { isvalidComparedToSchema } from '@config/utils';
import { isJsonString, removeCommentsFromJSON } from '@/core/utils/utilities';
import { logger } from '@/core//utils/logger';

/** ******************************************************************************************************************************
 *  ******************************************************************************************************************************
 *  ******************************************************************************************************************************
 * The map feature confiiguration class.
 */
export class MapFeatureConfig {
  /** The language used when interacting with this instance of MapFeatureConfig. */
  #language;

  /** Original copy of the geoview layer configuration provided by the user. */
  #originalgeoviewLayerConfig: TypeJsonObject = {};

  /** Flag used to indicate that errors were detected in the config provided. */
  #errorDetected = false;

  /** The service metadata. */
  // #metadata: Promise<TypeJsonObject>;

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
   * @param {string | TypeJsonObject} providedMapConfig The map feature configuration to instantiate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   *
   * @returns {MapFeatureConfig} The map feature configuration instance.
   */
  constructor(providedMapFeatureConfig: string | TypeJsonObject, language: TypeDisplayLanguage) {
    // Convert string to JSON object. Also transfer map property to gvMap and clone the config.
    const clonedJsonConfig = this.#getJsonMapFeatureConfig(providedMapFeatureConfig);
    this.#language = language;

    // set map configuration
    if (clonedJsonConfig.gvMap)
      (clonedJsonConfig.gvMap.listOfGeoviewLayerConfig as TypeJsonArray) = (clonedJsonConfig.gvMap.listOfGeoviewLayerConfig ||
        []) as TypeJsonArray;
    this.gvMap = Cast<TypeMapConfig>(defaultsDeep(clonedJsonConfig.gvMap, CV_DEFAULT_MAP_FEATURE_CONFIG.gvMap));
    this.gvMap.listOfGeoviewLayerConfig = (clonedJsonConfig.gvMap.listOfGeoviewLayerConfig as TypeJsonArray)
      .map((geoviewLayerConfig) => {
        return MapFeatureConfig.nodeFactory(geoviewLayerConfig, this.#language, this);
      })
      .filter((geoviewLayerInstance) => {
        return geoviewLayerInstance;
      }) as AbstractGeoviewLayerConfig[];
    this.serviceUrls = Cast<TypeServiceUrls>(defaultsDeep(clonedJsonConfig.serviceUrls, CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls));
    this.theme = (clonedJsonConfig.theme || CV_DEFAULT_MAP_FEATURE_CONFIG.theme) as TypeDisplayTheme;
    this.navBar = [...((clonedJsonConfig.navBar || CV_DEFAULT_MAP_FEATURE_CONFIG.navBar) as TypeNavBarProps)];
    this.appBar = Cast<TypeAppBarProps>(defaultsDeep(clonedJsonConfig.appBar, CV_DEFAULT_MAP_FEATURE_CONFIG.appBar));
    this.footerBar = Cast<TypeFooterBarProps>(defaultsDeep(clonedJsonConfig.footerBar, CV_DEFAULT_MAP_FEATURE_CONFIG.footerBar));
    this.overviewMap = Cast<TypeOverviewMapProps>(defaultsDeep(clonedJsonConfig.overviewMap, CV_DEFAULT_MAP_FEATURE_CONFIG.overviewMap));
    this.components = [...((clonedJsonConfig.components || CV_DEFAULT_MAP_FEATURE_CONFIG.components) as TypeMapComponents)];
    this.corePackages = [...((clonedJsonConfig.corePackages || CV_DEFAULT_MAP_FEATURE_CONFIG.corePackages) as TypeMapCorePackages)];
    this.externalPackages = [
      ...((clonedJsonConfig.externalPackages || CV_DEFAULT_MAP_FEATURE_CONFIG.externalPackages) as TypeExternalPackages),
    ];
    this.suportedLanguages = [
      ...((clonedJsonConfig.suportedLanguages || CV_DEFAULT_MAP_FEATURE_CONFIG.supportedLanguages) as TypeListOfLocalizedLanguages),
    ];
    this.schemaVersionUsed = (clonedJsonConfig.schemaVersionUsed as TypeValidVersions) || CV_DEFAULT_MAP_FEATURE_CONFIG.schemaVersionUsed;
    this.#errorDetected = this.#errorDetected || !isvalidComparedToSchema(CV_MAP_CONFIG_SCHEMA_PATH, this);
    if (this.#errorDetected) this.#makeMapConfigValid(); // Tries to apply a patch to invalid properties
    // this.#metadata = fetchServiceMetadata
  }

  /** ***************************************************************************************************************************
   * @private
   * Get the JSON representation of the map feature configuration and convert "map" property to "gvMap" to avoid conflict with
   * the Array's map function. A cloned copy of the configuration is kept in the private variable #originalgeoviewLayerConfig.
   * The cloned object is return to the caller.
   *
   * @param {string | TypeJsonObject} providedMapFeatureConfig The map feature configuration to initialize.
   *
   * @returns {TypeJsonObject} The cloned map feature configuration.
   */
  #getJsonMapFeatureConfig(providedMapFeatureConfig: string | TypeJsonObject): TypeJsonObject {
    if (providedMapFeatureConfig) {
      const jsonMapFeatureConfig =
        typeof providedMapFeatureConfig === 'string'
          ? this.#getJsonRepresentation(providedMapFeatureConfig as TypeJsonObject)
          : (providedMapFeatureConfig as TypeJsonObject);
      // GV: User's schema has a property named "map" which conflicts with the map function of the "Array" type. We need to rename it.
      // GV: To be able to delete the map property after having transfered it in gvMap, we must set jsonMapConfig's properties
      // GV: as optional otherwise we have an typescript error saying we cannot delete jsonMapConfig.map because it is not optional
      this.#originalgeoviewLayerConfig = cloneDeep(jsonMapFeatureConfig);
      if (!('gvMap' in this.#originalgeoviewLayerConfig)) {
        // We rename the map property to avoid conflict with the map function associated to Arrays
        this.#originalgeoviewLayerConfig.gvMap = { ...(this.#originalgeoviewLayerConfig.map as object) };
        delete (this.#originalgeoviewLayerConfig as Partial<TypeJsonObject>).map;
      }
      return this.#originalgeoviewLayerConfig as TypeJsonObject;
    }
    this.#errorDetected = true;
    throw new Error(`We cannot create a map feature object without providing a configuration,`);
  }

  /** ***************************************************************************************************************************
   * @private
   * Convert the stringMapFeatureConfig to a json object. Comments will be removed from the string.
   * @param {TypeJsonObject} stringMapFeatureConfig The map configuration string to convert to JSON format.
   *
   * @returns {TypeJsonObject} A JSON map feature configuration object.
   */
  #getJsonRepresentation(stringMapFeatureConfig: TypeJsonObject): TypeJsonObject {
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
    this.#errorDetected = true;
    return toJsonObject(CV_DEFAULT_MAP_FEATURE_CONFIG);
  }

  /** ***************************************************************************************************************************
   * The getter method that returns the isValid flag (true when the map feature config is valid).
   *
   * @returns {boolean} The isValid property associated to map feature config.
   */
  get isValid(): boolean {
    return !this.#errorDetected;
  }

  /** ***************************************************************************************************************************
   * The getter method, which returns the json string of the map feature's configuration as if it were a property. However, this
   * pseudo-property is not part of the serialized output. What's more, the output representation is not a multi-line indented
   * string. Private variables and pseudo-properties are not serialized.
   *
   * @returns {TypeLayerEntryType} The json string corresponding to the map feature configuration.
   */
  get jsonString(): string {
    return this.indentedJsonString(undefined);
  }

  /** ***************************************************************************************************************************
   * The getter method, which returns the json string of the map feature's configuration as if it were a property. However, this
   * pseudo-property is not part of the serialized output. What's more, the output representation is a multi-line indented
   * string. Indentation can be controled using the ident parameter. Private variables and pseudo-properties are not serialized.
   *
   * @returns {TypeLayerEntryType} The json string corresponding to the map feature configuration.
   */
  indentedJsonString(indent: number | undefined = 2): string {
    return JSON.stringify(this, undefined, indent);
  }

  /** ***************************************************************************************************************************
   * Methode used to propagate the error flag to the MapFeatureConfig instance.
   */
  propagateError(): void {
    this.#errorDetected = true;
  }

  /** ***************************************************************************************************************************
   * @static
   * The method used to implement the class factory model that returns the instance of the class based on the GeoView layer type
   * needed.
   *
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   * @param {MapFeatureConfig} mapFeatureConfig An optional mapFeatureConfig instance if the layer is part of it.
   *
   * @returns {AbstractGeoviewLayerConfig | undefined} The GeoView layer instance or undefined if there is an error.
   */
  static nodeFactory(
    layerConfig: TypeJsonObject,
    language: TypeDisplayLanguage,
    mapFeatureConfig?: MapFeatureConfig
  ): AbstractGeoviewLayerConfig | undefined {
    switch (layerConfig.geoviewLayerType) {
      // case CONST_LAYER_TYPES.CSV:
      //   return new CsvLayerConfig(layerConfig);
      case CV_CONST_LAYER_TYPES.ESRI_DYNAMIC:
        return new EsriDynamicLayerConfig(layerConfig, language, mapFeatureConfig);
      case CV_CONST_LAYER_TYPES.ESRI_FEATURE:
        return new EsriFeatureLayerConfig(layerConfig, language, mapFeatureConfig);
      // case CONST_LAYER_TYPES.ESRI_IMAGE:
      //   return new EsriImageLayerConfig(layerConfig);
      // case CONST_LAYER_TYPES.GEOJSON:
      //   return new GeojsonLayerConfig(layerConfig);
      // case CONST_LAYER_TYPES.GEOPACKAGE:
      //   return new GeopackageLayerConfig(layerConfig);
      // case CONST_LAYER_TYPES.XYZ_TILES:
      //   return new XyzLayerConfig(layerConfig);
      // case CONST_LAYER_TYPES.VECTOR_TILES:
      //   return new VectorTileLayerConfig(layerConfig);
      // case CONST_LAYER_TYPES.OGC_FEATURE:
      //   return new OgcFeatureLayerConfig(layerConfig);
      // case CONST_LAYER_TYPES.WFS:
      //   return new WfsLayerConfig(layerConfig);
      // case CONST_LAYER_TYPES.WMS:
      //   return new WmsLayerConfig(layerConfig);
      default:
        logger.logError(`Invalid GeoView layerType (${layerConfig.geoviewLayerType}).`);
    }
    return undefined;
  }

  /** ***************************************************************************************************************************
   * @private
   * This method attempts to recover a valid configuration following the detection of an error. It will attempt to replace the
   * erroneous values with the default values associated with the properties in error. There is a limit to this recovery
   * capability, however, and the resulting configuration may not be viable despite this attempt.
   */
  #makeMapConfigValid(): void {
    // Do validation for all pieces
    this.gvMap.viewSettings.projection =
      this.gvMap.viewSettings.projection && VALID_PROJECTION_CODES.includes(this.gvMap.viewSettings.projection)
        ? this.gvMap.viewSettings.projection
        : CV_DEFAULT_MAP_FEATURE_CONFIG.gvMap.viewSettings.projection;

    this.#validateCenter();

    // zoom cannot be undefined because udefined values were set with default values.
    const zoom = this.gvMap.viewSettings.initialView!.zoomAndCenter![0];
    this.gvMap.viewSettings.initialView!.zoomAndCenter![0] =
      !Number.isNaN(zoom) && zoom >= 0 && zoom <= 28
        ? zoom
        : CV_DEFAULT_MAP_FEATURE_CONFIG.gvMap.viewSettings.initialView!.zoomAndCenter![0];

    this.#validateBasemap();

    this.schemaVersionUsed = VALID_VERSIONS.includes(this.schemaVersionUsed!)
      ? this.schemaVersionUsed
      : CV_DEFAULT_MAP_FEATURE_CONFIG.schemaVersionUsed!;

    const minZoom = this.gvMap.viewSettings.minZoom!;
    this.gvMap.viewSettings.minZoom =
      !Number.isNaN(minZoom) && minZoom >= 0 && minZoom <= 50 ? minZoom : CV_DEFAULT_MAP_FEATURE_CONFIG.gvMap.viewSettings.minZoom;

    const maxZoom = this.gvMap.viewSettings.maxZoom!;
    this.gvMap.viewSettings.maxZoom =
      !Number.isNaN(maxZoom) && maxZoom >= 0 && maxZoom <= 50 ? maxZoom : CV_DEFAULT_MAP_FEATURE_CONFIG.gvMap.viewSettings.maxZoom;

    this.#validateMaxExtent();

    this.#logModifs();
  }

  /** ***************************************************************************************************************************
   * @private
   * Validate the center property.
   */
  #validateCenter(): void {
    // center and projection cannot be undefined because udefined values were set with default values.
    const xVal = this.gvMap.viewSettings.initialView!.zoomAndCenter![1][0];
    const yVal = this.gvMap.viewSettings.initialView!.zoomAndCenter![1][1];
    const { projection } = this.gvMap.viewSettings;

    this.gvMap.viewSettings.initialView!.zoomAndCenter![1][0] =
      !Number.isNaN(xVal) && xVal > CV_MAP_CENTER[projection].long[0] && xVal < CV_MAP_CENTER[projection].long[1]
        ? xVal
        : CV_DEFAULT_MAP_FEATURE_CONFIG.gvMap.viewSettings.initialView!.zoomAndCenter![1][0];
    this.gvMap.viewSettings.initialView!.zoomAndCenter![1][1] =
      !Number.isNaN(yVal) && yVal > CV_MAP_CENTER[projection].lat[0] && yVal < CV_MAP_CENTER[projection].lat[1]
        ? yVal
        : CV_DEFAULT_MAP_FEATURE_CONFIG.gvMap.viewSettings.initialView!.zoomAndCenter![1][1];
  }

  /** ***************************************************************************************************************************
   * @private
   * Validate basemap options properties.
   */
  #validateBasemap(): void {
    // basemapOptions and projection cannot be undefined because udefined values were set with default values.
    const { projection } = this.gvMap.viewSettings;
    const { basemapOptions } = this.gvMap;

    this.gvMap.basemapOptions.basemapId = CV_BASEMAP_ID[projection].includes(basemapOptions.basemapId)
      ? basemapOptions.basemapId
      : CV_DEFAULT_MAP_FEATURE_CONFIG.gvMap.basemapOptions.basemapId;
    this.gvMap.basemapOptions.shaded = CV_BASEMAP_SHADED[projection].includes(basemapOptions.shaded)
      ? basemapOptions.shaded
      : CV_DEFAULT_MAP_FEATURE_CONFIG.gvMap.basemapOptions.shaded;
    this.gvMap.basemapOptions.labeled = CV_BASEMAP_LABEL[projection].includes(basemapOptions.labeled)
      ? basemapOptions.labeled
      : CV_DEFAULT_MAP_FEATURE_CONFIG.gvMap.basemapOptions.labeled;
  }

  /** ***************************************************************************************************************************
   * @private
   * Validate the maxExtent property.
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
   * @private
   * Log modifications made to configuration by the validator. This method compares the values provided by the user to the
   * final values of the configuration and log all modifications made to the config.
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
