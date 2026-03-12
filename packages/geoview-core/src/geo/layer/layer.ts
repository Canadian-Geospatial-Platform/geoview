// TODO: REFACTOR - Rename this file to layer-api and move it in /api folder instead of /core

import type BaseLayer from 'ol/layer/Base';
import type { Extent } from 'ol/extent';
import type { GeoJSONObject } from 'ol/format/GeoJSON';
import type { FitOptions } from 'ol/View';

import { GeoCore } from '@/api/config/geocore';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
import type { FeatureHighlight } from '@/geo/map/feature-highlight';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

import { ConfigValidation } from '@/api/config/config-validation';
import { generateId, isValidUUID } from '@/core/utils/utilities';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { logger } from '@/core/utils/logger';

import type {
  AbstractGeoViewLayer,
  LayerGroupCreatedEvent,
  LayerEntryRegisterInitEvent,
  LayerGVCreatedEvent,
} from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { type TypeDisplayLanguage, type TypeOutfieldsType } from '@/api/types/map-schema-types';
import type {
  MapConfigLayerEntry,
  TypeGeoviewLayerConfig,
  TypeLayerEntryConfig,
  GeoCoreLayerConfig,
  GeoPackageLayerConfig,
  TypeMosaicRule,
} from '@/api/types/layer-schema-types';
import { CONST_LAYER_TYPES } from '@/api/types/layer-schema-types';
import {
  mapConfigLayerEntryIsGeoCore,
  mapConfigLayerEntryIsGeoPackage,
  mapConfigLayerEntryIsShapefile,
  mapConfigLayerEntryIsRCS,
} from '@/api/types/layer-schema-types';

import { GeoJSON } from '@/geo/layer/geoview-layers/vector/geojson';
import { WMS } from '@/geo/layer/geoview-layers/raster/wms';
import { WMTS } from '@/geo/layer/geoview-layers/raster/wmts';
import { EsriDynamic } from '@/geo/layer/geoview-layers/raster/esri-dynamic';
import { EsriFeature } from '@/geo/layer/geoview-layers/vector/esri-feature';
import { EsriImage } from '@/geo/layer/geoview-layers/raster/esri-image';
import { GeoTIFF } from '@/geo/layer/geoview-layers/raster/geotiff';
import { ImageStatic } from '@/geo/layer/geoview-layers/raster/image-static';
import { KML } from '@/geo/layer/geoview-layers/vector/kml';
import { WFS } from '@/geo/layer/geoview-layers/vector/wfs';
import { OgcFeature } from '@/geo/layer/geoview-layers/vector/ogc-feature';
import { XYZTiles } from '@/geo/layer/geoview-layers/raster/xyz-tiles';
import { VectorTiles } from '@/geo/layer/geoview-layers/raster/vector-tiles';
import { CSV } from '@/geo/layer/geoview-layers/vector/csv';
import { WKB } from '@/geo/layer/geoview-layers/vector/wkb';

import type { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import type { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import type { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import type { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import { formatError, NotSupportedError } from '@/core/exceptions/core-exceptions';
import { LayerCreatedTwiceError, LayerDifferingFieldLengthsError, LayerNotQueryableError } from '@/core/exceptions/layer-exceptions';
import { LayerEntryConfigError } from '@/core/exceptions/layer-entry-config-exceptions';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { LayerMessageEvent } from '@/geo/layer/gv-layers/abstract-gv-layer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import { GeoUtilities } from '@/geo/utils/utilities';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import {
  type TypeOrderedLayerInfo,
  addStoreMapInitialFilter,
  getStoreMapOrderedLayerInfo,
  getStoreMapOrderedLayerInfoByPath,
  getStoreMapVisibilityByPath,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  isStoreTimeSliderInitialized,
  removeStoreTimeSliderLayer,
} from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { deleteStoreDetailsFeatureInfo } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { getStoreDisplayDateMode } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  addStoreGeochartChart,
  isStoreGeochartInitialized,
  removeStoreGeochartChart,
} from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { isStoreSwiperInitialized, removeStoreSwiperLayerPath } from '@/core/stores/store-interface-and-intial-values/swiper-state';
import {
  setStoreLayerBoundsForLayerAndParentsAndForget,
  setStoreLayerItemVisibility,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import { MapViewer } from '@/geo/map/map-viewer';
import { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import type { TypeLegendItem } from '@/core/components/layers/types';
import { GeoViewError } from '@/core/exceptions/geoview-exceptions';
import { LayerGeoCoreError } from '@/core/exceptions/geocore-exceptions';
import { ShapefileReader } from '@/api/config/reader/shapefile-reader';
import { GeoPackageReader } from '@/api/config/reader/geopackage-reader';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type {
  DomainLayerDelegate,
  DomainLayerErrorDelegate,
  DomainLayerErrorEvent,
  DomainLayerEvent,
  DomainLayerStatusChangedDelegate,
  DomainLayerStatusChangedEvent,
  DomainLayerVisibleChangedDelegate,
  DomainLayerVisibleChangedEvent,
  LayerDomain,
} from '@/core/domains/layer-domain';
import { EsriDynamicLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-dynamic-layer-entry-config';
import { CsvLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/csv-layer-entry-config';
import { EsriFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/esri-feature-layer-entry-config';
import { EsriImageLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/esri-image-layer-entry-config';
import { GeoJSONLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/geojson-layer-entry-config';
import { GeoTIFFLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/geotiff-layer-entry-config';
import { ImageStaticLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/image-static-layer-entry-config';
import { KmlLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/kml-layer-entry-config';
import { OgcFeatureLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/ogc-layer-entry-config';
import { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { WkbLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wkb-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { OgcWmtsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import { XYZTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/xyz-layer-entry-config';
import { VectorTilesLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/vector-tiles-layer-entry-config';

/**
 * A class to get the layer from layer type. Layer type can be esriFeature, esriDynamic and ogcWMS
 */
export class LayerApi {
  /** Reference on the map viewer */
  mapViewer: MapViewer;

  /** Reference on the controller registry */
  #controllers: ControllerRegistry;

  /** Reference on the layer domain. */
  #layerDomain: LayerDomain;

  /** Used to access geometry API to create and manage geometries */
  geometry: GeometryApi;

  /** Order to load layers */
  initialLayerOrder: Array<TypeOrderedLayerInfo> = [];

  /** Used to access feature and bounding box highlighting */
  featureHighlight: FeatureHighlight;

  /** Legends layer set associated to the map */
  legendsLayerSet: LegendsLayerSet;

  /** Hover feature info layer set associated to the map */
  hoverFeatureInfoLayerSet: HoverFeatureInfoLayerSet;

  /** All feature info layer set associated to the map */
  allFeatureInfoLayerSet: AllFeatureInfoLayerSet;

  /** Feature info layer set associated to the map */
  featureInfoLayerSet: FeatureInfoLayerSet;

  /** Dictionary holding all the geoview layers used for processing layer entry configs */
  #geoviewLayers: { [geoviewLayerId: string]: AbstractGeoViewLayer } = {};

  /** Callback delegates for the layer config added event */
  #onLayerConfigAddedHandlers: LayerBuilderDelegate[] = [];

  /** Callback delegates for the layer config error event */
  #onLayerConfigErrorHandlers: LayerConfigErrorDelegate[] = [];

  /** Callback delegates for the layer config removed event */
  #onLayerConfigRemovedHandlers: LayerPathDelegate[] = [];

  /** Callback delegates for the layer created event */
  #onLayerCreatedHandlers: LayerDelegate[] = [];

  /** Callback delegates for the layer loading event */
  #onLayerLoadingHandlers: DomainLayerDelegate[] = [];

  /** Callback delegates for the layer first loaded event */
  #onLayerLoadedFirstHandlers: DomainLayerDelegate[] = [];

  /** Callback delegates for the layer loaded event */
  #onLayerLoadedHandlers: DomainLayerDelegate[] = [];

  /** Callback delegates for the layer error event */
  #onLayerErrorHandlers: DomainLayerErrorDelegate[] = [];

  /** Callback delegates for the all layers loaded event */
  #onLayerAllLoadedHandlers: LayerConfigDelegate[] = [];

  /** Callback delegates for the layer status changed event */
  #onLayerStatusChangedHandlers: DomainLayerStatusChangedDelegate[] = [];

  /** Callback delegates for the layer visibility toggled event */
  #onLayerVisibilityToggledHandlers: DomainLayerVisibleChangedDelegate[] = [];

  /** Callback delegates for the layer item visibility toggled event */
  #onLayerItemVisibilityToggledHandlers: LayerItemVisibilityToggledDelegate[] = [];

  /**
   * Initializes layer types and listen to add/remove layer events from outside
   *
   * @param mapViewer - A reference to the map viewer
   */
  constructor(
    mapViewer: MapViewer,
    controllerRegistry: ControllerRegistry,
    layerDomain: LayerDomain,
    geometryApi: GeometryApi,
    featureHighlight: FeatureHighlight
  ) {
    this.mapViewer = mapViewer;
    this.#controllers = controllerRegistry;

    // Keep a reference on the layer sets
    // GV These assignations references of the layer sets are for legacy support. They could be removed eventually.
    this.legendsLayerSet = controllerRegistry.layerSetController.legendsLayerSet;
    this.hoverFeatureInfoLayerSet = controllerRegistry.layerSetController.hoverFeatureInfoLayerSet;
    this.allFeatureInfoLayerSet = controllerRegistry.layerSetController.allFeatureInfoLayerSet;
    this.featureInfoLayerSet = controllerRegistry.layerSetController.featureInfoLayerSet;

    // Keep a reference on the geometry api and feature highlight
    this.geometry = geometryApi;
    this.featureHighlight = featureHighlight;

    // Initialize events on domain for the events relay
    this.#layerDomain = layerDomain;
    this.initEventsOnDomain(layerDomain);
  }

  /**
   * Initializes the events on the domain to listen to changes and re-emit the events higher.
   * This is a shortcut to not have the event from the domain have to go through the controller
   * to be caught by the layer api.
   *
   * @param layerDomain - The layer domain to listen on
   */
  initEventsOnDomain(layerDomain: LayerDomain): void {
    // Listen on the domain layer status changed
    layerDomain.onLayerStatusChanged((sender, event) => {
      // Re-emit
      this.#emitLayerStatusChanged(event);

      // TODO: ALEX - MOVE THIS LOGIC INSIDE THE DOMAIN
      // If the config is a layer entry (not a group)
      if (event.config instanceof AbstractBaseLayerEntryConfig) {
        // Check if all layers are loaded/error right now
        const allLoaded = this.#controllers.layerController.checkIfAllLayersLoaded();
        if (allLoaded) {
          // Emit about it
          this.#emitLayerAllLoaded({ config: event.config });
        }
      }
    });

    // Listen on the domain layer visibility changed
    layerDomain.onLayerVisibleChanged((sender, event) => {
      // Re-emit
      this.#emitLayerVisibilityToggled(event);
    });

    // Listen on the domain layer loading
    layerDomain.onLayerLoading((sender, event) => {
      // Re-emit
      this.#emitLayerLoading(event);
    });

    // Listen on the domain layer loading
    layerDomain.onLayerFirstLoaded((sender, event) => {
      // Re-emit
      this.#emitLayerFirstLoaded(event);
    });

    // Listen on the domain layer loaded
    layerDomain.onLayerLoaded((sender, event) => {
      // Re-emit
      this.#emitLayerLoaded(event);
    });

    // Listen on the domain layer error
    layerDomain.onLayerError((sender, event) => {
      // Re-emit
      this.#emitLayerError(event);
    });

    // Listen on the domain layer message
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    layerDomain.onLayerMessage((sender, event) => {
      // TODO: Do something?
    });
  }

  /**
   * Gets the Map Id.
   *
   * @returns The map id
   */
  getMapId(): string {
    return this.mapViewer.mapId;
  }

  // #region PUBLIC METHODS - LAYER CONTROLLER SIMPLE GETTER REDIRECTIONS

  /**
   * Gets the GeoView Layer Ids / UUIDs.
   *
   * @returns The ids of the layers
   */
  getGeoviewLayerIds(): string[] {
    return this.#controllers.layerController.getGeoviewLayerIds();
  }

  /**
   * Gets the Layer Entry layer paths.
   *
   * @returns The GeoView Layer Paths
   */
  getLayerEntryLayerPaths(): string[] {
    return this.#controllers.layerController.getLayerEntryLayerPaths();
  }

  /**
   * Gets the Layer Entry Configs.
   *
   * @returns The GeoView Layer Entry Configs
   */
  getLayerEntryConfigs(): ConfigBaseClass[] {
    return this.#controllers.layerController.getLayerEntryConfigs();
  }

  /**
   * Gets the layer configuration of the specified layer path.
   *
   * @param layerPath - The layer path.
   * @returns The layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   */
  getLayerEntryConfig(layerPath: string): ConfigBaseClass {
    return this.#controllers.layerController.getLayerEntryConfig(layerPath);
  }

  /**
   * Gets the layer configuration of a regular layer (not a group) at the specified layer path.
   *
   * @param layerPath - The layer path.
   * @returns The layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
   */
  getLayerEntryConfigRegular(layerPath: string): AbstractBaseLayerEntryConfig {
    return this.#controllers.layerController.getLayerEntryConfigRegular(layerPath);
  }

  /**
   * Gets the layer configuration of a group layer (not a regular) at the specified layer path.
   *
   * @param layerPath - The layer path.
   * @returns The layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
   */
  getLayerEntryConfigGroup(layerPath: string): GroupLayerEntryConfig {
    return this.#controllers.layerController.getLayerEntryConfigGroup(layerPath);
  }

  /**
   * Gets the layer configuration of the specified layer path.
   *
   * @param layerPath - The layer path.
   * @returns The layer configuration or undefined if not found.
   */
  getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined {
    return this.#controllers.layerController.getLayerEntryConfigIfExists(layerPath);
  }

  /**
   * Gets the GeoView Layer Paths.
   *
   * @returns The layer paths of the GV Layers
   */
  getGeoviewLayerPaths(): string[] {
    return this.#controllers.layerController.getGeoviewLayerPaths();
  }

  /**
   * Gets all GeoView Layers
   *
   * @returns The list of new Geoview Layers
   */
  getGeoviewLayers(): AbstractBaseGVLayer[] {
    return this.#controllers.layerController.getGeoviewLayers();
  }

  /**
   * Gets all GeoView layers that are regular layers (not groups).
   *
   * This method filters the list returned by `getGeoviewLayers()` and
   * returns only the layers that are instances of `AbstractGVLayer`.
   *
   * @returns An array containing only the regular layers from the current GeoView layer collection.
   */
  getGeoviewLayersRegulars(): AbstractGVLayer[] {
    return this.#controllers.layerController.getGeoviewLayersRegulars();
  }

  /**
   * Gets all GeoView layers that are group layers.
   *
   * This method filters the list returned by `getGeoviewLayers()` and
   * returns only the layers that are instances of `GVGroupLayer`.
   *
   * @returns An array containing only the group layers from the current GeoView layer collection.
   */
  getGeoviewLayersGroups(): GVGroupLayer[] {
    return this.#controllers.layerController.getGeoviewLayersGroups();
  }

  /**
   * Gets all GeoView layers that are at the root.
   *
   * @returns An array containing only the layers at the root level of the registry.
   */
  getGeoviewLayersRoot(): AbstractBaseGVLayer[] {
    return this.#controllers.layerController.getGeoviewLayersRoot();
  }

  /**
   * Returns the GeoView instance associated to the layer path.
   *
   * @param layerPath - The layer path
   * @returns The new Geoview Layer
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  getGeoviewLayer(layerPath: string): AbstractBaseGVLayer {
    return this.#controllers.layerController.getGeoviewLayer(layerPath);
  }

  /**
   * Returns the AbstractGVLayer instance associated to the layer path.
   *
   * This returns an actual AbstractGVLayer and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
   * An AbstractGVLayer is essentially a layer that's not a group layer.
   *
   * @param layerPath - The layer path
   * @returns The new Geoview Layer
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   */
  getGeoviewLayerRegular(layerPath: string): AbstractGVLayer {
    return this.#controllers.layerController.getGeoviewLayerRegular(layerPath);
  }

  /**
   * Returns the GeoView Layer instance associated to the layer path.
   *
   * This returns an actual AbstractGVLayer (or undefined) and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
   * An AbstractGVLayer is essentially a layer that's not a group layer.
   *
   * @param layerPath - The layer path
   * @returns The AbstractGVLayer or undefined when not found
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   */
  getGeoviewLayerRegularIfExists(layerPath: string): AbstractGVLayer | undefined {
    return this.#controllers.layerController.getGeoviewLayerRegularIfExists(layerPath);
  }

  /**
   * Returns the GeoView Layer instance associated to the layer path.
   *
   * @param layerPath - The layer path
   * @returns The AbstractBaseGVLayer or undefined when not found
   */
  getGeoviewLayerIfExists(layerPath: string): AbstractBaseGVLayer | undefined {
    return this.#controllers.layerController.getGeoviewLayerIfExists(layerPath);
  }

  /**
   * Asynchronously returns the OpenLayer layer associated to a specific layer path.
   *
   * This function waits the timeout period before abandonning (or uses the default timeout when not provided).
   * Note this function uses the 'Async' suffix to differentiate it from 'getOLLayer'.
   *
   * @param layerPath - The layer path to the layer's configuration.
   * @param timeout - Optionally indicate the timeout after which time to abandon the promise
   * @param checkFrequency - Optionally indicate the frequency at which to check for the condition on the layerabstract
   * @returns A promise that resolves to an OpenLayer layer associated to the layer path.
   */
  getOLLayerAsync(layerPath: string, timeout?: number, checkFrequency?: number): Promise<BaseLayer> {
    return this.#controllers.layerController.getOLLayerAsync(layerPath, timeout, checkFrequency);
  }

  // #endregion LAYER CONTROLLER GETTERS REDIRECTIONS

  // #region PUBLIC METHODS - LAYER CONTROLLER GENERAL REDIRECTIONS

  /**
   * Renames a layer.
   *
   * @param layerPath - The path of the layer.
   * @param name - The new name to use.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  setLayerName(layerPath: string, name: string): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerName(layerPath, name);
  }

  /**
   * Sets the opacity of a layer.
   *
   * @param layerPath - The path of the layer.
   * @param opacity - The new opacity value for the layer.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  setLayerOpacity(layerPath: string, opacity: number): void {
    // Redirect to controller
    this.#controllers.layerController.setLayerOpacity(layerPath, opacity);
  }

  /**
   * Sets queryable state for a layer.
   *
   * @param layerPath - The path of the layer.
   * @param queryable - The new queryable state for the layer.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  setLayerQueryable(layerPath: string, queryable: boolean): void {
    // Redirect on the controller
    this.#controllers.layerController.setLayerQueryable(layerPath, queryable);
  }

  /**
   * Sets hoverable state for a layer.
   *
   * @param layerPath - The path of the layer.
   * @param hoverable - The new hoverable state for the layer.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  setLayerHoverable(layerPath: string, hoverable: boolean): void {
    // Redirect on the controller
    this.#controllers.layerController.setLayerHoverable(layerPath, hoverable);
  }

  /**
   * Updates the raster function for an ESRI Image layer.
   *
   * @param layerPath - The path of the layer.
   * @param rasterFunctionId - The raster function ID to apply or undefined to remove it.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer is not an ESRI Image layer.
   */
  setLayerRasterFunction(layerPath: string, rasterFunctionId: string | undefined): void {
    // Redirect
    this.#controllers.layerController.setLayerRasterFunction(layerPath, rasterFunctionId);
  }

  /**
   * Loops through all geoview layers and refresh their respective source.
   * Use this function on projection change or other viewer modification who may affect rendering.
   */
  refreshLayers(): void {
    // Redirect
    this.#controllers.layerController.refreshLayers();
  }

  highlightLayer(layerPath: string): void {
    // Redirect
    this.#controllers.layerController.highlightLayer(layerPath);
  }

  removeLayerHighlights(layerPath: string): void {
    // Redirect
    this.#controllers.layerController.removeLayerHighlights(layerPath);
  }

  removeHighlightLayer(): void {
    // Redirect
    this.#controllers.layerController.removeHighlightLayer();
  }

  /**
   * Sets the date temporal mode for the specific layer.
   *
   * This updates the layer-level configuration used to control how date values
   * are interpreted.
   * The value is stored in the application state via the LegendEventProcessor.
   *
   * @param layerPath - The unique path identifying the layer.
   * @param temporalMode - The date format to apply
   * for displaying date values associated with this layer.
   */
  setLayerDateTemporalMode(layerPath: string, temporalMode: TemporalMode): void {
    // Redirect
    this.#controllers.layerController.setLayerDateTemporalMode(layerPath, temporalMode);
  }

  /**
   * Sets the date display format for a specific layer.
   *
   * This updates the layer-level configuration used to control how date values
   * are formatted when displayed (e.g., in legends, tooltips, or UI components).
   * The value is stored in the application state via the LegendEventProcessor.
   *
   * @param layerPath - The unique path identifying the layer.
   * @param displayDateFormat - The date format to apply
   * for displaying date values associated with this layer.
   */
  setLayerDisplayDateFormat(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void {
    // Redirect
    this.#controllers.layerController.setLayerDisplayDateFormat(layerPath, displayDateFormat);
  }

  /**
   * Sets the date display format (short) for a specific layer.
   *
   * Short means the date should be displayed in a more compact format.
   * This updates the layer-level configuration used to control how date values
   * are formatted when displayed (e.g., in legends, tooltips, or UI components).
   * The value is stored in the application state via the LegendEventProcessor.
   *
   * @param layerPath - The unique path identifying the layer.
   * @param displayDateFormat - The date format to apply
   * for displaying date values associated with this layer.
   */
  setLayerDisplayDateFormatShort(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void {
    // Redirect
    this.#controllers.layerController.setLayerDisplayDateFormatShort(layerPath, displayDateFormat);
  }

  /**
   * Sets the mosaic rule for an ESRI Image layer.
   *
   * @param layerPath - The layer path
   * @param mosaicRule - The mosaic rule to apply or undefined to remove it
   */
  setLayerMosaicRule(layerPath: string, mosaicRule: TypeMosaicRule | undefined): void {
    // Redirect
    this.#controllers.layerController.setLayerMosaicRule(layerPath, mosaicRule);
  }

  /**
   * Sets the WMS style for a WMS layer.
   *
   * @param layerPath - The layer path
   * @param wmsStyle - The WMS style to apply
   */
  setLayerWmsStyle(layerPath: string, wmsStyle: string): void {
    // Redirect
    this.#controllers.layerController.setLayerWmsStyle(layerPath, wmsStyle);
  }

  /**
   * Changes a GeoJson Source of a GeoJSON layer at the given layer path.
   *
   * @param layerPath - The path of the layer.
   * @param geojson - The new geoJSON.
   * @returns A promise that resolves when the geojson source has been set
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   * @throws {LayerNotGeoJsonError} When the layer is not a GeoJson layer.
   */
  setGeojsonSource(layerPath: string, geojson: GeoJSONObject | string): Promise<void> {
    // Redirect
    return this.#controllers.layerController.setGeojsonSource(layerPath, geojson);
  }

  // #endregion PUBLIC METHODS - LAYER CONTROLLER GENERAL REDIRECTIONS

  // #region PUBLIC METHODS - LAYER PROCESSING

  /**
   * Load layers that was passed in with the map config
   *
   * @param mapConfigLayerEntries - An optional array containing layers passed within the map config
   * @returns A promise that resolves when everything is done
   */
  async loadListOfGeoviewLayer(mapConfigLayerEntries: MapConfigLayerEntry[]): Promise<void> {
    const validGeoviewLayerConfigs = this.#deleteDuplicateAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries);

    // Make sure to convert all map config layer entry into a GeoviewLayerConfig
    const promisesOfGeoviewLayers = LayerApi.convertMapConfigsToGeoviewLayerConfig(
      this.getMapId(),
      this.mapViewer.getDisplayLanguage(),
      mapConfigLayerEntries,
      (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => {
        // Show the error(s)
        this.showLayerError(error, mapConfigLayerEntry.geoviewLayerId);
      }
    );

    // Wait for all promises (GeoCore ones) to process
    // The reason for the Promise.allSettled is because of synch issues with the 'setMapOrderedLayerInfo' which happens below and the
    // other setMapOrderedLayerInfos that happen in parallel via the ADD_LAYER events ping/pong'ing, making the setMapOrdered below fail
    // if we don't stage the promises. If we don't stage the promises, sometimes I have 4 layers loaded in 'Details' and sometimes
    // I have 3 layers loaded in Details - for example.
    // To fix this, we'll have to synch the ADD_LAYER events and make sure those 'know' what order they should be in when they
    // propagate the mapOrderedLayerInfo in their processes. For now at least, this is repeating the same behavior until the events are fixed.
    const orderedLayerInfos: TypeOrderedLayerInfo[] = getStoreMapOrderedLayerInfo(this.getMapId()).length
      ? getStoreMapOrderedLayerInfo(this.getMapId())
      : [];
    const promisedLayers = await Promise.allSettled(promisesOfGeoviewLayers);

    // For each layers in the fulfilled promises only
    promisedLayers.forEach((promise) => {
      // If fullfilled
      if (promise.status === 'fulfilled') {
        // Get the geoview layer config
        const geoviewLayerConfig = promise.value;

        try {
          // Generate array of layer order information for non-basemap layers
          if (geoviewLayerConfig.useAsBasemap !== true) {
            const layerInfos = LayerApi.generateArrayOfLayerOrderInfo(geoviewLayerConfig);
            orderedLayerInfos.push(...layerInfos);
          }

          // Add it
          this.addGeoviewLayer(geoviewLayerConfig);
        } catch (error: unknown) {
          // An error happening here likely means a particular, trivial, config error.
          // The majority of typicaly errors happen in the addGeoviewLayer promise catcher, not here.

          // Show the error(s)
          this.showLayerError(error, geoviewLayerConfig.geoviewLayerId);
        }
      } else {
        // Depending on the error
        let uuids;
        if (promise.reason instanceof LayerGeoCoreError) {
          ({ uuids } = promise.reason);
        }

        // For each uuid that failed
        uuids?.forEach((uuid: string) => {
          // Get the index at which the TypeGeoviewLayerConfig happened
          const index = validGeoviewLayerConfigs.findIndex((mapLayerEntry) => mapLayerEntry.geoviewLayerId === uuid);

          // If found
          if (index >= 0) {
            // Remove the entry
            validGeoviewLayerConfigs.splice(index, 1);
          }
        });
      }
    });

    // At this point, we've removed the duplicated geocore (DuplicateAndMultipleUuidGeoviewLayerConfig) and the
    // geocore that were failing were removed from the validGeoviewLayerConfigs variable.
    // Time to update the list we received in param so that the rest of the application works with that list.
    // This is notably so that the map loads even if no geocore layers were valid

    // Replace the array received in param
    mapConfigLayerEntries.splice(0, mapConfigLayerEntries.length, ...validGeoviewLayerConfigs);

    // Init ordered layer info (?)
    MapEventProcessor.setMapOrderedLayerInfo(this.getMapId(), orderedLayerInfos);
  }

  /**
   * Adds a Geoview Layer by GeoCore UUID.
   *
   * @param uuid - The GeoCore UUID to add to the map
   * @param layerEntryConfig - The optional layer configuration
   * @returns A promise that resolves with the added layer result or undefined when an error occurs
   */
  async addGeoviewLayerByGeoCoreUUID(uuid: string, layerEntryConfig?: string): Promise<GeoViewLayerAddedResult | undefined> {
    // Add a place holder to the ordered layer info array
    const layerInfo: TypeOrderedLayerInfo = {
      layerPath: uuid,
      visible: true,
      queryableState: true,
      hoverable: true,
      legendCollapsed: false,
      inVisibleRange: true,
    };

    if (this.getGeoviewLayerIds().includes(uuid)) {
      // eslint-disable-next-line no-param-reassign
      uuid = `${uuid}:${generateId(8)}`;
    }

    try {
      // GV: This is here as a placeholder so that the layers will appear in the proper order,
      // GV: regardless of how quickly we get the response. It is removed, in the catch below, if the layer fails.
      MapEventProcessor.addOrderedLayerInfo(this.getMapId(), layerInfo);

      const parsedLayerEntryConfig = layerEntryConfig ? JSON.parse(layerEntryConfig) : undefined;
      if (parsedLayerEntryConfig && !parsedLayerEntryConfig[0].layerId) parsedLayerEntryConfig[0].layerId = 'base-group';

      let optionalConfig: GeoCoreLayerConfig | undefined =
        parsedLayerEntryConfig && (parsedLayerEntryConfig[0].listOfLayerEntryConfig || parsedLayerEntryConfig[0].initialSettings)
          ? {
              geoviewLayerType: 'geoCore',
              geoviewLayerId: uuid,
              geoviewLayerName: parsedLayerEntryConfig[0].geoviewLayerName,
              listOfLayerEntryConfig: parsedLayerEntryConfig[0].geoviewLayerName
                ? parsedLayerEntryConfig[0].listOfLayerEntryConfig
                : parsedLayerEntryConfig,
              initialSettings: parsedLayerEntryConfig[0].initialSettings,
            }
          : undefined;

      // If a simplified config is provided, build a config with the layerName provided
      if (!optionalConfig && parsedLayerEntryConfig && (parsedLayerEntryConfig[0].layerName || parsedLayerEntryConfig[0].geoviewLayerName))
        optionalConfig = {
          geoviewLayerType: 'geoCore',
          geoviewLayerId: uuid,
          geoviewLayerName: parsedLayerEntryConfig[0].geoviewLayerName || parsedLayerEntryConfig[0].layerName,
        };

      // Create the layers from the UUID
      const response = await GeoCore.createLayerConfigFromUUID(uuid, this.mapViewer.getDisplayLanguage(), this.getMapId(), optionalConfig);
      const geoviewLayerConfig = response.config;

      // If a Geochart is initialized
      if (isStoreGeochartInitialized(this.getMapId())) {
        // For each geocharts configuration
        Object.entries(response.geocharts).forEach(([layerPath, geochartConfig]) => {
          // Add a GeoChart configuration on-the-fly
          addStoreGeochartChart(this.getMapId(), layerPath, geochartConfig);

          // Make sure geochart tab is shown
          this.#controllers.uiController.showTabButton('geochart');
        });
      }

      if (geoviewLayerConfig.useAsBasemap === true) {
        // If a basemap, remove the orderedLayerInfo placeholder as basemap are not part of the ordered layer info.
        MapEventProcessor.removeOrderedLayerInfo(this.getMapId(), geoviewLayerConfig.geoviewLayerId, true);
      }

      // Add the geoview layer
      return this.addGeoviewLayer(geoviewLayerConfig);
    } catch (error: unknown) {
      // An error happening here likely means an issue with the UUID or a trivial config error.
      // The majority of typicaly errors happen in the addGeoviewLayer promise catcher, not here.

      // Remove geoCore ordered layer info placeholder
      const orderedInfo = getStoreMapOrderedLayerInfoByPath(this.getMapId(), uuid);
      if (orderedInfo) MapEventProcessor.removeOrderedLayerInfo(this.getMapId(), uuid, false);

      // Show the error(s)
      this.showLayerError(error, uuid);
    }

    // None
    return undefined;
  }

  /**
   * Adds a layer to the map.
   *
   * This is the main method to add a GeoView Layer on the map. It handles all the processing, including the validations,
   * and makes sure to inform the layer sets about the layer. The result contains the instanciated GeoViewLayer along
   * with a promise that will resolve when the layer will be officially on the map.
   *
   * @param geoviewLayerConfig - The geoview layer configuration to add.
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
   * @returns The result of the addition of the geoview layer.
   * @throws {LayerCreatedTwiceError} When there already is a layer on the map with the provided geoviewLayerId.
   */
  addGeoviewLayer(geoviewLayerConfig: TypeGeoviewLayerConfig, abortSignal?: AbortSignal): GeoViewLayerAddedResult {
    // TODO: REFACTOR listOfLayerEntryConfig types - This should be dealt with the config classes and this line commented out.
    // TO.DOCONT: Right now, this function is called when the configuration is first read and schema checked and everything and then again here when we're adding a geoviewLayerConfig.
    // TO.DOCONT: Commenting the function from here would remove an redundancy call and it seems to be working in our templates when the line is commented. However, commenting it would
    // TO.DOCONT: probably cause issues when this 'addGeoviewLayer' function is called by external?
    // TO.DOCONT: PS: GeoCore also calls this 'validateListOfGeoviewLayerConfig' function from within 'createLayerConfigFromUUID'.
    ConfigValidation.validateListOfGeoviewLayerConfig([geoviewLayerConfig]);

    // If the geoviewlayerid already exists, throw
    if (this.getGeoviewLayerIds().includes(geoviewLayerConfig.geoviewLayerId)) {
      // Throw that the geoview layer id was already created
      throw new LayerCreatedTwiceError(geoviewLayerConfig.geoviewLayerId, geoviewLayerConfig.geoviewLayerName);
    }

    // Process the addition of the layer
    const result: GeoViewLayerAddedResult = this.#addGeoviewLayerStep2(geoviewLayerConfig, abortSignal);

    // If any errors happened during the processing, we want to show them in the notifications
    result.promiseLayer.catch((error: unknown) => {
      // GV This is the major catcher of many possible layer processing issues

      // Show the error(s).
      this.showLayerError(error, geoviewLayerConfig.geoviewLayerId);
    });

    // Return the result
    return result;
  }

  /**
   * Continues the addition of the geoview layer.
   *
   * @param geoviewLayerConfig - The geoview layer configuration to add.
   * @param abortSignal - Optional {@link AbortSignal} used to cancel the layer creation process.
   * @returns The result of the addition of the geoview layer.
   * The result contains the instanciated GeoViewLayer along with a promise that will resolve when the layer will be officially on the map.
   */
  #addGeoviewLayerStep2(geoviewLayerConfig: TypeGeoviewLayerConfig, abortSignal?: AbortSignal): GeoViewLayerAddedResult {
    // Create the layer for the processing
    const layerBeingAdded = LayerApi.createLayerConfigFromType(geoviewLayerConfig);

    // Add in the geoviewLayers set
    this.#geoviewLayers[layerBeingAdded.getGeoviewLayerId()] = layerBeingAdded;

    // For each layer entry config in the geoview layer
    layerBeingAdded.getAllLayerEntryConfigs().forEach((layerConfig) => {
      // Log
      logger.logTraceCore(`LAYERS - 1 - Registering layer entry config ${layerConfig.layerPath} on map ${this.getMapId()}`, layerConfig);

      // Register it
      this.#registerLayerConfigInit(layerConfig);

      // Add filters to map initial filters, if they exist
      this.#addInitialFilters(layerConfig);
    });

    // Register a callback when the layer entry config wants to register extra configs
    layerBeingAdded.onLayerEntryRegisterInit(this.#handleLayerEntryRegisterInit.bind(this));

    // Register a callback when layer wants to send a message
    layerBeingAdded.onLayerMessage(this.#handleLayerMessage.bind(this));

    // Register a callback when a Group Layer has been created
    layerBeingAdded.onLayerGroupCreated(this.#handleLayerGroupCreated.bind(this));

    // Register a callback when a GV Layer has been created
    layerBeingAdded.onLayerGVCreated(this.#handleLayerGVCreated.bind(this));

    // Create a promise that the layer will be added on the map
    const promiseLayer = new Promise<void>((resolve, reject) => {
      // Continue the addition process
      layerBeingAdded
        .createGeoViewLayers(getStoreDisplayDateMode(this.getMapId()), this.mapViewer.getProjection(), abortSignal)
        .then(() => {
          // Add the layer on the map
          this.#addToMap(layerBeingAdded, geoviewLayerConfig);

          // Resolve, done
          resolve();

          // Emit
          this.#emitLayerConfigAdded({ layer: layerBeingAdded });
        })
        .catch((error: unknown) => {
          // Reject it higher, because that's not where we want to handle the promise failure, we're returning the promise higher
          reject(formatError(error));
        });
    });

    // Return the layer with the promise it'll be on the map
    return { layer: layerBeingAdded, promiseLayer };
  }

  // #endregion PUBLIC METHODS - LAYER PROCESSING

  // TODO: REFACTOR - FINISH CLEARING THIS REGION BELOW OF FUNCTIONS THAT SHOULD BE IN A CONTROLLER OR ELSEWHERE..
  // TO.DOCONT: PURSUING WITH CONTROLLERS CLEANUP FOR NOW

  // #region IN THIS REGION METHODS SHOULD BE MOVED ELSEWHERE?

  /**
   * Refreshes GeoCore Layers
   */
  reloadGeocoreLayers(): void {
    const configs = this.getLayerEntryConfigs();
    const originalMapOrderedLayerInfo = getStoreMapOrderedLayerInfo(this.getMapId());
    const parentPaths: string[] = [];

    // Have to do the Promise allSettled so the new MapOrderedLayerInfo has all the children layerPaths
    Promise.allSettled(
      configs
        .filter((config) => {
          // Filter to just Geocore layers and not child layers
          if (isValidUUID(config.getGeoviewLayerId()) && !config.getParentLayerConfig()) {
            return true;
          }
          return false;
        })
        .map((config) => {
          // Remove and add back in GeoCore Layers and return their promises
          parentPaths.push(config.layerPath);
          this.removeLayerUsingPath(config.layerPath);
          return this.addGeoviewLayerByGeoCoreUUID(config.getGeoviewLayerId());
        })
    )
      .then(() => {
        const originalLayerPaths = originalMapOrderedLayerInfo.map((info) => info.layerPath);

        // Prepare listeners for removing previously removed layers
        parentPaths.forEach((parentPath) => {
          function removeChildLayers(sender: LayerApi): void {
            const childPaths = sender.#getAllChildPaths(parentPath);
            childPaths.forEach((childPath) => {
              if (!originalLayerPaths.includes(childPath)) {
                sender.removeLayerUsingPath(childPath);
              }
            });
            // TODO: MINOR - Bound this 'removeChildLayers' function (like other ones) instead of creating a new handler on each 'forEach'
            sender.offLayerConfigAdded(removeChildLayers);
          }

          this.onLayerConfigAdded(removeChildLayers);
        });

        // Prepare listeners for changing the visibility
        MapEventProcessor.setMapOrderedLayerInfo(this.getMapId(), originalMapOrderedLayerInfo);
        originalMapOrderedLayerInfo.forEach((layerInfo) => {
          function setLayerVisibility(sender: LayerDomain, event: DomainLayerEvent): void {
            const layerPath = event.layer.getLayerPath();
            if (layerInfo.layerPath === layerPath) {
              const { visible } = originalMapOrderedLayerInfo.filter((info) => info.layerPath === layerPath)[0];
              event.layer?.setVisible(visible);
              // TODO: MINOR - Bound this 'setLayerVisibility' function (like other ones) instead of creating a new handler on each 'forEach'
              sender.offLayerFirstLoaded(setLayerVisibility);
            }
          }

          // TODO: REFACTOR - Instead of attaching on the domain, attach it on the layer itself
          this.#layerDomain.onLayerFirstLoaded(setLayerVisibility);
        });
      })
      .catch((error: unknown) => {
        // Log
        logger.logError(error);
      });
  }

  /**
   * Attempts to reload a layer.
   *
   * @param layerPath - The path to the layer to reload
   */
  reloadLayer(layerPath: string): void {
    const layerEntryConfig = this.getLayerEntryConfig(layerPath);
    const geoviewLayer = layerEntryConfig ? this.#geoviewLayers[layerEntryConfig.getGeoviewLayerId()] : undefined;
    const gvLayer = this.getGeoviewLayerIfExists(layerPath);

    if (geoviewLayer) {
      if (gvLayer instanceof GVGroupLayer) {
        // Reload each sub layers that are in error
        (layerEntryConfig as GroupLayerEntryConfig).listOfLayerEntryConfig.forEach((sublayerEntryConfig) => {
          if (sublayerEntryConfig.layerStatus === 'error') this.reloadLayer(sublayerEntryConfig.layerPath);
        });
      } else {
        // For each layer paths, check each starting with the given layerPath
        this.getLayerEntryLayerPaths().forEach((registeredLayerPath) => {
          if (registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) {
            // Get the geoview layer if exists
            const innerGVLayer = this.getGeoviewLayerIfExists(registeredLayerPath);

            // If found
            if (innerGVLayer) {
              // Remove actual OL layer from the map
              const layer = innerGVLayer.getOLLayer();
              if (layer) this.mapViewer.map.removeLayer(layer);

              // Remove from registered layers
              this.#layerDomain.deleteGVLayer(innerGVLayer);
            }
          }
        });

        // Create and register new layer
        const layer = geoviewLayer.createGVLayer(layerEntryConfig as AbstractBaseLayerEntryConfig);

        // Re-register in the domain
        this.#layerDomain.registerGVLayer(layer);

        // Re-add on the map
        this.mapViewer.map.addLayer(layer.getOLLayer());
      }
    }
  }

  /**
   * Removes all geoview layers from the map
   */
  removeAllGeoviewLayers(): void {
    this.getLayerEntryLayerPaths().forEach((layerEntryConfigId) => {
      // Remove it
      this.removeLayerUsingPath(layerEntryConfigId);
    });
  }

  /**
   * Removes all layers in error from the map
   */
  removeAllLayersInError(): void {
    this.getLayerEntryConfigs().forEach((layerEntryConfig) => {
      // Remove it if it is in error
      if (layerEntryConfig.layerStatus === 'error') this.removeLayerUsingPath(layerEntryConfig.layerPath);
    });
  }

  /**
   * Removes a layer from the map using its layer path. The path may point to the root geoview layer
   * or a sub layer.
   *
   * @param layerPath - The path or ID of the layer to be removed
   */
  removeLayerUsingPath(layerPath: string): void {
    // Remove any highlights associated with the layer
    this.#controllers.layerController.removeLayerHighlights(layerPath);

    // A layer path is a slash seperated string made of the GeoView layer Id followed by the layer Ids
    const layerPathNodes = layerPath.split('/');

    // Get the layer entry config to remove
    const layerEntryConfig = this.getLayerEntryConfigIfExists(layerPath);

    // If the layer config was found
    if (layerEntryConfig) {
      // initialize these two constant now because we will delete the information used to get their values.
      const indexToDelete = layerEntryConfig
        ? layerEntryConfig.getParentLayerConfig()?.listOfLayerEntryConfig.findIndex((layerConfig) => layerConfig === layerEntryConfig)
        : undefined;
      const listOfLayerEntryConfigAffected = this.getLayerEntryConfigIfExists(layerPath)?.getParentLayerConfig()?.listOfLayerEntryConfig;

      // Remove layer info from registered layers
      this.getLayerEntryLayerPaths().forEach((registeredLayerPath) => {
        if (registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) {
          // Get the geoview layer if exists
          const innerGVLayer = this.getGeoviewLayerIfExists(registeredLayerPath);

          // Remove actual OL layer from the map
          const layer = innerGVLayer?.getOLLayer();
          if (layer) this.mapViewer.map.removeLayer(layer);

          // Unregister layer config from the application
          this.#unregisterLayerConfig(this.getLayerEntryConfig(registeredLayerPath));

          // Remove the text layer if it is a vector layer
          if (innerGVLayer instanceof AbstractGVVector) {
            const textLayer = innerGVLayer.getTextOLLayer();
            if (textLayer) this.mapViewer.map.removeLayer(textLayer);
          }

          // If the layer had a parent
          const parent = innerGVLayer?.getParent();
          if (innerGVLayer && parent) {
            // Make sure to remove the layer from the parent and that way when the bounds get recalculated the removed layer won't be included
            parent.removeLayer(innerGVLayer);
          }

          // Unregister from the domain
          if (innerGVLayer) this.#layerDomain.deleteGVLayer(innerGVLayer);

          // Remove from registered layer configs
          this.#layerDomain.deleteLayerEntryConfig(registeredLayerPath);
          delete this.#geoviewLayers[registeredLayerPath];
        }
      });

      // Now that some layers have been removed, check if they are all effectively loaded/error and update store if so
      this.#controllers.layerController.checkIfAllLayersLoaded();

      // Remove from parents listOfLayerEntryConfig
      if (listOfLayerEntryConfigAffected) listOfLayerEntryConfigAffected.splice(indexToDelete!, 1);

      // Remove layer from geoview layers
      if (this.#geoviewLayers[layerPathNodes[0]]) {
        const geoviewLayer = this.#geoviewLayers[layerPathNodes[0]];

        // If it is a single layer, remove geoview layer
        if (layerPathNodes.length === 1 || (layerPathNodes.length === 2 && geoviewLayer.listOfLayerEntryConfig.length === 1)) {
          geoviewLayer.olRootLayer?.dispose();
          if (geoviewLayer.olRootLayer) delete geoviewLayer.olRootLayer;

          delete this.#geoviewLayers[layerPathNodes[0]];
          const { mapFeaturesConfig } = this.mapViewer;

          if (mapFeaturesConfig.map.listOfGeoviewLayerConfig)
            mapFeaturesConfig.map.listOfGeoviewLayerConfig = mapFeaturesConfig.map.listOfGeoviewLayerConfig.filter(
              (geoviewLayerConfig) => geoviewLayerConfig.geoviewLayerId !== layerPath
            );
        } else if (layerPathNodes.length === 2) {
          const updatedListOfLayerEntryConfig = geoviewLayer.listOfLayerEntryConfig.filter(
            (entryConfig) => entryConfig.layerId !== layerPathNodes[1]
          );
          geoviewLayer.listOfLayerEntryConfig = updatedListOfLayerEntryConfig;
        } else {
          // For layer paths more than two deep, drill down through listOfLayerEntryConfigs to layer entry config to remove
          let layerEntryConfig2 = geoviewLayer.listOfLayerEntryConfig.find((entryConfig) => entryConfig.layerId === layerPathNodes[1]);

          for (let i = 1; i < layerPathNodes.length; i++) {
            if (i === layerPathNodes.length - 1 && layerEntryConfig2) {
              // When we get to the top level, remove the layer entry config
              const updatedListOfLayerEntryConfig = layerEntryConfig2.listOfLayerEntryConfig.filter(
                (entryConfig) => entryConfig.layerId !== layerPathNodes[i]
              );
              geoviewLayer.listOfLayerEntryConfig = updatedListOfLayerEntryConfig;
            } else if (layerEntryConfig2) {
              // Not on the top level, so update to the latest
              layerEntryConfig2 = layerEntryConfig2.listOfLayerEntryConfig.find((entryConfig) => entryConfig.layerId === layerPathNodes[i]);
            }
          }
        }
      }

      // Emit about it
      this.#emitLayerConfigRemoved({ layerPath, layerName: layerEntryConfig.getLayerName() || 'No name / Sans nom' });

      // Log
      logger.logInfo(`Layer removed for ${layerPath}`);

      // Redirect to feature info delete
      deleteStoreDetailsFeatureInfo(this.getMapId(), layerPath);
    }
  }

  /**
   * Gets the max extent of all layers on the map, or of a provided subset of layers.
   *
   * @param layerIds - Identifiers or layerPaths of layers to get max extents from.
   * @returns A promise that resolves with the overall extent or undefined when no bounds are found
   */
  async getExtentOfMultipleLayers(layerIds: string[] = this.getLayerEntryLayerPaths()): Promise<Extent | undefined> {
    const layerBoundsPromises: Promise<Extent | undefined>[] = [];
    layerIds.forEach((layerId) => {
      // Get sublayerpaths and layerpaths from layer IDs.
      const subLayerPaths = this.getLayerEntryLayerPaths().filter(
        (layerPath) => layerPath.startsWith(`${layerId}/`) || layerPath === layerId
      );

      if (subLayerPaths.length) {
        // Get max extents from all selected layers.
        subLayerPaths.forEach((layerPath) => {
          // Get the GV layer and get its bounds
          const layerBoundsPromise = this.getGeoviewLayer(layerPath).getBounds(this.mapViewer.getProjection(), MapViewer.DEFAULT_STOPS);
          layerBoundsPromises.push(layerBoundsPromise);
        });
      }
    });

    // Once all promises resolve
    const allBounds = await Promise.all(layerBoundsPromises);

    // For each bounds found
    let boundsUnion: Extent | undefined;
    allBounds.forEach((bounds) => {
      // Union the bounds with each other
      boundsUnion = GeoUtilities.getExtentUnion(boundsUnion, bounds);
    });

    // Return the final bounds
    return boundsUnion;
  }

  /**
   * Zoom to extents of a layer.
   *
   * @param layerPath - The path of the layer to zoom to.
   * @param fitOptions - Optional fit options for zooming.
   * @returns A promise that resolves when the zoom operation is complete
   * @throws {NoBoundsError} When the layer doesn't have bounds.
   */
  zoomToLayerExtent(layerPath: string, fitOptions?: FitOptions): Promise<void> {
    // Redirect to the map viewer function
    return MapEventProcessor.zoomToLayerExtent(this.getMapId(), layerPath, fitOptions);
  }

  /**
   * Sets the visibility of a single legend item on a regular (non-group) layer.
   *
   * This method updates the visibility of the specified item both in the underlying
   * layer's style configuration and optionally in the legend store. It can also
   * trigger the layer filters to be reapplied and optionally wait for the next
   * render cycle before resolving. Finally, it emits an event indicating the visibility
   * change.
   *
   * @param layerPath - The path identifying the target layer within the map.
   * @param item - The legend item whose visibility will be updated.
   * @param visibility - Whether the item should be visible.
   * @param refresh - If `true`, updates the legend layers store
   * to reflect this change (used to avoid repeated rerenders when updating multiple items).
   * @param waitForRender - If `true`, the promise resolves only after the
   * underlying layer has finished its next render cycle.
   * @returns A promise that resolves once the visibility has been applied,
   * optional legend store updated, filters applied, and render completed if requested
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  async setItemVisibility(
    layerPath: string,
    item: TypeLegendItem,
    visibility: boolean,
    refresh: boolean,
    waitForRender: boolean
  ): Promise<void> {
    // Get registered layer config
    const layer = this.getGeoviewLayerRegular(layerPath);

    // Set it
    await layer.setStyleItemVisibility(item, visibility, false);

    // TODO: REFACTOR - This current function should probably end here and the setting of the store happen in an event hook on the
    // TO.DOCONT: style item visibility. Refer to pattern of setLayerName, setLayerOpacity, setLayerQueryable, etc
    // Apply filter to layer
    if (refresh) MapEventProcessor.applyLayerFilters(this.getMapId(), layerPath);

    // Update the legend layers if necessary
    if (refresh) {
      // Save to the store
      setStoreLayerItemVisibility(this.getMapId(), layerPath, item, visibility, layer.getLayerFilters().getClassFilter());
    }

    // Await on the render if we must
    if (waitForRender) {
      // Wait for the render to complete
      await layer.waitForRender();
    }

    // Emit event
    this.#emitLayerItemVisibilityToggled({ layerPath, itemName: item.name, visibility });
  }

  /**
   * Sets the visibility of all geoview layers on the map.
   *
   * @param newValue - The new visibility.
   */
  setAllLayersVisibility(newValue: boolean): void {
    this.getLayerEntryLayerPaths().forEach((layerPath) => {
      // If the layer path has a corresponding Geoview layer (it's possible that there's a layer entry config without necessarily a GV layer)
      if (this.getGeoviewLayerIfExists(layerPath)) {
        // There is a geoview layer at this layer path
        this.setOrToggleLayerVisibility(layerPath, newValue);
      }
    });
  }

  /**
   * Sets or toggles the visibility of a layer within the current map.
   *
   * Retrieves the current visibility of the layer, determines the resulting visibility
   * based on the optional `newValue`, and applies the change only if the visibility
   * actually differs. If `newValue` is provided, the visibility is set explicitly;
   * if omitted, the method toggles the current visibility.
   *
   * @param layerPath - The path of the layer whose visibility is being updated.
   * @param newValue - Optional. The new visibility value to apply. If omitted, the current visibility is toggled.
   * @returns The resulting visibility state of the layer after the update
   * @throws {LayerNotFoundError} If the layer cannot be found at the given path.
   */
  setOrToggleLayerVisibility(layerPath: string, newValue?: boolean): boolean {
    // Get current visibility based on the store
    // TODO: CHECK - Should likely check the current visibility by using the layer (domain) instead of the store
    const layerVisibility = getStoreMapVisibilityByPath(this.getMapId(), layerPath);

    // Determine the outcome of the new visibility based on parameters
    const newVisibility = newValue !== undefined ? newValue : !layerVisibility;

    if (layerVisibility !== newVisibility) {
      // Redirect
      this.getGeoviewLayer(layerPath).setVisible(newVisibility);
    }

    return newVisibility;
  }

  /**
   * Redefine feature info fields.
   *
   * @param layerPath - The path of the layer.
   * @param fieldNames - The new field names to use.
   * @param fields - The fields to change.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
   * @throws {LayerDifferingFieldLengthsError} When the layer configuration has different field lengths.
   * @throws {LayerNotQueryableError} When the layer configuration is not queryable.
   */
  redefineFeatureFields(layerPath: string, fieldNames: string[], fields: 'alias' | 'name'): void {
    // Get the layer config
    const layerConfig = this.getLayerEntryConfigRegular(layerPath);

    // Get outfields
    const outfields = layerConfig.getOutfields();

    // If has fields and queryable
    if (!!outfields?.length && layerConfig.getQueryableSourceDefaulted()) {
      // Convert the provided field names to an array so we can index
      if (outfields.length === fieldNames.length)
        // Override existing values in each outfield with provided field name
        outfields.forEach((outfield, index) => {
          // eslint-disable-next-line no-param-reassign
          outfield[fields] = fieldNames[index];
        });
      else throw new LayerDifferingFieldLengthsError(layerPath);
    } else throw new LayerNotQueryableError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
  }

  /**
   * Replace outfield names, aliases and types with any number of new values, provided an identical count of each are supplied.
   *
   * @param layerPath - The path of the layer.
   * @param types - The new field types (TypeOutfieldsType) to use.
   * @param fieldNames - The new field names to use.
   * @param fieldAliases - Optional, the new field aliases to use.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
   * @throws {LayerDifferingFieldLengthsError} When the layer configuration has different field lengths.
   * @throws {LayerNotQueryableError} When the layer configuration is not queryable.
   */
  replaceFeatureOutfields(layerPath: string, types: TypeOutfieldsType[], fieldNames: string[], fieldAliases?: string[]): void {
    // Get the layer config
    const layerConfig = this.getLayerEntryConfigRegular(layerPath);

    // Get outfields
    const outfields = layerConfig.getOutfields();

    // If has fields and queryable
    if (!!outfields?.length && layerConfig.getQueryableSourceDefaulted()) {
      // Ensure same number of all items are provided
      if (fieldNames.length === types.length) {
        // Convert to array of outfields
        const newOutfields = fieldNames.map((name, index) => {
          return {
            name,
            alias: fieldAliases ? fieldAliases[index] : name,
            type: types[index],
          };
        });

        // Set new outfields
        layerConfig.setOutfields(newOutfields);
      } else throw new LayerDifferingFieldLengthsError(layerPath);
    } else throw new LayerNotQueryableError(layerConfig.layerPath, layerConfig.getLayerNameCascade());
  }

  /**
   * Show the errors that happened during layers loading.
   *
   * If it's an aggregate error, log and show all of them.
   * If it's a regular error, log and show only that error.
   *
   * @param error - The error to log and show.
   * @param geoviewLayerId - The Geoview layer id for which the error happened.
   */
  showLayerError(error: unknown, geoviewLayerId: string): void {
    // If an aggregation error
    if (error instanceof AggregateError) {
      // For each errors
      error.errors.forEach((layerError) => {
        // Recursive call
        this.showLayerError(layerError, geoviewLayerId);
      });
    } else {
      // Cast the error
      const theError = formatError(error);

      // Read the layer path if possible, more precise
      let layerPathOrId = geoviewLayerId;
      if (theError instanceof LayerEntryConfigError) {
        layerPathOrId = theError.layerConfig.layerPath;
      }

      // Show error
      this.mapViewer.notifications.showErrorFromError(theError, true);

      // If the Error is GeoViewError, it has a translation
      let { message } = theError;
      if (theError instanceof GeoViewError) {
        message = theError.translateMessage(this.mapViewer.getDisplayLanguage());
      }

      // Emit about it
      this.#emitLayerConfigError({ layerPath: layerPathOrId, error: message });
    }
  }

  // #endregion IN THIS REGION METHODS SHOULD BE MOVED ELSEWHERE?

  // #region PRIVATE FUNCTIONS

  /**
   * Gets all child paths from a parent path.
   *
   * @param parentPath - The parent path
   * @returns Child layer paths
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer configuration is of the wrong type at the given layer path.
   */
  #getAllChildPaths(parentPath: string): string[] {
    // Get the group layer
    const parentLayerEntryConfig = this.getLayerEntryConfigGroup(parentPath);

    // Return all the layer paths inside that group
    return parentLayerEntryConfig.getLayerPathsAll();
  }

  /**
   * Continues the addition of the geoview layer.
   * Adds the layer to the map if valid. If not (is a string) emits an error.
   *
   * @param geoviewLayer - The layer
   */
  #addToMap(geoviewLayer: AbstractGeoViewLayer, geoviewLayerConfig: TypeGeoviewLayerConfig): void {
    // If no root layer is set, forget about it
    if (!geoviewLayer.olRootLayer) return;

    // If all layer status are good
    if (!geoviewLayer.allLayerStatusAreGreaterThanOrEqualTo('error')) {
      // Add the OpenLayers layer to the map officially
      this.mapViewer.map.addLayer(geoviewLayer.olRootLayer);

      // Log
      logger.logInfo(`GeoView Layer ${geoviewLayer.getGeoviewLayerId()} added to map ${this.getMapId()}`, geoviewLayer);

      // GV: KML currently has no style or symbology associated with it, so we warn the user
      if (geoviewLayerConfig.geoviewLayerType === CONST_LAYER_TYPES.KML)
        this.mapViewer.notifications.showWarning('warning.layer.kmlLayerWarning', [], true);

      // Set the layer z indices
      MapEventProcessor.setLayerZIndices(this.getMapId());
    }
  }

  // #endregion PRIVATE FUNCTIONS

  // #region PRIVATE FUNCTIONS - LAYER PROCESSING

  /**
   * Registers the layer identifier.
   *
   * @param layerConfig - The layer entry config to register
   */
  #registerLayerConfigInit(layerConfig: ConfigBaseClass): void {
    // Register it in the domain
    this.#layerDomain.registerLayerEntryConfig(layerConfig);
  }

  /**
   * Unregisters the layer in the LayerApi to stop managing it.
   *
   * @param layerConfig - The layer entry config to unregister
   * @param unregisterOrderedLayerInfo - Should it be unregistered from orderedLayerInfo
   */
  #unregisterLayerConfig(layerConfig: ConfigBaseClass, unregisterOrderedLayerInfo: boolean = true): void {
    // Unregister from ordered layer info
    if (unregisterOrderedLayerInfo) {
      // Remove from ordered layer info
      MapEventProcessor.removeOrderedLayerInfo(this.getMapId(), layerConfig.layerPath);
    }

    // If the TimeSlider plugin is initialized
    if (isStoreTimeSliderInitialized(this.getMapId())) {
      // Remove from the TimeSlider
      removeStoreTimeSliderLayer(this.getMapId(), layerConfig.layerPath, () => {
        // Remove the tab
        this.#controllers.uiController.hideTabButton('time-slider');
      });
    }

    // If the geochart plugin is initialized
    if (isStoreGeochartInitialized(this.getMapId())) {
      // Remove from the GeoChart Charts
      removeStoreGeochartChart(this.getMapId(), layerConfig.layerPath, () => {
        // Remove the tab
        this.#controllers.uiController.hideTabButton('geochart');
      });
    }

    // If the swiper plugin is initialized
    if (isStoreSwiperInitialized(this.getMapId())) {
      // Remove it from the Swiper
      removeStoreSwiperLayerPath(this.getMapId(), layerConfig.layerPath);
    }

    // Unregister from the domain
    this.#layerDomain.unregisterLayerEntryConfig(layerConfig);
  }

  /**
   * Handles the initialization of a layer-entry registration event.
   *
   * This method is triggered when an additional layer-entry configuration
   * (typically created dynamically) needs to be registered in the map's
   * layer configuration system.
   *
   * Behavior:
   *  1. Checks whether a configuration for the given `layerPath` already exists.
   *  2. If it exists, unregisters the old configuration (without triggering
   *     cleanup actions tied to removal).
   *  3. Registers the new layer-entry configuration using `registerLayerConfigInit`.
   *
   * @param geoviewLayer - The GeoView layer associated with this registration event.
   * @param event - The event containing the layer-entry configuration to be registered.
   */
  #handleLayerEntryRegisterInit(geoviewLayer: AbstractGeoViewLayer, event: LayerEntryRegisterInitEvent): void {
    // Log
    logger.logTraceCore(
      `LAYERS - 1.5 - Registering an extra layer entry config ${event.config.layerPath} on map ${this.getMapId()}`,
      event.config
    );

    // If already existing
    const alreadyExisting = this.getLayerEntryConfigIfExists(event.config.layerPath);
    if (alreadyExisting) {
      // Unregister the old one
      this.#unregisterLayerConfig(alreadyExisting, false);
    }

    // Register it
    this.#registerLayerConfigInit(event.config);
  }

  /**
   * Handles the creation of a GeoView layer (`GVLayer`) after its underlying
   * OL layer and configuration have been fully initialized.
   *
   * This method is triggered once a layer has completed its construction,
   * allowing the system to register it, attach handlers, and notify any
   * listeners that the layer is now ready for interaction.
   *
   * Behavior:
   *  1. Stores references to the GV layer and the underlying OL layer,
   *     indexed by their `layerPath`.
   *  2. Registers internal event handlers for the new layer.
   *  3. Emits a "layer created" event so external code can bind to it immediately.
   *  4. Calls the layer's `init()` method to finalize initialization.
   *
   * @param geoviewLayer - The parent or context GeoView layer associated with this creation event.
   * @param event - The event containing the newly created GV layer instance and its configuration.
   */
  #handleLayerGVCreated(geoviewLayer: AbstractGeoViewLayer, event: LayerGVCreatedEvent): void {
    // Get the GV Layer and the config
    const gvLayer = event.layer;
    const layerConfig = gvLayer.getLayerConfig();

    // Log
    logger.logTraceCore(
      `LAYERS - 9 - GV Layer created for ${layerConfig.layerPath} on map ${this.getMapId()}`,
      layerConfig.layerStatus,
      layerConfig
    );

    // Register in the domain
    this.#layerDomain.registerGVLayer(gvLayer);

    // Handle text layer for vector layers
    if (gvLayer instanceof AbstractGVVector) {
      const textLayer = gvLayer.getTextOLLayer();
      if (textLayer) {
        this.mapViewer.map.addLayer(textLayer);
      }
    }

    // Calculate the bounds upon creation
    setStoreLayerBoundsForLayerAndParentsAndForget(this.getMapId(), gvLayer, this.mapViewer.getProjection(), MapViewer.DEFAULT_STOPS);

    // Emit about its creation so that one can attach events on it right away if necessary
    this.#emitLayerCreated({ layer: gvLayer });

    // Init it
    gvLayer.init();
  }

  /**
   * Handles the creation of a GeoView group layer (`GVGroupLayer`).
   *
   * This method is invoked once a group layer has been fully instantiated,
   * allowing the system to register it, attach handlers, and initialize its
   * visibility constraints.
   *
   * Behavior:
   *  1. Stores references to the GV group layer and its corresponding
   *     OpenLayers layer, indexed by `layerPath`.
   *  2. Registers internal event handlers specific to group layers.
   *  3. Computes and stores the layer's initial "in visible range" state.
   *
   * @param geoviewLayer - The parent or context layer
   *   associated with this creation event.
   * @param event - The event containing the newly
   *   created group layer instance and its configuration.
   */
  #handleLayerGroupCreated(geoviewLayer: AbstractGeoViewLayer, event: LayerGroupCreatedEvent): void {
    // Get the Group Layer and the config
    const groupLayer = event.layer;
    const layerConfig = groupLayer.getLayerConfig();

    // Log
    logger.logTraceCore(
      `LAYERS - 7 - Group Layer created for ${layerConfig.layerPath} on map ${this.getMapId()}`,
      layerConfig.layerStatus,
      layerConfig
    );

    // Register in the domain
    this.#layerDomain.registerGVLayer(groupLayer);

    // TODO: REFACTOR - Think about moving this call somewhere else
    // Set in visible range property for all newly added layers
    this.#controllers.layerController.setLayerInVisibleRange(groupLayer);
  }

  /**
   * Handles layer-specific messages and displays them through the map viewer's notification system.
   *
   * @param layer - The layer instance that triggered the message
   * @param layerMessageEvent - The message event containing notification details
   *
   * @example
   * handleLayerMessage(myLayer, {
   *   messageKey: 'layers.fetchProgress',
   *   messageParams: [50, 100],
   *   messageType: 'error',
   *   notification: true
   * });
   */
  #handleLayerMessage(layer: AbstractGeoViewLayer, layerMessageEvent: LayerMessageEvent): void {
    // Read event params for clarity
    const { messageType } = layerMessageEvent;
    const { messageKey } = layerMessageEvent;
    const { messageParams } = layerMessageEvent;
    const { notification } = layerMessageEvent;

    if (messageType === 'info') {
      this.mapViewer.notifications.showMessage(messageKey, messageParams, notification);
    } else if (messageType === 'warning') {
      this.mapViewer.notifications.showWarning(messageKey, messageParams, notification);
    } else if (messageType === 'error') {
      this.mapViewer.notifications.showError(messageKey, messageParams, notification);
    } else if (messageType === 'success') {
      this.mapViewer.notifications.showSuccess(messageKey, messageParams, notification);
    }
  }

  /**
   * Adds initial filters to layers, if provided.
   *
   * @param layerConfig - The layer config being processed
   */
  #addInitialFilters(layerConfig: ConfigBaseClass): void {
    // If correct subclass, otherwise skip
    if (layerConfig instanceof AbstractBaseLayerEntryConfig) {
      // Get the layer filter
      const layerFilter = layerConfig.getLayerFilter();

      // If any layer filter
      if (layerFilter) {
        // Save to the store
        addStoreMapInitialFilter(this.getMapId(), layerConfig.layerPath, layerFilter);
      }
    }
  }

  /**
   * Validates the geoview layer configuration array to eliminate duplicate entries and inform the user.
   *
   * @param mapConfigLayerEntries - The Map Config Layer Entries to validate.
   * @returns The new configuration with duplicate entries eliminated
   */
  #deleteDuplicateAndMultipleUuidGeoviewLayerConfig(mapConfigLayerEntries?: MapConfigLayerEntry[]): MapConfigLayerEntry[] {
    if (mapConfigLayerEntries && mapConfigLayerEntries.length > 0) {
      const validGeoviewLayerConfigs = mapConfigLayerEntries.filter((geoviewLayerConfigToCreate, configToCreateIndex) => {
        for (let configToTestIndex = 0; configToTestIndex < mapConfigLayerEntries.length; configToTestIndex++) {
          if (
            geoviewLayerConfigToCreate.geoviewLayerId === mapConfigLayerEntries[configToTestIndex].geoviewLayerId &&
            // We keep the first instance of the duplicate entry.
            configToCreateIndex > configToTestIndex
          ) {
            this.#printDuplicateGeoviewLayerConfigError(geoviewLayerConfigToCreate);

            // Remove geoCore ordered layer info placeholder
            const orderedInfo = getStoreMapOrderedLayerInfoByPath(this.getMapId(), geoviewLayerConfigToCreate.geoviewLayerId);
            if (orderedInfo) {
              MapEventProcessor.removeOrderedLayerInfo(this.getMapId(), geoviewLayerConfigToCreate.geoviewLayerId, false);
            }

            return false;
          }
        }
        return true;
      });
      return validGeoviewLayerConfigs;
    }
    return [];
  }

  /**
   * Prints an error message for the duplicate geoview layer configuration.
   *
   * @param mapConfigLayerEntry - The Map Config Layer Entry in error.
   */
  #printDuplicateGeoviewLayerConfigError(mapConfigLayerEntry: MapConfigLayerEntry): void {
    // Log
    logger.logError(`Duplicate use of geoview layer identifier ${mapConfigLayerEntry.geoviewLayerId} on map ${this.getMapId()}`);

    // Show the error
    this.mapViewer.notifications.showError('validation.layer.usedtwice', [mapConfigLayerEntry.geoviewLayerId]);
  }

  // #endregion PRIVATE FUNCTIONS - LAYER PROCESSING

  // #region EVENTS

  /**
   * Emits an event to all handlers when a layer config has been flag as error.
   *
   * @param event - The event to emit
   */
  #emitLayerConfigError(event: LayerConfigErrorEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigErrorHandlers, event);
  }

  /**
   * Registers a layer config error event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigError(callback: LayerConfigErrorDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigErrorHandlers, callback);
  }

  /**
   * Unregisters a layer config error event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigError(callback: LayerConfigErrorDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigErrorHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer config has been added.
   *
   * @param event - The event to emit
   */
  #emitLayerConfigAdded(event: LayerBuilderEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigAddedHandlers, event);
  }

  /**
   * Registers a layer config added event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigAdded(callback: LayerBuilderDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigAddedHandlers, callback);
  }

  /**
   * Unregisters a layer config added event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigAdded(callback: LayerBuilderDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigAddedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitLayerConfigRemoved(event: LayerPathEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerConfigRemovedHandlers, event);
  }

  /**
   * Registers a layer removed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerConfigRemoved(callback: LayerPathDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerConfigRemovedHandlers, callback);
  }

  /**
   * Unregisters a layer removed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerConfigRemoved(callback: LayerPathDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerConfigRemovedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitLayerCreated(event: LayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerCreatedHandlers, event);
  }

  /**
   * Registers a layer created event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerCreated(callback: LayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerCreatedHandlers, callback);
  }

  /**
   * Unregisters a layer created event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerCreated(callback: LayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerCreatedHandlers, callback);
  }

  /**
   * Emits an event to all registered handlers.
   *
   * @param event - The event to emit
   */
  #emitLayerStatusChanged(event: DomainLayerStatusChangedEvent): void {
    // Emit the layersetupdated event
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerStatusChangedHandlers, event);
  }

  /**
   * Registers a callback to be executed whenever the layer status is updated.
   *
   * @param callback - The callback function
   */
  onLayerStatusChanged(callback: DomainLayerStatusChangedDelegate): void {
    // Register the layersetupdated event callback
    EventHelper.onEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a callback from being called whenever the layer status is updated.
   *
   * @param callback - The callback function to unregister
   */
  offLayerStatusChanged(callback: DomainLayerStatusChangedDelegate): void {
    // Unregister the layersetupdated event callback
    EventHelper.offEvent(this.#onLayerStatusChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when all layers have turned into a loaded/error state on the map.
   *
   * @param event - The event to emit
   */
  #emitLayerAllLoaded(event: LayerConfigEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerAllLoadedHandlers, event);
  }

  /**
   * Registers a layer all loaded/error event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerAllLoaded(callback: LayerConfigDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerAllLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer all loaded/error event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerAllLoaded(callback: LayerConfigDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerAllLoadedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has been loaded for the first time on the map.
   *
   * @param event - The event to emit
   */
  #emitLayerFirstLoaded(event: DomainLayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerLoadedFirstHandlers, event);
  }

  /**
   * Registers a layer first loaded event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerFirstLoaded(callback: DomainLayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadedFirstHandlers, callback);
  }

  /**
   * Unregisters a layer first loaded event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerFirstLoaded(callback: DomainLayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadedFirstHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has turned into a loading state on the map.
   *
   * @param event - The event to emit
   */
  #emitLayerLoading(event: DomainLayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerLoadingHandlers, event);
  }

  /**
   * Registers a layer loading event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoading(callback: DomainLayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Unregisters a layer loading event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoading(callback: DomainLayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadingHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has turned into a loaded state on the map.
   *
   * @param event - The event to emit
   */
  #emitLayerLoaded(event: DomainLayerEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerLoadedHandlers, event);
  }

  /**
   * Registers a layer loaded event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerLoaded(callback: DomainLayerDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Unregisters a layer loaded event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerLoaded(callback: DomainLayerDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerLoadedHandlers, callback);
  }

  /**
   * Emits an event to all handlers when a layer has been flag as error on the map.
   *
   * @param event - The event to emit
   */
  #emitLayerError(event: DomainLayerErrorEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerErrorHandlers, event);
  }

  /**
   * Registers a layer error event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerError(callback: DomainLayerErrorDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerErrorHandlers, callback);
  }

  /**
   * Unregisters a layer error event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerError(callback: DomainLayerErrorDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerErrorHandlers, callback);
  }

  /**
   * Emits layer visibility toggled event.
   *
   * @param event - The event to emit
   */
  #emitLayerVisibilityToggled(event: DomainLayerVisibleChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this.#layerDomain, this.#onLayerVisibilityToggledHandlers, event);
  }

  /**
   * Registers a layer visibility toggled event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerVisibilityToggled(callback: DomainLayerVisibleChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerVisibilityToggledHandlers, callback);
  }

  /**
   * Unregisters a layer  visibility toggled event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerVisibilityToggled(callback: DomainLayerVisibleChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerVisibilityToggledHandlers, callback);
  }

  /**
   * Emits layer item visibility toggled event.
   *
   * @param event - The event to emit
   */
  #emitLayerItemVisibilityToggled(event: LayerItemVisibilityToggledEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onLayerItemVisibilityToggledHandlers, event);
  }

  /**
   * Registers a layer item visibility toggled event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onLayerItemVisibilityToggled(callback: LayerItemVisibilityToggledDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onLayerItemVisibilityToggledHandlers, callback);
  }

  /**
   * Unregisters a layer item visibility toggled event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offLayerItemVisibilityToggled(callback: LayerItemVisibilityToggledDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onLayerItemVisibilityToggledHandlers, callback);
  }

  // #endregion EVENTS

  // #region STATIC

  /**
   * Converts a map configuration layer entry into a promise of a GeoView layer configuration.
   *
   * Depending on the type of the layer entry (e.g., GeoCore, GeoPackage, Shapefile, RCS, or standard GeoView),
   * this function processes each entry accordingly and wraps the result in a `Promise`.
   * Errors encountered during asynchronous operations are handled via a provided callback.
   *
   * @param mapId - The unique identifier of the map instance this configuration applies to.
   * @param language - The language setting used for layer labels and metadata.
   * @param entry - The array of layer entry to convert.
   * @param errorCallback - Callback invoked when an error occurs during layer processing.
   * @returns A promise that resolves to a `TypeGeoviewLayerConfig` object
   */
  static convertMapConfigToGeoviewLayerConfig(
    mapId: string,
    language: TypeDisplayLanguage,
    entry: MapConfigLayerEntry,
    errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void
  ): Promise<TypeGeoviewLayerConfig> {
    // Depending on the map config layer entry type
    let promise: Promise<TypeGeoviewLayerConfig>;
    if (mapConfigLayerEntryIsGeoCore(entry)) {
      // Working with a GeoCore layer
      promise = GeoCore.createLayerConfigFromUUID(entry.geoviewLayerId, language, mapId, entry).then((response) => {
        // If a Geochart is initialized
        if (isStoreGeochartInitialized(mapId)) {
          // For each geocharts configuration
          Object.entries(response.geocharts).forEach(([layerPath, geochartConfig]) => {
            // Add the chart to the store
            addStoreGeochartChart(mapId, layerPath, geochartConfig);

            // Log
            logger.logInfo('Added GeoChart configs for layer path:', layerPath);
          });
        }
        return response.config;
      });
    } else if (mapConfigLayerEntryIsGeoPackage(entry)) {
      // Working with a geopackage layer
      promise = GeoPackageReader.createLayerConfigFromGeoPackage(entry as GeoPackageLayerConfig);
    } else if (mapConfigLayerEntryIsShapefile(entry)) {
      // Working with a shapefile layer
      promise = ShapefileReader.convertShapefileConfigToGeoJson(entry);
    } else if (mapConfigLayerEntryIsRCS(entry)) {
      // Working with a RCS (Geocore subset) layer
      promise = GeoCore.createLayerConfigFromRCSUUID(entry.geoviewLayerId, language, mapId, entry);
    } else {
      // Working with a standard GeoView layer
      promise = Promise.resolve(entry);
    }

    // Prepare to catch errors
    promise.catch((error) => {
      // Callback
      errorCallback?.(entry, error);
    });

    return promise;
  }

  /**
   * Converts a list of map configuration layer entries into an array of promises,
   * each resolving to one or more GeoView layer configuration objects.
   *
   * @param mapId - The unique identifier of the map instance this configuration applies to.
   * @param language - The language setting used for layer labels and metadata.
   * @param mapConfigLayerEntries - The array of layer entries to convert.
   * @param errorCallback - Callback invoked when an error occurs during layer processing.
   * @returns An array of promises, each resolving to a `TypeGeoviewLayerConfig` object
   */
  static convertMapConfigsToGeoviewLayerConfig(
    mapId: string,
    language: TypeDisplayLanguage,
    mapConfigLayerEntries: MapConfigLayerEntry[],
    errorCallback: (mapConfigLayerEntry: MapConfigLayerEntry, error: unknown) => void
  ): Promise<TypeGeoviewLayerConfig>[] {
    // For each layer entry
    return mapConfigLayerEntries.map((entry) => {
      // Redirect
      return LayerApi.convertMapConfigToGeoviewLayerConfig(mapId, language, entry, errorCallback);
    });
  }

  /**
   * Generate an array of layer info for the orderedLayerList.
   *
   * @param geoviewLayerConfig - The config to get the info from.
   * @returns The array of ordered layer info
   */
  static generateArrayOfLayerOrderInfo(geoviewLayerConfig: TypeGeoviewLayerConfig | ConfigBaseClass): TypeOrderedLayerInfo[] {
    const newOrderedLayerInfos: TypeOrderedLayerInfo[] = [];

    const addSubLayerPathToLayerOrder = (layerEntryConfig: TypeLayerEntryConfig, layerPath: string): void => {
      const subLayerPath = layerPath.endsWith(`/${layerEntryConfig.layerId}`) ? layerPath : `${layerPath}/${layerEntryConfig.layerId}`;

      const settings = ConfigBaseClass.getClassOrTypeInitialSettings(layerEntryConfig);
      const featureInfo = AbstractBaseLayerEntryConfig.getClassOrTypeFeatureInfo(layerEntryConfig);

      const layerInfo: TypeOrderedLayerInfo = {
        layerPath: subLayerPath,
        visible: settings?.states?.visible ?? true, // default: true
        queryableSource: featureInfo?.queryable ?? true, // default: true
        queryableState: settings?.states?.queryable ?? true, // default: true
        hoverable: settings?.states?.hoverable ?? true, // default: true
        legendCollapsed: settings?.states?.legendCollapsed ?? false, // default: false
        inVisibleRange: true,
      };

      newOrderedLayerInfos.push(layerInfo);
      if (layerEntryConfig.listOfLayerEntryConfig?.length) {
        layerEntryConfig.listOfLayerEntryConfig?.forEach((subLayerEntryConfig) => {
          addSubLayerPathToLayerOrder(subLayerEntryConfig, subLayerPath);
        });
      }
    };

    // TODO: REFACTOR listOfLayerEntryConfig types - This function has issues with the expected types and what it's truly doing.
    // TO.DOCONT: Sometimes, geoviewLayerConfig is a ConfigBaseClass instance and sometimes a regular json object
    // GV: The old code was doing `if (theGeoviewLayerConfig.geoviewLayerId)` which condition is only possible when `geoviewLayerId` is a property of the class instance.
    // GV: However, since that it's not a property anymore, that code was only being executed when the objet was a json object. For a while now...
    // GV: Attempting to fix it by supporting both the class instance and the json object by doing something like:
    // GV: const theGeoviewLayerConfig = ConfigBaseClass.getClassOrTypeGeoviewLayerConfig(geoviewLayerConfig);
    // GV: was actually making it worse. Therefore, I'm assuming the correct condition check is to check if the variable is a
    // GV: json object (not a class instance), so I'm changing it for clarity. However, I'm not sure what the whole intention is here.

    if (!(geoviewLayerConfig instanceof ConfigBaseClass)) {
      if (geoviewLayerConfig.listOfLayerEntryConfig?.length > 1) {
        const layerPath = `${geoviewLayerConfig.geoviewLayerId}/base-group`;
        // Using as any, because even a TypeGeoviewLayerConfig can have initialSettings? To confirm...
        const settingsGVLC = ConfigBaseClass.getClassOrTypeInitialSettings(geoviewLayerConfig)?.states;

        const layerInfo: TypeOrderedLayerInfo = {
          layerPath,
          legendCollapsed: settingsGVLC?.legendCollapsed ?? false, // default: false
          visible: settingsGVLC?.visible ?? true, // default: true
          inVisibleRange: true,
        };

        newOrderedLayerInfos.push(layerInfo);
        geoviewLayerConfig.listOfLayerEntryConfig.forEach((layerEntryConfig) => {
          addSubLayerPathToLayerOrder(layerEntryConfig, layerPath);
        });
      } else {
        const layerEntryConfig = geoviewLayerConfig.listOfLayerEntryConfig[0];
        addSubLayerPathToLayerOrder(layerEntryConfig, layerEntryConfig.layerPath);
      }
    } else {
      addSubLayerPathToLayerOrder(geoviewLayerConfig as TypeLayerEntryConfig, geoviewLayerConfig.layerPath);
    }

    return newOrderedLayerInfos;
  }

  /**
   * Creates an instance of a specific `AbstractGeoViewLayer` subclass based on the given GeoView layer configuration.
   *
   * This function determines the correct layer type from the configuration and instantiates it accordingly.
   *
   * @remarks
   * - This method currently supports GeoJSON, CSV, WMS, Esri Dynamic, Esri Feature, Esri Image, GeoTIFF
   *   ImageStatic, KML, WFS, WKB, OGC Feature, XYZ Tiles, and Vector Tiles.
   * - If the layer type is not supported, an error is thrown.
   * - TODO: Refactor to use the validated configuration with metadata already fetched.
   *
   * @param geoviewLayerConfig - The configuration object for the GeoView layer.
   * @returns An instance of the corresponding `AbstractGeoViewLayer` subclass
   * @throws {NotSupportedError} When the configuration does not match any supported layer type.
   */
  static createLayerConfigFromType(geoviewLayerConfig: TypeGeoviewLayerConfig): AbstractGeoViewLayer {
    // Depending on the layer type of config
    if (CsvLayerEntryConfig.isClassOrTypeCSV(geoviewLayerConfig)) {
      return new CSV(geoviewLayerConfig);
    }
    if (EsriDynamicLayerEntryConfig.isClassOrTypeEsriDynamic(geoviewLayerConfig)) {
      return new EsriDynamic(geoviewLayerConfig);
    }
    if (EsriFeatureLayerEntryConfig.isClassOrTypeEsriFeature(geoviewLayerConfig)) {
      return new EsriFeature(geoviewLayerConfig);
    }
    if (EsriImageLayerEntryConfig.isClassOrTypeEsriImage(geoviewLayerConfig)) {
      return new EsriImage(geoviewLayerConfig);
    }
    if (GeoJSONLayerEntryConfig.isClassOrTypeGeoJSON(geoviewLayerConfig)) {
      return new GeoJSON(geoviewLayerConfig);
    }
    if (GeoTIFFLayerEntryConfig.isClassOrTypeGeoTIFF(geoviewLayerConfig)) {
      return new GeoTIFF(geoviewLayerConfig);
    }
    if (ImageStaticLayerEntryConfig.isClassOrTypeImageStatic(geoviewLayerConfig)) {
      return new ImageStatic(geoviewLayerConfig);
    }
    if (KmlLayerEntryConfig.isClassOrTypeKMLLayer(geoviewLayerConfig)) {
      return new KML(geoviewLayerConfig);
    }
    if (OgcFeatureLayerEntryConfig.isClassOrTypeOGCLayer(geoviewLayerConfig)) {
      return new OgcFeature(geoviewLayerConfig);
    }
    if (VectorTilesLayerEntryConfig.isClassOrTypeVectorTiles(geoviewLayerConfig)) {
      return new VectorTiles(geoviewLayerConfig);
    }
    if (OgcWfsLayerEntryConfig.isClassOrTypeWFSLayer(geoviewLayerConfig)) {
      return new WFS(geoviewLayerConfig);
    }
    if (WkbLayerEntryConfig.isClassOrTypeWKBLayer(geoviewLayerConfig)) {
      return new WKB(geoviewLayerConfig);
    }
    if (OgcWmsLayerEntryConfig.isClassOrTypeWMS(geoviewLayerConfig)) {
      return new WMS(geoviewLayerConfig);
    }
    if (OgcWmtsLayerEntryConfig.isClassOrTypeWMTS(geoviewLayerConfig)) {
      return new WMTS(geoviewLayerConfig);
    }
    if (XYZTilesLayerEntryConfig.isClassOrTypeXYZTiles(geoviewLayerConfig)) {
      return new XYZTiles(geoviewLayerConfig);
    }

    // Not implemented
    throw new NotSupportedError('Unsupported layer class type in createLayerConfigFromType');
  }

  // #endregion
}

export type GeoViewLayerAddedResult = {
  layer: AbstractGeoViewLayer;
  promiseLayer: Promise<void>;
};

// #region EVENTS & DELEGATES

/**
 * Define an event for the delegate
 */
export type LayerBuilderEvent = {
  layer: AbstractGeoViewLayer;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerBuilderDelegate = EventDelegateBase<LayerApi, LayerBuilderEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerConfigErrorEvent = {
  // The layer path (or the geoview layer id) depending when the error occurs in the process
  layerPath: string;
  // The error
  error: string;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerConfigErrorDelegate = EventDelegateBase<LayerApi, LayerConfigErrorEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerEvent = {
  // The loaded layer
  layer: AbstractGVLayer;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerDelegate = EventDelegateBase<LayerApi, LayerEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerErrorEvent = {
  // The loaded layer
  layer: AbstractGVLayer;
  // The error
  error: unknown;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerErrorDelegate = EventDelegateBase<LayerApi, LayerErrorEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerPathEvent = {
  // The layer path
  layerPath: string;
  // The layer name
  layerName: string;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerPathDelegate = EventDelegateBase<LayerApi, LayerPathEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerConfigEvent = {
  // The layer entry config
  config: ConfigBaseClass;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerConfigDelegate = EventDelegateBase<LayerApi, LayerConfigEvent, void>;

/**
 * Define an event for the delegate
 */
export type LayerItemVisibilityToggledEvent = {
  // The layer path of the affected layer
  layerPath: string;
  // Name of the item being toggled
  itemName: string;
  // The new visibility
  visibility: boolean;
};

/**
 * Define a delegate for the event handler function signature
 */
export type LayerItemVisibilityToggledDelegate = EventDelegateBase<LayerApi, LayerItemVisibilityToggledEvent, void>;

// #endregion EVENTS
