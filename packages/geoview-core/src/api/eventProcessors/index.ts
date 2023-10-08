import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AppBarEventProcessor } from '@/api/eventProcessors/appBar-event-process';
import { MapEventProcessor } from '@/api/eventProcessors/map-event-process';
import { NotificationEventProcessor } from '@/api/eventProcessors/notification-event-process';

const appBarEventProcessor = new AppBarEventProcessor();
const mapEventProcessor = new MapEventProcessor();
const notificationEventProcessor = new NotificationEventProcessor();

export function initializeEventProcessors(store: GeoViewStoreType) {
  mapEventProcessor.onInitialize(store);
  appBarEventProcessor.onInitialize(store);
  notificationEventProcessor.onInitialize(store);
}

export function destroyEventProcessors() {
  mapEventProcessor.onDestroy();
  appBarEventProcessor.onDestroy();
  notificationEventProcessor.onDestroy();
}
