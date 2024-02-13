import { TypeFeatureInfoResultsSet, EventType, TypeLayerData, TypeArrayOfLayerData } from '@/api/events/payloads/get-feature-info-payload';

import { GeochartEventProcessor } from './geochart-event-processor';
import { AbstractEventProcessor, BatchedPropagationLayerDataArrayByMap } from '../abstract-event-processor';
import { UIEventProcessor } from './ui-event-processor';

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
   * Static method used to propagate feature info layer sets to the store
   *
   * @param {string} mapId The map identifier of the resul set modified.
   * @param {string} layerPath The layer path that has changed.
   * @param {EventType} eventType The event type that triggered the layer set update.
   * @param {TypeFeatureInfoResultsSet} resultsSet The resul sets associated to the map.
   */
  static propagateFeatureInfoToStore(mapId: string, layerPath: string, eventType: EventType, resultsSet: TypeFeatureInfoResultsSet) {
    const featureInfoState = super.getState(mapId).detailsState;
    if (eventType === 'click') {
      /**
       * Create a details object for each layer which is then used to render layers in details panel.
       */
      const layerDataArray = [...featureInfoState.layerDataArray];
      if (!layerDataArray.find((layerEntry) => layerEntry.layerPath === layerPath)) {
        layerDataArray.push(resultsSet?.[layerPath]?.data.click as TypeLayerData);
        featureInfoState.actions.setLayerDataArray(layerDataArray);
      }
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

      // Also propagate in the geochart arrays
      GeochartEventProcessor.propagateArrayDataToStore(mapId, layerDataArray);
    } else if (eventType === 'hover') {
      /**
       * Create a hover object for each layer which is then used to render layers
       */
      const hoverDataArray = [...featureInfoState.hoverDataArray];
      if (!hoverDataArray.find((layerEntry) => layerEntry.layerPath === layerPath)) {
        hoverDataArray.push(resultsSet?.[layerPath]?.data.hover as TypeLayerData);
        featureInfoState.actions.setHoverDataArray(hoverDataArray);
      }
    } else if (eventType === 'all-features') {
      /**
       * Create a get all features info object for each layer which is then used to render layers
       */
      const allFeaturesDataArray = [...featureInfoState.allFeaturesDataArray];
      if (!allFeaturesDataArray.find((layerEntry) => layerEntry.layerPath === layerPath)) {
        allFeaturesDataArray.push(resultsSet?.[layerPath]?.data['all-features'] as TypeLayerData);
        featureInfoState.actions.setAllFeaturesDataArray(allFeaturesDataArray);
      }
    }
  }

  /**
   * Propagate feature info layer sets to the store in a batched manner, every 'timeDelayBetweenPropagationsForBatch' millisecond.
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
    const featureInfoState = super.getState(mapId).detailsState;

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
