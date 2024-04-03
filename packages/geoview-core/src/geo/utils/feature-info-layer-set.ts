import { Coordinate } from 'ol/coordinate';
import { EVENT_NAMES } from '@/api/events/event-types';
import { payloadIsAMapMouseEvent } from '@/api/events/payloads';
import { api, LayerApi } from '@/app';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { logger } from '@/core/utils/logger';
import { getLocalizedValue } from '@/core/utils/utilities';
import { ConfigBaseClass } from '@/core/utils/config/validation-classes/config-base-class';
import { TypeLayerStatus } from '@/geo/map/map-schema-types';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';

import { EventType, LayerSet, TypeFeatureInfoEntry, TypeLayerData, TypeResultSet } from './layer-set';
import { AbstractBaseLayerEntryConfig } from '@/core/utils/config/validation-classes/abstract-base-layer-entry-config';

/**
 * A class containing a set of layers associated with a TypeLayerData object, which will receive the result of a
 * "get feature info" request made on the map layers when the user click a location on the map.
 *
 * @class FeatureInfoLayerSet
 */
export class FeatureInfoLayerSet extends LayerSet {
  /** The resultSet object as existing in the base class, retyped here as a TypeFeatureInfoResultSet */
  declare resultSet: TypeFeatureInfoResultSet;

  // Keep all callback delegate references
  #onQueryEndedHandlers: QueryEndedDelegate[] = [];

  /**
   * The class constructor that instanciate a set of layer.
   *
   * @param {LayerApi} layerApi The layer Api to work with.
   */
  constructor(layerApi: LayerApi) {
    super(layerApi);

    // Wire a listener on the map click
    this.setMapClickListener();
  }

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to check for condition to register a layer in its set.
   * @param {AbstractGeoViewLayer} geoviewLayer The geoview layer being registered
   * @param {string} layerPath The layer path
   */
  protected onRegisterLayerCheck = (geoviewLayer: AbstractGeoViewLayer, layerPath: string): boolean => {
    // Log
    logger.logTraceCore('FEATURE-INFO-LAYER-SET - onRegisterLayerCheck', layerPath, Object.keys(this.resultSet));

    const layerConfig = this.layerApi.registeredLayers[layerPath];
    const queryable = (layerConfig as AbstractBaseLayerEntryConfig)?.source?.featureInfo?.queryable;
    return !!queryable;
  };

  /**
   * Overrides the behavior to apply when a feature-info-layer-set wants to register a layer in its set.
   * @param {AbstractGeoViewLayer} geoviewLayer The geoview layer being registered
   * @param {string} layerPath The layer path
   */
  protected onRegisterLayer = (geoviewLayer: AbstractGeoViewLayer, layerPath: string): void => {
    // Log
    logger.logTraceCore('FEATURE-INFO-LAYER-SET - onRegisterLayer', layerPath, Object.keys(this.resultSet));

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
    FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, 'click', this.resultSet);
  };

  /**
   * Overrides the behavior to apply when a layer status changed for a feature-info-layer-set.
   * @param {ConfigBaseClass} config The layer config class
   * @param {string} layerPath The layer path being affected
   * @param {string} layerStatus The new layer status
   */
  protected onProcessLayerStatusChanged(config: ConfigBaseClass, layerPath: string, layerStatus: TypeLayerStatus): void {
    // if layer's status flag exists and is different than the new one
    if (this.resultSet?.[layerPath]?.layerStatus && this.resultSet?.[layerPath]?.layerStatus !== layerStatus) {
      if (layerStatus === 'error') delete this.resultSet[layerPath];
      else {
        // Call parent. After this call, this.resultSet?.[layerPath]?.layerStatus may have changed!
        super.onProcessLayerStatusChanged(config, layerPath, layerStatus);

        const layerConfig = this.layerApi.registeredLayers[layerPath];
        if (this?.resultSet?.[layerPath]?.data) {
          this.resultSet[layerPath].data.layerStatus = layerStatus;
          FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerConfig.layerPath, 'click', this.resultSet);
        }
      }
    }
  }

  /**
   * Emits an event to all handlers.
   * @param {QueryEndedEvent} event The event to emit
   */
  emitQueryEnded = (event: QueryEndedEvent) => {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onQueryEndedHandlers, event);
  };

  /**
   * Wires an event handler.
   * @param {QueryEndedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onQueryEnded = (callback: QueryEndedDelegate): void => {
    // Wire the event handler
    EventHelper.onEvent(this.#onQueryEndedHandlers, callback);
  };

  /**
   * Unwires an event handler.
   * @param {QueryEndedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offQueryEnded = (callback: QueryEndedDelegate): void => {
    // Unwire the event handler
    EventHelper.offEvent(this.#onQueryEndedHandlers, callback);
  };

  /**
   * Queries the features at the provided coordinate for all the registered layers.
   *
   * @param {Coordinate} longLatCoordinate The longitude/latitude coordinate where to query the features
   */
  queryLayers = async (longLatCoordinate: Coordinate): Promise<TypeFeatureInfoResultSet> => {
    // TODO: REFACTOR - Watch out for code reentrancy between queries!
    // GV Each query should be distinct as far as the resultSet goes! The 'reinitialization' below isn't sufficient.
    // GV As it is (and was like this befor events refactor), the this.resultSet is mutating between async calls.

    // Prepare to hold all promises of features in the loop below
    const allPromises: Promise<TypeFeatureInfoEntry[] | undefined | null>[] = [];

    // Query and event types of what we're doing
    const queryType = 'at_long_lat';
    const eventType = 'click';

    // Reinitialize the resultSet
    // Loop on each layer path in the resultSet
    Object.keys(this.resultSet).forEach((layerPath) => {
      const layerConfig = this.layerApi.registeredLayers[layerPath] as AbstractBaseLayerEntryConfig;
      const { data } = this.resultSet[layerPath];
      if (!data.eventListenerEnabled) return;
      if (layerConfig.layerStatus === 'loaded') {
        data.features = undefined;
        data.queryStatus = 'processing';

        // Process query on results data
        const promiseResult = this.queryLayerFeatures(data, layerConfig, layerPath, queryType, longLatCoordinate);

        // Add the promise
        allPromises.push(promiseResult);

        // When the promise is done, propagate to store
        promiseResult.then((arrayOfRecords) => {
          // Keep the features retrieved
          data.features = arrayOfRecords;
          data.layerStatus = layerConfig.layerStatus!;

          // When property features is undefined, we are waiting for the query result.
          // when Array.isArray(features) is true, the features property contains the query result.
          // when property features is null, the query ended with an error.
          data.queryStatus = arrayOfRecords ? 'processed' : 'error';

          // Propagate to store
          FeatureInfoEventProcessor.propagateFeatureInfoToStore(this.mapId, layerPath, eventType, this.resultSet);
        });
      } else {
        data.features = null;
        data.queryStatus = 'error';
      }
    });

    // Await for the promises to settle
    await Promise.allSettled(allPromises);

    // Emit the query layers has ended
    this.emitQueryEnded({ coordinate: longLatCoordinate, resultSet: this.resultSet, eventType });

    // Return the results
    return this.resultSet;
  };

  /**
   * Listen to "map click" and call a query for all registered layers at the clicked location.
   */
  setMapClickListener() {
    api.event.on(
      EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK,
      (payload) => {
        // Log
        logger.logTraceCoreAPIEvent('FEATURE-INFO-LAYER-SET on EVENT_NAMES.MAP.EVENT_MAP_SINGLE_CLICK', this.mapId, payload);

        if (payloadIsAMapMouseEvent(payload)) {
          // Query all layers which can be queried
          this.queryLayers(payload.coordinates.lnglat);
        }
      },
      this.mapId
    );
  }

  /**
   * Function used to enable listening of click events. When a layer path is not provided,
   * click events listening is enabled for all layers
   *
   * @param {string} layerPath Optional parameter used to enable only one layer
   */
  enableClickListener(layerPath?: string) {
    if (layerPath) this.resultSet[layerPath].data.eventListenerEnabled = true;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.eventListenerEnabled = true;
      });
  }

  /**
   * Function used to disable listening of click events. When a layer path is not provided,
   * click events listening is disable for all layers
   *
   * @param {string} layerPath Optional parameter used to disable only one layer
   */
  disableClickListener(layerPath?: string) {
    if (layerPath) this.resultSet[layerPath].data.eventListenerEnabled = false;
    else
      Object.keys(this.resultSet).forEach((key: string) => {
        this.resultSet[key].data.eventListenerEnabled = false;
      });
  }

  /**
   * Function used to determine whether click events are disabled for a layer. When a layer path is not provided,
   * the value returned is undefined if the map flags are a mixture of true and false values.
   *
   * @param {string} layerPath Optional parameter used to get the flag value of a layer.
   *
   * @returns {boolean | undefined} The flag value for the map or layer.
   */
  isClickListenerEnabled(layerPath?: string): boolean | undefined {
    if (layerPath) return !!this.resultSet?.[layerPath]?.data?.eventListenerEnabled;

    let returnValue: boolean | undefined;
    Object.keys(this.resultSet).forEach((key: string, i) => {
      if (i === 0) returnValue = this.resultSet[key].data.eventListenerEnabled;
      if (returnValue !== this.resultSet[key].data.eventListenerEnabled) returnValue = undefined;
    });
    return returnValue;
  }
}

export type TypeFeatureInfoResultSetEntry = {
  layerName?: string;
  layerStatus: TypeLayerStatus;
  data: TypeLayerData;
};

export type TypeFeatureInfoResultSet = {
  [layerPath: string]: TypeFeatureInfoResultSetEntry;
};

/**
 * Define a delegate for the event handler function signature
 */
type QueryEndedDelegate = EventDelegateBase<FeatureInfoLayerSet, QueryEndedEvent>;

/**
 * Define an event for the delegate
 */
export type QueryEndedEvent = {
  coordinate: Coordinate;
  resultSet: TypeResultSet;
  eventType: EventType;
};
