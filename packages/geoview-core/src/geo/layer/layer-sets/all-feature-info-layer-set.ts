import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { QueryType, TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { AbstractBaseLayer } from '@/geo/layer/gv-layers/abstract-base-layer';
import { GVWMS } from '@/geo/layer/gv-layers/raster/gv-wms';
import { AbstractLayerSet, PropagationType } from '@/geo/layer/layer-sets/abstract-layer-set';
import {
  TypeAllFeatureInfoResultSet,
  TypeAllFeatureInfoResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { AbortError } from '@/core/exceptions/geoview-exceptions';

/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user queries for all records within a layer) with a store
 * for UI updates.
 * @class AllFeatureInfoLayerSet
 */
export class AllFeatureInfoLayerSet extends AbstractLayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeAllFeatureInfoResultSet */
  declare resultSet: TypeAllFeatureInfoResultSet;

  // Keep all abort controllers per layer path
  #abortControllers: { [layerPath: string]: AbortController } = {};

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractBaseLayer} layer - The layer
   * @returns {boolean} True when the layer should be registered to this all-feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layer: AbstractBaseLayer): boolean {
    // Return if the layer is of queryable type and source is queryable
    return (
      super.onRegisterLayerCheck(layer) &&
      AbstractLayerSet.isQueryableType(layer) &&
      !(layer instanceof GVWMS) &&
      AbstractLayerSet.isSourceQueryable(layer)
    );
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractBaseLayer} layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractBaseLayer): void {
    // Call parent
    super.onRegisterLayer(layer);

    // Update the resultSet data
    const layerPath = layer.getLayerPath();
    this.resultSet[layerPath].eventListenerEnabled = true;
    this.resultSet[layerPath].queryStatus = 'processed';
    this.resultSet[layerPath].features = undefined;

    // Extra initialization of settings
    DataTableEventProcessor.setInitialSettings(this.getMapId(), layerPath);
  }

  /**
   * Overrides the behavior to apply when propagating to the store
   * @param {TypeAllFeatureInfoResultSetEntry} resultSetEntry - The result set entry to propagate
   */
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  protected override onPropagateToStore(resultSetEntry: TypeAllFeatureInfoResultSetEntry, type: PropagationType): void {
    // Redirect
    this.#propagateToStore(resultSetEntry);
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
   * @param {QueryType} queryType - The query's type to perform
   * @returns {Promise<TypeAllFeatureInfoResultSet | void>} A promise which will hold the result of the query
   */
  // TODO: (future development) The queryType is a door opened to allow the triggering using a bounding box or a polygon.
  queryLayer(layerPath: string, queryType: QueryType = 'all'): Promise<TypeAllFeatureInfoResultSet | void> {
    // FIXME: Watch out for code reentrancy between queries!
    // FIX.MECONT: Consider using a LIFO pattern, per layer path, as the race condition resolution
    // GV Each query should be distinct as far as the resultSet goes! The 'reinitialization' below isn't sufficient.
    // GV As it is (and was like this before events refactor), the this.resultSet is mutating between async calls.

    // If valid layer path
    if (this.resultSet[layerPath]) {
      // If event listener is disabled
      if (!this.resultSet[layerPath].eventListenerEnabled) return Promise.resolve();

      // Get the layer config and layer associated with the layer path
      const layer = this.layerApi.getGeoviewLayer(layerPath);

      // If layer was found
      if (layer && layer instanceof AbstractGVLayer) {
        // If state is not queryable
        if (!AbstractLayerSet.isStateQueryable(layer)) return Promise.resolve();

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
        const promiseResult = AbstractLayerSet.queryLayerFeatures(layer, queryType, layerPath, false, this.#abortControllers[layerPath])
          .then((arrayOfRecords) => {
            // Use the response to align arrayOfRecords fields with layerConfig fields
            if (arrayOfRecords.length) {
              AbstractLayerSet.alignRecordsWithOutFields(
                this.layerApi.getLayerEntryConfig(layerPath) as TypeLayerEntryConfig,
                arrayOfRecords
              );
            }

            // Keep the features retrieved
            this.resultSet[layerPath].features = arrayOfRecords;

            // Query was processed
            this.resultSet[layerPath].queryStatus = 'processed';
          })
          .catch((error) => {
            // If aborted
            if (AbortError.isAbortError(error)) {
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
}
