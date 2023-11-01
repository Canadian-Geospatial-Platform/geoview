import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { MapEventProcessor } from '@/api/eventProcessors/map-event-process';
import { NotificationEventProcessor } from '@/api/eventProcessors/notification-event-process';

const mapEventProcessor = new MapEventProcessor();
const notificationEventProcessor = new NotificationEventProcessor();

export function initializeEventProcessors(store: GeoViewStoreType) {
  mapEventProcessor.onInitialize(store);
  notificationEventProcessor.onInitialize(store);
}

export function destroyEventProcessors() {
  mapEventProcessor.onDestroy();
  notificationEventProcessor.onDestroy();
}
