import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { DataTableProcessor } from '@/api/event-processors/event-processor-children/data-table-processor';

// core
const appEventProcessor = new AppEventProcessor();
const featureInfoEventProcessor = new FeatureInfoEventProcessor();
const legendEventProcessor = new LegendEventProcessor();
const mapEventProcessor = new MapEventProcessor();
const dataTableProcessor = new DataTableProcessor();

// packages
const timeSliderEventProcessor = new TimeSliderEventProcessor();
const geochartEventProcessor = new GeochartEventProcessor();

export function initializeEventProcessors(store: GeoviewStoreType) {
  // core stores
  appEventProcessor.initialize(store);
  featureInfoEventProcessor.initialize(store);
  legendEventProcessor.initialize(store);
  mapEventProcessor.initialize(store);
  dataTableProcessor.initialize(store);

  // package stores, only create if needed
  // TODO: Change this check for something more generic that checks in appBar too
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('time-slider')) timeSliderEventProcessor.initialize(store);
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('geochart')) geochartEventProcessor.initialize(store);
}

export function destroyEventProcessors(store: GeoviewStoreType) {
  // core stores
  appEventProcessor.destroy();
  featureInfoEventProcessor.destroy();
  legendEventProcessor.destroy();
  mapEventProcessor.destroy();
  dataTableProcessor.destroy();

  // package stores, only destroy if created
  // TODO: Change this check for something more generic that checks in appBar too
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('time-slider')) timeSliderEventProcessor.destroy();
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('geochart')) geochartEventProcessor.destroy();
}
