import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AppBarEventProcessor } from './appBar';
import { MapEventProcessor } from './map';

const mapEventProcessor = new MapEventProcessor();
const appBarEventProcessor = new AppBarEventProcessor();

export function initializeEventProcessors(store: GeoViewStoreType) {
  mapEventProcessor.onInitialize(store);
  appBarEventProcessor.onInitialize(store);
}

export function destroyEventProcessors() {
  mapEventProcessor.onDestroy();
}
