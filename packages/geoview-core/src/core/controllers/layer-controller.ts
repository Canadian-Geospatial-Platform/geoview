import type BaseLayer from 'ol/layer/Base';
import type { GeoJSONObject } from 'ol/format/GeoJSON';

import { VALID_PROJECTION_CODES, type Extent, type TypeFeatureInfoEntryPartial } from '@/api/types/map-schema-types';
import type {
  TypeLayerEntryConfig,
  TypeLayerStatus,
  TypeMosaicMethod,
  TypeMosaicOperation,
  TypeMosaicRule,
} from '@/api/types/layer-schema-types';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import type { GroupLayerEntryConfig } from '@/api/config/validation-classes/group-layer-entry-config';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { LayerNotEsriDynamicError, LayerNotGeoJsonError, LayerWrongTypeError } from '@/core/exceptions/layer-exceptions';
import { useControllers } from '@/core/controllers/base/controller-manager';
import {
  getStoreLayerMosaicRule,
  getStoreLayerStateHighlightedLayer,
  getStoreLayerStateLegendLayerByPath,
  getStoreLayerStateLegendLayers,
  setStoreHighlightedLayer,
  setStoreLayerBoundsForLayerAndParentsAndForget,
  setStoreLayerDateTemporal,
  setStoreLayerDeletionStartTime,
  setStoreLayerDisplayDateFormat,
  setStoreLayerDisplayDateFormatShort,
  setStoreLayerHoverable,
  setStoreLayerItemVisibility,
  setStoreLayerMosaicRule,
  setStoreLayerName,
  setStoreLayerQueryable,
  setStoreLayerRasterFunction,
  setStoreLayersAreLoading,
  setStoreLayerTextVisibility,
  setStoreLayerWmsStyle,
  setStoreLegendLayersDirectly,
  setStoreOpacity,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { TypeTimeSliderProps } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type {
  DomainLayerHoverableChangedDelegate,
  DomainLayerHoverableChangedEvent,
  DomainLayerDelegate,
  DomainLayerEvent,
  DomainLayerNameChangedDelegate,
  DomainLayerNameChangedEvent,
  DomainLayerOpacityChangedDelegate,
  DomainLayerOpacityChangedEvent,
  DomainLayerQueryableChangedDelegate,
  DomainLayerQueryableChangedEvent,
  DomainLayerStatusChangedDelegate,
  DomainLayerStatusChangedEvent,
  DomainLayerVisibleChangedDelegate,
  DomainLayerVisibleChangedEvent,
  LayerDomain,
  DomainLayerGroupLayerDelegate,
  DomainLayerGroupLayerEvent,
  DomainLayerWMSImageLoadRescueEvent,
  DomainLayerWMSImageLoadRescueDelegate,
  DomainLayerRegisteredDelegate,
  DomainLayerRegisteredEvent,
} from '@/core/domains/layer-domain';
import { doTimeout, isValidUUID, type DelayJob } from '@/core/utils/utilities';
import type { TemporalMode, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import type { TypeLegendItem } from '@/core/components/layers/types';
import { logger } from '@/core/utils/logger';
import {
  getStoreMapConfigCorePackagesConfig,
  getStoreMapOrderedLayerIndexByPath,
  getStoreMapOrderedLayerInfo,
  setStoreMapLayerHoverable,
  setStoreMapLayerQueryable,
  utilFindMapLayerAndChildrenFromOrderedInfo,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { Projection } from '@/geo/utils/projection';
import { MapViewer } from '@/geo/map/map-viewer';
import { AbstractGVRaster } from '@/geo/layer/gv-layers/raster/abstract-gv-raster';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVGroupLayer } from '@/geo/layer/gv-layers/gv-group-layer';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVGeoJSON } from '@/geo/layer/gv-layers/vector/gv-geojson';
import { GVEsriDynamic } from '@/geo/layer/gv-layers/raster/gv-esri-dynamic';

/**
 * LayerController class that extends the AbstractMapViewerController and provides methods to interact with map layers.
 */
export class LayerController extends AbstractMapViewerController {
  /** The opacity ratio to use when highlighting a layer vs the other layers */
  static readonly HIGHLIGHT_OPACITY_RATIO = 4;

  /** The Layer Domain instance associated with this controller */
  #layerDomain: LayerDomain;

  /** Used to keep a reference of highlighted layer */
  #highlightedLayerPath: string = '';

  /** Holds all the layers in process of being deleted from the map */
  #layersBeingDeleted: Record<string, LayerDeletionJob> = {};

  /** The bounded reference to the handle layer entry config registered */
  #boundedHandleLayerEntryConfigRegistered: DomainLayerStatusChangedDelegate;

  /** The bounded reference to the handle layer entry config unregistered */
  #boundedHandleLayerEntryConfigUnregistered: DomainLayerStatusChangedDelegate;

  /** The bounded reference to the handle layer registered */
  #boundedHandleLayerRegistered: DomainLayerRegisteredDelegate;

  /** The bounded reference to the handle layer registered */
  #boundedHandleLayerUnregistered: DomainLayerRegisteredDelegate;

  /** The bounded reference to the handle layer name changed */
  #boundedHandleLayerNameChanged: DomainLayerNameChangedDelegate;

  /** The bounded reference to the handle layer visibility changed */
  #boundedHandleLayerVisibleChanged: DomainLayerVisibleChangedDelegate;

  /** The bounded reference to the handle layer opacity changed */
  #boundedHandleLayerOpacityChanged: DomainLayerOpacityChangedDelegate;

  /** The bounded reference to the handle layer loading changed */
  #boundedHandleLayerLoadingChanged: DomainLayerDelegate;

  /** The bounded reference to the handle layer first loaded changed */
  #boundedHandleLayerFirstLoadedChanged: DomainLayerDelegate;

  /** The bounded reference to the handle layer loaded changed */
  #boundedHandleLayerLoadedChanged: DomainLayerDelegate;

  /** The bounded reference to the handle layer loaded changed */
  #boundedHandleLayerAllLoaded: DomainLayerStatusChangedDelegate;

  /** The bounded reference to the handle layer hoverable changed */
  #boundedHandleLayerHoverableChanged: DomainLayerHoverableChangedDelegate;

  /** The bounded reference to the handle layer queryable changed */
  #boundedHandleLayerQueryableChanged: DomainLayerQueryableChangedDelegate;

  /** The bounded reference to the handle layer queryable changed */
  #boundedHandleLayerGroupLayerAdded: DomainLayerGroupLayerDelegate;

  /** The bounded reference to the handle layer queryable changed */
  #boundedHandleLayerGroupLayerRemoved: DomainLayerGroupLayerDelegate;

  /** The bounded reference to the handle WMS Layer Image Load Callbacks */
  #boundedHandleLayerWMSImageLoadRescue: DomainLayerWMSImageLoadRescueDelegate;

  /** Callback delegates for the layer item visibility toggled event */
  #onLayerItemVisibilityToggledHandlers: LayerItemVisibilityToggledDelegate[] = [];

  /**
   * Creates an instance of LayerController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller.
   * @param layerDomain - The layer domain instance to associate with this controller.
   * @param featureHighlight - The feature highlight instance to associate with this controller.
   */
  constructor(mapViewer: MapViewer, layerDomain: LayerDomain) {
    super(mapViewer);

    // Keep the domain internally
    this.#layerDomain = layerDomain;

    // Keep a bounded reference to the handle layer entry config registered
    this.#boundedHandleLayerEntryConfigRegistered = this.#handleLayerEntryConfigRegistered.bind(this);

    // Keep a bounded reference to the handle layer entry config unregistered
    this.#boundedHandleLayerEntryConfigUnregistered = this.#handleLayerEntryConfigUnregistered.bind(this);

    // Keep a bounded reference to the handle layer registered
    this.#boundedHandleLayerRegistered = this.#handleLayerRegistered.bind(this);

    // Keep a bounded reference to the handle layer unregistered
    this.#boundedHandleLayerUnregistered = this.#handleLayerUnregistered.bind(this);

    // Keep a bounded reference to the handle layer name changed
    this.#boundedHandleLayerNameChanged = this.#handleLayerNameChanged.bind(this);

    // Keep a bounded reference to the handle layer visibility changed
    this.#boundedHandleLayerVisibleChanged = this.#handleLayerVisibleChanged.bind(this);

    // Keep a bounded reference to the handle layer opacity changed
    this.#boundedHandleLayerOpacityChanged = this.#handleLayerOpacityChanged.bind(this);

    // Keep a bounded reference to the handle layer loading changed
    this.#boundedHandleLayerLoadingChanged = this.#handleLayerLoadingChanged.bind(this);

    // Keep a bounded reference to the handle layer first loaded changed
    this.#boundedHandleLayerFirstLoadedChanged = this.#handleLayerFirstLoadedChanged.bind(this);

    // Keep a bounded reference to the handle layer loaded changed
    this.#boundedHandleLayerLoadedChanged = this.#handleLayerLoadedChanged.bind(this);

    // Keep a bounded reference to the handle layer all loaded changed
    this.#boundedHandleLayerAllLoaded = this.#handleLayerAllLoaded.bind(this);

    // Keep a bounded reference to the handle layer hoverable changed
    this.#boundedHandleLayerHoverableChanged = this.#handleLayerHoverableChanged.bind(this);

    // Keep a bounded reference to the handle layer queryable changed
    this.#boundedHandleLayerQueryableChanged = this.#handleLayerQueryableChanged.bind(this);

    // Keep a bounded reference to the handle layer group layer added
    this.#boundedHandleLayerGroupLayerAdded = this.#handleLayerGroupLayerAdded.bind(this);

    // Keep a bounded reference to the handle layer group layer added
    this.#boundedHandleLayerGroupLayerRemoved = this.#handleLayerGroupLayerRemoved.bind(this);

    // Keep a bounded reference to the handle WMS Layer Image Load Callbacks
    this.#boundedHandleLayerWMSImageLoadRescue = this.#handleLayerWMSImageLoadRescue.bind(this);
  }

  // #region OVERRIDES

  /**
   * Hooks layer domain listeners.
   */
  protected override onHook(): void {
    // Listens when a layer config has been registered in the domain
    this.#layerDomain.onLayerEntryConfigRegistered(this.#boundedHandleLayerEntryConfigRegistered);

    // Listens when a layer config has been unregistered from the domain
    this.#layerDomain.onLayerEntryConfigUnregistered(this.#boundedHandleLayerEntryConfigUnregistered);

    // Listens when a gv layer has been registered in the domain
    this.#layerDomain.onLayerRegistered(this.#boundedHandleLayerRegistered);

    // Listens when a gv layer has been unregistered from the domain
    this.#layerDomain.onLayerUnregistered(this.#boundedHandleLayerUnregistered);

    // Listens when the layer name is changed in the Layer domain
    this.#layerDomain.onLayerNameChanged(this.#boundedHandleLayerNameChanged);

    // Listens when the layer visibility is changed in the Layer domain
    this.#layerDomain.onLayerVisibleChanged(this.#boundedHandleLayerVisibleChanged);

    // Listens when the layer opacity is changed in the Layer domain
    this.#layerDomain.onLayerOpacityChanged(this.#boundedHandleLayerOpacityChanged);

    // Listens when the layer loading state is changed in the Layer domain
    this.#layerDomain.onLayerLoading(this.#boundedHandleLayerLoadingChanged);

    // Listens when the layer loading state is changed in the Layer domain
    this.#layerDomain.onLayerFirstLoaded(this.#boundedHandleLayerFirstLoadedChanged);

    // Listens when the layer loaded state is changed in the Layer domain
    this.#layerDomain.onLayerLoaded(this.#boundedHandleLayerLoadedChanged);

    // Listens when the layers are all loaded in the Layer domain
    this.#layerDomain.onLayerAllLoaded(this.#boundedHandleLayerAllLoaded);

    // Listens when the layer hoverable state is changed in the Layer domain
    this.#layerDomain.onLayerHoverableChanged(this.#boundedHandleLayerHoverableChanged);

    // Listens when the layer queryable state is changed in the Layer domain
    this.#layerDomain.onLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);

    // Listens when a layer is added to a group layer in the Layer domain
    this.#layerDomain.onLayerGroupLayerAdded(this.#boundedHandleLayerGroupLayerAdded);

    // Listens when a layer is added to a group layer in the Layer domain
    this.#layerDomain.onLayerGroupLayerRemoved(this.#boundedHandleLayerGroupLayerRemoved);

    // Listens when a WMS image load rescue event occurs
    this.#layerDomain.onLayerWMSImageLoadRescue(this.#boundedHandleLayerWMSImageLoadRescue);
  }

  /**
   * Unhooks the controller from the action.
   */
  protected override onUnhook(): void {
    // Unhooks when a WMS image load rescue event occurs
    this.#layerDomain.offLayerWMSImageLoadRescue(this.#boundedHandleLayerWMSImageLoadRescue);

    // Unhooks when a layer is added to a group layer in the Layer domain
    this.#layerDomain.offLayerGroupLayerRemoved(this.#boundedHandleLayerGroupLayerRemoved);

    // Unhooks when a layer is added to a group layer in the Layer domain
    this.#layerDomain.offLayerGroupLayerAdded(this.#boundedHandleLayerGroupLayerAdded);

    // Unhooks when the layer queryable state is changed in the Layer domain
    this.#layerDomain.offLayerQueryableChanged(this.#boundedHandleLayerQueryableChanged);

    // Unhooks when the layer hoverable state is changed in the Layer domain
    this.#layerDomain.offLayerHoverableChanged(this.#boundedHandleLayerHoverableChanged);

    // Unhooks when the layers are all loaded in the Layer domain
    this.#layerDomain.offLayerAllLoaded(this.#boundedHandleLayerAllLoaded);

    // Unhooks when the layer loaded state is changed in the Layer domain
    this.#layerDomain.offLayerLoaded(this.#boundedHandleLayerLoadedChanged);

    // Unhooks when the layer first loaded state is changed in the Layer domain
    this.#layerDomain.offLayerFirstLoaded(this.#boundedHandleLayerFirstLoadedChanged);

    // Unhooks when the layer loading state is changed in the Layer domain
    this.#layerDomain.offLayerLoading(this.#boundedHandleLayerLoadingChanged);

    // Unhooks when the layer opacity is changed in the Layer domain
    this.#layerDomain.offLayerOpacityChanged(this.#boundedHandleLayerOpacityChanged);

    // Unhooks when the layer visibility is changed in the Layer domain
    this.#layerDomain.offLayerVisibleChanged(this.#boundedHandleLayerVisibleChanged);

    // Unhooks when a layer name is changed in the Layer domain
    this.#layerDomain.offLayerNameChanged(this.#boundedHandleLayerNameChanged);

    // Listens when a gv layer has been registered in the domain
    this.#layerDomain.offLayerUnregistered(this.#boundedHandleLayerUnregistered);

    // Listens when a gv layer has been unregistered from the domain
    this.#layerDomain.offLayerRegistered(this.#boundedHandleLayerRegistered);

    // Unhooks when a layer config has been unregistered from the domain
    this.#layerDomain.offLayerEntryConfigUnregistered(this.#boundedHandleLayerEntryConfigUnregistered);

    // Unhooks when a layer config has been registered in the domain
    this.#layerDomain.offLayerEntryConfigRegistered(this.#boundedHandleLayerEntryConfigRegistered);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS - DOMAIN SIMPLE GETTERS

  /**
   * Gets the GeoView Layer Ids / UUIDs.
   *
   * @returns The ids of the layers
   */
  getGeoviewLayerIds(): string[] {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayerIds();
  }

  /**
   * Gets the Layer Entry layer paths.
   *
   * @returns The GeoView Layer Paths
   */
  getLayerEntryLayerPaths(): string[] {
    // Retrieve from the domain
    return this.#layerDomain.getLayerEntryLayerPaths();
  }

  /**
   * Gets the Layer Entry Configs.
   *
   * @returns The GeoView Layer Entry Configs
   */
  getLayerEntryConfigs(): ConfigBaseClass[] {
    // Retrieve from the domain
    return this.#layerDomain.getLayerEntryConfigs();
  }

  /**
   * Retrieves the layer entry configuration for the given layer path.
   *
   * @param layerPath - The layer path to look up
   * @returns The ConfigBaseClass layer configuration.
   * @throws {LayerConfigNotFoundError} When the layer configuration couldn't be found at the given layer path.
   */
  getLayerEntryConfig(layerPath: string): ConfigBaseClass {
    // Retrieve from the domain
    return this.#layerDomain.getLayerEntryConfig(layerPath);
  }

  /**
   * Retrieves the layer entry configuration for the given layer path, if it exists.
   *
   * @param layerPath - The layer path to look up
   * @returns The ConfigBaseClass layer configuration, or undefined if not found
   */
  getLayerEntryConfigIfExists(layerPath: string): ConfigBaseClass | undefined {
    // Retrieve from the domain
    return this.#layerDomain.getLayerEntryConfigIfExists(layerPath);
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
    return this.#layerDomain.getLayerEntryConfigRegular(layerPath);
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
    return this.#layerDomain.getLayerEntryConfigGroup(layerPath);
  }

  /**
   * Gets the GeoView Layer Paths.
   *
   * @returns The layer paths of the GV Layers
   */
  getGeoviewLayerPaths(): string[] {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayerPaths();
  }

  /**
   * Gets all GeoView Layers
   *
   * @returns The list of new Geoview Layers
   */
  getGeoviewLayers(): AbstractBaseGVLayer[] {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayers();
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
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayersRegulars();
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
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayersGroups();
  }

  /**
   * Gets all GeoView layers that are at the root.
   *
   * @returns An array containing only the layers at the root level of the registry.
   */
  getGeoviewLayersRoot(): AbstractBaseGVLayer[] {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayersRoot();
  }

  /**
   * Retrieves the Geoview layer for the given layer path.
   *
   * @param layerPath - The layer path to look up
   * @returns The Geoview layer
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  getGeoviewLayer(layerPath: string): AbstractBaseGVLayer {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayer(layerPath);
  }

  /**
   * Retrieves the Geoview layer for the given layer path, if it exists.
   *
   * @param layerPath - The layer path to look up
   * @returns The AbstractBaseGVLayer or undefined when not found
   */
  getGeoviewLayerIfExists(layerPath: string): AbstractBaseGVLayer | undefined {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayerIfExists(layerPath);
  }

  /**
   * Returns the AbstractGVLayer instance associated to the layer path.
   *
   * This returns an actual AbstractGVLayer and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
   * An AbstractGVLayer is essentially a layer that's not a group layer.
   *
   * @param layerPath - The layer path
   * @returns The AbstractGVLayer Layer
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   */
  getGeoviewLayerRegular(layerPath: string): AbstractGVLayer {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayerRegular(layerPath);
  }

  /**
   * Returns the GeoView Layer instance associated to the layer path, if it exists.
   *
   * This returns an actual AbstractGVLayer (or undefined) and throws a LayerWrongTypeError if the layerPath points to a GVGroupLayer object.
   * An AbstractGVLayer is essentially a layer that's not a group layer.
   *
   * @param layerPath - The layer path
   * @returns The AbstractGVLayer or undefined when not found
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   */
  getGeoviewLayerRegularIfExists(layerPath: string): AbstractGVLayer | undefined {
    // Retrieve from the domain
    return this.#layerDomain.getGeoviewLayerRegularIfExists(layerPath);
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
    // Retrieve from the domain
    return this.#layerDomain.getOLLayerAsync(layerPath, timeout, checkFrequency);
  }

  // #endregion PUBLIC METHODS - DOMAIN SIMPLE GETTERS

  // #region PUBLIC METHODS

  /**
   * Gets the max extent of all layers on the map, or of a provided subset of layers.
   *
   * @param layerIds - Identifiers or layerPaths of layers to get max extents from.
   * @returns A promise that resolves with the overall extent or undefined when no bounds are found
   */
  getExtentOfMultipleLayers(layerIds: string[] = this.getLayerEntryLayerPaths()): Promise<Extent | undefined> {
    // Retrieve from the domain
    return this.#layerDomain.getExtentOfMultipleLayers(layerIds, this.getMapViewer().getProjection(), MapViewer.DEFAULT_STOPS);
  }

  /**
   * Gets the extent of a feature or group of features.
   *
   * @param layerPath - The layer path
   * @param objectIds - The IDs of features to get extents from
   * @param outfield - Optional ID field to return for services that require a value in outfields
   * @returns A promise that resolves with the extent of the features
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  getExtentFromFeatures(layerPath: string, objectIds: number[], outfield?: string): Promise<Extent> {
    // Get extent from features calling the GV Layer method
    return this.getGeoviewLayerRegular(layerPath).getExtentFromFeatures(objectIds, this.getMapViewer().getProjection(), outfield);
  }

  /**
   * Retrieves the service (metadata) projection code for a specific raster layer.
   *
   * @param layerPath - The fully qualified path of the layer.
   * @returns The projection code (e.g., "EPSG:4326") defined in the layer's service metadata,
   *          or `undefined` if:
   *          - the layer does not exist,
   *          - the layer is not a raster layer,
   *          - or the metadata projection is not available.
   * @description
   *
   * This method looks up the GeoView layer associated with the provided `layerPath`.
   * If the layer exists and is an instance of `AbstractGVRaster`, it retrieves the
   * projection defined in the service metadata via `getMetadataProjection()`.
   * The projection code is then returned using `projection.getCode()`.
   */
  getLayerMetatadaProjectionEPSG(layerPath: string): string | undefined {
    // Get the layer if it exists
    const geoviewLayer = this.getGeoviewLayerIfExists(layerPath);

    // If of the right type
    if (geoviewLayer instanceof AbstractGVRaster) {
      // Get the projection and return its code
      const projection = geoviewLayer.getMetadataProjection();
      return projection?.getCode();
    }

    // Layer not found or not a Raster layer or no metadata projection
    return undefined;
  }

  /**
   * Gets the raster function previews for the ESRI image layer.
   *
   * @param layerPath - The layer path.
   * @returns The raster function previews.
   */
  getLayerRasterFunctionPreviews(layerPath: string): Map<string, Promise<string>> {
    const geoviewLayer = this.getGeoviewLayerIfExists(layerPath);
    if (!geoviewLayer || !(geoviewLayer instanceof GVEsriImage)) return new Map<string, Promise<string>>();

    return geoviewLayer.getRasterFunctionPreviews();
  }

  /**
   * Checks if a layer has a text layer.
   *
   * @param layerPath - The layer path of the layer to check.
   * @returns True if the layer has a text layer, false otherwise.
   */
  getLayerHasText(layerPath: string): boolean {
    const layer = this.getGeoviewLayerRegularIfExists(layerPath);

    // Check if it's a vector layer with a text layer
    if (layer instanceof AbstractGVVector) {
      return layer.getTextOLLayer() !== undefined;
    }

    return false;
  }

  /**
   * Gets the text visibility state for a layer.
   *
   * @param layerPath - The layer path of the layer to check.
   * @returns True if text is visible, false otherwise. Returns undefined if layer has no text.
   */
  getLayerTextVisibility(layerPath: string): boolean | undefined {
    const layer = this.getGeoviewLayerRegularIfExists(layerPath);

    // Check if it's a vector layer with a text layer
    if (layer instanceof AbstractGVVector && layer.getTextOLLayer()) {
      return layer.getTextVisible();
    }

    return undefined;
  }

  /**
   * Sets the text visibility for a layer.
   *
   * @param layerPath - The layer path of the layer to change.
   * @param visible - True to show text, false to hide text.
   */
  setLayerTextVisibility(layerPath: string, visible: boolean): void {
    // Get the layer
    const layer = this.getGeoviewLayerRegular(layerPath);
    if (!layer) return;

    // If it's a vector layer, set text visibility
    if (layer instanceof AbstractGVVector) {
      layer.setTextVisible(visible);

      // Update the store
      setStoreLayerTextVisibility(this.getMapId(), layerPath, visible);
    }
  }

  /**
   * Sets the name of the layer indicated by the given layer path.
   *
   * @param layerPath - The layer path to set the queryable property
   * @param name - The value to set for the name property
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  setLayerName(layerPath: string, name: string): void {
    // Act on the domain
    this.getGeoviewLayer(layerPath).setLayerName(name);
  }

  /**
   * Sets opacity for a layer.
   *
   * @param layerPath - The path of the layer.
   * @param opacity - The new opacity to use.
   * @param emitOpacityChange - Whether to emit the event or not (false to avoid updating the legend layers)
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path
   */
  setLayerOpacity(layerPath: string, opacity: number, emitOpacityChange?: boolean): void {
    // Act on the domain
    this.getGeoviewLayer(layerPath).setOpacity(opacity, emitOpacityChange);
  }

  /**
   * Sets the queryable property of the layer indicated by the given layer path.
   *
   * @param layerPath - The layer path to set the queryable property
   * @param queryable - The value to set for the queryable property
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  setLayerQueryable(layerPath: string, queryable: boolean): void {
    // Act on the domain
    this.getGeoviewLayerRegular(layerPath).setQueryable(queryable);
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
    // Act on the domain
    this.getGeoviewLayerRegular(layerPath).setHoverable(hoverable);
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
    // Get the layer
    const layer = this.getGeoviewLayer(layerPath);

    // Check if it's the right type
    if (!(layer instanceof GVEsriImage)) throw new LayerWrongTypeError(layerPath, layer.getLayerName());

    // Update the raster function
    layer.setRasterFunction(rasterFunctionId);

    // Update the store
    //TODO: REFACTOR - The store update should happen through a store adaptor via a setRasterFunctionChanged event raised by the layer
    setStoreLayerRasterFunction(this.getMapId(), layerPath, rasterFunctionId);

    // Trigger legend re-query through the layer set system (forced refresh)
    this.getControllersRegistry().layerSetController.legendsLayerSet.queryLegend(layer, true);
  }

  /**
   * Sets the ascending flag on the mosaic rule for a layer.
   *
   * @param layerPath - The layer path
   * @param value - Whether the mosaic order is ascending
   */
  setLayerMosaicRuleAscending(layerPath: string, value: boolean): void {
    this.#setLayerMosaicRuleProperty(layerPath, { ascending: value });
  }

  /**
   * Sets the mosaic method on the mosaic rule for a layer.
   *
   * @param layerPath - The layer path
   * @param value - The mosaic method to set
   */
  setLayerMosaicRuleMethod(layerPath: string, value: TypeMosaicMethod): void {
    this.#setLayerMosaicRuleProperty(layerPath, { mosaicMethod: value });
  }

  /**
   * Sets the mosaic operation on the mosaic rule for a layer.
   *
   * @param layerPath - The layer path
   * @param value - The mosaic operation to set
   */
  setLayerMosaicRuleOperation(layerPath: string, value: TypeMosaicOperation): void {
    this.#setLayerMosaicRuleProperty(layerPath, { mosaicOperation: value });
  }

  /**
   * Sets the mosaic rule for an ESRI Image layer.
   *
   * @param layerPath - The layer path
   * @param mosaicRule - The mosaic rule to apply or undefined to remove it
   */
  setLayerMosaicRule(layerPath: string, mosaicRule: TypeMosaicRule | undefined): void {
    const layer = this.getGeoviewLayer(layerPath);
    if (!(layer instanceof GVEsriImage)) return;

    // Update the mosaic rule
    layer.setMosaicRule(mosaicRule);

    // Update the store
    //TODO: REFACTOR - The store update should happen through a store adaptor via a setMosaicRuleChanged event raised by the layer
    setStoreLayerMosaicRule(this.getMapId(), layerPath, mosaicRule);

    // Trigger legend re-query through the layer set system
    this.getControllersRegistry().layerSetController.legendsLayerSet.queryLegend(layer, true);
  }

  /**
   * Updates the visible-range settings (min/max zoom) of a GeoView layer and
   * stores whether the layer is currently within the visible range based on
   * the map's zoom level.
   *
   * Behavior:
   *  - Reads the layer's configuration to determine min/max zoom or min/max scale.
   *  - Converts scale-based limits into zoom levels when necessary.
   *  - Applies calculated `minZoom` and `maxZoom` to non-group layers only.
   *    (Group layers are skipped because their children already inherit the
   *     correct configuration and visibility is handled elsewhere.)
   *  - Computes whether the layer is currently in visible range and updates
   *    the store via `mapController`.
   *
   * @param gvLayer - The layer whose visibility
   *   range should be recalculated and stored.
   */
  setLayerInVisibleRange(gvLayer: AbstractBaseGVLayer): void {
    // Get the layer config
    const layerConfig = gvLayer.getLayerConfig();

    // Set the final maxZoom and minZoom values
    // Skip the GVGroupLayers since we don't want to prevent the children from loading if they aren't initially
    // in visible range. Inheritance has already been passed in the config and the group layer visibility will
    // be handled in the map-viewer's handleMapZoomEnd by checking the children visibility
    if ((layerConfig.getInitialSettings()?.maxZoom || layerConfig.getMaxScale()) && !(gvLayer instanceof GVGroupLayer)) {
      // Calculate the map zoom for the corresponding max scale
      const scaleZoomLevel = this.getMapViewer().getMapZoomFromScale(layerConfig.getMaxScale()) ?? Infinity;

      const maxZoom = Math.min(layerConfig.getInitialSettings()?.maxZoom ?? Infinity, scaleZoomLevel);
      gvLayer.setMaxZoom(maxZoom);
    }

    if ((layerConfig.getInitialSettings()?.minZoom || layerConfig.getMinScale()) && !(gvLayer instanceof GVGroupLayer)) {
      // Calculate the map zoom for the corresponding min scale
      const scaleZoomLevel = this.getMapViewer().getMapZoomFromScale(layerConfig.getMinScale()) ?? -Infinity;

      const minZoom = Math.max(layerConfig.getInitialSettings()?.minZoom ?? -Infinity, scaleZoomLevel);
      gvLayer.setMinZoom(minZoom);
    }

    const zoom = this.getMapViewer().getView().getZoom()!;
    const inVisibleRange = gvLayer.inVisibleRange(zoom);

    // Apply accross all layers
    this.getControllersRegistry().mapController.setLayerInVisibleRange(gvLayer.getLayerPath(), inVisibleRange);
  }

  /**
   * Checks if the layer results sets are all greater than or equal to the provided status
   *
   * @returns Indicates if all layers passed the callback and how many have passed the callback
   */
  checkLayerStatus(status: TypeLayerStatus, callbackNotGood?: (layerConfig: ConfigBaseClass) => void): [boolean, number] {
    // Redirect to domain
    return this.#layerDomain.checkLayerStatus(status, callbackNotGood);
  }

  /**
   * Manually checks if all layers are loaded or error and update the store when so.
   *
   * @returns True if all layers are loaded
   */
  checkIfAllLayersLoadedAndUpdateStore(): boolean {
    // Get if all layers are loaded or error
    const [allLoadedOrError] = this.checkLayerStatus('loaded');

    // If all loaded/error
    if (allLoadedOrError) {
      // Update the store that all layers are loaded at this point
      setStoreLayersAreLoading(this.getMapId(), false);
    }

    // Return result
    return allLoadedOrError;
  }

  /**
   * Loops through all geoview layers and refresh their respective source.
   * Use this function on projection change or other viewer modification who may affect rendering.
   */
  refreshLayers(): void {
    // For each geoview layer
    this.getGeoviewLayers().forEach((geoviewLayer) => {
      // Call the layer refresh function
      geoviewLayer.refresh(this.getMapViewer().getProjection());
    });
  }

  /**
   * Refreshes a layer and resets its states to their original configuration.
   *
   * This method performs the following steps:
   * 1. Retrieves the layer using the MapViewerLayer API.
   * 2. Calls the layer's `refresh` method to reload or redraw its data.
   * 3. Resets the layer's opacity and visibility to the values defined in its
   *    initial settings (defaulting to 1 for opacity and true for visibility).
   * 4. Updates all legend items' visibility if the layer is set to visible.
   *
   * @param layerPath - The layer path to refresh
   * @returns A promise that resolves once the layer has been refreshed,
   * its states reset, and its items rendered if visible
   * @throws {LayerNotFoundError} When the layer could not be found at the specified layer path.
   */
  resetLayer(layerPath: string): Promise<void> {
    // Get the layer through layer API
    const layer = this.getGeoviewLayer(layerPath);

    // Refresh the layer
    layer.refresh(this.getMapViewer().getProjection());

    // Get the layer config
    const layerConfig = layer.getLayerConfig();

    // Reset layer states to original values
    const opacity = layerConfig.getInitialSettings()?.states?.opacity ?? 1; // default: 1
    const visibility = layerConfig.getInitialSettings()?.states?.visible ?? true; // default: true
    this.setLayerOpacity(layerPath, opacity);
    this.getControllersRegistry().mapController.setOrToggleMapLayerVisibility(layerPath, visibility);

    if (visibility) {
      // Return the promise that all items visibility will be renderered if layer is set to visible
      return this.setAllItemsVisibility(layerPath, visibility, true);
    }

    // Resolve right away
    return Promise.resolve();
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
    if (refresh) this.getControllersRegistry().mapController.applyLayerFilters(layerPath);

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
   * Toggles the visibility of a legend item on a specific layer.
   *
   * Inverts the current visibility of the given item and updates the corresponding layer.
   * Delegates to the layer API and can optionally wait for the layer to finish rendering.
   *
   * @param layerPath - The layer path
   * @param item - The legend item whose visibility will be toggled
   * @param waitForRender - If true, the returned promise resolves only after the layer has completed its next render cycle
   * @returns A promise that resolves once the visibility change has been applied
   */
  toggleItemVisibility(layerPath: string, item: TypeLegendItem, waitForRender: boolean): Promise<void> {
    // Redirect to layer API
    return this.setItemVisibility(layerPath, item, !item.isVisible, true, waitForRender);
  }

  /**
   * Toggles the visibility of a legend item without waiting for the render to complete.
   *
   * @param layerPath - The layer path
   * @param item - The legend item whose visibility will be toggled
   */
  toggleItemVisibilityAndForget(layerPath: string, item: TypeLegendItem): void {
    // Redirect
    this.toggleItemVisibility(layerPath, item, false).catch((error: unknown) => {
      // Log promise failed
      logger.logPromiseFailed('in LayerController.toggleItemVisibilityAndForget', error);
    });
  }

  /**
   * Sets the visibility of all legend items in a specific layer and optionally waits for rendering.
   *
   * This method performs the following steps:
   * 1. Ensures the layer itself is visible on the map.
   * 2. Updates the visibility of each item in the legend layer store and on the map.
   * 3. Triggers a re-render of the layer.
   * 4. Optionally waits for the next render cycle to complete before resolving.
   *
   * @param layerPath - The layer path
   * @param visibility - Whether all items in the layer should be visible
   * @param waitForRender - If true, the returned promise resolves only after the layer has completed its next render cycle
   * @returns A promise that resolves once all item visibilities have been updated and the layer has rendered if requested
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer was of wrong type.
   */
  async setAllItemsVisibility(layerPath: string, visibility: boolean, waitForRender: boolean): Promise<void> {
    // Set layer to visible
    this.getControllersRegistry().mapController.setOrToggleMapLayerVisibility(layerPath, true);

    // Get legend layers and legend layer to update
    // GV This object is about to get mutated multiple times, that's why we can use it to set legend layers later... (pattern should be changed..)
    const curLayers = getStoreLayerStateLegendLayers(this.getMapId());

    // Get the particular object holding the items array itself from the store
    const layerStore = getStoreLayerStateLegendLayerByPath(this.getMapId(), layerPath);

    // Set item visibility on map and in legend layer item for each item in layer
    if (layerStore) {
      // For each
      const promisesVisibility: Promise<void>[] = [];
      layerStore.items.forEach((item) => {
        // Set the item visibility and send refresh to false to not refresh right away for performance
        const promiseVis = this.setItemVisibility(layerPath, item, visibility, false, false);

        // eslint-disable-next-line no-param-reassign
        item.isVisible = visibility;

        // Add the promise
        promisesVisibility.push(promiseVis);
      });

      // Wait for all promises (should be instant in our case)
      await Promise.all(promisesVisibility);

      // Shadow-copy this specific array so that the hooks are triggered for this items array and this one only
      layerStore.items = [...layerStore.items];
    }

    // Now that it's done, apply the layer visibility
    this.getControllersRegistry().mapController.applyLayerFilters(layerPath);

    // Set updated legend layers
    setStoreLegendLayersDirectly(this.getMapId(), curLayers);

    // If must wait for the renderer
    if (waitForRender) {
      // Get the layer
      const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);
      await layer.waitForRender();
    }
  }

  /**
   * Sets the visibility of all legend items without waiting for the render to complete.
   *
   * @param layerPath - The layer path
   * @param visibility - Whether all items should be visible
   */
  setAllItemsVisibilityAndForget(layerPath: string, visibility: boolean): void {
    // Redirect
    this.setAllItemsVisibility(layerPath, visibility, false).catch((error: unknown) => {
      // Log promise failed
      logger.logPromiseFailed('in LayerController.setAllItemsVisibilityAndForget', error);
    });
  }

  /**
   * Sets the highlighted layer state.
   *
   * Toggles or changes the highlighted layer. Only one layer can be highlighted at a time.
   *
   * @param layerPath - The layer path to set as the highlighted layer
   */
  setHighlightLayer(layerPath: string): void {
    // Get highlighted layer to set active button state because there can only be one highlighted layer at a time.
    const currentHighlight = getStoreLayerStateHighlightedLayer(this.getMapId());

    // Highlight layer and get new highlighted layer path from map event processor.
    const highlightedLayerpath = this.getControllersRegistry().mapController.changeOrRemoveLayerHighlight(layerPath, currentHighlight);

    // Save to the store
    setStoreHighlightedLayer(this.getMapId(), highlightedLayerpath);
  }

  /**
   * Highlights layer or sublayer on map
   *
   * @param layerPath - Identifier of layer to highlight
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  highlightLayer(layerPath: string): void {
    // Clear previous highlights if any
    this.removeHighlightLayer();

    // Find the layer
    const layer = this.getGeoviewLayer(layerPath);

    // Keep the highlighted layer with its original opacity
    this.#highlightedLayerPath = layerPath;

    // Build a list of layers to exclude from the opacity adjustments
    const excludingLayers = [layer];

    // If the layer we're highlighting is a group, we have to exclude all its children from upcoming opacity adjustments
    if (layer instanceof GVGroupLayer) {
      excludingLayers.push(...layer.getLayersAllLeafs());
    }

    // Get all other regular gv layers on the map excluding the one we highlight and its children
    this.getGeoviewLayersRegulars()
      .filter((otherLayer) => !excludingLayers.includes(otherLayer))
      .forEach((otherLayer) => {
        // Reduce the opacity on the other layer using the ratio.
        otherLayer.setOpacity(otherLayer.getOpacity() / LayerController.HIGHLIGHT_OPACITY_RATIO);
      });
  }

  /**
   * Removes layer and feature highlights for a given layer.
   *
   * @param layerPath - The path of the layer to remove highlights from.
   */
  removeLayerHighlights(layerPath: string): void {
    // Remove layer highlight if layer being removed or its child is highlighted
    if (this.#highlightedLayerPath === layerPath) this.removeHighlightLayer();

    // Reset the result set for the layer and any children
    this.getLayerEntryLayerPaths().forEach((registeredLayerPath) => {
      if (registeredLayerPath.startsWith(`${layerPath}/`) || registeredLayerPath === layerPath) {
        // Remove feature highlight and result set for features from this layer
        this.getControllersRegistry().layerSetController.resetResultSet(registeredLayerPath);
      }
    });
  }

  /**
   * Removes layer or sublayer highlight
   */
  removeHighlightLayer(): void {
    // Call map controller
    this.getControllersRegistry().mapController.removeBBoxHighlight();

    // Get the highlighted layer information
    const layer = this.getGeoviewLayerIfExists(this.#highlightedLayerPath);

    // If no current highlight, skip
    if (!layer) return;

    // Build a list of layers to exclude from the opacity adjustments
    const excludingLayers = [layer];

    // If the layer we're removing the highlight is a group, we have to exclude all its children from upcoming opacity adjustments
    if (layer instanceof GVGroupLayer) {
      excludingLayers.push(...layer.getLayersAllLeafs());
    }

    // Get all other regular gv layers on the map excluding the one we highlight and its children
    this.getGeoviewLayersRegulars()
      .filter((otherLayer) => !excludingLayers.includes(otherLayer))
      .forEach((otherLayer) => {
        // Resets the opacity on the other layer using the ratio.
        otherLayer.setOpacity(otherLayer.getOpacity() * LayerController.HIGHLIGHT_OPACITY_RATIO);
      });

    // Clear the highlighted layer information
    this.#highlightedLayerPath = '';
  }

  /**
   * Clears any overridden CRS settings on all WMS layers in the map.
   *
   * Iterates through all GeoView layers, identifies those that are instances of `GVWMS`,
   * and resets their override CRS to `undefined`, allowing them to use the default projection behavior.
   */
  clearWMSLayersWithOverrideCRS(): void {
    // Get all WMS layers
    const wmsLayers = this.getGeoviewLayers().filter((layer) => layer instanceof GVWMS);
    wmsLayers.forEach((gvLayer) => gvLayer.setOverrideCRS(undefined));
  }

  /**
   * Sets the date temporal mode for the specific layer.
   *
   * This updates the layer-level configuration used to control how date values
   * are interpreted.
   * The value is stored in the application state via the LayerController.
   *
   * @param layerPath - The unique path identifying the layer.
   * @param temporalMode - The date format to apply
   * for displaying date values associated with this layer.
   */
  setLayerDateTemporalMode(layerPath: string, temporalMode: TemporalMode): void {
    // Redirect
    setStoreLayerDateTemporal(this.getMapId(), layerPath, temporalMode);
  }

  /**
   * Sets the date display format for a specific layer.
   *
   * This updates the layer-level configuration used to control how date values
   * are formatted when displayed (e.g., in legends, tooltips, or UI components).
   * The value is stored in the application state via the LayerController.
   *
   * @param layerPath - The unique path identifying the layer.
   * @param displayDateFormat - The date format to apply for displaying date values associated with this layer.
   */
  setLayerDisplayDateFormat(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void {
    // Make sure of the input format
    let displayDateFormatToSet: TypeDisplayDateFormat = displayDateFormat as TypeDisplayDateFormat;
    if (typeof displayDateFormat === 'string') displayDateFormatToSet = { en: displayDateFormat, fr: displayDateFormat };

    // Save to the store
    setStoreLayerDisplayDateFormat(this.getMapId(), layerPath, displayDateFormatToSet);
  }

  /**
   * Sets the date display format (short) for a specific layer.
   *
   * Short means the date should be displayed in a more compact format.
   * This updates the layer-level configuration used to control how date values
   * are formatted when displayed (e.g., in legends, tooltips, or UI components).
   * The value is stored in the application state via the LayerController.
   *
   * @param layerPath - The unique path identifying the layer.
   * @param displayDateFormat - The date format to apply
   * for displaying date values associated with this layer.
   */
  setLayerDisplayDateFormatShort(layerPath: string, displayDateFormat: TypeDisplayDateFormat | string): void {
    // Make sure of the input format
    let displayDateFormatToSet: TypeDisplayDateFormat = displayDateFormat as TypeDisplayDateFormat;
    if (typeof displayDateFormat === 'string') displayDateFormatToSet = { en: displayDateFormat, fr: displayDateFormat };

    // Save to the store
    setStoreLayerDisplayDateFormatShort(this.getMapId(), layerPath, displayDateFormatToSet);
  }

  /**
   * Sets the WMS style for a WMS layer.
   *
   * @param layerPath - The layer path
   * @param wmsStyle - The WMS style to apply, if any
   */
  setLayerWmsStyle(layerPath: string, wmsStyleName: string | undefined): void {
    if (!wmsStyleName) return; // Skip if no style name to apply

    const layer = this.getGeoviewLayer(layerPath);
    if (!(layer instanceof GVWMS)) return;

    // Update the WMS style
    layer.setWmsStyle(wmsStyleName);

    // Update the store
    //TODO: REFACTOR - The store update should happen through a store adaptor via a setWmsStyleChanged event raised by the layer
    setStoreLayerWmsStyle(this.getMapId(), layerPath, wmsStyleName);

    // Trigger legend re-query through the layer set system
    this.getControllersRegistry().layerSetController.legendsLayerSet.queryLegend(layer, true);
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
  async setGeojsonSource(layerPath: string, geojson: GeoJSONObject | string): Promise<void> {
    // Get the GeoviewLayer
    const gvLayer = this.getGeoviewLayerRegular(layerPath);

    // If not of right type
    if (!(gvLayer instanceof GVGeoJSON)) throw new LayerNotGeoJsonError(layerPath, gvLayer.getLayerName());

    // Override the GeoJson source
    await gvLayer.setGeojsonSource(geojson, this.getMapViewer().getProjection());

    // Reset the feature info result set
    this.getControllersRegistry().layerSetController.resetResultSet(layerPath);

    // Update feature info
    this.getControllersRegistry()
      .layerSetController.triggerGetAllFeatureInfo(layerPath)
      .catch((error: unknown) => {
        // Log
        logger.logPromiseFailed(`Update all feature info in setGeojsonSource failed for layer ${layerPath}`, error);
      });
  }

  /**
   * Queries the EsriDynamic layer at the given layer path for a specific set of object IDs.
   *
   * @param layerPath - The layer path of the layer to query
   * @param objectIDs - The object IDs to filter the query on
   * @returns A promise that resolves with an array of feature info entry records
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   * @throws {LayerWrongTypeError} When the layer is of wrong type at the given layer path.
   * @throws {LayerNotEsriDynamicError} When the layer configuration isn't EsriDynamic.
   */
  queryLayerEsriDynamic(layerPath: string, objectIDs: number[]): Promise<TypeFeatureInfoEntryPartial[]> {
    // Get the layer
    const layer = this.getGeoviewLayerRegular(layerPath);

    // If not EsriDynamic
    if (!(layer instanceof GVEsriDynamic)) throw new LayerNotEsriDynamicError(layerPath, layer.getLayerName());

    // Perform the query
    return layer.getRecordsByOIDs(objectIDs, this.getMapViewer().getProjectionNumber());
  }

  /**
   * Starts the delayed deletion process for a layer, allowing a short
   * time window for the user to undo the operation.
   *
   * During this period:
   * - The layer is temporarily hidden.
   * - A deletion start timestamp is stored so the UI can derive progress locally.
   * - The user may abort the deletion via {@link deleteLayerAbort}.
   *
   * If the undo window expires, the layer is permanently deleted.
   * If called again for the same layer while a previous timer is running,
   * the previous timer is cancelled and a new one starts, preserving the
   * original visibility state from the first call.
   *
   * @param layerPath - Unique path identifying the layer within the map.
   * @param undoWindowDuration - Duration in milliseconds of the undo window before deletion is finalized.
   * @returns A promise resolving to:
   * - `true` if the deletion completed successfully.
   * - `false` if the deletion was aborted, superseded by a newer call, or
   *   if the layer was already in the deletion process.
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  async deleteLayerStartTimer(layerPath: string, undoWindowDuration: number): Promise<boolean> {
    // If there was already a job going, cancel it but keep the reference so we can preserve its original visibility
    const existingJob = this.#getLayerBeingDeleted(layerPath);
    if (existingJob) {
      // Cancel
      existingJob.delayedJob.cancel();
    }

    // Get the layer if it exists, it's possible it doesn't exist if the layer failed to process
    const gvLayer = this.getGeoviewLayerIfExists(layerPath);

    // Note the original visibility state of the layer before starting the deletion process.
    // If there was already a pending deletion, preserve its original visibility since the layer is already hidden.
    const originalVisibility = existingJob?.originalVisibility ?? gvLayer?.getVisible() ?? false;

    // Hide layer immediately
    gvLayer?.setVisible(false);
    this.getControllersRegistry().layerController.removeLayerHighlights(layerPath);

    // Set start deletion time in the store
    setStoreLayerDeletionStartTime(this.getMapId(), layerPath, Date.now());

    // Start delayed job
    const delayedJob = doTimeout(undoWindowDuration);

    // Register job (replaces any previous entry for this layerPath)
    this.#addLayerBeingDeleted(layerPath, {
      delayedJob,
      originalVisibility,
    });

    // Wait for the job to perform operation or be cancelled
    const result = await delayedJob.promise;

    // Check if our job is still the current one. A subsequent call to deleteLayerStartTimer
    // may have replaced it while we were awaiting — in that case, let the newer call own the lifecycle.
    const currentJob = this.#getLayerBeingDeleted(layerPath);
    if (currentJob?.delayedJob !== delayedJob) {
      return false;
    }

    // Our job is still current — remove it from the stack
    this.#removeLayerBeingDeleted(layerPath);

    if (result === 'timeout') {
      // Perform deletion
      this.deleteLayer(layerPath);
      return true;
    }

    // Undo deletion — restore original visibility
    gvLayer?.setVisible(originalVisibility);

    // Negative
    return false;
  }

  /**
   * Aborts an ongoing layer deletion process if it has not yet been finalized.
   *
   * This restores the layer to its previous visibility state and stops
   * the deletion timer.
   *
   * @param layerPath - Unique path identifying the layer within the map.
   */
  deleteLayerAbort(layerPath: string): void {
    // Get the job about layer deletion
    const job = this.#getLayerBeingDeleted(layerPath);

    // Cancel the delayed job
    job?.delayedJob.cancel();
  }

  /**
   * Immediately deletes a layer from the map.
   *
   * @param layerPath - Unique path identifying the layer within the map.
   */
  deleteLayer(layerPath: string): void {
    // Delete layer through layer API
    // TODO: REFACTOR IMPORTANT - We shouldn't go back to the layer api here.. FIX THIS LATER..
    this.getMapViewer().layer.removeLayerUsingPath(layerPath);
  }

  /**
   * Reloads a layer on the map.
   *
   * @param layerPath - The layer path of the layer to reload
   */
  reloadLayer(layerPath: string): void {
    // Delete layer through layer API
    // TODO: REFACTOR IMPORTANT - We shouldn't go back to the layer api here.. FIX THIS LATER..
    this.getMapViewer().layer.reloadLayer(layerPath);
  }

  // #endregion PUBLIC METHODS

  // #region DOMAIN HANDLERS
  // GV Eventually, these should be moved to a store adaptor or similar construct that directly connects the domain to the store without going through the controller
  // GV.CONT but for now this allows us to keep domain-store interactions in one place and call application-level processes as needed during migration.

  /**
   * Handles when a layer entry config is registered in the domain.
   *
   * Registers the layer for ordered layer info, notifies all layer sets,
   * and sets the layer status to registered.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the registered layer config
   */
  #handleLayerEntryConfigRegistered(sender: LayerDomain, event: DomainLayerStatusChangedEvent): void {
    // Register for ordered layer information
    if (event.config.getGeoviewLayerConfig().useAsBasemap !== true) this.#registerForOrderedLayerInfo(event.config as TypeLayerEntryConfig);

    // Tell the layer sets about it
    this.getControllersRegistry().layerSetController.allLayerSets.forEach((layerSet) => {
      // Register the config to the layer set
      layerSet.registerLayerConfig(event.config);
    });

    // Set the layer status to registered
    event.config.setLayerStatusRegistered();
  }

  /**
   * Handles when a layer entry config is unregistered from the domain.
   *
   * Notifies all layer sets to unregister the layer.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the unregistered layer config
   */
  #handleLayerEntryConfigUnregistered(sender: LayerDomain, event: DomainLayerStatusChangedEvent): void {
    // GV Could be moved to layer-set-controller, but keeping it here for now to be next to the layer entry config registered event hook

    // Tell the layer sets about it
    this.getControllersRegistry().layerSetController.allLayerSets.forEach((layerSet) => {
      // Unregister from the layer set
      layerSet.unregister(event.config.layerPath);
    });
  }

  /**
   * Handles when a layer registered in the domain.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the registered layer
   */
  #handleLayerRegistered(sender: LayerDomain, event: DomainLayerRegisteredEvent): void {
    // Calculate the bounds upon creation
    setStoreLayerBoundsForLayerAndParentsAndForget(
      this.getMapId(),
      event.layer,
      this.getMapViewer().getProjection(),
      MapViewer.DEFAULT_STOPS
    );
  }

  /**
   * Handles when a layer unregistered from the domain.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the unregistered layer
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this, @typescript-eslint/no-unused-vars
  #handleLayerUnregistered(sender: LayerDomain, event: DomainLayerRegisteredEvent): void {
    //
    // Do something here....
    //
  }

  /**
   * Handles when a layer name is changed in the domain.
   *
   * @param layer - The layer that's become changed.
   * @param event - The event containing the name change.
   */
  #handleLayerNameChanged(sender: LayerDomain, event: DomainLayerNameChangedEvent): void {
    setStoreLayerName(this.getMapId(), event.layer.getLayerPath(), event.name);
  }

  /**
   * Handles when a layer opacity is changed on the map.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the opacity change.
   */
  #handleLayerVisibleChanged(sender: LayerDomain, event: DomainLayerVisibleChangedEvent): void {
    // Redirect to the map controller
    this.getControllersRegistry().mapController.setMapLayerVisibility(event.layer.getLayerPath(), event.visible);
  }

  /**
   * Handles when a layer opacity is changed on the map.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the opacity change.
   */
  #handleLayerOpacityChanged(sender: LayerDomain, event: DomainLayerOpacityChangedEvent): void {
    // Update the store
    setStoreOpacity(this.getMapId(), event.layer.getLayerPath(), event.opacity);
  }

  /**
   * Handles when a layer loading state is changed on the map.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the loading state change.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleLayerLoadingChanged(sender: LayerDomain, event: DomainLayerEvent): void {
    // Update the store that at least 1 layer is loading
    setStoreLayersAreLoading(this.getMapId(), true);
  }

  /**
   * Handles when a layer first loaded state is changed on the map.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the first loaded state change.
   */
  #handleLayerFirstLoadedChanged(sender: LayerDomain, event: DomainLayerEvent): void {
    // Set in visible range property for all newly added layers
    this.setLayerInVisibleRange(event.layer);

    // If the layer is regular layer
    if (event.layer instanceof AbstractGVLayer) {
      // Register the layer in the time-slider if it must
      this.#registerForTimeSlider(event.layer);
    }
  }

  /**
   * Handles when a layer loaded state is changed on the map.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the loaded state change.
   */
  #handleLayerLoadedChanged(sender: LayerDomain, event: DomainLayerEvent): void {
    // If a vector layer has been loaded
    if (event.layer instanceof AbstractGVVector) {
      // Calculate the bounds as those depend on the actual features in the layer
      setStoreLayerBoundsForLayerAndParentsAndForget(
        this.getMapId(),
        event.layer,
        this.getMapViewer().getProjection(),
        MapViewer.DEFAULT_STOPS
      );
    }
  }

  /**
   * Handles when all layers are loaded/error state on the map.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the loaded state change.
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleLayerAllLoaded(sender: LayerDomain, event: DomainLayerStatusChangedEvent): void {
    // Update the store that all layers are loaded at this point
    setStoreLayersAreLoading(this.getMapId(), false);
  }

  /**
   * Handles when a layer's hoverable state changes in the domain.
   *
   * Propagates the change to the store and clears feature info results
   * when hoverable is turned off.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the layer and new hoverable state
   */
  #handleLayerHoverableChanged(sender: LayerDomain, event: DomainLayerHoverableChangedEvent): void {
    // Save in store
    // TODO: CHECK - Why 2 store locations to store the hoverable state? Centralize?
    setStoreMapLayerHoverable(this.getMapId(), event.layer.getLayerPath(), event.hoverable);

    // Save in store
    setStoreLayerHoverable(this.getMapId(), event.layer.getLayerPath(), event.hoverable);

    // If not hoverable
    if (!event.hoverable) {
      // Clear the results when turning the hoverable to false
      this.getControllersRegistry().layerSetController.hoverFeatureInfoLayerSet.clearResults(event.layer.getLayerPath());
    }
  }

  /**
   * Handles when a layer's queryable state changes in the domain.
   *
   * Propagates the change to the store and clears feature info results
   * when queryable is turned off.
   *
   * @param sender - The layer domain that fired the event
   * @param event - The event containing the layer and new queryable state
   */
  #handleLayerQueryableChanged(sender: LayerDomain, event: DomainLayerQueryableChangedEvent): void {
    // Save in store
    setStoreLayerQueryable(this.getMapId(), event.layer.getLayerPath(), event.queryable);

    // Save in store
    // TODO: CHECK - Why 2 store locations to store the queryable state? Centralize?
    setStoreMapLayerQueryable(this.getMapId(), event.layer.getLayerPath(), event.queryable);

    // If not queryable
    if (!event.queryable) {
      // Clear the results from the layer set when turning the queryable to false
      this.getControllersRegistry().layerSetController.clearFeatureInfoLayerResults(event.layer.getLayerPath());
    }
  }

  /**
   * Handles the event triggered when a layer is added to a `GVGroupLayer`.
   *
   * When a layer is added to a group, this handler checks whether the added
   * layer is a concrete `AbstractGVLayer` (i.e., not another group wrapper type).
   * If so, it waits for the layer's source to become ready before recalculating
   * and propagating its bounds to the store. This ensures bounds are computed
   * only after the layer has sufficient metadata (e.g., extent) available.
   * Bounds propagation may also affect the parent group hierarchy.
   *
   * @param sender - The group layer receiving the new child layer.
   * @param event - The event payload containing information about the layer addition.
   */
  #handleLayerGroupLayerAdded(sender: LayerDomain, event: DomainLayerGroupLayerEvent): void {
    // Calculate the bounds on the group layer which had a layer added
    setStoreLayerBoundsForLayerAndParentsAndForget(
      this.getMapId(),
      event.groupLayer,
      this.getMapViewer().getProjection(),
      MapViewer.DEFAULT_STOPS
    );

    // Get the initial settings opacity of the group layer
    const initialSettingsOpacity = event.groupLayer.getLayerConfig().getInitialSettings()?.states?.opacity;

    // If any
    if (initialSettingsOpacity !== undefined) {
      // Update the store
      setStoreOpacity(this.getMapId(), event.groupLayer.getLayerPath(), initialSettingsOpacity);
    }
  }

  /**
   * Handles the event triggered when a layer is removed from a `GVGroupLayer`.
   *
   * When a child layer is removed from a group, this handler recalculates the
   * bounds of the group layer to reflect the updated set of children. The
   * recalculated bounds are then stored and may propagate upward in the
   * layer hierarchy.
   *
   * @param sender - The group layer from which the child layer was removed.
   * @param event - The event payload containing information about the layer removal.
   */
  #handleLayerGroupLayerRemoved(sender: LayerDomain, event: DomainLayerGroupLayerEvent): void {
    // Calculate the bounds on the group layer which had a layer removed
    setStoreLayerBoundsForLayerAndParentsAndForget(
      this.getMapId(),
      event.groupLayer,
      this.getMapViewer().getProjection(),
      MapViewer.DEFAULT_STOPS
    );
  }

  /**
   * Handles when a WMS layer failed to render an image on the map and we're trying to rescue it on-the-fly before officializing the error.
   *
   * This callback is useful when a WMS doesn't officially support the map projection, but we still want to attempt to pull an image and put it on the map.
   *
   * @param sender - The WMS layer which is attempting to render its image on the map.
   * @param event - The error event which happened when the image tried to be rendered.
   * @returns True if the rescue was attempted, false if we let it fail
   */
  #handleLayerWMSImageLoadRescue(sender: LayerDomain, event: DomainLayerWMSImageLoadRescueEvent): boolean {
    // Get the supported CRS projections
    const supportedCRSs = event.layer.getLayerConfig().getSupportedCRSs();

    // Get the map projection
    const mapProj = this.getMapViewer().getProjection().getCode();

    // If the map projection isn't supported by the WMS, that might be the issue
    if (!supportedCRSs.includes(mapProj)) {
      // Log warning
      logger.logWarning(`The map projection '${mapProj}' is not officially supported by the layer '${event.layer.getLayerPath()}'...`);

      // If we're not already overriding the CRS
      if (!event.layer.getOverrideCRS()) {
        // Get prioritized lists of projections to retry with (we want to attempt with higher priority projections)
        const highlyPrioritizedProjections = VALID_PROJECTION_CODES.map((projCode) => 'EPSG:' + projCode);
        const moderatePrioritizedProjections = Object.values(Projection.PROJECTION_NAMES);

        // Attempt to find a suitable CRS
        let selectedCRS: string | undefined;

        // 1. Look in high priority list
        selectedCRS = highlyPrioritizedProjections.find((crs) => supportedCRSs.includes(crs));

        // 2. If not found, look in moderate priority list
        if (!selectedCRS) {
          selectedCRS = moderatePrioritizedProjections.find((crs) => supportedCRSs.includes(crs));
        }

        // 3. If still not found, just take the first supported CRS (fallback)
        if (!selectedCRS && supportedCRSs.length > 0) {
          selectedCRS = supportedCRSs[0];
        }

        // 4. If we found one, override
        if (selectedCRS) {
          // Override the CRS in the layer
          event.layer.setOverrideCRS({
            layerProjection: selectedCRS,
            mapProjection: mapProj,
          });

          // Notify the user
          this.getMapViewer().notifications.showWarning('warning.layer.layerCRSNotSupported', [mapProj, event.layer.getLayerName()], true);

          // Force a refresh so the layer gets drawn with the overridden CRS
          event.layer.refresh(this.getMapViewer().getProjection());

          // Rescued
          return true;
        }
      }
    }

    // Nothing to tweak, couldn't rescue the error, let it fail
    return false;
  }

  // #endregion DOMAIN HANDLERS

  // #region PRIVATE METHODS

  /**
   * Registers layer information for the ordered layer info in the store.
   *
   * @param layerConfig - The layer configuration to be reordered.
   */
  #registerForOrderedLayerInfo(layerConfig: ConfigBaseClass): void {
    // If the map index for the given layer path hasn't been set yet
    if (getStoreMapOrderedLayerIndexByPath(this.getMapId(), layerConfig.layerPath) === -1) {
      // Get the parent layer path
      const parentLayerPathArray = layerConfig.layerPath.split('/');
      parentLayerPathArray.pop();
      const parentLayerPath = parentLayerPathArray.join('/');

      // Get the parent layer config, if any
      const parentLayerConfig = layerConfig.getParentLayerConfig();

      // If the map index of a parent layer path has been set and it is a valid UUID, the ordered layer info is a place holder
      // registered while the geocore layer info was fetched
      if (getStoreMapOrderedLayerIndexByPath(this.getMapId(), parentLayerPath) !== -1 && isValidUUID(parentLayerPath)) {
        // Replace the placeholder ordered layer info
        this.getControllersRegistry().mapController.replaceOrderedLayerInfo(layerConfig, parentLayerPath);
      } else if (parentLayerConfig) {
        // Here the map index of a sub layer path hasn't been set and there's a parent layer config for the current layer config
        // Get the map index of the parent layer path
        const parentLayerIndex = getStoreMapOrderedLayerIndexByPath(this.getMapId(), parentLayerPath);

        // Get the number of layers
        const numberOfLayers = utilFindMapLayerAndChildrenFromOrderedInfo(
          parentLayerPath,
          getStoreMapOrderedLayerInfo(this.getMapId())
        ).length;

        // If the map index of the parent has been set
        if (parentLayerIndex !== -1) {
          // Add the ordered layer information for the sub layer path based on the parent index + the number of child layers
          this.getControllersRegistry().mapController.addOrderedLayerInfoByConfig(
            layerConfig as TypeLayerEntryConfig,
            parentLayerIndex + numberOfLayers
          );
        } else {
          // If we get here, something went wrong and we have a sub layer being registered before the parent
          logger.logError(`Sub layer ${layerConfig.layerPath} registered in layer order before parent layer`);
          this.getControllersRegistry().mapController.addOrderedLayerInfoByConfig(parentLayerConfig);
        }
      } else {
        // Add the orderedLayerInfo for layer that hasn't been set and has no parent layer or geocore placeholder
        this.getControllersRegistry().mapController.addOrderedLayerInfoByConfig(layerConfig as TypeLayerEntryConfig);
      }
    }
  }

  /**
   * Registers layer information for TimeSlider.
   *
   * @param layer - The layer to be registered.
   */
  #registerForTimeSlider(layer: AbstractGVLayer): void {
    // TODO: CHECK - Think about delegating this code to the time slider controller itself?
    try {
      // Get time slider config if present in map config
      const timeSliderConfigs = getStoreMapConfigCorePackagesConfig(this.getMapId())?.find((config) =>
        Object.keys(config).includes('time-slider')
      )?.['time-slider'] as Record<'sliders', TypeTimeSliderProps[]>;

      const layerSliderConfig = timeSliderConfigs?.sliders?.find((slider: TypeTimeSliderProps) =>
        slider.layerPaths.includes(layer.getLayerPath())
      );

      // If the layer is loaded AND flag is true to use time dimension, continue
      if (layer.getIsTimeAware() && layer.getTimeDimension()) {
        // Check (if dimension is valid) and add time slider layer when needed
        this.getControllersRegistry().timeSliderController?.checkInitTimeSliderLayerAndApplyFilters(layer, layerSliderConfig);
      }
    } catch (error: unknown) {
      // Log error
      logger.logError(error);
      // Layer failed to load, abandon it for the TimeSlider registration, too bad.
      // Here, we haven't even made it to a possible layer registration for a possible Time Slider, because we couldn't even get the layer to load anyways.
    }
  }

  /**
   * Updates the mosaicRule for a layer by merging new properties.
   *
   * @param layerPath - The layer path.
   * @param partialMosaicRule - An object with one or more mosaicRule properties to update.
   */
  #setLayerMosaicRuleProperty(layerPath: string, partialMosaicRule: Partial<TypeMosaicRule>): void {
    const prevRule = getStoreLayerMosaicRule(this.getMapId(), layerPath);
    if (!prevRule) return;

    // Merge the existing mosaic rule with the new properties, ensuring required properties are preserved
    const mergedRule: TypeMosaicRule = {
      ...prevRule,
      ...partialMosaicRule,
      mosaicMethod: partialMosaicRule.mosaicMethod ?? prevRule.mosaicMethod ?? 'esriMosaicNone',
      mosaicOperation: partialMosaicRule.mosaicOperation ?? prevRule.mosaicOperation ?? 'MT_FIRST',
    };

    this.setLayerMosaicRule(layerPath, mergedRule);
  }

  /**
   * Retrieves the timestamp when a layer started its deletion process.
   *
   * @param mapId - Identifier of the map instance.
   * @param layerPath - Unique path identifying the layer within the map.
   * @returns The timestamp (in ms) when deletion started, or `undefined`
   * if the layer is not currently pending deletion.
   */
  #getLayerBeingDeleted(layerPath: string): LayerDeletionJob | undefined {
    return this.#layersBeingDeleted?.[layerPath];
  }

  /**
   * Marks a layer as being in the deletion process.
   *
   * @param mapId - Identifier of the map instance.
   * @param layerPath - Unique path identifying the layer within the map.
   */
  #addLayerBeingDeleted(layerPath: string, job: LayerDeletionJob): void {
    // Add the layer for deletion
    this.#layersBeingDeleted[layerPath] = job;
  }

  /**
   * Removes a layer from the pending deletion list and clears its
   * deletion progress indicator from the UI store.
   *
   * @param mapId - Identifier of the map instance.
   * @param layerPath - Unique path identifying the layer within the map.
   */
  #removeLayerBeingDeleted(layerPath: string): void {
    // Update the store
    setStoreLayerDeletionStartTime(this.getMapId(), layerPath, undefined);

    // Remove the layer from deletion
    delete this.#layersBeingDeleted[layerPath];
  }

  // #endregion PRIVATE METHODS

  // #region EVENTS

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
}

/**
 * Layer Controller hook to access the layer controller from the context.
 *
 * @returns The layer controller instance from the context.
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export function useLayerController(): LayerController {
  return useControllers().layerController;
}

/** Represents a pending layer deletion job with its undo state. */
type LayerDeletionJob = {
  /** The delayed job that controls the deletion timer. */
  delayedJob: DelayJob;

  /** The original visibility of the layer before the deletion process started. */
  originalVisibility: boolean;
};

/**
 * Define an event for the delegate
 */
// TODO: REFACTOR IMPORTANT - Move this event from the controller into the domain instead (like the others) once the event processors migration stabilizes
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
export type LayerItemVisibilityToggledDelegate = EventDelegateBase<LayerController, LayerItemVisibilityToggledEvent, void>;
