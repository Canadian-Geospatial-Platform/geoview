import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { SwiperEventProcessor } from '@/api/event-processors/event-processor-children/swiper-event-processor';

// core
const appEventProcessor = new AppEventProcessor();
const featureInfoEventProcessor = new FeatureInfoEventProcessor();
const legendEventProcessor = new LegendEventProcessor();
const mapEventProcessor = new MapEventProcessor();
const dataTableEventProcessor = new DataTableEventProcessor();

// packages
const timeSliderEventProcessor = new TimeSliderEventProcessor();
const geochartEventProcessor = new GeochartEventProcessor();
const swiperEventProcessor = new SwiperEventProcessor();

export function initializeEventProcessors(store: GeoviewStoreType): void {
  // core stores
  appEventProcessor.initialize(store);
  featureInfoEventProcessor.initialize(store);
  legendEventProcessor.initialize(store);
  mapEventProcessor.initialize(store);
  dataTableEventProcessor.initialize(store);

  // package stores, only create if needed
  // TODO: Change this check for something more generic that checks in appBar too
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('time-slider')) timeSliderEventProcessor.initialize(store);
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('geochart')) geochartEventProcessor.initialize(store);
  if (store.getState().mapConfig!.corePackages?.includes('swiper')) swiperEventProcessor.initialize(store);
}

export function destroyEventProcessors(store: GeoviewStoreType): void {
  // core stores
  appEventProcessor.destroy();
  featureInfoEventProcessor.destroy();
  legendEventProcessor.destroy();
  mapEventProcessor.destroy();
  dataTableEventProcessor.destroy();

  // package stores, only destroy if created
  // TODO: Change this check for something more generic that checks in appBar too
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('time-slider')) timeSliderEventProcessor.destroy();
  if (store.getState().mapConfig!.footerBar?.tabs.core.includes('geochart')) geochartEventProcessor.destroy();
  if (store.getState().mapConfig!.corePackages?.includes('swiper')) swiperEventProcessor.destroy();
}
