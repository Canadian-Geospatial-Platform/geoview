import defaultsDeep from 'lodash/defaultsDeep';
import cloneDeep from 'lodash/cloneDeep';

import { isJsonString, removeCommentsFromJSON } from 'geoview-core/src/core/utils/utilities';
import { logger } from 'geoview-core/src/core/utils/logger';
import {
  TypeAppBarProps,
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
} from '../map-schema-types';
import { AbstractGeoviewLayerConfig } from './geoview-config/abstract-geoview-layer-config';
import { Cast, TypeJsonArray, TypeJsonObject, toJsonObject } from '../config-types';
import { CV_CONST_LAYER_TYPES, CV_DEFAULT_MAP_FEATURES_CONFIG, CV_MAP_CONFIG_SCHEMA_PATH } from '../config-constants';
import { EsriDynamicLayerConfig } from './geoview-config/raster-config/esri-dynamic-config';
import { EsriFeatureLayerConfig } from './geoview-config/vector-config/esri-feature-config';
import { validateAgainstSchema } from '../../utils';

/** ******************************************************************************************************************************
 *  Definition of the map feature instance according to what is specified in the schema.
 */
export class MapFeaturesConfig {
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
   *
   * @returns {MapFeaturesConfig} The map features configuration instance.
   */
  constructor(providedMapConfig: string | TypeJsonObject) {
    const mapConfigWithDefault = this.#getJsonMapConfigWithDefaultValues(providedMapConfig);

    // set map configuration
    this.gvMap = Cast<TypeMapConfig>(mapConfigWithDefault.gvMap);
    /** List of GeoView Layers in the order which they should be added to the map. */
    for (let i = 0; i < (mapConfigWithDefault.gvMap.listOfGeoviewLayerConfig as TypeJsonArray).length; i++) {
      const geoviewLayer = MapFeaturesConfig.nodeFactory(mapConfigWithDefault.gvMap.listOfGeoviewLayerConfig[i], this);
      if (geoviewLayer) this.gvMap.listOfGeoviewLayerConfig[i] = geoviewLayer;
    }

    // Initialize map features properties
    this.serviceUrls = { ...(mapConfigWithDefault.serviceUrls as object) } as TypeServiceUrls;
    this.theme = mapConfigWithDefault.theme as TypeDisplayTheme;
    this.navBar = [...((mapConfigWithDefault.navBar as TypeJsonArray) || [])] as TypeNavBarProps;
    this.appBar = { ...Cast<TypeAppBarProps>(mapConfigWithDefault.appBar) };
    this.footerBar = { ...Cast<TypeFooterBarProps>(mapConfigWithDefault.footerBar) };
    this.overviewMap = { ...Cast<TypeOverviewMapProps>(mapConfigWithDefault.overviewMap) };
    this.components = [...Cast<TypeMapComponents>(mapConfigWithDefault.components || [])];
    this.corePackages = [...Cast<TypeMapCorePackages>(mapConfigWithDefault.corePackages || [])];
    this.externalPackages = { ...Cast<TypeExternalPackages>(mapConfigWithDefault.externalPackages) };
    this.suportedLanguages = [...Cast<TypeListOfLocalizedLanguages>(mapConfigWithDefault.suportedLanguages || [])];
    this.schemaVersionUsed = '1.0';
    validateAgainstSchema(mapConfigWithDefault, CV_MAP_CONFIG_SCHEMA_PATH, this);
  }

  /** ***************************************************************************************************************************
   * Get the JSON representation of map elements and initialize properties that are undefined with their default value.
   *
   * @param {string | TypeJsonObject} mapFeaturesConfigToValidate The map features configuration to initialize.
   *
   * @returns {TypeJsonObject} the initialized map features configuration.
   */
  #getJsonMapConfigWithDefaultValues(providedMapConfig: string | TypeJsonObject): TypeJsonObject {
    // GV: To be able to delete the map property after having transfered it in gvMap, we must set jsonMapConfig's properties
    // GV: as optional otherwise we have an typescript error saying we cannot delete jsonMapConfig.map because it is not optional
    const mapConfig = cloneDeep(providedMapConfig);
    let jsonMapConfig: Partial<TypeJsonObject> = mapConfig as TypeJsonObject;
    if (mapConfig) {
      if (typeof mapConfig === 'string') {
        // Erase comments in the config file.
        let newJsonStringMapConfig = removeCommentsFromJSON(mapConfig);

        // If you want to use quotes in your JSON string, write \&quot or escape it using a backslash;
        // First, replace apostrophes not preceded by a backslash with quotes
        newJsonStringMapConfig = newJsonStringMapConfig.replace(/(?<!\\)'/gm, '"');
        // Then, replace apostrophes preceded by a backslash with a single apostrophe
        newJsonStringMapConfig = newJsonStringMapConfig.replace(/\\'/gm, "'");

        if (isJsonString(newJsonStringMapConfig)) {
          // Create the config
          jsonMapConfig = JSON.parse(newJsonStringMapConfig);
        }
      }

      if (!('gvMap' in jsonMapConfig)) {
        // We rename the map property to avoid conflict with the map function associated to Arrays
        jsonMapConfig.gvMap = { ...(jsonMapConfig.map as object) };
        delete jsonMapConfig.map;
      }

      // Set default values
      return defaultsDeep(jsonMapConfig, CV_DEFAULT_MAP_FEATURES_CONFIG);
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
    return JSON.stringify(this);
  }

  /**
   * The getter method that returns the indentedJsonString property of the map features config.
   *
   * @returns {TypeLayerEntryType} The indentedJsonString property associated to map features config.
   */
  indentedJsonString(indent = 2): string {
    return JSON.stringify(this, null, indent);
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
   * @param {TypeJsonObject} layerConfig The layer configuration.
   * @param {MapFeaturesConfig} mapFeaturesConfig The map features instance that owns the GeoView layer.
   *
   * @returns {AbstractGeoviewLayerConfig | undefined} The GeoView layer instance or undefined if there is an error.
   */
  static nodeFactory(nodeConfig: TypeJsonObject, mapFeaturesConfig?: MapFeaturesConfig): AbstractGeoviewLayerConfig | undefined {
    switch (nodeConfig.geoviewLayerType) {
      // case CONST_LAYER_TYPES.CSV:
      //   return new CsvLayerConfig(nodeConfig);
      case CV_CONST_LAYER_TYPES.ESRI_DYNAMIC:
        return new EsriDynamicLayerConfig(nodeConfig, mapFeaturesConfig);
      case CV_CONST_LAYER_TYPES.ESRI_FEATURE:
        return new EsriFeatureLayerConfig(nodeConfig, mapFeaturesConfig);
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
}
