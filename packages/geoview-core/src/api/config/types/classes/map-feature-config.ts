import cloneDeep from 'lodash/cloneDeep';
import defaultsDeep from 'lodash/defaultsDeep';

import { AbstractGeoviewLayerConfig } from '@config/types/classes/geoview-config/abstract-geoview-layer-config';
import { EsriDynamicLayerConfig } from '@config/types/classes/geoview-config/raster-config/esri-dynamic-config';
import { Cast, TypeJsonArray, TypeJsonObject } from '@config/types/config-types';
import { EsriFeatureLayerConfig } from '@config/types/classes/geoview-config/vector-config/esri-feature-config';
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
} from '@config/types/config-constants';
import { isvalidComparedToSchema } from '@config/utils';
import {
  Extent,
  TypeAppBarProps,
  TypeDisplayLanguage,
  TypeDisplayTheme,
  TypeExternalPackages,
  TypeFooterBarProps,
  TypeMapComponents,
  TypeMapConfig,
  TypeMapCorePackages,
  TypeNavBarProps,
  TypeOverviewMapProps,
  TypeServiceUrls,
  TypeValidMapProjectionCodes,
  TypeValidVersions,
} from '@config/types/map-schema-types';

import { logger } from '@/core//utils/logger';

/**
 * The map feature configuration class.
 */
export class MapFeatureConfig {
  /** The language used when interacting with this instance of MapFeatureConfig. */
  #language;

  /** Original copy of the geoview layer configuration provided by the user. */
  #originalgeoviewLayerConfig: TypeJsonObject = {};

  /** Flag used to indicate that errors were detected in the config provided. */
  #errorDetected = false;

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

  /** List of external packages. */
  externalPackages?: TypeExternalPackages;

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
   * A copy of the original configuration is kept to identify which fields were left empty by the user. This information will be
   * useful after reading the metadata to determine whether a default value should be applied.
   *
   * @param {string | TypeJsonObject} providedMapConfig The map feature configuration to instantiate.
   * @param {TypeDisplayLanguage} language The initial language to use when interacting with the map feature configuration.
   * @constructor
   */
  constructor(providedMapFeatureConfig: TypeJsonObject, language: TypeDisplayLanguage) {
    // Keep an unaltered copy of the config.
    this.#originalgeoviewLayerConfig = cloneDeep(providedMapFeatureConfig);
    this.#language = language;
    // Input schema validation.
    this.#errorDetected = this.#errorDetected || !isvalidComparedToSchema(CV_MAP_CONFIG_SCHEMA_PATH, providedMapFeatureConfig);

    // set map configuration
    const gvMap = cloneDeep(providedMapFeatureConfig.map) as TypeJsonObject;
    if (gvMap) (gvMap.listOfGeoviewLayerConfig as TypeJsonArray) = (gvMap.listOfGeoviewLayerConfig || []) as TypeJsonArray;
    this.map = Cast<TypeMapConfig>(
      defaultsDeep(gvMap, MapFeatureConfig.#getDefaultMapConfig(gvMap?.viewSettings?.projection as TypeValidMapProjectionCodes))
    );
    this.map.listOfGeoviewLayerConfig = (gvMap.listOfGeoviewLayerConfig as TypeJsonArray)
      .map((geoviewLayerConfig) => {
        const returnValue = MapFeatureConfig.nodeFactory(geoviewLayerConfig, this.#language, this);
        if (returnValue === undefined) this.#errorDetected = true;
        return returnValue;
      })
      .filter((layerConfig) => {
        return layerConfig;
      }) as AbstractGeoviewLayerConfig[];
    this.serviceUrls = Cast<TypeServiceUrls>(defaultsDeep(providedMapFeatureConfig.serviceUrls, CV_DEFAULT_MAP_FEATURE_CONFIG.serviceUrls));
    this.theme = (providedMapFeatureConfig.theme || CV_DEFAULT_MAP_FEATURE_CONFIG.theme) as TypeDisplayTheme;
    this.navBar = [...((providedMapFeatureConfig.navBar || CV_DEFAULT_MAP_FEATURE_CONFIG.navBar) as TypeNavBarProps)];
    this.appBar = Cast<TypeAppBarProps>(defaultsDeep(providedMapFeatureConfig.appBar, CV_DEFAULT_MAP_FEATURE_CONFIG.appBar));
    this.footerBar = Cast<TypeFooterBarProps>(providedMapFeatureConfig.footerBar);
    this.overviewMap = Cast<TypeOverviewMapProps>(
      defaultsDeep(providedMapFeatureConfig.overviewMap, CV_DEFAULT_MAP_FEATURE_CONFIG.overviewMap)
    );
    this.components = [...((providedMapFeatureConfig.components || CV_DEFAULT_MAP_FEATURE_CONFIG.components) as TypeMapComponents)];
    this.corePackages = [...((providedMapFeatureConfig.corePackages || CV_DEFAULT_MAP_FEATURE_CONFIG.corePackages) as TypeMapCorePackages)];
    this.externalPackages = [
      ...((providedMapFeatureConfig.externalPackages || CV_DEFAULT_MAP_FEATURE_CONFIG.externalPackages) as TypeExternalPackages),
    ];
    this.schemaVersionUsed =
      (providedMapFeatureConfig.schemaVersionUsed as TypeValidVersions) || CV_DEFAULT_MAP_FEATURE_CONFIG.schemaVersionUsed;
    if (this.#errorDetected) this.#makeMapConfigValid(); // Tries to apply a correction to invalid properties
  }

  /**
   * This method reads the service metadata for geoview layers in the geoview layer list.
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
  }

  /**
   * The getter method that returns the errorDetected flag.
   *
   * @returns {boolean} The errorDetected property associated to the map feature config.
   */
  get errorDetected(): boolean {
    return this.#errorDetected;
  }

  /**
   * This method returns the json string of the map feature's configuration. The output representation is a multi-line indented
   * string. Indentation can be controled using the ident parameter. Private variables and pseudo-properties are not serialized.
   * @param {number} indent The number of space to indent the output string (default=2).
   *
   * @returns {string} The json string corresponding to the map feature configuration.
   */
  serialize(indent: number = 2): string {
    return JSON.stringify(this, undefined, indent);
  }

  /**
   * Methode used to set the MapFeatureConfig error flag to true.
   */
  setErrorDetectedFlag(): void {
    this.#errorDetected = true;
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
      // TODO: Restore this error message when we have converted our code to the new framework.
      // logger.logError(`Invalid GeoView layerType (${layerConfig.geoviewLayerType}).`);
    }
    return undefined;
  }

  /**
   * Get the default values for the mapFeatureConfig.map using the projection code.
   * @param {TypeValidMapProjectionCodes} projection The projection code.
   *
   * @returns {TypeMapConfig} The default map configuration associated to the projection.
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
   * @private
   */
  #makeMapConfigValid(): void {
    // Do validation for all pieces
    this.map.viewSettings.projection =
      this.map.viewSettings.projection && VALID_PROJECTION_CODES.includes(this.map.viewSettings.projection)
        ? this.map.viewSettings.projection
        : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.projection;

    this.#validateCenter();

    // zoom cannot be undefined because undefined values were set with default values.
    const zoom = this.map.viewSettings.initialView!.zoomAndCenter![0];
    this.map.viewSettings.initialView!.zoomAndCenter![0] =
      !Number.isNaN(zoom) && zoom >= 0 && zoom <= 28 ? zoom : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.initialView!.zoomAndCenter![0];

    this.#validateBasemap();

    this.schemaVersionUsed = ACCEPTED_SCHEMA_VERSIONS.includes(this.schemaVersionUsed!)
      ? this.schemaVersionUsed
      : CV_DEFAULT_MAP_FEATURE_CONFIG.schemaVersionUsed!;
    const minZoom = this.map.viewSettings.minZoom!;
    this.map.viewSettings.minZoom =
      !Number.isNaN(minZoom) && minZoom >= 0 && minZoom <= 50 ? minZoom : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.minZoom;

    const maxZoom = this.map.viewSettings.maxZoom!;
    this.map.viewSettings.maxZoom =
      !Number.isNaN(maxZoom) && maxZoom >= 0 && maxZoom <= 50 ? maxZoom : CV_DEFAULT_MAP_FEATURE_CONFIG.map.viewSettings.maxZoom;

    this.#validateMaxExtent();
    this.#logModifs();
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
    // TODO: Which one do we want, the commented one or the next one?
    // const [extentMinX, extentMinY, extentMaxX, extentMaxY] = getMinOrMaxExtents(maxExtent, CV_MAP_EXTENTS[projection], 'min');
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
   * @private
   */
  #logModifs(): void {
    Object.keys(this.#originalgeoviewLayerConfig).forEach((key) => {
      if (!(key in this)) {
        logger.logWarning(`- Key '${key}' is invalid -`);
      }
    });

    if ((this.#originalgeoviewLayerConfig?.map as TypeJsonObject)?.viewSettings?.projection !== this.map.viewSettings.projection) {
      logger.logWarning(
        `- Invalid projection code ${(this.#originalgeoviewLayerConfig?.map as TypeJsonObject)?.viewSettings?.projection} replaced by ${
          this.map.viewSettings.projection
        } -`
      );
    }

    if (
      (this.#originalgeoviewLayerConfig?.map as TypeJsonObject)?.viewSettings?.initialView?.zoomAndCenter &&
      this.map.viewSettings.initialView?.zoomAndCenter &&
      (this.#originalgeoviewLayerConfig?.map as TypeJsonObject)?.viewSettings?.initialView?.zoomAndCenter[0] !==
        this.map.viewSettings.initialView?.zoomAndCenter[0]
    ) {
      logger.logWarning(
        `- Invalid zoom level ${(this.#originalgeoviewLayerConfig?.map as TypeJsonObject)?.viewSettings?.initialView?.zoomAndCenter[0]}
        replaced by ${this.map.viewSettings.initialView?.zoomAndCenter[0]} -`
      );
    }

    const originalZoomAndCenter = (this.#originalgeoviewLayerConfig?.map as TypeJsonObject)?.viewSettings?.initialView?.zoomAndCenter;
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

    if (
      JSON.stringify((this.#originalgeoviewLayerConfig?.map as TypeJsonObject)?.basemapOptions) !== JSON.stringify(this.map.basemapOptions)
    ) {
      logger.logWarning(
        `- Invalid basemap options ${JSON.stringify(
          (this.#originalgeoviewLayerConfig?.map as TypeJsonObject)?.basemapOptions
        )} replaced by ${JSON.stringify(this.map.basemapOptions)} -`
      );
    }
  }
}
