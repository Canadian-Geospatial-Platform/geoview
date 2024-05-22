import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { logger } from '@/core/utils/logger';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { getLocalizedValue } from '@/core/utils/utilities';
import { TypeLayerEntryConfig, TypeLayerStatus } from '@/geo/map/map-schema-types';
import { CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

import { AbstractLayerSet, QueryType, TypeLayerData } from './abstract-layer-set';
import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';

/**
 * A class containing a set of layers associated with a TypeLayerData object, which will receive the result of a
 * "get  all feature info" request made on a specific layer of the map. The query is made for one layer at a time.
 *
 * @class AllFeatureInfoLayerSet
 */
export class AllFeatureInfoLayerSet extends AbstractLayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeAllFeatureInfoResultSet */
  declare resultSet: TypeAllFeatureInfoResultSet;

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {TypeLayerEntryConfig} layerConfig - The layer config
   * @returns {boolean} True when the layer should be registered to this all-feature-info-layer-set.
   */
  protected override onRegisterLayerCheck(layerConfig: TypeLayerEntryConfig): boolean {
    // Log
    logger.logTraceCore('ALL-FEATURE-INFO-LAYER-SET - onRegisterLayerCheck', layerConfig.layerPath, Object.keys(this.resultSet));

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
    const queryable = layerConfig?.source?.featureInfo?.queryable;
    return !!(queryable || queryable === undefined);
  }

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
   * @param {TypeLayerEntryConfig} layerConfig - The layer config
   */
  protected override onRegisterLayer(layerConfig: TypeLayerEntryConfig): void {
    // Log
    logger.logTraceCore('ALL-FEATURE-INFO-LAYER-SET - onRegisterLayer', layerConfig.layerPath, Object.keys(this.resultSet));

    // Call parent
    super.onRegisterLayer(layerConfig);

    this.resultSet[layerConfig.layerPath] = {
      layerName: getLocalizedValue(layerConfig.layerName, AppEventProcessor.getDisplayLanguage(this.mapId)) ?? '',
      layerStatus: layerConfig.layerStatus!,
      data: {
        layerName: getLocalizedValue(layerConfig.layerName, AppEventProcessor.getDisplayLanguage(this.mapId)) ?? '',
        layerStatus: layerConfig.layerStatus!,
        eventListenerEnabled: true,
        queryStatus: 'processed',
        features: [],
        layerPath: layerConfig.layerPath,
      },
    };

    DataTableEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, this.resultSet);
    DataTableEventProcessor.setInitialSettings(this.mapId, layerConfig.layerPath);
  }

  /**
   * Overrides the behavior to apply when unregistering a layer from the all-feature-info-layer-set.
   * @param {TypeLayerEntryConfig} layerConfig - The layer config
   */
  protected override onUnregisterLayer(layerConfig: TypeLayerEntryConfig): void {
    // Log
    logger.logTraceCore('ALL-FEATURE-INFO-LAYER-SET - onUnregisterLayer', layerConfig.layerPath, Object.keys(this.resultSet));

    // Call parent
    super.onUnregisterLayer(layerConfig);

    // Remove it from data table info array
    DataTableEventProcessor.deleteFeatureAllInfo(this.mapId, layerConfig.layerPath);
  }

  /**
   * Overrides the behavior to apply when a layer status changed for a all-feature-info-layer-set.
   * @param {ConfigBaseClass} config - The layer config class
   * @param {string} layerPath - The layer path being affected
   * @param {string} layerStatus - The new layer status
   */
  protected override onProcessLayerStatusChanged(config: ConfigBaseClass, layerPath: string, layerStatus: TypeLayerStatus): void {
    // TODO: Refactor - This function (and the same function in feature-info-layer-set and hover-feature-info-layer-set) are all very similar if not identical
    // TO.DOCONT: Move the code to the mother class. Be mindful of legends-layer-set that also has a onProcessLayerStatusChanged which is different though.
    // TO.DOCONT: The status of layers should not matters to child layer set (all feature, feature, hover).
    // TO.DOCONT: The layer set is the one who decide who goes in and out of these 3 sets. So he knows the status of the layer and if
    // TO.DOCONT: not loaded he does not add the layer to the sets. If a layer becomes unstable and get in error, layer set will remove the layers
    // TO.DOCONT: from al feature, feature and hover set.

    // if layer's status flag exists and is different than the new one
    if (this.resultSet?.[layerPath]?.layerStatus && this.resultSet?.[layerPath]?.layerStatus !== layerStatus) {
      if (layerStatus === 'error') delete this.resultSet[layerPath];
      else {
        // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
        super.onProcessLayerStatusChanged(config, layerPath, layerStatus);

        const layerConfig = this.layerApi.getLayerEntryConfig(layerPath)!;
        if (this?.resultSet?.[layerPath]?.data) {
          this.resultSet[layerPath].data.layerStatus = layerStatus;
          DataTableEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, this.resultSet);
        }
      }
    }
  }

  /**
   * Overrides behaviour when layer name is changed.
   * @param {string} layerPath - The layer path being affected
   * @param {string} name - The new layer name
   */
  protected override onProcessNameChanged(layerPath: string, name: string): void {
    if (this.resultSet?.[layerPath]) {
      // Change the layer name
      this.resultSet[layerPath].data.layerName = name;

      // Inform that the layer set has been updated
      this.onLayerSetUpdatedProcess(layerPath);

      // Propagate to store
      DataTableEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, this.resultSet);
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
    // GV As it is (and was like this befor events refactor), the this.resultSet is mutating between async calls.

    // TODO: Refactor - Make this function throw an error instead of returning void as option of the promise (to have same behavior as feature-info-layer-set)

    // If valid layer path
    if (this.layerApi.isLayerEntryConfigRegistered(layerPath) && this.resultSet[layerPath]) {
      const { data } = this.resultSet[layerPath];
      const layerConfig = this.layerApi.getLayerEntryConfig(layerPath)!;

      if (!this.resultSet[layerPath].data.eventListenerEnabled) return Promise.resolve();

      if (layerConfig.layerStatus === 'loaded') {
        data.features = undefined;
        data.queryStatus = 'processing';

        // Process query on results data
        const promiseResult = AllFeatureInfoLayerSet.queryLayerFeatures(data, layerConfig, layerPath, queryType, layerPath);

        // Wait for promise to resolve
        const arrayOfRecords = await promiseResult;

        // Keep the features retrieved
        data.features = arrayOfRecords;
        data.layerStatus = layerConfig.layerStatus!;

        // When property features is undefined, we are waiting for the query result.
        // when Array.isArray(features) is true, the features property contains the query result.
        // when property features is null, the query ended with an error.
        data.queryStatus = arrayOfRecords ? 'processed' : 'error';
      } else {
        data.features = null;
        data.queryStatus = 'error';
      }

      // Propagate to the store
      DataTableEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, this.resultSet);

      // Return the resultsSet
      return this.resultSet;
    }

    // Log the error
    logger.logError(`The queryLayer method cannot be used on an inexistant layer path (${layerPath})`);
    return Promise.resolve();
  }
}

export type TypeAllFeatureInfoResultSetEntry = {
  layerName?: string;
  layerStatus: TypeLayerStatus;
  data: TypeLayerData;
};

export type TypeAllFeatureInfoResultSet = {
  [layerPath: string]: TypeAllFeatureInfoResultSetEntry;
};
