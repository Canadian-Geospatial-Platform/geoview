import cloneDeep from 'lodash/cloneDeep';
import defaultsDeep from 'lodash/defaultsDeep';

import {
  DEFAULT_MAP_FEATURE_CONFIG,
  MAP_EXTENTS,
  VALID_PROJECTION_CODES,
  MAP_CENTER,
  TypeAppBarProps,
  TypeDisplayTheme,
  TypeFooterBarProps,
  TypeGlobalSettings,
  TypeMapConfig,
  TypeCorePackagesConfig,
  TypeOverviewMapProps,
  TypeServiceUrls,
  TypeMapFeaturesInstance,
  TypeValidMapProjectionCodes,
  TypeValidMapCorePackageProps,
  TypeValidMapComponentProps,
  TypeValidNavBarProps,
  TypeExternalPackagesProps,
  TypeValidVersions,
} from '@/api/config/types/map-schema-types';

/**
 * The map feature configuration class.
 */
export class MapFeatureConfig {
  /** map configuration. */
  map: TypeMapConfig;

  /** Display theme, default = geo.ca. */
  theme?: TypeDisplayTheme;

  /** Nav bar properies. */
  navBar?: TypeValidNavBarProps[];

  /** Footer bar properies. */
  footerBar?: TypeFooterBarProps;

  /** App bar properies. */
  appBar?: TypeAppBarProps;

  /** Overview map properies. */
  overviewMap?: TypeOverviewMapProps;

  /** Map components. */
  components?: TypeValidMapComponentProps[];

  /** List of core packages. */
  corePackages?: TypeValidMapCorePackageProps[];

  /** List of core packages config. */
  corePackagesConfig?: TypeCorePackagesConfig;

  /** List of external packages. */
  externalPackages?: TypeExternalPackagesProps[];

  /** Global map settings */
  globalSettings: TypeGlobalSettings;

  /** Service URLs. */
  serviceUrls: TypeServiceUrls;

  /**
   * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
   * this version of the viewer.
   */
  schemaVersionUsed?: TypeValidVersions;

  /**
   * The class constructor
   *
   * All properties at this inheritance level have no values provided in the metadata. They are therefore initialized
   * from the configuration passed as a parameter or from the default values.
   *
   * @param {TypeMapFeaturesInstance} userMapFeatureConfig - The map feature configuration to instantiate.
   * @constructor
   */
  constructor(userMapFeatureConfig: TypeMapFeaturesInstance) {
    // Clone the map config as received by the user
    const gvMapFromUser = cloneDeep(userMapFeatureConfig.map);

    // Get a cloned copy of a default map config for a given projection
    const gvMapDefault = MapFeatureConfig.#getDefaultMapConfig(gvMapFromUser?.viewSettings?.projection);

    // Combine the default values.
    this.map = defaultsDeep(gvMapFromUser, gvMapDefault);

    // Above code will add default zoomAndCenter, remove if other initial view is provided
    if (this.map.viewSettings.initialView?.extent || this.map.viewSettings.initialView?.layerIds)
      delete this.map.viewSettings.initialView.zoomAndCenter;

    this.serviceUrls = defaultsDeep(userMapFeatureConfig.serviceUrls, DEFAULT_MAP_FEATURE_CONFIG.serviceUrls);
    this.theme = userMapFeatureConfig.theme || DEFAULT_MAP_FEATURE_CONFIG.theme;
    this.navBar = [...(userMapFeatureConfig.navBar ?? DEFAULT_MAP_FEATURE_CONFIG.navBar ?? [])];
    this.appBar = defaultsDeep(userMapFeatureConfig.appBar, DEFAULT_MAP_FEATURE_CONFIG.appBar);
    this.footerBar = userMapFeatureConfig.footerBar;
    this.overviewMap = defaultsDeep(userMapFeatureConfig.overviewMap, DEFAULT_MAP_FEATURE_CONFIG.overviewMap);
    this.components = [...(userMapFeatureConfig.components ?? DEFAULT_MAP_FEATURE_CONFIG.components ?? [])];
    this.corePackages = [...(userMapFeatureConfig.corePackages ?? DEFAULT_MAP_FEATURE_CONFIG.corePackages ?? [])];
    this.corePackagesConfig = [...(userMapFeatureConfig.corePackagesConfig ?? DEFAULT_MAP_FEATURE_CONFIG.corePackagesConfig ?? [])];
    this.externalPackages = [...(userMapFeatureConfig.externalPackages ?? DEFAULT_MAP_FEATURE_CONFIG.externalPackages ?? [])];
    this.globalSettings = userMapFeatureConfig.globalSettings || DEFAULT_MAP_FEATURE_CONFIG.globalSettings;
    this.schemaVersionUsed = userMapFeatureConfig.schemaVersionUsed || DEFAULT_MAP_FEATURE_CONFIG.schemaVersionUsed;
  }

  /**
   * Get the default values for the mapFeatureConfig.map using the projection code.
   * @param {TypeValidMapProjectionCodes?} projection The projection code.
   * @returns {TypeMapConfig} The default map configuration associated to the projection.
   * @static @private
   */
  static #getDefaultMapConfig(projection?: TypeValidMapProjectionCodes): TypeMapConfig {
    // Clone the default config, because we want to start from it and modify it
    const mapConfig = cloneDeep(DEFAULT_MAP_FEATURE_CONFIG.map);

    // Get the projection for the map config we want
    const proj =
      projection && VALID_PROJECTION_CODES.includes(projection) ? projection : DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.projection;

    // Set values specific to projection
    mapConfig.viewSettings.maxExtent = [...MAP_EXTENTS[proj]];
    mapConfig.viewSettings.initialView = { zoomAndCenter: [3.5, MAP_CENTER[proj]] };

    // Return it
    return mapConfig;
  }
}
