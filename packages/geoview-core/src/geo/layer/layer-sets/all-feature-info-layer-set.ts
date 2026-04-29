import type { QueryType, TypeFeatureInfoResult } from '@/api/types/map-schema-types';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { GVEsriImage } from '@/geo/layer/gv-layers/raster/gv-esri-image';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import {
  deleteStoreDataTableFeatureAllInfo,
  propagateFeatureInfoDataTableToStore,
  setStoreDataTableInitialSettings,
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

  /** The abort controllers per layer path */
  #abortControllers: { [layerPath: string]: AbortController } = {};

  // #region OVERRIDES

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
   *
   * @param layer - The layer
   * @returns True when the layer should be registered to this all-feature-info-layer-set
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
      this.controllerRegistry.uiController.showTabButton('data-table');
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

    // Propagate
    propagateFeatureInfoDataTableToStore(this.getMapId(), layerPath, 'init', undefined);

    // Extra initialization of settings
    setStoreDataTableInitialSettings(this.getMapId(), layerPath);
  }

  /**
   * Overrides the behavior to apply when deleting from the store.
   *
   * @param layerPath - The layer path to delete from the store
   */
  protected override onDeleteFromStore(layerPath: string): void {
    // Remove it from data table info array
    deleteStoreDataTableFeatureAllInfo(this.getMapId(), layerPath, () => {
      this.controllerRegistry.uiController.hideTabButton('data-table');
    });
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Helper function used to launch the query on a layer to get all of its feature information.
   *
   * @param layerPath - The layerPath that will be queried
   * @param queryType - The query type, default: AllFeatureInfoLayerSet.QUERY_TYPE
   * @returns A promise that resolves with the result of the query
   */
  // TODO: (future development) The queryType is a door opened to allow the triggering using a bounding box or a polygon.
  async queryLayer(layerPath: string, queryType: QueryType = AllFeatureInfoLayerSet.QUERY_TYPE): Promise<TypeFeatureInfoResult> {
    // Get the layer layer associated with the layer path
    const layer = this.layerDomain.getGeoviewLayerRegular(layerPath);

    // Propagate
    propagateFeatureInfoDataTableToStore(this.getMapId(), layerPath, 'processing', undefined);

    // Abort any in-flight query for this layer path
    this.#abortControllers[layerPath]?.abort();

    // Create a fresh AbortController for this query
    this.#abortControllers[layerPath] = new AbortController();
    const { signal } = this.#abortControllers[layerPath];

    try {
      // Process query on results data
      const promiseResult = await this.queryLayerFeatures(layer, queryType, layerPath, false, this.#abortControllers[layerPath]);

      // Get the array of records in the results
      const arrayOfRecords = promiseResult.results;

      // Align arrayOfRecords fields with layerConfig fields so callers receive the aligned data
      if (arrayOfRecords.length) {
        AbstractLayerSet.alignRecordsWithOutFields(layer.getLayerConfig(), arrayOfRecords);
      }

      // Only propagate to the store if this query has not been superseded by a newer one
      if (!signal.aborted && this.getRegisteredLayerPaths().includes(layerPath)) {
        propagateFeatureInfoDataTableToStore(this.getMapId(), layerPath, 'processed', arrayOfRecords);
      }

      // Return the result with aligned records
      return promiseResult;
    } catch (error: unknown) {
      // If aborted
      if (error instanceof RequestAbortedError || signal.aborted) {
        // Log
        logger.logDebug('Query aborted and replaced by another one.. keep spinning..');
      } else if (this.getRegisteredLayerPaths().includes(layerPath)) {
        // Log
        logger.logPromiseFailed('queryLayerFeatures in queryLayers in AllFeatureInfoLayerSet', error);

        // Propagate
        propagateFeatureInfoDataTableToStore(this.getMapId(), layerPath, 'error', undefined);
      }

      // Re-throw so the caller can handle the error
      throw error;
    }
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
    // Propagate
    propagateFeatureInfoDataTableToStore(this.getMapId(), layerPath, 'init', undefined);
  }

  // #endregion PUBLIC METHODS
}
