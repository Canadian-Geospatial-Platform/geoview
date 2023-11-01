import { AppEventProcessor } from '@/api/eventProcessors/app-event-processor';
import { FeatureInfoEventProcessor } from '@/api/eventProcessors/feature-info-event-processor';
import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { LegendEventProcessor } from '@/api/eventProcessors/legend-event-processor';
import { MapEventProcessor } from '@/api/eventProcessors/map-event-processor';

const appEventProcessor = new AppEventProcessor();
const featureInfoEventProcessor = new FeatureInfoEventProcessor();
const legendEventProcessor = new LegendEventProcessor();
const mapEventProcessor = new MapEventProcessor();

export function initializeEventProcessors(store: GeoViewStoreType) {
  appEventProcessor.onInitialize(store);
  featureInfoEventProcessor.onInitialize(store);
  legendEventProcessor.onInitialize(store);
  mapEventProcessor.onInitialize(store);
}

export function destroyEventProcessors() {
  appEventProcessor.onDestroy();
  featureInfoEventProcessor.onDestroy();
  legendEventProcessor.onDestroy();
  mapEventProcessor.onDestroy();
}
