import type { Coordinate } from 'ol/coordinate';

import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { useControllers } from '@/core/controllers/base/controller-manager';
import type { LayerDomain } from '@/core/domains/layer-domain';
import {
  getStoreDetailsSelectedLayerPath,
  propagateStoreFeatureInfoDetails,
  type TypeFeatureInfoResultSet,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  getStoreActiveFooterBarTab,
  getStoreAppBarComponents,
  getStoreFooterBarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { setStoreMapClickMarkerIconHide } from '@/core/stores/store-interface-and-intial-values/map-state';
import { logger } from '@/core/utils/logger';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { AllFeatureInfoLayerSet } from '@/geo/layer/layer-sets/all-feature-info-layer-set';
import { HoverFeatureInfoLayerSet } from '@/geo/layer/layer-sets/hover-feature-info-layer-set';
import { LegendsLayerSet } from '@/geo/layer/layer-sets/legends-layer-set';
import type { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type { MapPointerMoveEvent, MapSingleClickEvent, MapViewer } from '@/geo/map/map-viewer';
import { FeatureInfoLayerSet } from '@/geo/layer/layer-sets/feature-info-layer-set';
import type { TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import { setStoreSelectedLayerPath } from '../stores/store-interface-and-intial-values/data-table-state';

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

  /**
   * Creates an instance of LayerSetController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller.
   * @param layerDomain - The layer domain instance to associate with this controller.
   */
  constructor(mapViewer: MapViewer, layerDomain: LayerDomain) {
    super(mapViewer);

    // The layer sets
    this.legendsLayerSet = new LegendsLayerSet(mapViewer, layerDomain);
    this.hoverFeatureInfoLayerSet = new HoverFeatureInfoLayerSet(mapViewer, layerDomain);
    this.allFeatureInfoLayerSet = new AllFeatureInfoLayerSet(mapViewer, layerDomain);
    this.featureInfoLayerSet = new FeatureInfoLayerSet(mapViewer, layerDomain);
    this.allLayerSets = [this.legendsLayerSet, this.hoverFeatureInfoLayerSet, this.featureInfoLayerSet, this.allFeatureInfoLayerSet];
  }

  // #region OVERRIDES

  /**
   * Hooks the controller into action.
   */
  protected override onHook(): void {
    // Register a handler on the map click
    this.getMapViewer().onMapSingleClick(this.#handleMapClicked.bind(this));

    // Register a handler when the map pointer moves
    this.getMapViewer().onMapPointerMove(this.#handleMapPointerMoved.bind(this));

    // Register a handler when the map pointer stops
    this.getMapViewer().onMapPointerStop(this.#handleMapPointerStopped.bind(this));
  }

  /**
   * Unhooks the controller from the action.
   */
  protected override onUnhook(): void {
    // Unhooks when the layer queryable state is changed in the Layer domain and updates the store accordingly
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
      MapEventProcessor.removeHighlightedFeature(this.getMapId(), 'all');
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
   * Repeats the last feature info query if any.
   *
   * @returns A promise which will hold the result of the query.
   * @throws {LayerNoLastQueryToPerformError} When there's no last query to perform.
   */
  repeatLastQuery(): Promise<TypeFeatureInfoResultSet> {
    return this.featureInfoLayerSet.repeatLastQuery();
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
   * Switches the open panel to the details tab when a map click occurs.
   *
   * If the current footer-bar tab is neither 'details' nor 'geochart', the footer bar
   * switches to 'details'. Also opens the app-bar details tab with focus trap when available.
   */
  openDetailsPanelOnMapClick(): void {
    // Show details panel as soon as there is a click on the map
    // If the current tab is not 'details' nor 'geochart', switch to details
    if (
      getStoreActiveFooterBarTab(this.getMapId()) === undefined ||
      (!['details', 'geochart'].includes(getStoreActiveFooterBarTab(this.getMapId()).tabId) &&
        getStoreFooterBarComponents(this.getMapId()).includes('details'))
    ) {
      this.getControllersRegistry().uiController.setActiveFooterBarTab('details');
    }
    // Open details appbar tab when user clicked on map layer.
    if (getStoreAppBarComponents(this.getMapId()).includes('details')) {
      this.getControllersRegistry().uiController.setActiveAppBarTab('details', true, true);
    }
  }

  // #endregion PUBLIC METHODS

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
