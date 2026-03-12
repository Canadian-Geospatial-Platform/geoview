import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import {
  getStoreDetailsSelectedLayerPath,
  propagateStoreFeatureInfoDetails,
  type TypeFeatureInfoResultSet,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { MapEventProcessor } from './map-event-processor';
import {
  getStoreActiveFooterBarTab,
  getStoreAppBarComponents,
  getStoreFooterBarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';

/**
 * Event processor for feature-info (details) related operations.
 *
 * Provides static methods that orchestrate store updates and layer API calls
 * for managing feature info result sets, query repetition, and panel navigation.
 */
export abstract class FeatureInfoEventProcessor extends AbstractEventProcessor {
  // #region STATIC METHODS

  /**
   * Resets the feature info result set for a specific layer path.
   *
   * Clears features from the result set and propagates the change to the store.
   * Also removes highlighted features and the click marker when the layer path
   * matches the currently selected details layer path.
   *
   * @param mapId - The map identifier
   * @param layerPath - The layer path to clear features for
   */
  static resetResultSet(mapId: string, layerPath: string): void {
    const { resultSet } = MapEventProcessor.getMapViewerLayerAPI(mapId).featureInfoLayerSet;

    if (resultSet[layerPath]) {
      resultSet[layerPath].features = [];
      propagateStoreFeatureInfoDetails(mapId, resultSet[layerPath]);
    }

    // Remove highlighted features and marker if it is the selected layer path
    if (getStoreDetailsSelectedLayerPath(mapId) === layerPath) {
      MapEventProcessor.removeHighlightedFeature(mapId, 'all');
      MapEventProcessor.clickMarkerIconHide(mapId);
    }
  }

  /**
   * Repeats the last feature info query if any.
   *
   * @param mapId - The map identifier
   * @returns A promise which will hold the result of the query.
   * @throws {LayerNoLastQueryToPerformError} When there's no last query to perform.
   */
  static repeatLastQuery(mapId: string): Promise<TypeFeatureInfoResultSet> {
    return MapEventProcessor.getMapViewerLayerAPI(mapId).featureInfoLayerSet.repeatLastQuery();
  }

  /**
   * Switches the open panel to the details tab when a map click occurs.
   *
   * If the current footer-bar tab is neither 'details' nor 'geochart', the footer bar
   * switches to 'details'. Also opens the app-bar details tab with focus trap when available.
   *
   * @param mapId - The map identifier
   */
  static openDetailsPanelOnMapClick(mapId: string): void {
    // Show details panel as soon as there is a click on the map
    // If the current tab is not 'details' nor 'geochart', switch to details
    if (
      getStoreActiveFooterBarTab(mapId) === undefined ||
      (!['details', 'geochart'].includes(getStoreActiveFooterBarTab(mapId).tabId) && getStoreFooterBarComponents(mapId).includes('details'))
    ) {
      this.getUIController(mapId).setActiveFooterBarTab('details');
    }
    // Open details appbar tab when user clicked on map layer.
    if (getStoreAppBarComponents(mapId).includes('details')) {
      this.getUIController(mapId).setActiveAppBarTab('details', true, true);
    }
  }

  // #endregion STATIC METHODS
}
