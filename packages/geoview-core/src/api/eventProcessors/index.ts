import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { MapEventProcessor } from './map';

const mapEventProcessor = new MapEventProcessor();

export const initializeEventProcessors = function (store: GeoViewStoreType) {
  mapEventProcessor.onInitialize(store);
};

export const destroyEventProcessors = function () {
  mapEventProcessor.onDestroy();
};
