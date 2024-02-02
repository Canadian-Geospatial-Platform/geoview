import { isEqual } from 'lodash';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeFeatureInfoResultsSet, EventType, TypeLayerData, TypeArrayOfLayerData } from '@/api/events/payloads/get-feature-info-payload';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { delay } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { GeochartEventProcessor } from './geochart-event-processor';

export type BatchedPropagationLayerDataArrayByMap = {
  [mapId: string]: TypeArrayOfLayerData[];
};

export class FeatureInfoEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use store action to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler
  // #region

  // Holds the list of layer data arrays being buffered in the propagation process for the batch
  static batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap = {};

  // The time delay between propagations in the batch layer data array.
  // The longer the delay, the more the layers will have a chance to get in a loaded state before changing the layerDataArray.
  // The longer the delay, the longer it'll take to update the UI.
  static timeDelayBetweenPropagationsForBatch = 1000;

  /**
   * Static method used to propagate feature info layer sets to the store
   *
   * @param {string} mapId The map identifier of the resul set modified.
   * @param {string} layerPath The layer path that has changed.
   * @param {EventType} eventType The event type that triggered the layer set update.
   * @param {TypeFeatureInfoResultsSet} resultsSet The resul sets associated to the map.
   */
  static propagateFeatureInfoToStore(mapId: string, layerPath: string, eventType: EventType, resultsSet: TypeFeatureInfoResultsSet) {
    // TODO: Refactor - Remove the unnecessary 'layerPath' parameter? It is kind of confusing.
    // TO.DOCONT: Indeed, the layerPath is irrelevant as the whole resultsSet is reprocessed.
    // TO.DOCONT: If the parameter is used only for logging purposes I'd suggest to name it clearly to remove confusion.
    const store = getGeoViewStore(mapId);
    const layerPathInResultsSet = Object.keys(resultsSet);

    if (eventType === 'click') {
      /**
       * Create a details object for each layer which is then used to render layers in details panel.
       */
      const layerDataArray = [] as TypeArrayOfLayerData;
      let atLeastOneFeature = false;
      layerPathInResultsSet.forEach((layerPathItem) => {
        const newLayerData: TypeLayerData = resultsSet?.[layerPathItem]?.data.click as TypeLayerData;
        if (!atLeastOneFeature) atLeastOneFeature = !!newLayerData.features?.length;
        const layerDataFound = layerDataArray.find((layerEntry) => layerEntry.layerPath === layerPathItem);
        if (layerDataFound) {
          if (!isEqual(layerDataFound, newLayerData)) {
            layerDataFound.features = newLayerData.features;
            layerDataFound.layerStatus = newLayerData.layerStatus;
            layerDataFound.layerName = newLayerData.layerName;
          }
        } else {
          layerDataArray.push(newLayerData);
        }
      });

      // Update the layer data array in the store, all the time, for all statuses
      store.getState().detailsState.actions.setLayerDataArray(layerDataArray);

      // If there was some features on this propagation
      if (atLeastOneFeature) {
        // If the current tab is not 'details' nor 'geochart', switch to details
        if (!['details', 'geochart'].includes(store.getState().uiState.activefooterTabId))
          store.getState().uiState.actions.setActiveFooterTab('details');
      }

      // Also propagate in the batched array
      FeatureInfoEventProcessor.propagateFeatureInfoToStoreBatch(mapId, layerDataArray);

      // Also propagate in the geochart arrays
      GeochartEventProcessor.propagateArrayDataToStore(mapId, layerDataArray);
    } else if (eventType === 'hover') {
      /**
       * Create a hover object for each layer which is then used to render layers
       */
      const hoverDataArray = [] as TypeArrayOfLayerData;
      layerPathInResultsSet.forEach((layerPathItem) => {
        const newLayerData: TypeLayerData = resultsSet?.[layerPathItem]?.data.hover as TypeLayerData;
        const layerDataFound = hoverDataArray.find((layerEntry) => layerEntry.layerPath === layerPathItem);
        if (layerDataFound) {
          if (!isEqual(layerDataFound, newLayerData)) {
            layerDataFound.features = newLayerData.features;
            layerDataFound.layerStatus = newLayerData.layerStatus;
            layerDataFound.layerName = newLayerData.layerName;
          }
        } else {
          hoverDataArray.push(newLayerData);
        }
      });

      store.getState().detailsState.actions.setHoverDataArray(hoverDataArray);
    } else if (eventType === 'all-features') {
      /**
       * Create a get all features info object for each layer which is then used to render layers
       */
      const allFeaturesDataArray = [] as TypeArrayOfLayerData;
      layerPathInResultsSet.forEach((layerPathItem) => {
        const newLayerData: TypeLayerData = resultsSet?.[layerPathItem]?.data['all-features'] as TypeLayerData;
        const layerDataFound = allFeaturesDataArray.find((layerEntry) => layerEntry.layerPath === layerPathItem);
        if (layerDataFound) {
          if (!isEqual(layerDataFound, newLayerData)) {
            layerDataFound.features = newLayerData.features;
            layerDataFound.layerStatus = newLayerData.layerStatus;
            layerDataFound.layerName = newLayerData.layerName;
          }
        } else {
          allFeaturesDataArray.push(newLayerData);
        }
      });

      store.getState().detailsState.actions.setAllFeaturesDataArray(allFeaturesDataArray);
    }
  }

  /**
   * Propagate feature info layer sets to the store in a batched manner, every 'timeDelayBetweenPropagationsForBatch' millisecond.
   * This is used to provide another 'layerDataArray', in the store, which updates less often so that we save a couple 'layerDataArray'
   * update triggers in the components that are listening to the store array.
   * The propagation can be bypassed using the store 'layerDataArrayBatchLayerPathBypass' state which tells the process to
   * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
   */
  static propagateFeatureInfoToStoreBatch(mapId: string, layerDataArray: TypeArrayOfLayerData): Promise<void> {
    // The store
    const store = getGeoViewStore(mapId);

    // Redirect to batch propagate
    return this.helperPropagateArrayStoreBatch(
      mapId,
      layerDataArray,
      this.batchedPropagationLayerDataArray,
      this.timeDelayBetweenPropagationsForBatch,
      store.getState().detailsState.actions.setLayerDataArrayBatch,
      'feature-info-processor',
      store.getState().detailsState.layerDataArrayBatchLayerPathBypass,
      store.getState().detailsState.actions.setLayerDataArrayBatchLayerPathBypass
    );
  }

  /**
   * Helper method to propagate in the layerDataArray in a batched manner.
   * The propagation can be bypassed using the store 'layerDataArrayBatchLayerPathBypass' state which tells the process to
   * immediately batch out the array in the store for faster triggering of the state, for faster updating of the UI.
   * @param {string} mapId The map id
   * @param {TypeArrayOfLayerData} layerDataArray The layer data array to hold in buffer during the batch
   * @param {BatchedPropagationLayerDataArrayByMap} batchPropagationObject A reference to the BatchedPropagationLayerDataArrayByMap object used to hold all the layer data arrays in the buffer
   * @param {number} timeDelayBetweenPropagations The delay between actual propagations in the store
   * @param {(layerDataArray: TypeArrayOfLayerData) => void} onSetLayerDataArray The store action callback used to store the layerDataArray in the actual store
   * @param {string} traceProcessorIndication? Simple parameter for logging purposes
   * @param {string} layerPathBypass? Indicates a layer path which, when processed, should bypass the buffer period and immediately trigger an update to the store
   * @param {(layerPath: string) => void} onResetBypass? The store action callback used to reset the layerPathBypass value in the store.
   *                                                     This is used so that when the bypass occurred once, it's not occuring again for all subsequent checks in the period of batch propagations.
   *                                                     It's up to the components to re-initialize the layerPathBypass at a certain time.
   *                                                     When no onResetBypass is specified, once the bypass occurs, all subsequent propagations happen immediately.
   */
  static async helperPropagateArrayStoreBatch(
    mapId: string,
    layerDataArray: TypeArrayOfLayerData,
    batchPropagationObject: BatchedPropagationLayerDataArrayByMap,
    timeDelayBetweenPropagations: number,
    onSetLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void,
    traceProcessorIndication?: string,
    layerPathBypass?: string,
    onResetBypass?: (layerPath: string) => void
  ): Promise<void> {
    // Log
    logger.logTraceDetailed('propagateArrayStoreBatch', mapId, traceProcessorIndication);

    // Make sure the batch propagation for the map exists
    // eslint-disable-next-line no-param-reassign
    if (!batchPropagationObject[mapId]) batchPropagationObject[mapId] = [];

    // Log
    // logger.logDebug('Propagate in batch - buffering...', mapId, traceProcessorIndication, batchPropagationObject[mapId].length);

    // Pile up the array
    batchPropagationObject[mapId].push(layerDataArray);

    // If there's a layer path bypass set
    let layerDataBypass;
    if (layerPathBypass) {
      // If the layerDataArray has the layer we have set as the bypass
      layerDataBypass = layerDataArray.find((layer) => layer.layerPath === layerPathBypass);
    }

    // If found the layer data according to the layer path to bypass
    let bypass = false;
    if (layerDataBypass) {
      // If it has features in a responded state
      if (layerDataBypass.queryStatus === 'processed' || layerDataBypass.queryStatus === 'error') {
        // Bypass
        bypass = true;

        // Log
        // logger.logDebug('Propagate in batch - bypass!', mapId, traceProcessorIndication, batchPropagationObject[mapId].length);

        // Reset the flag so it stops bypassing for the rest of the processing
        onResetBypass?.('');
      }
    }

    // If not bypassing the delay
    if (!bypass) {
      // Wait to batch the updates of the layerDataArray
      await delay(timeDelayBetweenPropagations);
    }

    // If any in the buffer
    if (batchPropagationObject[mapId].length) {
      // Alright, take the last one in the pile (the most recent updated state - as this is cumulative)
      const mostUpdatedState = batchPropagationObject[mapId][batchPropagationObject[mapId].length - 1];

      // Log
      // logger.logDebug(
      //   `Propagate in batch - buffered ${batchPropagationObject[mapId].length} layers`,
      //   mapId,
      //   traceProcessorIndication,
      //   JSON.parse(JSON.stringify(mostUpdatedState))
      // );

      // Propagate that one to the store
      onSetLayerDataArray(mostUpdatedState);

      // Empty the list
      // eslint-disable-next-line no-param-reassign
      batchPropagationObject[mapId] = [];
    }
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
