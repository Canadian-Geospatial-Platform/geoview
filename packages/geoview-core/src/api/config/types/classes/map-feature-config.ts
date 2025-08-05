import cloneDeep from 'lodash/cloneDeep';
import defaultsDeep from 'lodash/defaultsDeep';

import { isvalidComparedToInputSchema, isvalidComparedToInternalSchema } from '@/api/config/utils';
import {
  BASEMAP_ID,
  BASEMAP_LABEL,
  BASEMAP_SHADED,
  DEFAULT_MAP_FEATURE_CONFIG,
  VALID_MAP_CENTER,
  MAP_CONFIG_SCHEMA_PATH,
  MAP_EXTENTS,
  ACCEPTED_SCHEMA_VERSIONS,
  VALID_PROJECTION_CODES,
  MAP_CENTER,
  VALID_ZOOM_LEVELS,
  Extent,
  TypeAppBarProps,
  TypeDisplayTheme,
  TypeExternalPackages,
  TypeFooterBarProps,
  TypeGlobalSettings,
  TypeMapConfig,
  TypeCorePackagesConfig,
  TypeNavBarProps,
  TypeOverviewMapProps,
  TypeServiceUrls,
  TypeMapFeaturesInstance,
  TypeValidMapProjectionCodes,
  TypeValidVersions,
  TypeValidMapCorePackageProps,
  TypeValidMapComponentProps,
} from '@/api/config/types/map-schema-types';
import { logger } from '@/core/utils/logger';

/**
 * The map feature configuration class.
 */
export class MapFeatureConfig {
  /** Flag used to indicate that errors were detected in the config provided. */
  #errorDetectedFlag = false;

  // TODO: Cleanup commented code - Remove this commented code if all good
  /** The registeredLayerPaths property keeps track of all the GeoView layers created and attached to this map */
  // #registeredLayerPaths: Record<string, AbstractGeoViewLayer> = {};

  /** map configuration. */
  map: TypeMapConfig;

  /** Display theme, default = geo.ca. */
  theme?: TypeDisplayTheme;

  /** Nav bar properies. */
  navBar?: TypeNavBarProps;

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
  externalPackages?: TypeExternalPackages;

  /** Global map settings */
  globalSettings: TypeGlobalSettings;

  /** Service URLs. */
  serviceUrls: TypeServiceUrls;

  /**
   * The schema version used to validate the configuration file. The schema should enumerate the list of versions accepted by
   * this version of the viewer.
   */
  schemaVersionUsed?: '1.0';

  /**
   * The class constructor
   *
   * All properties at this inheritance level have no values provided in the metadata. They are therefore initialized
   * from the configuration passed as a parameter or from the default values.
   *
   * @param {TypeMapFeaturesInstance} userMapFeatureConfig The map feature configuration to instantiate.
   * @constructor
   */
  constructor(userMapFeatureConfig: TypeMapFeaturesInstance) {
    // Input schema validation.
    this.#errorDetectedFlag = !isvalidComparedToInputSchema(MAP_CONFIG_SCHEMA_PATH, userMapFeatureConfig);

    // set map configuration
    const gvMap = cloneDeep(userMapFeatureConfig.map);
    this.map =
      // Default map config depends on map projection.
      defaultsDeep(gvMap, MapFeatureConfig.#getDefaultMapConfig(gvMap?.viewSettings?.projection));

    // Above code will add default zoomAndCenter, remove if other initial view is provided
    if (this.map.viewSettings.initialView?.extent || this.map.viewSettings.initialView?.layerIds)
      delete this.map.viewSettings.initialView.zoomAndCenter;

    // TODO: Cleanup commented code - Remove this commented out code if all good
    // this.map.listOfGeoviewLayerConfig = this.map.listOfGeoviewLayerConfig
    //   .map((geoviewLayerConfig) => {
    //     return MapFeatureConfig.nodeFactory(geoviewLayerConfig);
    //   })
    //   // Validate and filter undefined entries (undefined is returned when a GeoView layer cannot be instanciated).
    //   .filter((layerConfig) => {
    //     if (layerConfig) {
    //       if (layerConfig.geoviewLayerId in this.#registeredLayerPaths) {
    //         // Add duplicate marker ('geoviewId:uuid') so the ID is unique
    //         // eslint-disable-next-line no-param-reassign
    //         layerConfig.geoviewLayerId = `${layerConfig.geoviewLayerId}:${generateId(8)}`;
    //       }
    //       this.#registeredLayerPaths[layerConfig.geoviewLayerId] = layerConfig;
    //     }
    //     return layerConfig;
    //   }) as AbstractGeoviewLayerConfig[];

    this.serviceUrls = defaultsDeep(userMapFeatureConfig.serviceUrls, DEFAULT_MAP_FEATURE_CONFIG.serviceUrls);
    this.theme = (userMapFeatureConfig.theme || DEFAULT_MAP_FEATURE_CONFIG.theme) as TypeDisplayTheme;
    this.navBar = [...((userMapFeatureConfig.navBar || DEFAULT_MAP_FEATURE_CONFIG.navBar) as TypeNavBarProps)];
    this.appBar = defaultsDeep(userMapFeatureConfig.appBar as TypeAppBarProps, DEFAULT_MAP_FEATURE_CONFIG.appBar);
    this.footerBar = userMapFeatureConfig.footerBar as TypeFooterBarProps;
    this.overviewMap = defaultsDeep(userMapFeatureConfig.overviewMap as TypeOverviewMapProps, DEFAULT_MAP_FEATURE_CONFIG.overviewMap);
    this.components = [...(userMapFeatureConfig.components ?? DEFAULT_MAP_FEATURE_CONFIG.components ?? [])];
    this.corePackages = [...(userMapFeatureConfig.corePackages ?? DEFAULT_MAP_FEATURE_CONFIG.corePackages ?? [])];
    this.corePackagesConfig = [
      ...((userMapFeatureConfig.corePackagesConfig || DEFAULT_MAP_FEATURE_CONFIG.corePackagesConfig) as TypeCorePackagesConfig),
    ];
    this.externalPackages = [
      ...((userMapFeatureConfig.externalPackages || DEFAULT_MAP_FEATURE_CONFIG.externalPackages) as TypeExternalPackages),
    ];
    this.globalSettings = userMapFeatureConfig.globalSettings || DEFAULT_MAP_FEATURE_CONFIG.globalSettings;
    this.schemaVersionUsed = (userMapFeatureConfig.schemaVersionUsed as TypeValidVersions) || DEFAULT_MAP_FEATURE_CONFIG.schemaVersionUsed;
    if (this.#errorDetectedFlag) this.#makeMapConfigValid(userMapFeatureConfig); // Tries to apply a correction to invalid properties
    if (!isvalidComparedToInternalSchema(MAP_CONFIG_SCHEMA_PATH, this)) this.setErrorDetectedFlag();
  }

  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected and public.
   */

  // #region PRIVATE

  /**
   * Get the default values for the mapFeatureConfig.map using the projection code.
   * @param {TypeValidMapProjectionCodes} projection The projection code.
   *
   * @returns {TypeMapConfig} The default map configuration associated to the projection.
   * @static @private
   */
  static #getDefaultMapConfig(projection?: TypeValidMapProjectionCodes): TypeMapConfig {
    const proj =
      projection && VALID_PROJECTION_CODES.includes(projection) ? projection : DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.projection;
    const mapConfig = cloneDeep(DEFAULT_MAP_FEATURE_CONFIG.map);

    // Set values specific to projection
    mapConfig.viewSettings.maxExtent = [...MAP_EXTENTS[proj]];
    mapConfig.viewSettings.initialView = { zoomAndCenter: [3.5, MAP_CENTER[proj] as [number, number]] };

    return mapConfig;
  }

  /**
   * This method attempts to recover a valid configuration following the detection of an error. It will attempt to replace the
   * erroneous values with the default values associated with the properties in error. There is a limit to this recovery
   * capability, however, and the resulting configuration may not be viable despite this attempt.
   *
   * @param {TypeMapFeaturesInstance} providedMapConfig The map feature configuration to instantiate.
   * @private
   */
  #makeMapConfigValid(providedMapConfig: TypeMapFeaturesInstance): void {
    // Do validation for all pieces
    this.map.viewSettings.projection =
      this.map.viewSettings.projection && VALID_PROJECTION_CODES.includes(this.map.viewSettings.projection)
        ? this.map.viewSettings.projection
        : DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.projection;

    // TODO: add validation for extent and layerIds
    if (this.map.viewSettings.initialView!.zoomAndCenter) {
      this.#validateCenter();
      const zoom = this.map.viewSettings.initialView!.zoomAndCenter[0];
      this.map.viewSettings.initialView!.zoomAndCenter[0] =
        !Number.isNaN(zoom) && zoom >= 0 && zoom <= 28 ? zoom : DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![0];
    }

    this.#validateBasemap();

    this.schemaVersionUsed = ACCEPTED_SCHEMA_VERSIONS.includes(this.schemaVersionUsed!)
      ? this.schemaVersionUsed
      : DEFAULT_MAP_FEATURE_CONFIG.schemaVersionUsed!;
    const minZoom = this.map.viewSettings.minZoom!;
    this.map.viewSettings.minZoom =
      !Number.isNaN(minZoom) && minZoom >= VALID_ZOOM_LEVELS[0] && minZoom <= VALID_ZOOM_LEVELS[1]
        ? minZoom
        : DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.minZoom;

    const maxZoom = this.map.viewSettings.maxZoom!;
    this.map.viewSettings.maxZoom =
      !Number.isNaN(maxZoom) && maxZoom >= VALID_ZOOM_LEVELS[0] && maxZoom <= VALID_ZOOM_LEVELS[1]
        ? maxZoom
        : DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.maxZoom;

    if (this.map.viewSettings.initialView!.zoomAndCenter) this.#validateMaxExtent();
    this.#logModifs(providedMapConfig);
  }

  /**
   * Validate the center property.
   * @private
   */
  #validateCenter(): void {
    // TODO: This is not true anymore. Center and projection can be null if layersId is set. Apply correction accordingly.
    // center and projection cannot be undefined because udefined values were set with default values.
    const xVal = this.map.viewSettings.initialView!.zoomAndCenter![1][0];
    const yVal = this.map.viewSettings.initialView!.zoomAndCenter![1][1];
    const { projection } = this.map.viewSettings;

    this.map.viewSettings.initialView!.zoomAndCenter![1][0] =
      !Number.isNaN(xVal) && xVal > VALID_MAP_CENTER[projection].long[0] && xVal < VALID_MAP_CENTER[projection].long[1]
        ? xVal
        : DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][0];
    this.map.viewSettings.initialView!.zoomAndCenter![1][1] =
      !Number.isNaN(yVal) && yVal > VALID_MAP_CENTER[projection].lat[0] && yVal < VALID_MAP_CENTER[projection].lat[1]
        ? yVal
        : DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][1];
  }

  /**
   * Validate basemap options properties.
   * @private
   */
  #validateBasemap(): void {
    // basemapOptions and projection cannot be undefined because udefined values were set with default values.
    const { projection } = this.map.viewSettings;
    const { basemapOptions } = this.map;

    this.map.basemapOptions.basemapId = BASEMAP_ID[projection].includes(basemapOptions.basemapId)
      ? basemapOptions.basemapId
      : DEFAULT_MAP_FEATURE_CONFIG.map.basemapOptions.basemapId;
    this.map.basemapOptions.shaded = BASEMAP_SHADED[projection].includes(basemapOptions.shaded)
      ? basemapOptions.shaded
      : DEFAULT_MAP_FEATURE_CONFIG.map.basemapOptions.shaded;
    this.map.basemapOptions.labeled = BASEMAP_LABEL[projection].includes(basemapOptions.labeled)
      ? basemapOptions.labeled
      : DEFAULT_MAP_FEATURE_CONFIG.map.basemapOptions.labeled;
  }

  /**
   * Validate the maxExtent property.
   * @private
   */
  #validateMaxExtent(): void {
    const { projection } = this.map.viewSettings;
    const center = this.map.viewSettings.initialView!.zoomAndCenter![1];
    const maxExtent = this.map.viewSettings.maxExtent!;
    const [extentMinX, extentMinY, extentMaxX, extentMaxY] = maxExtent;

    const minX = !Number.isNaN(extentMinX) && extentMinX < center[0] ? extentMinX : VALID_MAP_CENTER[projection].long[0];
    const minY = !Number.isNaN(extentMinY) && extentMinY < center[1] ? extentMinY : VALID_MAP_CENTER[projection].lat[0];
    const maxX = !Number.isNaN(extentMaxX) && extentMaxX > center[0] ? extentMaxX : VALID_MAP_CENTER[projection].long[1];
    const maxY = !Number.isNaN(extentMaxY) && extentMaxY > center[1] ? extentMaxY : VALID_MAP_CENTER[projection].lat[1];

    this.map.viewSettings.maxExtent = [minX, minY, maxX, maxY] as Extent;
  }

  /**
   * Log modifications made to configuration by the validator. This method compares the values provided by the user to the
   * final values of the configuration and log all modifications made to the config.
   *
   * @param {TypeMapFeaturesInstance} providedMapConfig The map feature configuration to instantiate.
   * @private
   */
  #logModifs(providedMapConfig: TypeMapFeaturesInstance): void {
    Object.keys(providedMapConfig).forEach((key) => {
      if (!(key in this)) {
        logger.logWarning(`- Key '${key}' is invalid -`);
      }
    });

    if (providedMapConfig?.map?.viewSettings?.projection !== this.map.viewSettings.projection) {
      logger.logWarning(
        `- Invalid projection code ${providedMapConfig?.map?.viewSettings?.projection} replaced by ${this.map.viewSettings.projection} -`
      );
    }

    if (
      providedMapConfig?.map?.viewSettings?.initialView?.zoomAndCenter &&
      this.map.viewSettings.initialView?.zoomAndCenter &&
      providedMapConfig?.map?.viewSettings?.initialView?.zoomAndCenter[0] !== this.map.viewSettings.initialView?.zoomAndCenter[0]
    ) {
      logger.logWarning(
        `- Invalid zoom level ${providedMapConfig?.map?.viewSettings?.initialView?.zoomAndCenter[0]}
        replaced by ${this.map.viewSettings.initialView?.zoomAndCenter[0]} -`
      );
    }

    const originalZoomAndCenter = providedMapConfig?.map?.viewSettings?.initialView?.zoomAndCenter;
    if (
      originalZoomAndCenter &&
      Array.isArray(originalZoomAndCenter) &&
      originalZoomAndCenter.length === 2 &&
      Array.isArray(originalZoomAndCenter[1]) &&
      originalZoomAndCenter[1].length === 2 &&
      originalZoomAndCenter[1] !== this.map.viewSettings.initialView!.zoomAndCenter![1]
    ) {
      logger.logWarning(
        `- Invalid center ${originalZoomAndCenter[1]}
        replaced by ${this.map.viewSettings.initialView!.zoomAndCenter![1]}`
      );
    }

    if (JSON.stringify(providedMapConfig?.map?.basemapOptions) !== JSON.stringify(this.map.basemapOptions)) {
      logger.logWarning(
        `- Invalid basemap options ${JSON.stringify(
          providedMapConfig?.map?.basemapOptions
        )} replaced by ${JSON.stringify(this.map.basemapOptions)} -`
      );
    }
  }
  // #endregion PRIVATE

  // #region PUBLIC

  // GV: The benifit of using a setter/getter with a private #property is that it is invisible to the schema
  // GV: validation and JSON serialization.
  /**
   * The getter method that returns the errorDetected flag.
   *
   * @returns {boolean} The errorDetected property associated to the map feature config.
   */
  getErrorDetectedFlag(): boolean {
    return this.#errorDetectedFlag;
  }

  /**
   * Methode used to set the MapFeatureConfig error flag to true.
   */
  setErrorDetectedFlag(): void {
    this.#errorDetectedFlag = true;
  }

  // #endregion PUBLIC

  // #endregion METHODS
}
