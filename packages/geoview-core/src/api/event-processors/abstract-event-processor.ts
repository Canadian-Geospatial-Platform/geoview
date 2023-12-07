import { GeoViewStoreType } from '@/core/stores/geoview-store';

export abstract class AbstractEventProcessor {
  protected store: GeoViewStoreType | undefined;

  protected subscriptionArr: Array<() => void>;

  constructor() {
    this.subscriptionArr = [];
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onInitialize(store: GeoViewStoreType): void {
    // add to arr of subscriptions so it can be destroyed later
    this.subscriptionArr.push();
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onDestroy(store: GeoViewStoreType) {
    // destroying all subscriptions
    this.subscriptionArr.forEach((unsub) => unsub());
  }
}
