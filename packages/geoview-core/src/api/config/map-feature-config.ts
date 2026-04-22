import type {
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
} from '@/api/types/map-schema-types';
import {
  DEFAULT_MAP_FEATURE_CONFIG,
  VALID_PROJECTION_CODES,
  VALID_BASEMAP_ID,
  MAP_CENTER,
  MAP_ZOOM_LEVEL,
  MAX_EXTENTS_RESTRICTION_LONLAT,
} from '@/api/types/map-schema-types';
import { deepMerge } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

/**
 * The map feature configuration class.
 */
export class MapFeatureConfig {
  /** Map configuration. */
  map: TypeMapConfig;

  /** Display theme, default = geo.ca. */
  theme?: TypeDisplayTheme;

  /** Nav bar properties. */
  navBar?: TypeValidNavBarProps[];

  /** Footer bar properties. */
  footerBar?: TypeFooterBarProps;

  /** App bar properties. */
  appBar?: TypeAppBarProps;

  /** Overview map properties. */
  overviewMap?: TypeOverviewMapProps;

  /** Map components. */
  components?: TypeValidMapComponentProps[];

  /** List of core packages. */
  corePackages?: TypeValidMapCorePackageProps[];

  /** List of core packages config. */
  corePackagesConfig?: TypeCorePackagesConfig;

  /** List of external packages. */
  externalPackages?: TypeExternalPackagesProps[];

  /** Global map settings. */
  globalSettings: TypeGlobalSettings;

  /** Service URLs. */
  serviceUrls: TypeServiceUrls;

  /** Indicates whether schema validation errors were detected during configuration parsing. */
  hasSchemaErrors: boolean = false;

  /**
   * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
   * this version of the viewer.
   */
  schemaVersionUsed?: TypeValidVersions;

  /**
   * Creates an instance of MapFeatureConfig.
   *
   * All properties at this inheritance level have no values provided in the metadata. They are therefore initialized
   * from the configuration passed as a parameter or from the default values.
   *
   * @param userMapFeatureConfig - The map feature configuration to instantiate
   */
  constructor(userMapFeatureConfig: TypeMapFeaturesInstance) {
    // Clone the map config as received by the user
    const gvMapFromUser = structuredClone(userMapFeatureConfig.map);

    // Get a cloned copy of a default map config for a given projection
    const gvMapDefault = MapFeatureConfig.#getDefaultMapConfig(gvMapFromUser?.viewSettings?.projection);

    // TODO: REFACTOR - Remove all the deepMerge and spread operations happening here and deal with the optional settings at the application level.
    // TO.DOCONT: Indeed, forcing values at this level makes it difficult for the application to know if a value is coming from
    // TO.DOCONT: the user config or from the default config, which can be important information for the application in some cases
    // TO.DOCONT: (e.g., to decide if a setting should be modifiable by the user or not).

    // Combine the default values.
    this.map = deepMerge(gvMapDefault, gvMapFromUser);

    // Validate the projection after merge — user may have provided an invalid code that overwrote the default
    if (!VALID_PROJECTION_CODES.includes(this.map.viewSettings.projection)) {
      logger.logWarning(`Invalid projection code '${this.map.viewSettings.projection}', defaulting to 3978`);
      this.map.viewSettings.projection = DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.projection;
      this.map.viewSettings.maxExtent = MAX_EXTENTS_RESTRICTION_LONLAT[this.map.viewSettings.projection];
      this.map.viewSettings.initialView = {
        zoomAndCenter: [MAP_ZOOM_LEVEL[this.map.viewSettings.projection], MAP_CENTER[this.map.viewSettings.projection]],
      };
    }

    // Validate basemapId after merge — user may have provided an invalid basemapId that overwrote the default
    if (!VALID_BASEMAP_ID.includes(this.map.basemapOptions.basemapId)) {
      logger.logWarning(`Invalid basemapId '${this.map.basemapOptions.basemapId}', defaulting to 'transport'`);
      this.map.basemapOptions = structuredClone(DEFAULT_MAP_FEATURE_CONFIG.map.basemapOptions);
    }

    // Above code will add default zoomAndCenter, remove if other initial view is provided
    if (this.map.viewSettings.initialView?.extent || this.map.viewSettings.initialView?.layerIds)
      delete this.map.viewSettings.initialView.zoomAndCenter;

    this.serviceUrls = deepMerge(DEFAULT_MAP_FEATURE_CONFIG.serviceUrls, userMapFeatureConfig.serviceUrls);
    this.theme = userMapFeatureConfig.theme ?? DEFAULT_MAP_FEATURE_CONFIG.theme;
    this.navBar = [...(userMapFeatureConfig.navBar ?? DEFAULT_MAP_FEATURE_CONFIG.navBar ?? [])];
    this.appBar = deepMerge(DEFAULT_MAP_FEATURE_CONFIG.appBar, userMapFeatureConfig.appBar);
    this.footerBar = deepMerge(DEFAULT_MAP_FEATURE_CONFIG.footerBar, userMapFeatureConfig.footerBar);
    this.overviewMap = deepMerge(DEFAULT_MAP_FEATURE_CONFIG.overviewMap, userMapFeatureConfig.overviewMap);
    this.components = [...(userMapFeatureConfig.components ?? DEFAULT_MAP_FEATURE_CONFIG.components ?? [])];
    this.corePackages = [...(userMapFeatureConfig.corePackages ?? DEFAULT_MAP_FEATURE_CONFIG.corePackages ?? [])];
    this.corePackagesConfig = [...(userMapFeatureConfig.corePackagesConfig ?? DEFAULT_MAP_FEATURE_CONFIG.corePackagesConfig ?? [])];
    this.externalPackages = [...(userMapFeatureConfig.externalPackages ?? DEFAULT_MAP_FEATURE_CONFIG.externalPackages ?? [])];
    this.globalSettings = deepMerge(DEFAULT_MAP_FEATURE_CONFIG.globalSettings, userMapFeatureConfig.globalSettings);
    this.schemaVersionUsed = userMapFeatureConfig.schemaVersionUsed ?? DEFAULT_MAP_FEATURE_CONFIG.schemaVersionUsed;
  }

  /**
   * Gets the default values for the mapFeatureConfig.map using the projection code.
   *
   * @param projection - Optional projection code
   * @returns The default map configuration associated to the projection
   */
  static #getDefaultMapConfig(projection?: TypeValidMapProjectionCodes): TypeMapConfig {
    // Clone the default config, because we want to start from it and modify it
    const mapConfig = structuredClone(DEFAULT_MAP_FEATURE_CONFIG.map);

    // Get the projection for the map config we want
    const proj =
      projection && VALID_PROJECTION_CODES.includes(projection) ? projection : DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.projection;

    // Set values specific to projection
    mapConfig.viewSettings.maxExtent = MAX_EXTENTS_RESTRICTION_LONLAT[proj];
    mapConfig.viewSettings.initialView = { zoomAndCenter: [MAP_ZOOM_LEVEL[proj], MAP_CENTER[proj]] };

    // Return it
    return mapConfig;
  }
}
