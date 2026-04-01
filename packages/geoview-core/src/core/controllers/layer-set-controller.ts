import type { Coordinate } from 'ol/coordinate';

import type { TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import { CONST_LAYER_TYPES, type TypeLayerControls, type TypeMosaicMethod } from '@/api/types/layer-schema-types';
import type { ConfigBaseClass } from '@/api/config/validation-classes/config-base-class';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { useControllers } from '@/core/controllers/base/controller-manager';
import type { LayerDomain } from '@/core/domains/layer-domain';
import {
  getStoreDetailsSelectedLayerPath,
  propagateStoreFeatureInfoDetails,
  type TypeFeatureInfoResultSet,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  getStoreUIActiveFooterBarTab,
  getStoreUIAppBarComponents,
  getStoreUIFooterBarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  getStoreMapConfigGlobalSettings,
  getStoreMapOrderedLayerIndexByPath,
  setStoreMapClickMarkerIconHide,
} from '@/core/stores/store-interface-and-intial-values/map-state';
import { setStoreSelectedLayerPath } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { LayerNoLastQueryToPerformError } from '@/core/exceptions/geoview-exceptions';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import type { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type {
  MapPointerMoveDelegate,
  MapPointerMoveEvent,
  MapSingleClickDelegate,
  MapSingleClickEvent,
  MapViewer,
} from '@/geo/map/map-viewer';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import { AbstractGVVector } from '@/geo/layer/gv-layers/vector/abstract-gv-vector';
import type { TypeLegendItem, TypeLegendLayer, TypeLegendLayerItem } from '@/core/components/layers/types';
import {
  getStoreLayerLegendLayers,
  setStoreLegendLayersDirectly,
  type TypeLegendResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/layer-state';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import { OgcWmsLayerEntryConfig } from '@/api/config/validation-classes/raster-validation-classes/ogc-wms-layer-entry-config';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GeoUtilities } from '@/geo/utils/utilities';

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
   * @param mapViewer - The map viewer instance to associate with this controller.
   * @param layerDomain - The layer domain instance to associate with this controller.
   */
  constructor(mapViewer: MapViewer, layerDomain: LayerDomain) {
    super(mapViewer);

    // The layer sets
    this.legendsLayerSet = new LegendsLayerSet(mapViewer, this, layerDomain);
    this.hoverFeatureInfoLayerSet = new HoverFeatureInfoLayerSet(mapViewer, layerDomain);
    this.allFeatureInfoLayerSet = new AllFeatureInfoLayerSet(mapViewer, layerDomain);
    this.featureInfoLayerSet = new FeatureInfoLayerSet(mapViewer, layerDomain);
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
  triggerGetAllFeatureInfo(layerPath: string): Promise<TypeFeatureInfoResult> {
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
    setStoreSelectedLayerPath(this.getMapId(), '');
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
    const { resultSet } = this.featureInfoLayerSet;

    if (resultSet[layerPath]) {
      resultSet[layerPath].features = [];
      propagateStoreFeatureInfoDetails(this.getMapId(), resultSet[layerPath]);
    }

    // Remove highlighted features and marker if it is the selected layer path
    if (getStoreDetailsSelectedLayerPath(this.getMapId()) === layerPath) {
      this.getControllersRegistry().mapController.removeHighlightedFeature('all');
      setStoreMapClickMarkerIconHide(this.getMapId());
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
   * @throws {LayerNoLastQueryToPerformError} When there's no last query to perform.
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
   * @param legendResultSetEntry - The legend result set entry that triggered the propagation
   * @deprecated This function should be replaced, it's called too often and does too many things, see TODO.
   */
  propagateLegendToStore(legendResultSetEntry: TypeLegendResultSetEntry): void {
    // TODO: REFACTOR - propagateLegendToStore - This whole function should be refactored to an initial propagation into the store and then only specific propagations in the store.
    // TO.DOCONT: Right now things are sometimes recalculated, sometimes reset, sometimes unsure processing, for every single propagation in the store...

    // TODO: REFACTOR - propagateLegendToStore - IMPORTANT, this function uses 'createNewLegendEntries' recursively which sends the children array (existingEntries[entryIndex].children)
    // TO.DOCONT: in a loop and pushes objects into the array... However, when pushing objects into an array coming from a Zustand store (or react in general)
    // TO.DOCONT: the array remains the same object and a hook on the array
    // TO.DOCONT: (for example here the "useStoreLayerChildren = createLayerSelectorHook('children')") will never trigger, because
    // TO.DOCONT: as far as react is concerned, it's the same array object.
    // TO.DOCONT: UPDATE: Recently the stores have been fixed so that children are now a new array when updated. Refactoring this should be a bit more straightforward.

    const { layerPath } = legendResultSetEntry;
    const layerPathNodes = layerPath.split('/');

    const setLayerControls = (layerConfig: ConfigBaseClass, isChild: boolean = false, layer?: AbstractBaseGVLayer): TypeLayerControls => {
      const removeDefault = isChild ? getStoreMapConfigGlobalSettings(this.getMapId())?.canRemoveSublayers !== false : true;

      // Check if the layer has a minZoom or maxZoom defined, so we know if it needs the visible scale button.
      const visibleScale: boolean = Number.isFinite(layer?.getMinZoom()) || Number.isFinite(layer?.getMaxZoom());

      // Get the initial settings
      const initialSettings = layerConfig.getInitialSettings();

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
    };

    // TODO: REFACTOR - propagateLegendToStore - Avoid nested function relying on outside parameter like layerPathNodes
    // TO.DOCONT: The layerId set by this array has the map identifier in front... remove
    const createNewLegendEntries = (currentLevel: number, existingEntries: TypeLegendLayer[]): void => {
      // If outside of range of layer paths, stop
      if (layerPathNodes.length < currentLevel) return;

      const suffix = layerPathNodes.slice(0, currentLevel);
      const entryLayerPath = suffix.join('/');

      // Get the layer config
      const layerConfig = this.getControllersRegistry().layerController.getLayerEntryConfigIfExists(entryLayerPath);

      // If not found, skip
      if (!layerConfig) return;

      // Get the layer if exists
      const layer = this.getControllersRegistry().layerController.getGeoviewLayerIfExists(entryLayerPath);

      // Interpret the layer name the best we can
      const layerName = layer?.getLayerName() || layerConfig.getLayerNameCascade();

      let entryIndex = existingEntries.findIndex((entry) => entry.layerPath === entryLayerPath);

      // Get the existing store entry if any
      const existingStoreEntry: TypeLegendLayer | undefined = existingEntries[entryIndex];

      if (layerConfig.getEntryTypeIsGroup()) {
        // Get the schema tag
        const schemaTag = legendResultSetEntry.data?.type ?? layerConfig.getSchemaTag();

        const controls: TypeLayerControls = setLayerControls(layerConfig, currentLevel > 2);
        if (entryIndex === -1) {
          const legendLayerEntry: TypeLegendLayer = {
            controls,
            layerId: layerConfig.layerId,
            layerPath: entryLayerPath,
            layerName,
            layerStatus: legendResultSetEntry.layerStatus,
            legendQueryStatus: legendResultSetEntry.legendQueryStatus,
            schemaTag: schemaTag,
            entryType: 'group',
            canToggle: legendResultSetEntry.data?.type !== CONST_LAYER_TYPES.ESRI_IMAGE,
            opacity: layerConfig.getInitialSettings()?.states?.opacity ?? 1, // GV: This is call all the time, if set on OL use value, default to config or 1
            icons: [] as TypeLegendLayerItem[],
            items: [] as TypeLegendItem[],
            children: [] as TypeLegendLayer[],
            rasterFunction: undefined,
            mosaicRule: undefined,
          };

          existingEntries.push(legendLayerEntry);
          entryIndex = existingEntries.length - 1;
        } else {
          // TODO: REFACTOR - propagateLegendToStore - Is it missing group layer entry config properties in the store?
          // TO.DOCONT: At the time of writing this, it was just updating the layerStatus on the group layer entry.
          // TO.DOCONT: It seemed to me it should also at least update the name and the bounds (the bounds are tricky, as they get generated only when the children are loaded)
          // TO.DOCONT: Is there any other group layer entry attributes we would like to propagate in the legends store? I'd think so?
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex].layerStatus = layerConfig.layerStatus;
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex].layerName = layerName;
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex].entryType = 'group';
        }

        // Continue recursively
        createNewLegendEntries(currentLevel + 1, existingEntries[entryIndex].children);
      } else {
        // Not a group
        const layerConfigCasted = layerConfig as AbstractBaseLayerEntryConfig;

        // Read the icons
        // If data type is set
        let icons: TypeLegendLayerItem[] = [];
        let items: TypeLegendItem[] = [];
        if (legendResultSetEntry.data) {
          icons = GeoUtilities.getLayerIconImage(legendResultSetEntry.data.type, legendResultSetEntry.data) ?? [];
          items = GeoUtilities.getLayerItemsFromIcons(legendResultSetEntry.data.type, icons);
        }

        const controls: TypeLayerControls = setLayerControls(layerConfig, currentLevel > 2, layer);

        // Get the schema tag
        const schemaTag = legendResultSetEntry.data?.type ?? layerConfig.getSchemaTag();

        const legendLayerEntry: TypeLegendLayer = {
          url: layerConfig.getMetadataAccessPath(),
          bounds: existingStoreEntry?.bounds, // Reassigning the value, because we try to not manage this property from within this function anymore
          bounds4326: existingStoreEntry?.bounds4326, // Reassigning the value, because we try to not manage this property from within this function anymore
          controls,
          layerId: layerPathNodes[currentLevel - 1],
          layerPath: entryLayerPath,
          layerAttribution: layer?.getAttributions(),
          layerName,
          layerStatus: legendResultSetEntry.layerStatus,
          legendQueryStatus: legendResultSetEntry.legendQueryStatus,
          styleConfig: legendResultSetEntry.data?.styleConfig,
          schemaTag: schemaTag,
          entryType: layerConfig.getEntryType(),
          canToggle: schemaTag !== CONST_LAYER_TYPES.ESRI_IMAGE,
          opacity: existingStoreEntry?.opacity ?? layerConfig.getInitialSettings()?.states?.opacity ?? 1, // Reassigning the value, because we try to not manage this property from within this function anymore
          opacityMaxFromParent: existingStoreEntry?.opacityMaxFromParent ?? 1, // Reassigning the value, because we try to not manage this property from within this function anymore
          hoverable: layerConfig.getInitialSettings()?.states?.hoverable, // default: true
          queryable: layerConfig.getInitialSettings()?.states?.queryable, // default: true
          children: [] as TypeLegendLayer[],
          items,
          icons,
          // TODO: Encapsulate rasterFunction and possibly other 'settings' into their own object
          rasterFunction: layer instanceof GVEsriImage ? layer.getRasterFunction() : undefined,
          rasterFunctionInfos: layer instanceof GVEsriImage ? layer.getMetadataRasterFunctionInfos() : undefined,
          allowedMosaicMethods:
            layer instanceof GVEsriImage
              ? ((layer.getLayerConfig().getAllowedMosaicMethods()?.split(',') as TypeMosaicMethod[]) ?? undefined)
              : undefined,
          mosaicRule: layer instanceof GVEsriImage ? layer.getMosaicRule() : undefined,
          timeDimension: layer instanceof AbstractGVLayer ? layer.getTimeDimension() : undefined,
          hasText: layer instanceof AbstractGVVector ? layer.getTextOLLayer() !== undefined : undefined,
          textVisible: layer instanceof AbstractGVVector ? layer.getTextVisible() : undefined,
          wmsStyle: layer instanceof GVWMS ? layer.getWmsStyle() : undefined,
          wmsStyles: layerConfigCasted instanceof OgcWmsLayerEntryConfig ? layerConfigCasted.getStylesMetadata() : undefined,
        };

        // If layer is regular (not group)
        if (layer instanceof AbstractGVLayer) {
          // Store the layer filter
          legendLayerEntry.layerFilter = layer.getLayerFilters().getInitialFilter();
          legendLayerEntry.layerFilterClass = layer.getLayerFilters().getClassFilter();
          legendLayerEntry.dateTemporalMode = layerConfigCasted.getServiceDateTemporalMode();
          legendLayerEntry.displayDateFormat = layerConfigCasted.getDisplayDateFormat();
          legendLayerEntry.displayDateFormatShort = layerConfigCasted.getDisplayDateFormatShort();
          legendLayerEntry.displayDateTimezone = layerConfigCasted.getDisplayDateTimezone();
        }

        // If non existing in the store yet
        if (entryIndex === -1) {
          // Add it
          existingEntries.push(legendLayerEntry);
        } else {
          // Replace it
          // eslint-disable-next-line no-param-reassign
          existingEntries[entryIndex] = legendLayerEntry;
        }
      }
    };

    // Obtain the list of layers currently in the store
    const layers = getStoreLayerLegendLayers(this.getMapId());

    // Process creation of legend entries
    createNewLegendEntries(2, layers);

    // Update the legend layers with the updated array, triggering the subscribe
    // Reorder the array so legend tab is in synch
    const sortedLayers = layers.sort(
      (a, b) =>
        getStoreMapOrderedLayerIndexByPath(this.getMapId(), a.layerPath) - getStoreMapOrderedLayerIndexByPath(this.getMapId(), b.layerPath)
    );
    this.#sortLegendLayersChildren(sortedLayers);

    // Set updated legend layers
    setStoreLegendLayersDirectly(this.getMapId(), sortedLayers);
  }

  // #endregion PUBLIC METHODS - STORE PROPAGATION

  // #region ACTION HANDLERS

  /**
   * Handles a single click on the map by querying all queryable layers at the click location.
   *
   * @param mapViewer - The map viewer instance that fired the event
   * @param event - The map single click event containing the click coordinates
   */
  #handleMapClicked(mapViewer: MapViewer, event: MapSingleClickEvent): void {
    // Perform a query at the clicked lonlat
    this.queryAtLonLat(event.lonlat).catch((error: unknown) => {
      // Log
      logger.logPromiseFailed('performQueryAtLonLat in #handleMapClicked in LayerSetController', error);
    });
  }

  /**
   * Handles the map pointer move event by clearing all hover feature info results.
   *
   * @param mapViewer - The map viewer instance that fired the event
   * @param event - The map pointer move event
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  #handleMapPointerMoved(mapViewer: MapViewer, event: MapPointerMoveEvent): void {
    // Clear all hover features
    this.hoverFeatureInfoLayerSet.clearResultsAll();
  }

  /**
   * Handles the map pointer stop event by querying hoverable layers at the pointer position.
   *
   * @param mapViewer - The map viewer instance that fired the event
   * @param event - The map pointer move event containing the pixel coordinates
   */
  #handleMapPointerStopped(mapViewer: MapViewer, event: MapPointerMoveEvent): void {
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

  // #region PRIVATE METHODS - STORE PROPAGATION

  /**
   * Sorts legend layers children recursively in the given legend layers list.
   *
   * @param legendLayerList - The legend layer list to sort
   */
  #sortLegendLayersChildren(legendLayerList: TypeLegendLayer[]): void {
    legendLayerList.forEach((legendLayer) => {
      if (legendLayer.children.length)
        legendLayer.children.sort(
          (a, b) =>
            getStoreMapOrderedLayerIndexByPath(this.getMapId(), a.layerPath) -
            getStoreMapOrderedLayerIndexByPath(this.getMapId(), b.layerPath)
        );
      this.#sortLegendLayersChildren(legendLayer.children);
    });
  }

  // #endregion PRIVATE METHODS - STORE PROPAGATION
}

/**
 * Layer Controller hook to access the layer controller from the context.
 *
 * @returns The layer controller instance from the context.
 * @throws {Error} When used outside of a ControllerContext.Provider.
 */
export function useLayerSetController(): LayerSetController {
  return useControllers().layerSetController;
}
