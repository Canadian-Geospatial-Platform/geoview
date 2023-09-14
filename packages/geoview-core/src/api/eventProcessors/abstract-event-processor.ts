import { GeoViewStoreType } from '@/core/stores/geoview-store';

export abstract class AbstractEventProcessor {
  protected store: GeoViewStoreType | undefined;

  protected subscriptionArr: Array<() => void>;

  constructor() {
    this.subscriptionArr = [];
  }

  abstract onInitialize(store: GeoViewStoreType): void;

  onDestroy() {
    // destroying all subscriptions
    this.subscriptionArr.forEach((unsub) => unsub());
  }
}
