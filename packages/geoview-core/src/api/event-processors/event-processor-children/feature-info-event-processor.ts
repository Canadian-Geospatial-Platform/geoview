import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeFeatureInfoResultSets, EventType } from '@/api/events/payloads/get-feature-info-payload';
import { getGeoViewStore } from '@/core/stores/stores-managers';

export class FeatureInfoEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use store action to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler
  // #region
  static propagateFeatureInfoToStore(
    mapId: string,
    layerPath: string,
    eventType: EventType,
    resultSets: TypeFeatureInfoResultSets,
    isLegendData?: boolean
  ) {
    const store = getGeoViewStore(mapId);
    const layerPathInResultSets = Object.keys(resultSets);

    if (eventType === 'click') {
      /**
       * Create a details object for each layer which is then used to render layers in details panel.
       */
      const newDetails = layerPathInResultSets.map((layerPathItem) => {
        // when propagateFeatureInfoToStore is called from Legend Processor, at that time no features are available,
        // so to get the features from correct object, we need isLegendData flag.
        const features = isLegendData ? [] : resultSets[layerPathItem]?.data[eventType]?.features || [];
        const language = store.getState().appState.displayLanguage;
        return {
          features,
          layerStatus: resultSets[layerPathItem].layerStatus,
          layerPath: layerPathItem,
          layerName: resultSets[layerPathItem]?.layerName![language] ?? '',
        };
      });

      store.getState().detailsState.actions.setLayerDataArray(newDetails);
    }
  }
  // #endregion

  // **********************************************************
  // Static functions for Store Map State to action on API
  // **********************************************************
  //! NEVER add a store action who does set state AND map action at a same time.
  //! Review the action in store state to make sure
}
