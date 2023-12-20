import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';

const appEventProcessor = new AppEventProcessor();
const featureInfoEventProcessor = new FeatureInfoEventProcessor();
const legendEventProcessor = new LegendEventProcessor();
const mapEventProcessor = new MapEventProcessor();
const timeSliderEventProcessor = new TimeSliderEventProcessor();

export function initializeEventProcessors(store: GeoviewStoreType) {
  // core stores
  appEventProcessor.onInitialize(store);
  featureInfoEventProcessor.onInitialize(store);
  legendEventProcessor.onInitialize(store);
  mapEventProcessor.onInitialize(store);

  // package stores, only create if needed
  if (store.getState().mapConfig!.corePackages?.includes('time-slider')) timeSliderEventProcessor.onInitialize(store);
}

export function destroyEventProcessors(store: GeoviewStoreType) {
  // core stores
  appEventProcessor.onDestroy(store);
  featureInfoEventProcessor.onDestroy(store);
  legendEventProcessor.onDestroy(store);
  mapEventProcessor.onDestroy(store);

  // package stores, only destroy if created
  if (store.getState().mapConfig!.corePackages?.includes('time-slider')) timeSliderEventProcessor.onDestroy(store);
}
