import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { EVENT_NAMES } from '@/api/events/event-types';
import { payloadIsLegendsLayersetUpdated } from '@/api/events/payloads/get-legends-payload';
import { api } from '@/app';

export class LegendEventProcessor extends AbstractEventProcessor {
  onInitialize(store: GeoViewStoreType) {
    const { mapId } = store.getState();

    api.event.on(
      EVENT_NAMES.GET_LEGENDS.LEGENDS_LAYERSET_UPDATED,
      (layerUpdatedPayload) => {
        if (payloadIsLegendsLayersetUpdated(layerUpdatedPayload)) {
          const { layerPath, resultSets } = layerUpdatedPayload;
          const storeResultSets = store.getState().legendResultSets;
          if (!(layerPath in storeResultSets)) {
            storeResultSets[layerPath] = resultSets[layerPath];
            store.setState({ legendResultSets: storeResultSets });
          }
        }
      },
      `${mapId}/LegendsLayerSet`
    );
    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }
}
