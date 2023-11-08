import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from './abstract-event-processor';
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
          const { layerPath, resultSets } = allQueriesPayload;
          const storeResultSets = store.getState().featureInfoResultSets;
          if (!(layerPath in storeResultSets)) {
            storeResultSets[layerPath] = resultSets[layerPath];
            store.setState({ featureInfoResultSets: storeResultSets });
          }
        }
      },
      `${mapId}/FeatureInfoLayerSet`
    );

    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }

  // **********************************************************
  // Static functions for Typescript files to set store values
  // **********************************************************
  static propagateResultSetInfo(mapId: string, layerPath: string, eventType: EventType, resultSets: TypeFeatureInfoResultSets) {
    const store = getGeoViewStore(mapId);
    const layerPathInResultSets = Object.keys(resultSets);
    const newDetails: TypeArrayOfLayerData = [];
    layerPathInResultSets.forEach((existingLayerPath) => {
      if (resultSets[existingLayerPath].data[eventType]?.features?.length) newDetails.push(resultSets[existingLayerPath].data[eventType]!);
    });
    if (newDetails.length) store.getState().detailsState.actions.setLayerDataArray(newDetails);
  }
}
