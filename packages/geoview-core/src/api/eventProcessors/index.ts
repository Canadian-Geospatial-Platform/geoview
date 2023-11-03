import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AppEventProcessor } from '@/api/eventProcessors/app-event-processor';
import { MapEventProcessor } from '@/api/eventProcessors/map-event-processor';

const appEventProcessor = new AppEventProcessor();
const mapEventProcessor = new MapEventProcessor();

export function initializeEventProcessors(store: GeoViewStoreType) {
  appEventProcessor.onInitialize(store);
  mapEventProcessor.onInitialize(store);
}

export function destroyEventProcessors() {
  appEventProcessor.onDestroy();
  mapEventProcessor.onDestroy();
}
