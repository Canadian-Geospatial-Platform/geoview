import cloneDeep from 'lodash/cloneDeep';
import defaultsDeep from 'lodash/defaultsDeep';

import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { Cast, toJsonObject, TypeJsonArray, TypeJsonObject } from '@config/types/config-types';
import { EsriDynamicLayerConfig } from '@config/types/classes/geoview-config/raster-config/esri-dynamic-config';
import { EsriFeatureLayerConfig } from '@config/types/classes/geoview-config/vector-config/esri-feature-config';
import { EsriImageLayerConfig } from '@config/types/classes/geoview-config/raster-config/esri-image-config';
import { WmsLayerConfig } from '@config/types/classes/geoview-config/raster-config/wms-config';
import { WfsLayerConfig } from '@config/types/classes/geoview-config/vector-config/wfs-config';
import { GeoJsonLayerConfig } from '@config/types/classes/geoview-config/vector-config/geojson-config';
import {
  CV_BASEMAP_ID,
  CV_BASEMAP_LABEL,
  CV_BASEMAP_SHADED,
  CV_CONST_LAYER_TYPES,
  CV_DEFAULT_MAP_FEATURE_CONFIG,
  CV_VALID_MAP_CENTER,
  CV_MAP_CONFIG_SCHEMA_PATH,
  CV_MAP_EXTENTS,
  ACCEPTED_SCHEMA_VERSIONS,
  VALID_PROJECTION_CODES,
  CV_MAP_CENTER,
  CV_VALID_ZOOM_LEVELS,
} from '@config/types/config-constants';
import { isvalidComparedToInputSchema, isvalidComparedToInternalSchema } from '@config/utils';
import {
  Extent,
  TypeAppBarProps,
  TypeDisplayLanguage,
  TypeDisplayTheme,
  TypeExternalPackages,
  TypeFooterBarProps,
  TypeGlobalSettings,
  TypeMapComponents,
  TypeMapConfig,
  TypeMapCorePackages,
  TypeCorePackagesConfig,
  TypeNavBarProps,
  TypeOverviewMapProps,
  TypeServiceUrls,
  TypeValidMapProjectionCodes,
  TypeValidVersions,
} from '@config/types/map-schema-types';

import { logger } from '@/core/utils/logger';
import { ConfigApi } from '@/api/config/config-api';

// ========================
// #region CLASS HEADER

/**
 * The map feature configuration class.
 */
export class MapFeatureConfig {
  // ==========================
  // #region PRIVATE PROPERTIES
  /** The language used when interacting with this instance of MapFeatureConfig. */
  #language;

  /** Flag used to indicate that errors were detected in the config provided. */
  #errorDetectedFlag = false;

  /** The registeredLayerPaths property keeps track of all the GeoView layers created and attached to this map */
  #registeredLayerPaths: Record<string, AbstractGeoviewLayerConfig> = {};

  // #endregion PRIVATE PROPERTIES

  // =========================
  // #region PUBLIC PROPERTIES
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
  components?: TypeMapComponents;

  /** List of core packages. */
  corePackages?: TypeMapCorePackages;

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
  // #endregion PUBLIC PROPERTIES

  // ===================
  // #region CONSTRUCTOR
  /**
   * The class constructor
   *
   * All properties at this inheritance level have no values provided in the metadata. They are therefore initialized
   * from the configuration passed as a parameter or from the default values.
   *
   * @param {TypeJsonObject} userMapFeatureConfig The map feature configuration to instantiate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   * @constructor
   */
  constructor(userMapFeatureConfig: TypeJsonObject, language: TypeDisplayLanguage) {
    // Input schema validation.
    this.#errorDetectedFlag = !isvalidComparedToInputSchema(CV_MAP_CONFIG_SCHEMA_PATH, userMapFeatureConfig);

    this.#language = language;

    // set map configuration
    const gvMap = cloneDeep(userMapFeatureConfig.map) as TypeJsonObject;
    this.map = Cast<TypeMapConfig>(
      // Default map config depends on map projection.
      defaultsDeep(gvMap, MapFeatureConfig.#getDefaultMapConfig(gvMap?.viewSettings?.projection as TypeValidMapProjectionCodes))
    );

    // Above code will add default zoomAndCenter, remove if other initial view is provided
    if (this.map.viewSettings.initialView?.extent || this.map.viewSettings.initialView?.layerIds)
      delete this.map.viewSettings.initialView.zoomAndCenter;

    let duplicateCount = 0;
    this.map.listOfGeoviewLayerConfig = this.map.listOfGeoviewLayerConfig
      .map((geoviewLayerConfig) => {
        return MapFeatureConfig.nodeFactory(toJsonObject(geoviewLayerConfig), this.#language);
      })
      // Validate and filter undefined entries (undefined is returned when a GeoView layer cannot be instanciated).
      .filter((layerConfig) => {
        if (layerConfig) {
          if (layerConfig.geoviewLayerId in this.#registeredLayerPaths) {
            // Add duplicate marker so the ID is unique
            duplicateCount += 1;
            // eslint-disable-next-line no-param-reassign
            layerConfig.geoviewLayerId = `${layerConfig.geoviewLayerId}:${duplicateCount}`;
          }
          this.#registeredLayerPaths[layerConfig.geoviewLayerId] = layerConfig;
        }
        return layerConfig;
      }) as AbstractGeoviewLayerConfig[];

    this.serviceUrls = Cast<TypeServiceUrls>(defaultsDeep(userMapFeatureConfig.serviceUrls, CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls));
    this.theme = (userMapFeatureConfig.theme || CV_DEFAULT_MAP_FEATURE_CONFIG.theme) as TypeDisplayTheme;
    this.navBar = [...((userMapFeatureConfig.navBar || CV_DEFAULT_MAP_FEATURE_CONFIG.navBar) as TypeNavBarProps)];
    this.appBar = Cast<TypeAppBarProps>(defaultsDeep(userMapFeatureConfig.appBar, CV_DEFAULT_MAP_FEATURE_CONFIG.appBar));
    this.footerBar = Cast<TypeFooterBarProps>(userMapFeatureConfig.footerBar);
    this.overviewMap = Cast<TypeOverviewMapProps>(
      defaultsDeep(userMapFeatureConfig.overviewMap, CV_DEFAULT_MAP_FEATURE_CONFIG.overviewMap)
    );
    this.components = [...((userMapFeatureConfig.components || CV_DEFAULT_MAP_FEATURE_CONFIG.components) as TypeMapComponents)];
    this.corePackages = [...((userMapFeatureConfig.corePackages || CV_DEFAULT_MAP_FEATURE_CONFIG.corePackages) as TypeMapCorePackages)];
    this.corePackagesConfig = [
      ...((userMapFeatureConfig.corePackagesConfig || CV_DEFAULT_MAP_FEATURE_CONFIG.corePackagesConfig) as TypeCorePackagesConfig),
    ];
    this.externalPackages = [
      ...((userMapFeatureConfig.externalPackages || CV_DEFAULT_MAP_FEATURE_CONFIG.externalPackages) as TypeExternalPackages),
    ];
    this.globalSettings = userMapFeatureConfig.globalSettings || CV_DEFAULT_MAP_FEATURE_CONFIG.globalSettings;
    this.schemaVersionUsed =
      (userMapFeatureConfig.schemaVersionUsed as TypeValidVersions) || CV_DEFAULT_MAP_FEATURE_CONFIG.schemaVersionUsed;
    if (this.#errorDetectedFlag) this.#makeMapConfigValid(userMapFeatureConfig); // Tries to apply a correction to invalid properties
    if (!isvalidComparedToInternalSchema(CV_MAP_CONFIG_SCHEMA_PATH, this)) this.setErrorDetectedFlag();
  }
  // #endregion CONSTRUCTOR

  // ===============
  // #region METHODS
  /*
   * Methods are listed in the following order: abstract, override, private, protected and public.
   */
  // ================
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
      projection && VALID_PROJECTION_CODES.includes(projection) ? projection : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.projection;
    const mapConfig = cloneDeep(CV_DEFAULT_MAP_FEATURE_CONFIG.map);

    // Set values specific to projection
    mapConfig.viewSettings.maxExtent = [...CV_MAP_EXTENTS[proj]];
    mapConfig.viewSettings.initialView = { zoomAndCenter: [3.5, CV_MAP_CENTER[proj] as [number, number]] };

    return mapConfig;
  }

  /**
   * This method attempts to recover a valid configuration following the detection of an error. It will attempt to replace the
   * erroneous values with the default values associated with the properties in error. There is a limit to this recovery
   * capability, however, and the resulting configuration may not be viable despite this attempt.
   *
   * @param {TypeJsonObject} providedMapConfig The map feature configuration to instantiate.
   * @private
   */
  #makeMapConfigValid(providedMapConfig: TypeJsonObject): void {
    // Do validation for all pieces
    this.map.viewSettings.projection =
      this.map.viewSettings.projection && VALID_PROJECTION_CODES.includes(this.map.viewSettings.projection)
        ? this.map.viewSettings.projection
        : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.projection;

    // TODO: add validation for extent and layerIds
    if (this.map.viewSettings.initialView!.zoomAndCenter) {
      this.#validateCenter();
      const zoom = this.map.viewSettings.initialView!.zoomAndCenter![0];
      this.map.viewSettings.initialView!.zoomAndCenter![0] =
        !Number.isNaN(zoom) && zoom >= 0 && zoom <= 28
          ? zoom
          : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![0];
    }

    this.#validateBasemap();

    this.schemaVersionUsed = ACCEPTED_SCHEMA_VERSIONS.includes(this.schemaVersionUsed!)
      ? this.schemaVersionUsed
      : CV_DEFAULT_MAP_FEATURE_CONFIG.schemaVersionUsed!;
    const minZoom = this.map.viewSettings.minZoom!;
    this.map.viewSettings.minZoom =
      !Number.isNaN(minZoom) && minZoom >= CV_VALID_ZOOM_LEVELS[0] && minZoom <= CV_VALID_ZOOM_LEVELS[1]
        ? minZoom
        : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.minZoom;

    const maxZoom = this.map.viewSettings.maxZoom!;
    this.map.viewSettings.maxZoom =
      !Number.isNaN(maxZoom) && maxZoom >= CV_VALID_ZOOM_LEVELS[0] && maxZoom <= CV_VALID_ZOOM_LEVELS[1]
        ? maxZoom
        : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.maxZoom;

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
      !Number.isNaN(xVal) && xVal > CV_VALID_MAP_CENTER[projection].long[0] && xVal < CV_VALID_MAP_CENTER[projection].long[1]
        ? xVal
        : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][0];
    this.map.viewSettings.initialView!.zoomAndCenter![1][1] =
      !Number.isNaN(yVal) && yVal > CV_VALID_MAP_CENTER[projection].lat[0] && yVal < CV_VALID_MAP_CENTER[projection].lat[1]
        ? yVal
        : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![1][1];
  }

  /**
   * Validate basemap options properties.
   * @private
   */
  #validateBasemap(): void {
    // basemapOptions and projection cannot be undefined because udefined values were set with default values.
    const { projection } = this.map.viewSettings;
    const { basemapOptions } = this.map;

    this.map.basemapOptions.basemapId = CV_BASEMAP_ID[projection].includes(basemapOptions.basemapId)
      ? basemapOptions.basemapId
      : CV_DEFAULT_MAP_FEATURE_CONFIG.map.basemapOptions.basemapId;
    this.map.basemapOptions.shaded = CV_BASEMAP_SHADED[projection].includes(basemapOptions.shaded)
      ? basemapOptions.shaded
      : CV_DEFAULT_MAP_FEATURE_CONFIG.map.basemapOptions.shaded;
    this.map.basemapOptions.labeled = CV_BASEMAP_LABEL[projection].includes(basemapOptions.labeled)
      ? basemapOptions.labeled
      : CV_DEFAULT_MAP_FEATURE_CONFIG.map.basemapOptions.labeled;
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

    const minX = !Number.isNaN(extentMinX) && extentMinX < center[0] ? extentMinX : CV_VALID_MAP_CENTER[projection].long[0];
    const minY = !Number.isNaN(extentMinY) && extentMinY < center[1] ? extentMinY : CV_VALID_MAP_CENTER[projection].lat[0];
    const maxX = !Number.isNaN(extentMaxX) && extentMaxX > center[0] ? extentMaxX : CV_VALID_MAP_CENTER[projection].long[1];
    const maxY = !Number.isNaN(extentMaxY) && extentMaxY > center[1] ? extentMaxY : CV_VALID_MAP_CENTER[projection].lat[1];

    this.map.viewSettings.maxExtent! = [minX, minY, maxX, maxY] as Extent;
  }

  /**
   * Log modifications made to configuration by the validator. This method compares the values provided by the user to the
   * final values of the configuration and log all modifications made to the config.
   *
   * @param {TypeJsonObject} providedMapConfig The map feature configuration to instantiate.
   * @private
   */
  #logModifs(providedMapConfig: TypeJsonObject): void {
    Object.keys(providedMapConfig).forEach((key) => {
      if (!(key in this)) {
        logger.logWarning(`- Key '${key}' is invalid -`);
      }
    });

    if ((providedMapConfig?.map as TypeJsonObject)?.viewSettings?.projection !== this.map.viewSettings.projection) {
      logger.logWarning(
        `- Invalid projection code ${(providedMapConfig?.map as TypeJsonObject)?.viewSettings?.projection} replaced by ${
          this.map.viewSettings.projection
        } -`
      );
    }

    if (
      (providedMapConfig?.map as TypeJsonObject)?.viewSettings?.initialView?.zoomAndCenter &&
      this.map.viewSettings.initialView?.zoomAndCenter &&
      (providedMapConfig?.map as TypeJsonObject)?.viewSettings?.initialView?.zoomAndCenter[0] !==
        this.map.viewSettings.initialView?.zoomAndCenter[0]
    ) {
      logger.logWarning(
        `- Invalid zoom level ${(providedMapConfig?.map as TypeJsonObject)?.viewSettings?.initialView?.zoomAndCenter[0]}
        replaced by ${this.map.viewSettings.initialView?.zoomAndCenter[0]} -`
      );
    }

    const originalZoomAndCenter = (providedMapConfig?.map as TypeJsonObject)?.viewSettings?.initialView?.zoomAndCenter;
    if (
      originalZoomAndCenter &&
      Array.isArray(originalZoomAndCenter) &&
      (originalZoomAndCenter as TypeJsonArray).length === 2 &&
      Array.isArray(originalZoomAndCenter[1]) &&
      (originalZoomAndCenter[1] as TypeJsonArray).length === 2 &&
      Cast<[number, number]>(originalZoomAndCenter[1]) !== this.map.viewSettings.initialView!.zoomAndCenter![1]
    ) {
      logger.logWarning(
        `- Invalid center ${originalZoomAndCenter[1]}
        replaced by ${this.map.viewSettings.initialView!.zoomAndCenter![1]}`
      );
    }

    if (JSON.stringify((providedMapConfig?.map as TypeJsonObject)?.basemapOptions) !== JSON.stringify(this.map.basemapOptions)) {
      logger.logWarning(
        `- Invalid basemap options ${JSON.stringify(
          (providedMapConfig?.map as TypeJsonObject)?.basemapOptions
        )} replaced by ${JSON.stringify(this.map.basemapOptions)} -`
      );
    }
  }
  // #endregion PRIVATE

  // ==============
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

  /**
   * Methode used to get a specific GeoView layer configuration.
   *
   * @param {string} geoviewLayerId The GeoView layer identifier.
   *
   * @returns {AbstractGeoviewLayerConfig | undefined} The GeoView layer object or undefined if it doesn't exist.
   */
  getGeoviewLayer(geoviewLayerId: string): AbstractGeoviewLayerConfig | undefined {
    return this.#registeredLayerPaths?.[geoviewLayerId];
  }

  /**
   * This method reads the service metadata for all geoview layers in the geoview layer list.
   */
  async fetchAllServiceMetadata(): Promise<void> {
    const promiseLayersProcessed: Promise<void>[] = [];

    this.map.listOfGeoviewLayerConfig.forEach((geoviewLayerConfig) => {
      promiseLayersProcessed.push(geoviewLayerConfig.fetchServiceMetadata());
    });

    const promiseSettledResult = await Promise.allSettled(promiseLayersProcessed);
    promiseSettledResult.forEach((promise, i) => {
      if (promise.status === 'rejected') this.map.listOfGeoviewLayerConfig[i].setErrorDetectedFlag();
    });
    // TODO: Have a chat with Alex about his comment "We could still set the flag here, for processing reasons, and return the whole Promise.allSettled for convenience."
  }

  /**
   * This method returns the json string of the map feature's configuration. The output representation is a multi-line indented
   * string. Indentation can be controled using the ident parameter. Private variables are not serialized.
   * @param {number} indent The number of space to indent the output string (default=2).
   *
   * @returns {string} The json string corresponding to the map feature configuration.
   */
  serialize(indent: number = 2): string {
    return JSON.stringify(this, undefined, indent);
  }

  /**
   * Apply user configuration over the geoview layer configurations created from the raw metadata.
   */
  applyUserConfigToGeoviewLayers(listOfGeoviewLayerConfig?: TypeJsonArray): void {
    this.map.listOfGeoviewLayerConfig.forEach((geoviewConfig) => {
      // Use config pass as parameter if defined
      if (listOfGeoviewLayerConfig?.length) {
        const geoviewConfigToUse = listOfGeoviewLayerConfig.find(
          (geoviewLayerConfig) => geoviewLayerConfig.geoviewLayerId === geoviewConfig.geoviewLayerId
        );
        // If a GeoView layer config has been found, use it. Otherwise, do nothing
        if (geoviewConfigToUse) geoviewConfig.applyUserConfig(geoviewConfigToUse);
      } else {
        // Use config provided at instanciation time.
        geoviewConfig.applyUserConfig();
      }
    });
  }

  /**
   * The method used to implement the class factory model that returns the instance of the class based on the GeoView layer type
   * needed.
   *
   * @param {TypeJsonObject} layerConfig The layer configuration we want to instanciate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   * @param {MapFeatureConfig} mapFeatureConfig An optional mapFeatureConfig instance if the layer is part of it.
   *
   * @returns {AbstractGeoviewLayerConfig | undefined} The GeoView layer instance or undefined if there is an error.
   * @static
   */
  static nodeFactory(layerConfig: TypeJsonObject, language: TypeDisplayLanguage): AbstractGeoviewLayerConfig | undefined {
    switch (layerConfig.geoviewLayerType) {
      case CV_CONST_LAYER_TYPES.ESRI_DYNAMIC:
        return new EsriDynamicLayerConfig(layerConfig, language);
      case CV_CONST_LAYER_TYPES.ESRI_FEATURE:
        return new EsriFeatureLayerConfig(layerConfig, language);
      case CV_CONST_LAYER_TYPES.ESRI_IMAGE:
        return new EsriImageLayerConfig(layerConfig, language);
      case CV_CONST_LAYER_TYPES.WMS:
        return new WmsLayerConfig(layerConfig, language);
      case CV_CONST_LAYER_TYPES.WFS:
        return new WfsLayerConfig(layerConfig, language);
      case CV_CONST_LAYER_TYPES.GEOJSON:
        return new GeoJsonLayerConfig(layerConfig, language);
      // case CV_CONST_LAYER_TYPES.ESRI_IMAGE:
      //   return new EsriImageLayerConfig(layerConfig, language);
      // case CV_CONST_LAYER_TYPES.GEOPACKAGE:
      //   return new GeopackageLayerConfig(layerConfig, language);
      // case CV_CONST_LAYER_TYPES.XYZ_TILES:
      //   return new XyzLayerConfig(layerConfig, language);
      // case CV_CONST_LAYER_TYPES.VECTOR_TILES:
      //   return new VectorTileLayerConfig(layerConfig, language);
      // case CV_CONST_LAYER_TYPES.OGC_FEATURE:
      //   return new OgcFeatureLayerConfig(layerConfig, language);
      // case CV_CONST_LAYER_TYPES.CSV:
      //   return new CsvLayerConfig(layerConfig, language);
      default:
        // TODO: Restore the commented line and remove the next line when we have converted our code to the new framework.
        // logger.logError(`Invalid GeoView layerType (${layerConfig.geoviewLayerType}).`);
        if (ConfigApi.devMode) logger.logError(`Invalid GeoView layerType (${layerConfig.geoviewLayerType}).`);
    }
    return undefined;
  }
  // #endregion PUBLIC
  // #endregion METHODS
  // #endregion CLASS HEADER
}
