import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { EVENT_NAMES } from '@/api/events/event-types';
import {
  TypeFeatureInfoResultSets,
  TypeArrayOfLayerData,
  payloadIsAllQueriesDone,
  EventType,
} from '@/api/events/payloads/get-feature-info-payload';
import { api } from '@/app';
import { getGeoViewStore } from '@/core/stores/stores-managers';

export class FeatureInfoEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    const { mapId } = store.getState();

    api.event.on(
      EVENT_NAMES.GET_FEATURE_INFO.ALL_QUERIES_DONE,
      (allQueriesPayload) => {
        if (payloadIsAllQueriesDone(allQueriesPayload)) {
          store.setState({ featureInfoResultSets: allQueriesPayload.resultSets });
        }
      },
      `${mapId}/FeatureInfoLayerSet`
    );

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }

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
        if (resultSets[existingLayerPath].data[eventType]?.features?.length)
          newDetails.push(resultSets[existingLayerPath].data[eventType]!);
      });
      const storeDetails = store.getState().detailsState.layerDataArray;
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
