import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';

// core
const appEventProcessor = new AppEventProcessor();
const featureInfoEventProcessor = new FeatureInfoEventProcessor();
const legendEventProcessor = new LegendEventProcessor();
const mapEventProcessor = new MapEventProcessor();

// packages
const timeSliderEventProcessor = new TimeSliderEventProcessor();
const geochartEventProcessor = new GeochartEventProcessor();

export function initializeEventProcessors(store: GeoviewStoreType) {
  // core stores
  appEventProcessor.onInitialize(store);
  featureInfoEventProcessor.onInitialize(store);
  legendEventProcessor.onInitialize(store);
  mapEventProcessor.onInitialize(store);

  // package stores, only create if needed
  // TODO: Change this check for something more generic that checks in appBar too
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('time-slider')) timeSliderEventProcessor.onInitialize(store);
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('geochart')) geochartEventProcessor.onInitialize(store);
}

export function destroyEventProcessors(store: GeoviewStoreType) {
  // core stores
  appEventProcessor.onDestroy(store);
  featureInfoEventProcessor.onDestroy(store);
  legendEventProcessor.onDestroy(store);
  mapEventProcessor.onDestroy(store);

  // package stores, only destroy if created
  // TODO: Change this check for something more generic that checks in appBar too
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('time-slider')) timeSliderEventProcessor.onDestroy(store);
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('geochart')) geochartEventProcessor.onDestroy(store);
}
