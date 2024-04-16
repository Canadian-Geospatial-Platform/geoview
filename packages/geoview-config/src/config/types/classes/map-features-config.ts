import defaultsDeep from 'lodash/defaultsDeep';
import { isJsonString, removeCommentsFromJSON } from '../../../utilities';
import { logger } from '../../../logger';
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
import { CONST_LAYER_TYPES, DEFAULT_MAP_FEATURES_CONFIG, MAP_CONFIG_SCHEMA_PATH } from '../config-constants';
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
    const jsonMapConfig = this.#getJsonMapConfigWithDefaultValues(providedMapConfig);
    validateAgainstSchema(jsonMapConfig, MAP_CONFIG_SCHEMA_PATH, this);

    // set map configuration
    this.gvMap = Cast<TypeMapConfig>(jsonMapConfig.gvMap);
    /** List of GeoView Layers in the order which they should be added to the map. */
    this.gvMap.listOfGeoviewLayerConfig = Cast<AbstractGeoviewLayerConfig[]>(
      (jsonMapConfig.gvMap.listOfGeoviewLayerConfig as TypeJsonArray)?.filter((geoviewConfig) => {
        return MapFeaturesConfig.nodeFactory(geoviewConfig, this);
      })
    );

    // Initialize map features properties
    this.serviceUrls = { ...Cast<TypeServiceUrls>(jsonMapConfig.serviceUrls) };
    this.theme = jsonMapConfig.theme as TypeDisplayTheme;
    this.navBar = [...Cast<TypeNavBarProps>(jsonMapConfig.navBar || [])];
    this.appBar = { ...Cast<TypeAppBarProps>(jsonMapConfig.appBar) };
    this.footerBar = { ...Cast<TypeFooterBarProps>(jsonMapConfig.footerBar) };
    this.overviewMap = { ...Cast<TypeOverviewMapProps>(jsonMapConfig.overviewMap) };
    this.components = [...Cast<TypeMapComponents>(jsonMapConfig.components || [])];
    this.corePackages = [...Cast<TypeMapCorePackages>(jsonMapConfig.corePackages || [])];
    this.externalPackages = { ...Cast<TypeExternalPackages>(jsonMapConfig.externalPackages) };
    this.suportedLanguages = { ...Cast<TypeListOfLocalizedLanguages>(jsonMapConfig.suportedLanguages) };
    this.schemaVersionUsed = '1.0';
  }

  /** ***************************************************************************************************************************
   * Validate the map features configuration.
   * @param {MapFeaturesConfig} mapFeaturesConfigToValidate The map features configuration to validate.
   *
   * @returns {MapFeaturesConfig} A valid map features configuration.
   */
  #getJsonMapConfigWithDefaultValues(providedMapConfig: string | TypeJsonObject): TypeJsonObject {
    // GV: To be able to delete the map property after having transfered it in gvMap, we must set jsonMapConfig's properties
    // GV: as optional otherwise we have an typescript error saying we cannot delete jsonMapConfig.map because it is not optional
    let jsonMapConfig: Partial<TypeJsonObject> = providedMapConfig as TypeJsonObject;
    if (providedMapConfig) {
      if (typeof providedMapConfig === 'string') {
        // Erase comments in the config file.
        let newJsonStringMapConfig = removeCommentsFromJSON(providedMapConfig);

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
      return defaultsDeep(jsonMapConfig, DEFAULT_MAP_FEATURES_CONFIG);
    }
    this.#errorDetected = true;
    return toJsonObject(DEFAULT_MAP_FEATURES_CONFIG);
  }

  /** ***************************************************************************************************************************
   */
  get isValid(): boolean {
    return !this.#errorDetected;
  }

  /** ***************************************************************************************************************************
   */
  get jsonString(): string {
    return JSON.stringify(this);
  }

  /** ***************************************************************************************************************************
   */
  indentedJsonString(indent = 2): string {
    return JSON.stringify(this, null, indent);
  }

  /** ***************************************************************************************************************************
   */
  propagateError(): void {
    this.#errorDetected = true;
  }

  /** ***************************************************************************************************************************
   */
  static nodeFactory(nodeConfig: TypeJsonObject, mapFeaturesConfig?: MapFeaturesConfig): AbstractGeoviewLayerConfig | undefined {
    switch (nodeConfig.geoviewLayerType) {
      // case CONST_LAYER_TYPES.CSV:
      //   return new CsvLayerConfig(nodeConfig);
      case CONST_LAYER_TYPES.ESRI_DYNAMIC:
        return new EsriDynamicLayerConfig(nodeConfig, mapFeaturesConfig);
      case CONST_LAYER_TYPES.ESRI_FEATURE:
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
