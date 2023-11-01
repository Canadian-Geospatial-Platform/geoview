import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AppEventProcessor } from '@/api/eventProcessors/app-event-processor';
import { MapEventProcessor } from '@/api/eventProcessors/map-event-processor';
import { LegendEventProcessor } from '@/api/eventProcessors/legend-event-processor';
import { FeatureInfoEventProcessor } from '@/api/eventProcessors/feature-info-event-processor';

const appEventProcessor = new AppEventProcessor();
const mapEventProcessor = new MapEventProcessor();
const legendEventProcessor = new LegendEventProcessor();
const featureInfoEventProcessor = new FeatureInfoEventProcessor();

export function initializeEventProcessors(store: GeoViewStoreType) {
  appEventProcessor.onInitialize(store);
  mapEventProcessor.onInitialize(store);
  legendEventProcessor.onInitialize(store);
  featureInfoEventProcessor.onInitialize(store);
}

export function destroyEventProcessors() {
  appEventProcessor.onDestroy();
  mapEventProcessor.onDestroy();
  legendEventProcessor.onDestroy();
  featureInfoEventProcessor.onDestroy();
}
