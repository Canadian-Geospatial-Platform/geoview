import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { QueryType } from '@/geo/map/map-schema-types';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { AbstractGVLayer } from '../gv-layers/abstract-gv-layer';
import { AbstractBaseLayer } from '../gv-layers/abstract-base-layer';
import { WMS } from '../geoview-layers/raster/wms';
import { GVWMS } from '../gv-layers/raster/gv-wms';
import { AbstractLayerSet, PropagationType } from './abstract-layer-set';
import {
  TypeAllFeatureInfoResultSet,
  TypeAllFeatureInfoResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';

/**
 * A Layer-set working with the LayerApi at handling a result set of registered layers and synchronizing
 * events happening on them (in this case when the user queries for all records within a layer) with a store
 * for UI updates.
 * @class AllFeatureInfoLayerSet
 */
export class AllFeatureInfoLayerSet extends AbstractLayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeAllFeatureInfoResultSet */
  declare resultSet: TypeAllFeatureInfoResultSet;

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
   * @returns {boolean} True when the layer should be registered to this all-feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): boolean {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    // Return if the layer is of queryable type and source is queryable
    return (
      super.onRegisterLayerCheck(layer, layerPath) &&
      AbstractLayerSet.isQueryableType(layer) &&
      !(layer instanceof WMS) &&
      !(layer instanceof GVWMS) &&
      AbstractLayerSet.isSourceQueryable(layer, layerPath)
    );
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractGeoViewLayer | AbstractBaseLayer} layer - The layer
   */
  protected override onRegisterLayer(layer: AbstractGeoViewLayer | AbstractBaseLayer, layerPath: string): void {
    // TODO: Refactor - Layers refactoring. Remove the layerPath parameter once hybrid work is done
    // Call parent
    super.onRegisterLayer(layer, layerPath);

    // Update the resultSet data
    this.resultSet[layerPath].eventListenerEnabled = true;
    this.resultSet[layerPath].queryStatus = 'processed';
    this.resultSet[layerPath].features = [];

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
  // TODO: (futur development) The queryType is a door opened to allow the triggering using a bounding box or a polygon.
  async queryLayer(layerPath: string, queryType: QueryType = 'all'): Promise<TypeAllFeatureInfoResultSet | void> {
    // FIXME: Watch out for code reentrancy between queries!
    // FIX.MECONT: Consider using a LIFO pattern, per layer path, as the race condition resolution
    // GV Each query should be distinct as far as the resultSet goes! The 'reinitialization' below isn't sufficient.
    // GV As it is (and was like this before events refactor), the this.resultSet is mutating between async calls.

    // If valid layer path
    if (this.resultSet[layerPath]) {
      // If event listener is disabled
      if (!this.resultSet[layerPath].eventListenerEnabled) return Promise.resolve();

      // Get the layer config and layer associated with the layer path
      const layer = this.layerApi.getGeoviewLayerHybrid(layerPath);

      // If layer was found
      if (layer && (layer instanceof AbstractGeoViewLayer || layer instanceof AbstractGVLayer)) {
        // If state is not queryable
        if (!AbstractLayerSet.isStateQueryable(layer, layerPath)) return Promise.resolve();

        // Flag processing
        this.resultSet[layerPath].queryStatus = 'processing';

        // Propagate to the store
        this.#propagateToStore(this.resultSet[layerPath]);

        // Process query on results data
        const promiseResult = AbstractLayerSet.queryLayerFeatures(this.resultSet[layerPath], layer, queryType, layerPath);

        // Wait for promise to resolve
        const arrayOfRecords = await promiseResult;

        // Keep the features retrieved
        this.resultSet[layerPath].features = arrayOfRecords;

        // When property features is undefined, we are waiting for the query result.
        // when Array.isArray(features) is true, the features property contains the query result.
        // when property features is null, the query ended with an error.
        this.resultSet[layerPath].queryStatus = arrayOfRecords ? 'processed' : 'error';
      } else {
        this.resultSet[layerPath].features = null;
        this.resultSet[layerPath].queryStatus = 'error';
      }

      // Propagate to the store
      this.#propagateToStore(this.resultSet[layerPath]);
    }

    // Return the resultsSet
    return this.resultSet;
  }
}
