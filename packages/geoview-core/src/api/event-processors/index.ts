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
  appEventProcessor.onInitialize(store);
  featureInfoEventProcessor.onInitialize(store);
  legendEventProcessor.onInitialize(store);
  mapEventProcessor.onInitialize(store);
  timeSliderEventProcessor.onInitialize(store);
}

export function destroyEventProcessors(store: GeoviewStoreType) {
  appEventProcessor.onDestroy(store);
  featureInfoEventProcessor.onDestroy(store);
  legendEventProcessor.onDestroy(store);
  mapEventProcessor.onDestroy(store);
  timeSliderEventProcessor.onDestroy(store);
}
