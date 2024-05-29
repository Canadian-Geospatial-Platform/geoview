import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { logger } from '@/core/utils/logger';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { QueryType, TypeLayerStatus } from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

import { AbstractLayerSet } from './abstract-layer-set';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';
import {
  TypeAllFeatureInfoResultSet,
  TypeAllFeatureInfoResultSetEntry,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';

/**
 * A class containing a set of layers associated with a TypeAllFeatureInfoResultSet object, which will receive the result of a
 * "get  all feature info" request made on a specific layer of the map. The query is made for one layer at a time.
 *
 * @class AllFeatureInfoLayerSet
 */
export class AllFeatureInfoLayerSet extends AbstractLayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeAllFeatureInfoResultSet */
  declare resultSet: TypeAllFeatureInfoResultSet;

  /**
   * Propagate to store
   * @param {TypeAllFeatureInfoResultSetEntry} resultSetEntry - The result entry to propagate
   * @private
   */
  #propagateToStore(resultSetEntry: TypeAllFeatureInfoResultSetEntry): void {
    DataTableEventProcessor.propagateFeatureInfoToStore(this.mapId, resultSetEntry);
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @returns {boolean} True when the layer should be registered to this all-feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layerConfig: ConfigBaseClass): boolean {
    // Log
    logger.logTraceCore('ALL-FEATURE-INFO-LAYER-SET - onRegisterLayerCheck', layerConfig.layerPath);

    // TODO: Make a util function for this check - this can be done prior to layer creation in config section
    // for some layer type, we know there is no data-table
    if (
      layerConfig.schemaTag &&
      [
        CONST_LAYER_TYPES.ESRI_IMAGE,
        CONST_LAYER_TYPES.IMAGE_STATIC,
        CONST_LAYER_TYPES.XYZ_TILES,
        CONST_LAYER_TYPES.VECTOR_TILES,
        CONST_LAYER_TYPES.WMS,
      ].includes(layerConfig.schemaTag)
    )
      return false;

    // TODO: there is a synching issue, sometimes source is undefined when layer is registered. To overcome this,
    // TO.DOCONT: if not specified to false by default, we will set it to true
    const queryable = (layerConfig as AbstractBaseLayerEntryConfig)?.source?.featureInfo?.queryable;
    return !!(queryable || queryable === undefined);
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  protected override onRegisterLayer(layerConfig: ConfigBaseClass): void {
    // Log
    logger.logTraceCore('ALL-FEATURE-INFO-LAYER-SET - onRegisterLayer', layerConfig.layerPath);

    // Call parent
    super.onRegisterLayer(layerConfig);

    // Update the resultSet data
    this.resultSet[layerConfig.layerPath].layerPath = layerConfig.layerPath;
    this.resultSet[layerConfig.layerPath].eventListenerEnabled = true;
    this.resultSet[layerConfig.layerPath].queryStatus = 'processed';
    this.resultSet[layerConfig.layerPath].features = [];

    // Propagate to store on registration
    this.#propagateToStore(this.resultSet[layerConfig.layerPath]);
    DataTableEventProcessor.setInitialSettings(this.mapId, layerConfig.layerPath);
  }

  /**
   * Overrides the behavior to apply when unregistering a layer from the all-feature-info-layer-set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   */
  protected override onUnregisterLayer(layerConfig: ConfigBaseClass): void {
    // Log
    logger.logTraceCore('ALL-FEATURE-INFO-LAYER-SET - onUnregisterLayer', layerConfig.layerPath);

    // Call parent
    super.onUnregisterLayer(layerConfig);

    // Remove it from data table info array
    DataTableEventProcessor.deleteFeatureAllInfo(this.mapId, layerConfig.layerPath);
  }

  /**
   * Overrides the behavior to apply when a layer status changed for a all-feature-info-layer-set.
   * @param {ConfigBaseClass} layerConfig - The layer config
   * @param {TypeLayerStatus} layerStatus - The new layer status
   */
  protected override onProcessLayerStatusChanged(layerConfig: ConfigBaseClass, layerStatus: TypeLayerStatus): void {
    // TODO: Refactor - This function (and the same function in feature-info-layer-set and hover-feature-info-layer-set) are all very similar if not identical
    // TO.DOCONT: Move the code to the mother class? Be mindful of legends-layer-set that also has a onProcessLayerStatusChanged which is different though.

    // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
    super.onProcessLayerStatusChanged(layerConfig, layerStatus);

    // If the layer status isn't an error
    if (layerStatus !== 'error') {
      // Propagate to the store on layer status changed
      this.#propagateToStore(this.resultSet[layerConfig.layerPath]);
    } else {
      // Layer is in error, unregister it immediately
      this.onUnregisterLayer(layerConfig);
    }
  }

  /**
   * Helper function used to launch the query on a layer to get all of its feature information.
   * @param {string} layerPath - The layerPath that will be queried
   * @param {QueryType} queryType - The query's type to perform
   * @returns {Promise<TypeAllFeatureInfoResultSet | void>} A promise which will hold the result of the query
   */
  // TODO: (futur development) The queryType is a door opened to allow the triggering using a bounding box or a polygon.
  async queryLayer(layerPath: string, queryType: QueryType = 'all'): Promise<TypeAllFeatureInfoResultSet | void> {
    // TODO: REFACTOR - Watch out for code reentrancy between queries!
    // TO.DOCONT: Consider using a LIFO pattern, per layer path, as the race condition resolution
    // GV Each query should be distinct as far as the resultSet goes! The 'reinitialization' below isn't sufficient.
    // GV As it is (and was like this before events refactor), the this.resultSet is mutating between async calls.

    // TODO: Refactor - Make this function throw an error instead of returning void as option of the promise (to have same behavior as feature-info-layer-set)

    // If valid layer path
    if (this.layerApi.isLayerEntryConfigRegistered(layerPath) && this.resultSet[layerPath]) {
      // If event listener disabled
      if (!this.resultSet[layerPath].eventListenerEnabled) return Promise.resolve();

      // Get the layer config and layer associated with the layer path
      const layer = this.layerApi.getGeoviewLayerHybrid(layerPath)!;
      const layerConfig = layer.getLayerConfig(layerPath)!;

      if (layerConfig.layerStatus === 'loaded' && layer) {
        this.resultSet[layerPath].features = undefined;
        this.resultSet[layerPath].queryStatus = 'processing';

        // Propagate to the store
        this.#propagateToStore(this.resultSet[layerConfig.layerPath]);

        // Process query on results data
        const promiseResult = AbstractLayerSet.queryLayerFeatures(this.resultSet[layerPath], layerConfig, layer, queryType, layerPath);

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
      this.#propagateToStore(this.resultSet[layerConfig.layerPath]);

      // Return the resultsSet
      return this.resultSet;
    }

    // Log the error
    logger.logError(`The queryLayer method cannot be used on an inexistant layer path (${layerPath})`);
    return Promise.resolve();
  }
}
