import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import type { QueryType, TypeFeatureInfoEntry } from '@/api/types/map-schema-types';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import type { AbstractBaseGVLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import type { PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import { AbstractLayerSet } from '@/geo/layer/layer-sets/abstract-layer-set';
import type {
  TypeAllFeatureInfoResultSet,
  TypeAllFeatureInfoResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { RequestAbortedError } from '@/core/exceptions/core-exceptions';

/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user queries for all records within a layer) with a store
 * for UI updates.
 * @class AllFeatureInfoLayerSet
 */
export class AllFeatureInfoLayerSet extends AbstractLayerSet {
  /** The query type */
  static QUERY_TYPE: QueryType = 'all';

  /** The resultSet object as existing in the base class, retyped here as a TypeAllFeatureInfoResultSet */
  declare resultSet: TypeAllFeatureInfoResultSet;

  // Keep all abort controllers per layer path
  #abortControllers: { [layerPath: string]: AbortController } = {};

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractBaseGVLayer} layer - The layer
   * @returns {boolean} True when the layer should be registered to this all-feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseGVLayer): boolean {
    // Return if the layer is of queryable type and source is queryable
    let isQueryable =
      super.onRegisterLayerCheck(layer) && AbstractLayerSet.isQueryableType(layer) && AbstractLayerSet.isSourceQueryable(layer);

    // In the case of a GVWMS, also check if we has a way to retrieve vector data
    if (isQueryable && layer instanceof GVWMS) {
      // If we have a WFS layer config associated with the WMS
      isQueryable = layer.getLayerConfig().hasWfsLayerConfig();
    }

    // Return
    return isQueryable;
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractBaseGVLayer} layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseGVLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // Update the resultSet data
    const layerPath = layer.getLayerPath();
    this.resultSet[layerPath].queryStatus = 'processed';
    this.resultSet[layerPath].features = undefined;

    // Extra initialization of settings
    DataTableEventProcessor.setInitialSettings(this.getMapId(), layerPath);
  }

  /**
   * Overrides the behavior to apply when propagating to the store
   * @param {TypeAllFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate
   * @param {PropagationType} type - The propagation type
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onPropagateToStore(resultSetEntry: TypeAllFeatureInfoResultSetEntry, type: PropagationType): void {
    // Redirect
    this.#propagateToStore(resultSetEntry);
  }

  /**
   * Overrides the behavior to apply when deleting from the store
   * @param {string} layerPath - The layer path to delete from the store
   */
  protected override onDeleteFromStore(layerPath: string): void {
    // Remove it from data table info array
    DataTableEventProcessor.deleteFeatureAllInfo(this.getMapId(), layerPath);
  }

  /**
   * Helper function used to launch the query on a layer to get all of its feature information.
   * @param {string} layerPath - The layerPath that will be queried
   * @param {QueryType} queryType - The query type, default: AllFeatureInfoLayerSet.QUERY_TYPE.
   * @returns {Promise<TypeFeatureInfoEntry[] | void>} A promise which will hold the result of the query
   * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
   */
  // TODO: (future development) The queryType is a door opened to allow the triggering using a bounding box or a polygon.
  queryLayer(layerPath: string, queryType: QueryType = AllFeatureInfoLayerSet.QUERY_TYPE): Promise<TypeFeatureInfoEntry[] | void> {
    // FIXME: Watch out for code reentrancy between queries!
    // FIX.MECONT: The AbortController and the 'isDisabled' flag help a lot, but there could be some minor timing issues left
    // FIX.MECONT: with the mutating this.resultSet.
    // FIX.MECONT: Consider using a LIFO pattern, per layer path, as the race condition resolution.

    // If valid layer path
    if (this.resultSet[layerPath]) {
      // Get the layer config and layer associated with the layer path
      const layer = this.layerApi.getGeoviewLayer(layerPath);

      // If layer was found and of right type
      if (layer instanceof AbstractGVLayer) {
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
        const promiseResult = AbstractLayerSet.queryLayerFeatures(
          this.layerApi,
          layer,
          queryType,
          layerPath,
          false,
          this.#abortControllers[layerPath]
        );

        // When the promise is done, propagate to store
        promiseResult
          .then((arrayOfRecords) => {
            // Use the response to align arrayOfRecords fields with layerConfig fields
            if (arrayOfRecords.length) {
              AbstractLayerSet.alignRecordsWithOutFields(layer.getLayerConfig(), arrayOfRecords);
            }

            // Keep the features retrieved
            this.resultSet[layerPath].features = arrayOfRecords;

            // Query was processed
            this.resultSet[layerPath].queryStatus = 'processed';
          })
          .catch((error: unknown) => {
            // If aborted
            if (error instanceof RequestAbortedError) {
              // Log
              logger.logDebug('Query aborted and replaced by another one.. keep spinning..');
            } else {
              // Error
              this.resultSet[layerPath].features = null;
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

            // Propagate to the store
            this.#propagateToStore(this.resultSet[layerPath]);
          });

        // Return the promise
        return promiseResult;
      }

      // Error
      this.resultSet[layerPath].features = null;
      this.resultSet[layerPath].queryStatus = 'error';

      // Propagate to the store
      this.#propagateToStore(this.resultSet[layerPath]);
    }

    // Return empty
    return Promise.resolve();
  }

  /**
   * Clears all stored features for a specific layer in the Feature Info result set.
   * If the given `layerPath` exists in the internal `resultSet`, this method:
   * - Sets its `features` property to `null`, effectively removing all features.
   * - Propagates the updated layer result to the external store.
   * If the layer path does not exist in the result set, the method does nothing.
   * @param {string} layerPath - The unique path identifying the layer to clear.
   * @returns {void}
   */
  clearLayerFeatures(layerPath: string): void {
    // If valid layer path
    if (!this.resultSet[layerPath]) return;

    // Clear features
    this.resultSet[layerPath].features = null;

    // Propagate to the store
    this.#propagateToStore(this.resultSet[layerPath]);
  }

  /**
   * Propagates the resultSetEntry to the store
   * @param {TypeAllFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate to the store
   * @private
   */
  #propagateToStore(resultSetEntry: TypeAllFeatureInfoResultSetEntry): void {
    // Only if the layerStatus is loaded
    if (resultSetEntry.layerStatus === 'loaded') {
      // Propagate
      DataTableEventProcessor.propagateFeatureInfoToStore(this.getMapId(), resultSetEntry);
    }
  }
}
