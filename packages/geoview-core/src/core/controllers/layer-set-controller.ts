import type { Coordinate } from 'ol/coordinate';

import type { TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES, type TypeLayerControls, type TypeMosaicMethod } from '@/api/types/layer-schema-types';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { OgcWmtsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wmts-layer-entry-config';
import { OgcWfsLayerEntryConfig } from '@/api/config/validation-classes/vector-validation-classes/wfs-layer-entry-config';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { LayerDomain } from '@/core/domains/layer-domain';
import { getStoreDetailsSelectedLayerPath, type TypeFeatureInfoResultSet } from '@/core/stores/states/feature-info-state';
import { getStoreUIActiveFooterBarTab, getStoreUIAppBarComponents, getStoreUIFooterBarComponents } from '@/core/stores/states/ui-state';
import { getStoreMapConfigGlobalSettings } from '@/core/stores/states/map-state';
import {
  getStoreLayerLegendLayerByPath,
  getStoreLayerLegendLayers,
  getStoreLayerOrderedLayerIndexByPath,
  setStoreLegendLayersDirectly,
} from '@/core/stores/states/layer-state';
import { logger } from '@/core/utils/logger';
import { whenThisThen } from '@/core/utils/utilities';
import { LayerNoLastQueryToPerformError } from '@/core/exceptions/geoview-exceptions';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import type { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import {
  MapViewer,
  type MapPointerMoveDelegate,
  type MapPointerMoveEvent,
  type MapSingleClickDelegate,
  type MapSingleClickEvent,
} from '@/geo/map/map-viewer';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { TypeLegendItem, TypeLegendLayer, TypeLegendLayerItem } from '@/core/components/layers/types';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';

/**
 * LayerSetController class that extends the AbstractMapViewerController and provides methods to interact with map layers.
 */
export class LayerSetController extends AbstractMapViewerController {
  /** Legends layer set associated to the map */
  legendsLayerSet: LegendsLayerSet;

  /** Hover feature info layer set associated to the map */
  hoverFeatureInfoLayerSet: HoverFeatureInfoLayerSet;

  /** All feature info layer set associated to the map */
  allFeatureInfoLayerSet: AllFeatureInfoLayerSet;

  /** Feature info layer set associated to the map */
  featureInfoLayerSet: FeatureInfoLayerSet;

  /** All the layer sets */
  allLayerSets: AbstractLayerSet[];

  /** Keep a bounded reference to the handle map click event */
  #boundedHandleMapClicked: MapSingleClickDelegate;

  /** Keep a bounded reference to the handle map pointer move event */
  #boundedHandleMapPointerMoved: MapPointerMoveDelegate;

  /** Keep a bounded reference to the handle map pointer stop event */
  #boundedHandleMapPointerStopped: MapPointerMoveDelegate;

  /**
   * Creates an instance of LayerSetController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   * @param layerDomain - The layer domain instance to associate with this controller
   */
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry, layerDomain: LayerDomain) {
    super(mapViewer, controllerRegistry);

    // The layer sets
    this.legendsLayerSet = new LegendsLayerSet(mapViewer, controllerRegistry, layerDomain);
    this.hoverFeatureInfoLayerSet = new HoverFeatureInfoLayerSet(mapViewer, controllerRegistry, layerDomain);
    this.allFeatureInfoLayerSet = new AllFeatureInfoLayerSet(mapViewer, controllerRegistry, layerDomain);
    this.featureInfoLayerSet = new FeatureInfoLayerSet(mapViewer, controllerRegistry, layerDomain);
    this.allLayerSets = [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.featureInfoLayerSet, this.allFeatureInfoLayerSet];

    // Keep bounded references to the handlers
    this.#boundedHandleMapClicked = this.#handleMapClicked.bind(this);
    this.#boundedHandleMapPointerMoved = this.#handleMapPointerMoved.bind(this);
    this.#boundedHandleMapPointerStopped = this.#handleMapPointerStopped.bind(this);
  }

  // #region OVERRIDES

  /**
   * Hooks the controller into action.
   */
  protected override onHook(): void {
    // Register a handler on the map click
    this.getMapViewer().onMapSingleClick(this.#boundedHandleMapClicked);

    // Register a handler when the map pointer moves
    this.getMapViewer().onMapPointerMove(this.#boundedHandleMapPointerMoved);

    // Register a handler when the map pointer stops
    this.getMapViewer().onMapPointerStop(this.#boundedHandleMapPointerStopped);
  }

  /**
   * Unhooks the controller from the action.
   */
  protected override onUnhook(): void {
    // Unhooks when the layer queryable state is changed in the Layer domain and updates the store accordingly

    // Register a handler when the map pointer stops
    this.getMapViewer().offMapPointerStop(this.#boundedHandleMapPointerStopped);

    // Register a handler when the map pointer moves
    this.getMapViewer().offMapPointerMove(this.#boundedHandleMapPointerMoved);

    // Register a handler on the map click
    this.getMapViewer().offMapSingleClick(this.#boundedHandleMapClicked);
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Queries all feature info for a given layer path.
   *
   * @param layerPath - The layer path to query the features from
   * @returns A promise that resolves with the feature info result
   */
  async triggerGetAllFeatureInfo(layerPath: string, waitForLayer = false): Promise<TypeFeatureInfoResult> {
    // If the layer isn't in the domain yet, give it a chance to get registered
    if (waitForLayer) {
      // Wait for the layer to be available, this can happen if the trigger is called too soon (or between the layer config registration and the actual layer registration)
      await whenThisThen(() => this.allFeatureInfoLayerSet.getRegisteredLayerPaths().includes(layerPath));
    }

    // Query the registered layer
    return this.allFeatureInfoLayerSet.queryLayer(layerPath);
  }

  /**
   * Resets the data-table features for a given layer path.
   *
   * Clears the queried features and resets the selected layer path in the store.
   *
   * @param layerPath - The layer path to reset the features for
   */
  triggerResetFeatureInfo(layerPath: string): void {
    // Clear
    this.allFeatureInfoLayerSet.clearLayerFeatures(layerPath);

    // Update the layer data array in the store, all the time
    this.getControllersRegistry().dataTableController.setSelectedLayerPath('');
  }

  /**
   * Resets the feature info result set for a specific layer path.
   *
   * Clears features from the result set and propagates the change to the store.
   * Also removes highlighted features and the click marker when the layer path
   * matches the currently selected details layer path.
   *
   * @param layerPath - The layer path to clear features for
   */
  resetResultSet(layerPath: string): void {
    // Reset the details features
    this.featureInfoLayerSet.clearResults(layerPath);

    // Remove highlighted features and marker if it is the selected layer path
    if (getStoreDetailsSelectedLayerPath(this.getMapId()) === layerPath) {
      this.getControllersRegistry().mapController.removeHighlightedFeature('all');
      this.getControllersRegistry().mapController.clickMarkerIconHide();
    }
  }

  /**
   * Clears the feature info query results for a specific layer path.
   *
   * @param layerPath - The layer path to clear results for
   */
  clearFeatureInfoLayerResults(layerPath: string): void {
    this.featureInfoLayerSet.clearResults(layerPath);
  }

  /**
   * Performs a details query at the provided longitude/latitude.
   * This call will also open the details panel if not already open.
   *
   * @param longlat - The longitude/latitude coordinates to query
   */
  queryAtLonLat(longlat: Coordinate): Promise<TypeFeatureInfoResultSet> {
    // Query all layers which can be queried
    return this.featureInfoLayerSet?.queryLayers(longlat, () => {
      // Query has started, open the details panel
      this.openDetailsPanelOnMapClick();
    });
  }

  /**
   * Repeats the last feature info query.
   * This method waits for the map viewer layers to be rendered before performing the query.
   *
   * @returns A promise that resolves with the result of the query
   * @throws {LayerNoLastQueryToPerformError} When there's no last query to perform
   */
  async repeatLastQuery(): Promise<TypeFeatureInfoResultSet> {
    // Wait until the render completes
    await this.getMapViewer().waitForRender();

    // Redirect
    return this.featureInfoLayerSet.repeatLastQuery();
  }

  /**
   * Repeats the last feature info query, if any.
   * This method waits for the map viewer layers to be rendered before performing the query.
   *
   * @returns A promise that resolves with the result of the query or undefined when no query to repeat
   */
  async repeatLastQueryIfAny(): Promise<TypeFeatureInfoResultSet | undefined> {
    try {
      // Redirect and leave the 'await' keyword here so the try/catch works as expected.
      return await this.repeatLastQuery();
    } catch (error: unknown) {
      // If the error is LayerNoLastQueryToPerformError, no worries, skip
      if (error instanceof LayerNoLastQueryToPerformError) return;

      // Otherwise, keep throwing
      throw error;
    }
  }

  /**
   * Clears all vector features from every layer in the All Feature Info Layer Set.
   */
  clearVectorFeaturesFromAllFeatureInfoLayerSet(): void {
    // Get all vector layers
    const vectorLayers = this.getControllersRegistry()
      .layerController.getGeoviewLayers()
      .filter((layer) => layer instanceof AbstractGVVector);

    // For each layer config
    vectorLayers
      .map((layer) => layer.getLayerConfig())
      .forEach((layerConfig) => {
        // Trigger a reset
        this.triggerResetFeatureInfo(layerConfig.layerPath);
      });
  }

  /**
   * Switches the open panel to the details tab when a map click occurs.
   *
   * If the current footer-bar tab is neither 'details' nor 'geochart', the footer bar
   * switches to 'details'. Also opens the app-bar details tab with focus trap when available.
   */
  openDetailsPanelOnMapClick(): void {
    // Show details panel as soon as there is a click on the map
    // If the current tab is not 'details' nor 'geochart', switch to details
    if (
      getStoreUIActiveFooterBarTab(this.getMapId()) === undefined ||
      (!['details', 'geochart'].includes(getStoreUIActiveFooterBarTab(this.getMapId()).tabId) &&
        getStoreUIFooterBarComponents(this.getMapId()).includes('details'))
    ) {
      this.getControllersRegistry().uiController.setActiveFooterBarTab('details');
    }
    // Open details appbar tab when user clicked on map layer.
    if (getStoreUIAppBarComponents(this.getMapId()).includes('details')) {
      this.getControllersRegistry().uiController.setActiveAppBarTab('details', true, true);
    }
  }

  // #endregion PUBLIC METHODS

  // #region PUBLIC METHODS - STORE PROPAGATION

  /**
   * Propagates the information stored in the legend layer set to the store.
   *
   * @param layerPath - The layer path that triggered the propagation
   * @deprecated This function should be replaced, it's called too often and does too many things, see TODO.
   */
  propagateLegendToStore(layerPath: string): void {
    // TODO: REFACTOR - propagateLegendToStore - This whole function should be refactored to an initial propagation into the store and then only specific propagations in the store.
    // TO.DOCONT: Right now things are sometimes recalculated, sometimes reset, sometimes unsure processing, for every single propagation in the store...

    // TODO: REFACTOR - propagateLegendToStore - IMPORTANT, this function uses '#createOrUpdateLegendEntriesRec' recursively which sends the children array (existingEntries[entryIndex].children)
    // TO.DOCONT: in a loop and pushes objects into the array... However, when pushing objects into an array coming from a Zustand store (or react in general)
    // TO.DOCONT: the array remains the same object and a hook on the array
    // TO.DOCONT: (for example here the "useStoreLayerChildren = createLayerSelectorHook('children')") will never trigger, because
    // TO.DOCONT: as far as react is concerned, it's the same array object.
    // TO.DOCONT: UPDATE: Recently the stores have been fixed so that children are now a new array when updated. Refactoring this should be a bit more straightforward.

    // Build the propagation context helper
    const propagationContext = this.#buildLegendPropagationContext(layerPath);

    // Obtain the list of layers currently in the store
    const layers = getStoreLayerLegendLayers(this.getMapId());

    // Process creation of legend entries
    this.#createOrUpdateLegendEntriesRec(2, layers, propagationContext);

    // Update the legend layers with the updated array, triggering the subscribe
    // Reorder the array so legend tab is in synch
    const sortedLayers = LayerSetController.#sortLegendLayers(this.getMapId(), layers);

    // Set updated legend layers
    setStoreLegendLayersDirectly(this.getMapId(), sortedLayers);
  }

  // #endregion PUBLIC METHODS - STORE PROPAGATION

  // #region PRIVATE METHODS - STORE PROPAGATION

  /**
   * Recursively creates or updates legend entries for the provided layer path nodes.
   *
   * @param currentLevel - The current depth level in the layer path nodes
   * @param existingEntries - The legend entries array to mutate in place
   * @param context - Context used for recursion and visible-range computation
   */
  #createOrUpdateLegendEntriesRec(currentLevel: number, existingEntries: TypeLegendLayer[], context: TypeLegendPropagationContext): void {
    // If outside of range of layer paths, stop
    if (context.layerPathNodes.length < currentLevel) return;

    // Create the layer path for the current level
    const entryLayerPath = context.layerPathNodes.slice(0, currentLevel).join('/');

    // Get the layer config
    const layerConfig = this.getControllersRegistry().layerController.getLayerEntryConfigIfExists(entryLayerPath);

    // If not found, skip
    if (!layerConfig) return;

    // Get the layer if it exists
    const layer = this.getControllersRegistry().layerController.getGeoviewLayerIfExists(entryLayerPath);

    // Find the entry index
    let entryIndex = existingEntries.findIndex((entry) => entry.layerPath === entryLayerPath);

    if (layerConfig.getEntryTypeIsGroup()) {
      entryIndex = this.#createOrUpdateLegendGroupEntry(existingEntries, entryIndex, entryLayerPath, layerConfig, layer);

      // Continue recursively
      this.#createOrUpdateLegendEntriesRec(currentLevel + 1, existingEntries[entryIndex].children, context);
      return;
    }

    this.#createOrUpdateLegendLeafEntry(existingEntries, entryIndex, entryLayerPath, layerConfig, layer, context);
  }

  /**
   * Creates or updates a group legend entry and returns its index in the entry array.
   *
   * @param existingEntries - The legend entries array to mutate in place
   * @param entryIndex - The current index for the target entry, or -1 if missing
   * @param entryLayerPath - The target layer path for this entry
   * @param layerConfig - The layer configuration associated with the entry
   * @param layer - The layer instance associated with the entry, if available
   * @returns The index of the group entry in existingEntries
   */
  #createOrUpdateLegendGroupEntry(
    existingEntries: TypeLegendLayer[],
    entryIndex: number,
    entryLayerPath: string,
    layerConfig: ConfigBaseClass,
    layer: AbstractBaseGVLayer | undefined
  ): number {
    // Get the layer name
    const layerName = LayerSetController.#getLayerName(layer, layerConfig);

    if (entryIndex === -1) {
      // Get if the layer is a child, use the gv layer if we can or use the layerConfig.getParent
      const isChild = LayerSetController.#isLegendLayerChild(layerConfig, layer);

      // Build the controls
      const controls: TypeLayerControls = this.#buildLegendLayerControls(layerConfig, isChild);

      const opacity = layerConfig.getInitialSettings()?.states?.opacity ?? 1; // default: 1
      const legendCollapsed = layerConfig.getInitialSettings()?.states?.legendCollapsed ?? false; // default: false

      const legendLayerEntry: TypeLegendLayer = {
        controls,
        layerId: layerConfig.layerId,
        layerPath: entryLayerPath,
        layerName,
        layerStatus: layerConfig.layerStatus,
        legendQueryStatus: 'init',
        legendSchemaTag: undefined,
        schemaTag: layerConfig.getSchemaTag(),
        entryType: 'group',
        canToggle: true,
        opacity,
        visible: true,
        inVisibleRange: true,
        legendCollapsed,
        icons: [] as TypeLegendLayerItem[],
        items: [] as TypeLegendItem[],
        children: [] as TypeLegendLayer[],
        rasterFunction: undefined,
        mosaicRule: undefined,
      };

      existingEntries.push(legendLayerEntry);
      return existingEntries.length - 1;
    }

    // Make sure the entry type for that store entry is 'group', because if the layer was previously a leaf and now is a group, it needs to be updated
    // TODO: REFACTOR - propagateLegendToStore - this should be refactored so that the entry type is not 'magically' updated in this function
    // eslint-disable-next-line no-param-reassign
    existingEntries[entryIndex].entryType = 'group';
    return entryIndex;
  }

  /**
   * Creates or updates a non-group legend entry.
   *
   * @param existingEntries - The legend entries array to mutate in place
   * @param entryIndex - The current index for the target entry, or -1 if missing
   * @param entryLayerPath - The target layer path for this entry
   * @param layerConfig - The layer configuration associated with the entry
   * @param layer - The layer instance associated with the entry, if available
   * @param context - Context used for visible-range computation
   */
  #createOrUpdateLegendLeafEntry(
    existingEntries: TypeLegendLayer[],
    entryIndex: number,
    entryLayerPath: string,
    layerConfig: ConfigBaseClass,
    layer: AbstractBaseGVLayer | undefined,
    context: TypeLegendPropagationContext
  ): void {
    // Cast the layer config
    const layerConfigCasted = layerConfig as AbstractBaseLayerEntryConfig;

    // Get existing store entry if any (for updates)
    const existingStoreEntry = getStoreLayerLegendLayerByPath(this.getMapId(), entryLayerPath);

    // Get the layer name
    const layerName = LayerSetController.#getLayerName(layer, layerConfig);

    // Get if the layer is a child, use the gv layer if we can or use the layerConfig.getParent
    const isChild = LayerSetController.#isLegendLayerChild(layerConfig, layer);

    // Build the controls
    const controls: TypeLayerControls = this.#buildLegendLayerControls(layerConfig, isChild);

    // Get the visibility flag, use the gv layer if we can, or use the initial settings of the config or default true if none are specified
    // TODO: TEST - Attempt to set the visible state to false by default (it'd make more sense?) and see if it works...
    // TO.DOCONT: When attempted, it wasn't working for the Hydro - Scale WMS group layers of group layers and the 'Show all' toggle.
    const visible = layer?.getVisible() ?? layerConfigCasted.getInitialSettings()?.states?.visible ?? true;

    // Compute effective layer scales to get the in visible range flag
    const effectiveScales = MapViewer.computeEffectiveLayerScales(this.getMapViewer(), layerConfig);
    const { maxScale, minScale } = effectiveScales;
    const inVisibleRange = layer?.isInVisibleRange(context.calculatedMapResolution, context.calculatedMapScale, effectiveScales) ?? true; // default: true

    // Reuse existing value to make sure we don't override it when we shouldn't have (should be refactored, view note of this function)
    const schemaTag = existingStoreEntry?.legendSchemaTag ?? layerConfig.getSchemaTag();
    const opacity = existingStoreEntry?.opacity ?? layerConfig.getInitialSettings()?.states?.opacity ?? 1; // default: 1
    const opacityMaxFromParent = existingStoreEntry?.opacityMaxFromParent ?? 1; // default: 1
    const legendQueryStatus = existingStoreEntry?.legendQueryStatus ?? 'init'; // default: 'init'
    const styleConfig = existingStoreEntry?.styleConfig;
    const items = existingStoreEntry?.items ?? [];
    const icons = existingStoreEntry?.icons ?? [];

    const legendLayerEntry: TypeLegendLayer = {
      url: layerConfig.getMetadataAccessPath(),
      bounds: layer?.getBounds(),
      bounds4326: layer?.getBoundsLonLat(),
      controls,
      layerId: layerConfig.layerId,
      layerPath: entryLayerPath,
      layerAttribution: layer?.getAttributions(),
      layerName,
      layerStatus: layerConfig.layerStatus,
      legendQueryStatus,
      styleConfig,
      schemaTag,
      entryType: layerConfig.getEntryType(),
      canToggle: schemaTag !== CONST_LAYER_TYPES.ESRI_IMAGE,
      opacity,
      opacityMaxFromParent,
      hoverable: layerConfig.getInitialSettings()?.states?.hoverable,
      queryableSource: layerConfigCasted.getQueryableSourceDefaulted(),
      queryable: layerConfig.getInitialSettings()?.states?.queryable,
      visible,
      inVisibleRange,
      maxScale,
      minScale,
      legendCollapsed: layerConfig.getInitialSettings()?.states?.legendCollapsed ?? false, // default: false
      children: [] as TypeLegendLayer[],
      items,
      icons,
    };

    // If layer is regular (not group and not undefined!)
    if (layer instanceof AbstractGVLayer) {
      // Store the time dimension if any
      legendLayerEntry.timeDimension = layer.getTimeDimension();

      // Store the layer filter
      legendLayerEntry.layerFilter = layer.getLayerFilters().getInitialFilter();
      legendLayerEntry.layerFilterClass = layer.getLayerFilters().getClassFilter();
      legendLayerEntry.dateTemporalMode = layerConfigCasted.getServiceDateTemporalMode();
      legendLayerEntry.displayDateFormat = layerConfigCasted.getDisplayDateFormat();
      legendLayerEntry.displayDateFormatShort = layerConfigCasted.getDisplayDateFormatShort();
      legendLayerEntry.displayDateTimezone = layerConfigCasted.getDisplayDateTimezone();

      // If the layer is vector
      if (layer instanceof AbstractGVVector) {
        legendLayerEntry.hasText = !!layer.getTextOLLayer();
        legendLayerEntry.textVisible = layer.getTextVisible();
      }

      // If the layer is GVEsriImage
      if (layer instanceof GVEsriImage) {
        // TODO: Encapsulate rasterFunction and possibly other 'settings' into their own object
        legendLayerEntry.rasterFunction = layer.getRasterFunction();
        legendLayerEntry.rasterFunctionInfos = layer.getMetadataRasterFunctionInfos();
        legendLayerEntry.mosaicRule = layer.getMosaicRule();
        legendLayerEntry.allowedMosaicMethods = layer.getLayerConfig().getAllowedMosaicMethods()?.split(',') as
          | TypeMosaicMethod[]
          | undefined;
      }

      // If the layer is WMS
      if (layer instanceof GVWMS) {
        legendLayerEntry.wmsStyle = layer.getWmsStyle();
      }
    }

    // If the layer config is WMS
    if (layerConfig instanceof OgcWmsLayerEntryConfig) {
      legendLayerEntry.wmsStyles = layerConfig.getStylesMetadata();
    }

    // If layer config is OGC
    if (
      layerConfig instanceof OgcWmsLayerEntryConfig ||
      layerConfig instanceof OgcWfsLayerEntryConfig ||
      layerConfig instanceof OgcWmtsLayerEntryConfig
    ) {
      legendLayerEntry.ogcVersion = layerConfig.getVersion(); // Don't use getVersionOrDefault() here - we want the truth
    }

    // If non existing in the store yet
    if (entryIndex === -1) {
      // Add it
      existingEntries.push(legendLayerEntry);
      return;
    }

    // Replace it
    // eslint-disable-next-line no-param-reassign
    existingEntries[entryIndex] = legendLayerEntry;
  }

  /**
   * Builds the legend controls object for a layer config.
   *
   * @param layerConfig - The layer config used to derive controls
   * @param isChild - Indicates if the layer is nested under another layer
   * @returns The computed legend controls object
   */
  #buildLegendLayerControls(layerConfig: ConfigBaseClass, isChild: boolean): TypeLayerControls {
    const removeDefault = isChild ? getStoreMapConfigGlobalSettings(this.getMapId())?.canRemoveSublayers !== false : true;

    // Get the initial settings
    const initialSettings = layerConfig.getInitialSettings();

    // Show zoom-to-visible-scale control whenever the layer has any scale or zoom range constraint.
    // Do not rely only on layer min/max zoom because constraints can be provided as minScale/maxScale.
    const visibleScale: boolean =
      layerConfig.getMinScale() !== undefined ||
      layerConfig.getMaxScale() !== undefined ||
      initialSettings?.minZoom !== undefined ||
      initialSettings?.maxZoom !== undefined;

    // Get the layer controls using default values when needed
    return {
      highlight: initialSettings?.controls?.highlight ?? true, // default: true
      hover: initialSettings?.controls?.hover ?? false, // default: false
      opacity: initialSettings?.controls?.opacity ?? true, // default: true
      query: initialSettings?.controls?.query ?? false, // default: false
      remove: initialSettings?.controls?.remove ?? removeDefault, // default: removeDefault
      table: initialSettings?.controls?.table ?? true, // default: true
      visibility: initialSettings?.controls?.visibility ?? true, // default: true
      zoom: initialSettings?.controls?.zoom ?? true, // default: true
      visibleScale, // default: false
    };
  }

  /**
   * Builds propagation context for legend updates.
   *
   * @param layerPath - The layer path to propagate
   * @returns The context object used while propagating legend entries
   */
  #buildLegendPropagationContext(layerPath: string): TypeLegendPropagationContext {
    const mapViewer = this.getMapViewer();
    const mapView = mapViewer.getView();
    const currentMapZoom = mapView.getZoom();
    const currentMapResolution = mapView.getResolution();

    return {
      layerPathNodes: layerPath.split('/'),
      calculatedMapScale: mapViewer.getMapScaleFromZoom(currentMapZoom ?? 0),
      calculatedMapResolution: currentMapResolution ?? mapView.getResolutionForZoom(currentMapZoom ?? 0),
    };
  }

  // #endregion PRIVATE METHODS - STORE PROPAGATION

  // #region ACTION HANDLERS

  /**
   * Handles a single click on the map by querying all queryable layers at the click location.
   *
   * @param sender - The map viewer instance that fired the event
   * @param event - The map single click event containing the click coordinates
   */
  #handleMapClicked(sender: MapViewer, event: MapSingleClickEvent): void {
    // Perform a query at the clicked lonlat
    this.queryAtLonLat(event.lonlat).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('performQueryAtLonLat in #handleMapClicked in LayerSetController', error);
    });
  }

  /**
   * Handles the map pointer move event by clearing all hover feature info results.
   *
   * @param sender - The map viewer instance that fired the event
   * @param event - The map pointer move event
   */
  #handleMapPointerMoved(sender: MapViewer, event: MapPointerMoveEvent): void {
    // Clear all hover features
    this.hoverFeatureInfoLayerSet.clearResults();
  }

  /**
   * Handles the map pointer stop event by querying hoverable layers at the pointer position.
   *
   * @param sender - The map viewer instance that fired the event
   * @param event - The map pointer move event containing the pixel coordinates
   */
  #handleMapPointerStopped(sender: MapViewer, event: MapPointerMoveEvent): void {
    // Query
    this.hoverFeatureInfoLayerSet.queryLayers(event.pixel).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('queryLayers in onMapPointerStop in HoverFeatureInfoLayerSet', error);
    });
  }

  // #endregion ACTION HANDLERS

  // #region DOMAIN HANDLERS
  // GV Eventually, these should be moved to a store adaptor or similar construct that directly connects the domain to the store without going through the controller
  // GV.CONT but for now this allows us to keep domain-store interactions in one place and call application-level processes as needed during migration.

  // #endregion DOMAIN HANDLERS

  // #region STATIC METHODS

  /**
   * Gets the best available layer display name.
   *
   * @param layer - The layer, if it exists
   * @param layerConfig - The layer config associated with the path
   * @returns The layer display name
   */
  static #getLayerName(layer: AbstractBaseGVLayer | undefined, layerConfig: ConfigBaseClass): string {
    return layer?.getLayerName() || layerConfig.getLayerNameCascade();
  }

  /**
   * Checks if the legend entry belongs to a nested layer.
   *
   * @param layerConfig - The layer config associated with the entry
   * @param layer - The runtime layer instance, when available
   * @returns True when the layer is nested under a parent
   */
  static #isLegendLayerChild(layerConfig: ConfigBaseClass, layer: AbstractBaseGVLayer | undefined): boolean {
    return layer ? !!layer.getParent() : !!layerConfig.getParentLayerConfig();
  }

  /**
   * Sorts top-level and nested legend layers by ordered layer index.
   *
   * @param mapId - The map ID to use for retrieving layer order information from the store
   * @param legendLayers - The legend layers list to sort in place
   * @returns The same list instance after sorting
   */
  static #sortLegendLayers(mapId: string, legendLayers: TypeLegendLayer[]): TypeLegendLayer[] {
    const orderedLayerIndexByPath = LayerSetController.#createOrderedLayerIndexByPathGetter(mapId);

    legendLayers.sort((a, b) => orderedLayerIndexByPath(a.layerPath) - orderedLayerIndexByPath(b.layerPath));
    LayerSetController.#sortLegendLayersChildren(legendLayers, orderedLayerIndexByPath);

    return legendLayers;
  }

  /**
   * Sorts legend layers children recursively in the given legend layers list.
   *
   * @param legendLayerList - The legend layer list to sort
   * @param orderedLayerIndexByPath - Function returning the store order index for a layer path
   */
  static #sortLegendLayersChildren(legendLayerList: TypeLegendLayer[], orderedLayerIndexByPath: (layerPath: string) => number): void {
    legendLayerList.forEach((legendLayer) => {
      if (legendLayer.children.length)
        legendLayer.children.sort((a, b) => orderedLayerIndexByPath(a.layerPath) - orderedLayerIndexByPath(b.layerPath));
      LayerSetController.#sortLegendLayersChildren(legendLayer.children, orderedLayerIndexByPath);
    });
  }

  /**
   * Creates a memoized getter for ordered layer indexes by path.
   *
   * @param mapId - The map ID to query from the store
   * @returns A function that returns a cached ordered index for each requested path
   */
  static #createOrderedLayerIndexByPathGetter(mapId: string): (layerPath: string) => number {
    const indexByLayerPath = new Map<string, number>();

    return (layerPath: string): number => {
      const cachedValue = indexByLayerPath.get(layerPath);
      if (cachedValue !== undefined) return cachedValue;

      const orderedIndex = getStoreLayerOrderedLayerIndexByPath(mapId, layerPath);
      indexByLayerPath.set(layerPath, orderedIndex);
      return orderedIndex;
    };
  }

  // #endregion STATIC METHODS
}

/** Context used while recursively propagating legend entries to the store. */
type TypeLegendPropagationContext = {
  /** Layer path tokens split by '/'. */
  layerPathNodes: string[];

  /** Map resolution used by in-visible-range checks. */
  calculatedMapResolution: number | undefined;

  /** Map scale used by in-visible-range checks. */
  calculatedMapScale: number | undefined;
};
