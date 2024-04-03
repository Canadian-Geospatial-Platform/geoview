import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { logger } from '@/core/utils/logger';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { getLocalizedValue } from '@/core/utils/utilities';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { AbstractGeoViewLayer, CONST_LAYER_TYPES } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

import { LayerSet, QueryType, TypeLayerData } from './layer-set';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

/**
 * A class containing a set of layers associated with a TypeLayerData object, which will receive the result of a
 * "get  all feature info" request made on a specific layer of the map. The query is made for one layer at a time.
 *
 * @class AllFeatureInfoLayerSet
 */
export class AllFeatureInfoLayerSet extends LayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeAllFeatureInfoResultSet */
  declare resultSet: TypeAllFeatureInfoResultSet;

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractGeoViewLayer} geoviewLayer The geoview layer being registered
   * @param {string} layerPath The layer path
   */
  protected onRegisterLayerCheck = (geoviewLayer: AbstractGeoViewLayer, layerPath: string): boolean => {
    // Log
    logger.logTraceCore('ALL-FEATURE-INFO-LAYER-SET - onRegisterLayerCheck', layerPath, Object.keys(this.resultSet));

    // TODO: Make a util function for this check
    if (
      [
        CONST_LAYER_TYPES.ESRI_IMAGE,
        CONST_LAYER_TYPES.IMAGE_STATIC,
        CONST_LAYER_TYPES.XYZ_TILES,
        CONST_LAYER_TYPES.VECTOR_TILES,
        CONST_LAYER_TYPES.WMS,
      ].includes(geoviewLayer.type)
    )
      return false;

    const layerConfig = this.layerApi.registeredLayers[layerPath];
    const queryable = (layerConfig as AbstractBaseLayerEntryConfig)?.source?.featureInfo?.queryable;
    return !!queryable;
  };

  /**
   * Overrides the behavior to apply when an all-feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractGeoViewLayer} geoviewLayer The geoview layer being registered
   * @param {string} layerPath The layer path
   */
  protected onRegisterLayer = (geoviewLayer: AbstractGeoViewLayer, layerPath: string): void => {
    // Log
    logger.logTraceCore('ALL-FEATURE-INFO-LAYER-SET - onRegisterLayer', layerPath, Object.keys(this.resultSet));

    const layerConfig = this.layerApi.registeredLayers[layerPath];
    this.resultSet[layerPath] = {
      layerName: getLocalizedValue(layerConfig.layerName, this.mapId) ?? '',
      layerStatus: layerConfig.layerStatus!,
      data: {
        layerName: getLocalizedValue(layerConfig.layerName, this.mapId) ?? '',
        layerStatus: layerConfig.layerStatus!,
        eventListenerEnabled: true,
        queryStatus: 'processed',
        features: [],
        layerPath,
      },
    };

    FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, 'all-features', this.resultSet);
  };

  /**
   * Overrides the behavior to apply when a layer status changed for a all-feature-info-layer-set.
   * @param {ConfigBaseClass} config The layer config class
   * @param {string} layerPath The layer path being affected
   * @param {string} layerStatus The new layer status
   */
  protected onProcessLayerStatusChanged(config: ConfigBaseClass, layerPath: string, layerStatus: TypeLayerStatus): void {
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

        const layerConfig = this.layerApi.registeredLayers[layerPath];
        if (this?.resultSet?.[layerPath]?.data) {
          this.resultSet[layerPath].data.layerStatus = layerStatus;
          FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, 'all-features', this.resultSet);
        }
      }
    }
  }

  /**
   * Helper function used to launch the query on a layer to get all of its feature information
   *
   * @param {string} layerPath The layerPath that will be queried.
   * @param {QueryType} queryType the query's type to perform
   */
  // TODO: (futur development) The queryType is a door opened to allow the triggering using a bounding box or a polygon.
  async queryLayer(layerPath: string, queryType: QueryType = 'all'): Promise<TypeAllFeatureInfoResultSet | void> {
    // TODO: REFACTOR - Watch out for code reentrancy between queries!
    // GV Each query should be distinct as far as the resultSet goes! The 'reinitialization' below isn't sufficient.
    // GV As it is (and was like this befor events refactor), the this.resultSet is mutating between async calls.

    // TODO: Refactor - Make this function throw an error instead of returning void as option of the promise

    // If valid layer path
    if (this.layerApi.registeredLayers[layerPath] && this.resultSet[layerPath]) {
      const { data } = this.resultSet[layerPath];
      const layerConfig = this.layerApi.registeredLayers[layerPath] as AbstractBaseLayerEntryConfig;

      // Query and event types of what we're doing
      const eventType = 'all-features';

      if (!this.resultSet[layerPath].data.eventListenerEnabled) return Promise.resolve();

      if (layerConfig.layerStatus === 'loaded') {
        data.features = undefined;
        data.queryStatus = 'processing';

        // Process query on results data
        const promiseResult = this.queryLayerFeatures(data, layerConfig, layerPath, queryType, layerPath);

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
      FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, eventType, this.resultSet);

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
