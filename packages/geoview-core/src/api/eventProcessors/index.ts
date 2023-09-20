import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AppBarEventProcessor } from './appBar-event-process';
import { MapEventProcessor } from './map-event-process';

const mapEventProcessor = new MapEventProcessor();
const appBarEventProcessor = new AppBarEventProcessor();

export const initializeEventProcessors = function (store: GeoViewStoreType) {
  mapEventProcessor.onInitialize(store);
  appBarEventProcessor.onInitialize(store);
};

export const destroyEventProcessors = function () {
  mapEventProcessor.onDestroy();
};
