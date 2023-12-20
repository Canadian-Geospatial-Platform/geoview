import { GeoviewStoreType } from '@/core/stores/geoview-store';

import { getGeoViewStore } from '@/core/stores/stores-managers';
import { TypeMapFeaturesConfig } from '@/core/types/cgpv-types';

export abstract class AbstractEventProcessor {
  protected store: GeoviewStoreType | undefined;

  protected subscriptionArr: Array<() => void>;

  constructor() {
    this.subscriptionArr = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onInitialize(store: GeoviewStoreType): void {
    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDestroy(store: GeoviewStoreType) {
    // destroying all subscriptions
    this.subscriptionArr.forEach((unsub) => unsub());
  }

  /**
   * ! Function available from all children class!!!
   * Use to get the map configuration
   * 
   * @param {string} mapId the map id to retreive the config for
   * @returns {TypeMapFeaturesConfig | undefined} the map config or undefined if there is no config for this map id
   */
  static getGeoViewConfig(mapId: string): TypeMapFeaturesConfig | undefined {
    return getGeoViewStore(mapId).getState().mapConfig;
  }
}
