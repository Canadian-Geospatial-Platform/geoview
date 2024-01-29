import { isEqual } from 'lodash';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeFeatureInfoResultsSet, EventType, TypeLayerData, TypeArrayOfLayerData } from '@/api/events/payloads/get-feature-info-payload';
import { getGeoViewStore } from '@/core/stores/stores-managers';
import { delay } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';

type BatchedPropagationLayerDataArrayByMap = {
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

  // The array of layer data array being batched
  static batchedPropagationLayerDataArray: BatchedPropagationLayerDataArrayByMap = {};

  // The time delay between propagations in the batch layer data array.
  // The longer the delay, the more the layers will have a chance to get in a loaded state before changing the layerDataArray.
  // The longer the delay, the longer it'll take to update the UI.
  static timeDelayBetweenPropagationsForBatch = 1500;

  /**
   * Static methode used to propagate feature info layer sets to the store..
   *
   * @param {string} mapId The map identifier of the resul set modified.
   * @param {string} layerPath The layer path that has changed.
   * @param {EventType} eventType The event type that triggered the layer set update.
   * @param {TypeFeatureInfoResultsSet} resultsSet The resul sets associated to the map.
   */
  static propagateFeatureInfoToStore(mapId: string, layerPath: string, eventType: EventType, resultsSet: TypeFeatureInfoResultsSet) {
    // TODO: Refactor - Remove the unnecessary 'layerPath' parameter which is sort of cona bitconfuses the logic applied in this function.
    // TO.DOCONT: Indeed, the layerPath is irrelevant as the whole resultsSet is reprocessed.
    // TO.DOCONT: If the parameter is used only for logging purposes name it clearly to remove confusion
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

      // Update the layer data array in the store
      store.getState().detailsState.actions.setLayerDataArray(layerDataArray);

      // If there was some features on this propagation
      if (atLeastOneFeature) {
        // If the current tab is not 'details' nor 'geochart', switch to details
        if (!['details', 'geochart'].includes(store.getState().uiState.activefooterTabId))
          store.getState().uiState.actions.setActiveFooterTab('details');
      }

      // Also propagate in the batched array
      FeatureInfoEventProcessor.propagateFeatureInfoToStoreBatch(mapId, layerDataArray);
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
   */
  static async propagateFeatureInfoToStoreBatch(mapId: string, layerDataArray: TypeArrayOfLayerData) {
    // Get the store
    const store = getGeoViewStore(mapId);

    // Make batch propagation for the map exists
    if (!FeatureInfoEventProcessor.batchedPropagationLayerDataArray[mapId])
      FeatureInfoEventProcessor.batchedPropagationLayerDataArray[mapId] = [];

    // Pile up the array
    FeatureInfoEventProcessor.batchedPropagationLayerDataArray[mapId].push(layerDataArray);

    // Get the layer path bypass if any
    const layerPathBypass = store.getState().detailsState.layerDataArrayBatchLayerPathBypass;

    // If there's a layer path bypass set
    let layerData;
    if (layerPathBypass) {
      // If the layerDataArray has the layer we have set as the bypass
      layerData = layerDataArray.find((layer) => layer.layerPath === layerPathBypass);
    }

    // Log
    logger.logDebug('PROPAGATE - IN BUFFER WAIT?', mapId, FeatureInfoEventProcessor.batchedPropagationLayerDataArray[mapId].length);

    // If found the layer data according to the layer path to bypass
    let bypass = false;
    if (layerData) {
      // If it has features in a responded state (this if condition can be improved when we have an official flag for this)
      if (layerData.features?.length) {
        // Bypass
        bypass = true;

        // Reset the flag so it stops bypassing for the rest of the processing
        store.getState().detailsState.actions.setLayerDataArrayBatchLayerPathBypass('');

        // Log
        logger.logDebug('PROPAGATE - BYPASSING!!!!!!!!!!!!!!!!!!!!!', mapId, layerData.features?.length, layerPathBypass);
      }
    }

    // If not bypassing the delay
    if (!bypass) {
      // Wait to batch the updates of the layerDataArray
      await delay(FeatureInfoEventProcessor.timeDelayBetweenPropagationsForBatch);
    }

    // Log
    logger.logDebug('PROPAGATE - BUFFER GO', mapId, FeatureInfoEventProcessor.batchedPropagationLayerDataArray[mapId].length);

    // If any in the buffer
    if (FeatureInfoEventProcessor.batchedPropagationLayerDataArray[mapId].length) {
      // Alright, take the last one in the pile (the most recent updated state - as this is cumulative)
      const mostUpdatedState =
        FeatureInfoEventProcessor.batchedPropagationLayerDataArray[mapId][
          FeatureInfoEventProcessor.batchedPropagationLayerDataArray[mapId].length - 1
        ];

      // Propagate that one to the store
      getGeoViewStore(mapId).getState().detailsState.actions.setLayerDataArrayBatch(mostUpdatedState);

      // Empty the list
      FeatureInfoEventProcessor.batchedPropagationLayerDataArray[mapId] = [];
    }
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
