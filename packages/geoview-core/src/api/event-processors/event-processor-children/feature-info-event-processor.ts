import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeFeatureInfoResultSets, TypeArrayOfLayerData, EventType } from '@/api/events/payloads/get-feature-info-payload';
import { IDetailsState } from '@/core/stores';
import { getGeoViewStore } from '@/core/stores/stores-managers';

export class FeatureInfoEventProcessor extends AbstractEventProcessor {
  // **********************************************************
  // Static functions for Typescript files to access store actions
  // **********************************************************
  //! Typescript MUST always use store action to modify store - NEVER use setState!
  //! Some action does state modifications AND map actions.
  //! ALWAYS use map event processor when an action modify store and IS NOT trap by map state event handler
  // #region
  static propagateFeatureInfoToStore(mapId: string, layerPath: string, eventType: EventType, resultSets: TypeFeatureInfoResultSets) {
    const store = getGeoViewStore(mapId);
    const layerPathInResultSets = Object.keys(resultSets);
    if (eventType === 'click') {
      const newDetails: TypeArrayOfLayerData = [];
      layerPathInResultSets.forEach((existingLayerPath) => {
        if (resultSets[existingLayerPath].data[eventType]?.features) newDetails.push(resultSets[existingLayerPath].data[eventType]!);
      });
      const storeDetails = (store.getState().detailsState as IDetailsState).layerDataArray;
      if (storeDetails.length !== newDetails.length || storeDetails.findIndex((layerData, i) => layerData !== newDetails[i]) !== -1)
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
