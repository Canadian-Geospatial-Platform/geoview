import defaultsDeep from 'lodash/defaultsDeep';
import { isJsonString, removeCommentsFromJSON } from '../../../utilities';
import { ConfigApi } from '../../config-api';
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
import { CONST_LAYER_TYPES, DEFAULT_MAP_FEATURES_CONFIG } from '../config-constants';
import { EsriDynamicLayerConfig } from './geoview-config/raster-config/esri-dynamic-config';
import { EsriFeatureLayerConfig } from './geoview-config/vector-config/esri-feature-config';

/** ******************************************************************************************************************************
 *  Definition of the map feature instance according to what is specified in the schema.
 */
export class MapFeaturesConfig {
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

  /**
   * The class constructor.
   * @param {TypeJsonObject} jsonMapConfig The map configuration we want to instanciate.
   */
  constructor(jsonStringMapConfig: string) {
    const jsonMapConfig = this.convertStringToJsonAndSetDefaultValues(jsonStringMapConfig);
    this.gvMap = Cast<TypeMapConfig>(jsonMapConfig.gvMap);
    /** List of GeoView Layers in the order which they should be added to the map. */
    this.gvMap.listOfGeoviewLayerConfig = Cast<AbstractGeoviewLayerConfig[]>(
      (jsonMapConfig.gvMap.listOfGeoviewLayerConfig as TypeJsonArray)?.filter((geoviewConfig) => {
        return MapFeaturesConfig.nodeFactory(geoviewConfig);
      })
    );

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
    if (jsonMapConfig.schemaVersionUsed && jsonMapConfig.schemaVersionUsed !== '1.0')
      throw new Error(`Invalid configuration version number (${jsonMapConfig.schemaVersionUsed})`);
    this.schemaVersionUsed = '1.0';
    ConfigApi.validateMapConfigAgainstSchema(jsonMapConfig);
  }

  convertStringToJsonAndSetDefaultValues(providedMapConfig: string | TypeJsonObject): TypeJsonObject {
    // GV: To be able to delete the map property after having transfered it in gvMap, we must set jsonMapConfig's properties
    // GV: as optional otherwise we have an typescript error saying we cannot delete jsonMapConfig.map because it is not optional
    let jsonMapConfig: Partial<TypeJsonObject> = {};
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
    return toJsonObject(DEFAULT_MAP_FEATURES_CONFIG);
  }

  static nodeFactory(nodeConfig: TypeJsonObject): AbstractGeoviewLayerConfig | undefined {
    switch (nodeConfig.geoviewLayerType) {
      // case CONST_LAYER_TYPES.CSV:
      //   return new CsvLayerConfig(nodeConfig);
      case CONST_LAYER_TYPES.ESRI_DYNAMIC:
        return new EsriDynamicLayerConfig(nodeConfig);
      case CONST_LAYER_TYPES.ESRI_FEATURE:
        return new EsriFeatureLayerConfig(nodeConfig);
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
