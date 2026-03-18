import type { QueryType, TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import {
  deleteStoreFeatureAllInfo,
  propagateFeatureInfoDataTableToStore,
  setStoreInitialSettings,
  type TypeAllFeatureInfoResultSet,
  type TypeAllFeatureInfoResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';
import { logger } from '@/core/utils/logger';

/**
 * A Layer-set working with the LayerSetController at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user queries for all records within a layer) with a store
 * for UI updates.
 */
export class AllFeatureInfoLayerSet extends AbstractLayerSet {
  /** The query type */
  static QUERY_TYPE: QueryType = 'all';

  /** The resultSet object as existing in the base class, retyped here as a TypeAllFeatureInfoResultSet */
  declare resultSet: TypeAllFeatureInfoResultSet;

  /** The abort controllers per layer path */
  #abortControllers: { [layerPath: string]: AbortController } = {};

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
   *
   * @param layer - The layer
   * @returns True when the layer should be registered to this all-feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
    // Want to exclude ESRI Image layers. They have "features", but probably not useful
    if (layer instanceof GVEsriImage) return false;

    // Return if the layer is of queryable type and source is queryable
    let isQueryable =
      super.onRegisterLayerCheck(layer) && AbstractLayerSet.isQueryableType(layer) && AbstractLayerSet.isSourceQueryable(layer);

    // In the case of a GVWMS, also check if we has a way to retrieve vector data
    if (isQueryable && layer instanceof GVWMS) {
      // If we have a WFS layer config associated with the WMS
      isQueryable = layer.getLayerConfig().hasWfsLayerConfig();
    }

    if (isQueryable) {
      this.mapViewer.controllers.uiController.showTabButton('data-table');
    }

    // Return
    return isQueryable;
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
   *
   * @param layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseGVLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // Update the resultSet data
    const layerPath = layer.getLayerPath();
    this.resultSet[layerPath].queryStatus = 'init';
    this.resultSet[layerPath].features = undefined;

    // Extra initialization of settings
    setStoreInitialSettings(this.getMapId(), layerPath);
  }

  /**
   * Overrides the behavior to apply when propagating to the store.
   *
   * @param resultSetEntry - The result set entry to propagate
   * @param type - The propagation type
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onPropagateToStore(resultSetEntry: TypeAllFeatureInfoResultSetEntry, type: PropagationType): void {
    // Redirect - Add layer to the list after registration
    this.#propagateToStore(resultSetEntry);
  }

  /**
   * Overrides the behavior to apply when deleting from the store.
   *
   * @param layerPath - The layer path to delete from the store
   */
  protected override onDeleteFromStore(layerPath: string): void {
    // Remove it from data table info array
    deleteStoreFeatureAllInfo(this.getMapId(), layerPath, () => {
      this.mapViewer.controllers.uiController.hideTabButton('data-table');
    });
  }

  /**
   * Helper function used to launch the query on a layer to get all of its feature information.
   *
   * @param layerPath - The layerPath that will be queried
   * @param queryType - The query type, default: AllFeatureInfoLayerSet.QUERY_TYPE
   * @returns A promise that resolves with the result of the query
   */
  // TODO: (future development) The queryType is a door opened to allow the triggering using a bounding box or a polygon.
  queryLayer(layerPath: string, queryType: QueryType = AllFeatureInfoLayerSet.QUERY_TYPE): Promise<TypeFeatureInfoResult> {
    // FIXME: Watch out for code reentrancy between queries!
    // FIX.MECONT: The AbortController and the 'isDisabled' flag help a lot, but there could be some minor timing issues left
    // FIX.MECONT: with the mutating this.resultSet.
    // FIX.MECONT: Consider using a LIFO pattern, per layer path, as the race condition resolution.

    // If valid layer path
    if (this.resultSet[layerPath]) {
      // Get the layer config and layer associated with the layer path
      const layer = this.layerDomain.getGeoviewLayerRegular(layerPath);

      // Flag processing
      this.resultSet[layerPath].queryStatus = 'processing';

      // Disable all buttons until query is done so we do not have concurrent queries
      Object.keys(this.resultSet).forEach((path) => {
        this.resultSet[path].isDisabled = true;
      });

      // Propagate to the store
      this.#propagateToStore(this.resultSet[layerPath]);

      // If the layer path has an abort controller
      if (Object.keys(this.#abortControllers).includes(layerPath)) {
        // Abort it
        this.#abortControllers[layerPath].abort();
      }

      // Create an AbortController for the query
      this.#abortControllers[layerPath] = new AbortController();

      // Process query on results data
      const promise = this.queryLayerFeatures(layer, queryType, layerPath, false, this.#abortControllers[layerPath]);

      // When the promise is done, propagate to store
      promise
        .then((promiseResult) => {
          // Guard against the layer having been removed during the query
          if (!this.resultSet[layerPath]) return;

          // Get the array of records in the results
          const arrayOfRecords = promiseResult.results;

          // Use the response to align arrayOfRecords fields with layerConfig fields
          if (arrayOfRecords.length) {
            AbstractLayerSet.alignRecordsWithOutFields(layer.getLayerConfig(), arrayOfRecords);
          }

          // Keep the features retrieved
          this.resultSet[layerPath].features = arrayOfRecords;
          this.resultSet[layerPath].queryStatus = 'processed';
        })
        .catch((error: unknown) => {
          // If aborted
          if (error instanceof RequestAbortedError) {
            // Log
            logger.logDebug('Query aborted and replaced by another one.. keep spinning..');
          } else if (this.resultSet[layerPath]) {
            // Error
            this.resultSet[layerPath].features = undefined;
            this.resultSet[layerPath].queryStatus = 'error';

            // Log
            logger.logPromiseFailed('queryLayerFeatures in queryLayers in AllFeatureInfoLayerSet', error);
          }
        })
        .finally(() => {
          // Enable all buttons since query is done
          Object.keys(this.resultSet).forEach((path) => {
            this.resultSet[path].isDisabled = false;
          });

          // Propagate to the store (guard against the layer having been removed during the query)
          if (this.resultSet[layerPath]) {
            this.#propagateToStore(this.resultSet[layerPath]);
          }
        });

      // Return the promise
      return promise;
    }

    // Return empty
    return Promise.resolve({ results: [] });
  }

  /**
   * Clears all stored features for a specific layer in the Feature Info result set.
   *
   * If the given `layerPath` exists in the internal `resultSet`, this method:
   * - Sets its `features` property to `null`, effectively removing all features.
   * - Propagates the updated layer result to the external store.
   * If the layer path does not exist in the result set, the method does nothing.
   *
   * @param layerPath - The unique path identifying the layer to clear
   */
  clearLayerFeatures(layerPath: string): void {
    // If valid layer path
    if (!this.resultSet[layerPath]) return;

    // Clear features
    this.resultSet[layerPath].features = undefined;
    this.resultSet[layerPath].queryStatus = 'init';

    // Propagate to the store
    this.#propagateToStore(this.resultSet[layerPath]);
  }

  /**
   * Propagates the resultSetEntry to the store.
   *
   * @param resultSetEntry - The result set entry to propagate to the store
   */
  #propagateToStore(resultSetEntry: TypeAllFeatureInfoResultSetEntry): void {
    // Propagate
    propagateFeatureInfoDataTableToStore(this.getMapId(), resultSetEntry);
  }
}
