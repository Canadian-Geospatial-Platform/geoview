import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import {
  addOrUpdateStoreTableFilter,
  getStoreMapFilteredRecord,
  getStoreDataTableSelectedLayerPath,
  setStoreSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';

import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import type { TypeFeatureInfoResult } from '@/api/types/map-schema-types';

/**
 * Event processor for data-table related operations.
 *
 * Provides static methods that orchestrate store updates and layer API calls
 * for filtering, querying, and resetting feature info in the data table.
 */
export abstract class DataTableEventProcessor extends AbstractEventProcessor {
  // #region STATIC METHODS

  /**
   * Applies the current map filter strings to the selected data-table layer.
   *
   * If the layer already has a filtered record, the provided filter strings are applied;
   * otherwise the filter is cleared.
   *
   * @param mapId - The map id
   * @param filterStrings - The filter expression to apply
   */
  static applyMapFilters(mapId: string, filterStrings: string): void {
    const layerPath = getStoreDataTableSelectedLayerPath(mapId);
    const filter = getStoreMapFilteredRecord(mapId, layerPath) ? filterStrings : '';
    addOrUpdateStoreTableFilter(mapId, layerPath, filter);
    MapEventProcessor.applyLayerFilters(mapId, layerPath);
  }

  /**
   * Queries all feature info for a given layer path.
   *
   * @param mapId - The map id
   * @param layerPath - The layer path to query the features from
   * @returns A promise that resolves with the feature info result
   */
  static triggerGetAllFeatureInfo(mapId: string, layerPath: string): Promise<TypeFeatureInfoResult> {
    return MapEventProcessor.getMapViewer(mapId).controllers.layerSetController.allFeatureInfoLayerSet.queryLayer(layerPath);
  }

  /**
   * Resets the data-table features for a given layer path.
   *
   * Clears the queried features and resets the selected layer path in the store.
   *
   * @param mapId - The map id
   * @param layerPath - The layer path to reset the features for
   */
  static triggerResetFeatureInfo(mapId: string, layerPath: string): void {
    // Clear
    MapEventProcessor.getMapViewer(mapId).controllers.layerSetController.allFeatureInfoLayerSet.clearLayerFeatures(layerPath);

    // Update the layer data array in the store, all the time
    setStoreSelectedLayerPath(mapId, '');
  }

  // #endregion STATIC METHODS
}
