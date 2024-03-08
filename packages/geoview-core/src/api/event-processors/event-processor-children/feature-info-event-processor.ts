import { GeoviewStoreType, IFeatureInfoState } from '@/core/stores';
import { EventType, TypeLayerData, TypeArrayOfLayerData } from '@/api/events/payloads/get-feature-info-payload';
import { logger } from '@/core/utils/logger';

import { AbstractEventProcessor, BatchedPropagationLayerDataArrayByMap } from '../abstract-event-processor';
import { UIEventProcessor } from './ui-event-processor';
import { TypeFeatureInfoResultSet } from '@/geo/utils/feature-info-layer-set';

/**
 * Event processor focusing on interacting with the feature info state in the store (currently called detailsState).
 */
export class FeatureInfoEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use the defined store actions below to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler

  // #region
  // Holds the list of layer data arrays being buffered in the propagation process for the batch
  private static batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap = {};

  // The time delay between propagations in the batch layer data array.
  // The longer the delay, the more the layers will have a chance to get in a loaded state before changing the layerDataArray.
  // The longer the delay, the longer it'll take to update the UI. The delay can be bypassed using the layer path bypass method.
  private static timeDelayBetweenPropagationsForBatch = 1000;

  /**
   * Overrides initialization of the Feature Info Event Processor
   * @param {GeoviewStoreType} store The store associated with the Feature Info Event Processor
   * @returns An array of the subscriptions callbacks which were created
   */
  protected onInitialize(store: GeoviewStoreType): Array<() => void> | void {
    // Checks for udpated layers in layer order
    const unsubLayerRemoved = store.subscribe(
      (state) => state.mapState.orderedLayerInfo,
      (cur, prev) => {
        // Log
        logger.logTraceCoreStoreSubscription('FEATUREINFO EVENT PROCESSOR - orderedLayerInfo', cur);

        // For each layer path in the layer data array
        const curOrderedLayerPaths = cur.map((layerInfo) => layerInfo.layerPath);
        const prevOrderedLayerPaths = prev.map((layerInfo) => layerInfo.layerPath);
        store
          .getState()
          .detailsState.layerDataArray.map((layerInfo) => layerInfo.layerPath)
          .forEach((layerPath) => {
            // If it was in the layer data array and is not anymore
            if (prevOrderedLayerPaths.includes(layerPath) && !curOrderedLayerPaths.includes(layerPath)) {
              // Remove it from feature info array
              FeatureInfoEventProcessor.deleteFeatureInfo(store.getState().mapId, layerPath);

              // Remove it from hover array
              FeatureInfoEventProcessor.deleteFeatureHoverInfo(store.getState().mapId, layerPath);

              // Remove it from all features array
              FeatureInfoEventProcessor.deleteFeatureAllInfo(store.getState().mapId, layerPath);

              // Log
              logger.logInfo('Removed Feature Info in stores for layer path:', layerPath);
            }
          });
      }
    );

    return [unsubLayerRemoved];
  }

  /**
   * Shortcut to get the Feature Info state for a given map id
   * @param {string} mapId The mapId
   * @returns {IFeatureInfoState} The Feature Info state
   */
  protected static getFeatureInfoState(mapId: string): IFeatureInfoState {
    // Return the feature info state
    return super.getState(mapId).detailsState;
  }

  /**
   * Deletes the specified layer path from the layer sets in the store
   * @param {string} mapId The map identifier
   * @param {string} layerPath The layer path to delete
   */
  private static deleteFeatureInfo(mapId: string, layerPath: string) {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    // Redirect to helper function
    this.deleteFromArray(featureInfoState.layerDataArray, layerPath, (layerArrayResult) => {
      // Update the layer data array in the store
      featureInfoState.actions.setLayerDataArray(layerArrayResult);

      // Also propagate in the batched array
      FeatureInfoEventProcessor.propagateFeatureInfoToStoreBatch(mapId, layerArrayResult);
    });
  }

  /**
   * Deletes the specified layer path from the hover layers sets in the store
   * @param {string} mapId The map identifier
   * @param {string} layerPath The layer path to delete
   */
  private static deleteFeatureHoverInfo(mapId: string, layerPath: string) {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    // Redirect to helper function
    this.deleteFromArray(featureInfoState.hoverDataArray, layerPath, (layerArrayResult) => {
      // Update the layer data array in the store
      featureInfoState.actions.setHoverDataArray(layerArrayResult);
    });
  }

  /**
   * Deletes the specified layer path from the all features layers sets in the store
   * @param {string} mapId The map identifier
   * @param {string} layerPath The layer path to delete
   */
  private static deleteFeatureAllInfo(mapId: string, layerPath: string) {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    // Redirect to helper function
    this.deleteFromArray(featureInfoState.allFeaturesDataArray, layerPath, (layerArrayResult) => {
      // Update the layer data array in the store
      featureInfoState.actions.setAllFeaturesDataArray(layerArrayResult);
    });
  }

  /**
   * Helper function to delete a layer information from an array when found
   * @param {TypeArrayOfLayerData} layerArray The layer array to work with
   * @param {string} layerPath The layer path to delete
   * @param {(layerArray: TypeArrayOfLayerData) => void} onDeleteCallback The callback executed when the array is updated
   */
  private static deleteFromArray(
    layerArray: TypeArrayOfLayerData,
    layerPath: string,
    onDeleteCallback: (layerArray: TypeArrayOfLayerData) => void
  ) {
    // Find the layer data info to delete from the array
    const layerDataInfoToDelIndex = layerArray.findIndex((layerInfo) => layerInfo.layerPath === layerPath);

    // If found
    if (layerDataInfoToDelIndex >= 0) {
      // Remove from the array
      layerArray.splice(layerDataInfoToDelIndex, 1);

      // Callback with updated array
      onDeleteCallback(layerArray);
    }
  }

  /**
   * Propagates feature info layer sets to the store
   *
   * @param {string} mapId The map identifier of the modified result set.
   * @param {string} layerPath The layer path that has changed.
   * @param {EventType} eventType The event type that triggered the layer set update.
   * @param {TypeFeatureInfoResultSet} resultSet The resul sets associated to the map.
   */
  static propagateFeatureInfoToStore(mapId: string, layerPath: string, eventType: EventType, resultSet: TypeFeatureInfoResultSet) {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    // Depending on the event type
    if (eventType === 'click') {
      /**
       * Create a details object for each layer which is then used to render layers in details panel.
       */
      const layerDataArray = [...featureInfoState.layerDataArray];
      if (!layerDataArray.find((layerEntry) => layerEntry.layerPath === layerPath))
        layerDataArray.push(resultSet?.[layerPath]?.data as TypeLayerData);
      const atLeastOneFeature = layerDataArray.find((layerEntry) => !!layerEntry.features?.length) || false;

      // Update the layer data array in the store, all the time, for all statuses
      featureInfoState.actions.setLayerDataArray(layerDataArray);

      // If there was some features on this propagation
      if (atLeastOneFeature) {
        // If the current tab is not 'details' nor 'geochart', switch to details
        if (!['details', 'geochart'].includes(UIEventProcessor.getActiveFooterBarTab(mapId)))
          UIEventProcessor.setActiveFooterBarTab(mapId, 'details');
      }

      // Also propagate in the batched array
      FeatureInfoEventProcessor.propagateFeatureInfoToStoreBatch(mapId, layerDataArray);
    } else if (eventType === 'hover') {
      /**
       * Create a hover object for each layer which is then used to render layers
       */
      const hoverDataArray = [...featureInfoState.hoverDataArray];
      if (!hoverDataArray.find((layerEntry) => layerEntry.layerPath === layerPath)) {
        hoverDataArray.push(resultSet?.[layerPath]?.data as TypeLayerData);
        featureInfoState.actions.setHoverDataArray(hoverDataArray);
      }
    } else if (eventType === 'all-features') {
      /**
       * Create a get all features info object for each layer which is then used to render layers
       */
      const allFeaturesDataArray = [...featureInfoState.allFeaturesDataArray];
      if (!allFeaturesDataArray.find((layerEntry) => layerEntry.layerPath === layerPath)) {
        allFeaturesDataArray.push(resultSet?.[layerPath]?.data);
        featureInfoState.actions.setAllFeaturesDataArray(allFeaturesDataArray);
      }
    }
  }

  /**
   * Propagates feature info layer sets to the store in a batched manner, every 'timeDelayBetweenPropagationsForBatch' millisecond.
   * This is used to provide another 'layerDataArray', in the store, which updates less often so that we save a couple 'layerDataArray'
   * update triggers in the components that are listening to the store array.
   * The propagation can be bypassed using the store 'layerDataArrayBatchLayerPathBypass' state which tells the process to
   * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
   * @param {string} mapId The map id
   * @param {string} layerDataArray The layer data array to batch on
   * @returns {Promise<void>} Promise upon completion
   */
  private static propagateFeatureInfoToStoreBatch(mapId: string, layerDataArray: TypeArrayOfLayerData): Promise<void> {
    // The feature info state
    const featureInfoState = this.getFeatureInfoState(mapId);

    // Redirect to batch propagate
    return this.helperPropagateArrayStoreBatch(
      mapId,
      layerDataArray,
      this.batchedPropagationLayerDataArray,
      this.timeDelayBetweenPropagationsForBatch,
      featureInfoState.actions.setLayerDataArrayBatch,
      'feature-info-processor',
      featureInfoState.layerDataArrayBatchLayerPathBypass,
      featureInfoState.actions.setLayerDataArrayBatchLayerPathBypass
    );
  }

  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
