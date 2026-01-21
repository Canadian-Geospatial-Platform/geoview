import { AppEventProcessor } from '@/api/event-processors/event-processor-children/app-event-processor';
import { FeatureInfoEventProcessor } from '@/api/event-processors/event-processor-children/feature-info-event-processor';
import type { GeoviewStoreType } from '@/core/stores/geoview-store';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { UIEventProcessor } from './event-processor-children/ui-event-processor';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { DataTableEventProcessor } from '@/api/event-processors/event-processor-children/data-table-event-processor';
import { SwiperEventProcessor } from '@/api/event-processors/event-processor-children/swiper-event-processor';
import { DrawerEventProcessor } from '@/api/event-processors/event-processor-children/drawer-event-processor';

// core
const appEventProcessor = new AppEventProcessor();
const featureInfoEventProcessor = new FeatureInfoEventProcessor();
const legendEventProcessor = new LegendEventProcessor();
const mapEventProcessor = new MapEventProcessor();
const uiEventProcessor = new UIEventProcessor();
const dataTableEventProcessor = new DataTableEventProcessor();

// packages
const timeSliderEventProcessor = new TimeSliderEventProcessor();
const geochartEventProcessor = new GeochartEventProcessor();
const swiperEventProcessor = new SwiperEventProcessor();
const drawerEventProcessor = new DrawerEventProcessor();

/**
 * Checks if the time slider plugin is enabled in the map configuration.
 * @param {GeoviewStoreType} store - The GeoView store instance
 * @return {boolean} True if time slider plugin is enabled
 */
export function hasTimeSliderPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.footerBar?.tabs.core.includes('time-slider') ?? false;
}

/**
 * Checks if the geochart plugin is enabled in the map configuration.
 * @param {GeoviewStoreType} store - The GeoView store instance
 * @return {boolean} True if geochart plugin is enabled
 */
export function hasGeochartPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.footerBar?.tabs.core.includes('geochart') ?? false;
}

/**
 * Checks if the swiper plugin is enabled in the map configuration.
 * @param {GeoviewStoreType} store - The GeoView store instance
 * @return {boolean} True if swiper plugin is enabled
 */
export function hasSwiperPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.corePackages?.includes('swiper') ?? false;
}

/**
 * Checks if the drawer plugin is enabled in the map configuration.
 * @param {GeoviewStoreType} store - The GeoView store instance
 * @return {boolean} True if drawer plugin is enabled
 */
export function hasDrawerPlugin(store: GeoviewStoreType): boolean {
  return store.getState().mapConfig!.navBar?.includes('drawer') ?? false;
}

/**
 * Initializes all event processors for the given store.
 * @param {GeoviewStoreType} store - The GeoView store instance
 * @return {void}
 */
export function initializeEventProcessors(store: GeoviewStoreType): void {
  // core stores
  appEventProcessor.initialize(store);
  featureInfoEventProcessor.initialize(store);
  legendEventProcessor.initialize(store);
  mapEventProcessor.initialize(store);
  uiEventProcessor.initialize(store);
  dataTableEventProcessor.initialize(store);

  // package stores, only create if needed
  if (hasTimeSliderPlugin(store)) timeSliderEventProcessor.initialize(store);
  if (hasGeochartPlugin(store)) geochartEventProcessor.initialize(store);
  if (hasSwiperPlugin(store)) swiperEventProcessor.initialize(store);
  if (hasDrawerPlugin(store)) drawerEventProcessor.initialize(store);
}

/**
 * Destroys all event processors for the given store.
 * @param {GeoviewStoreType} store - The GeoView store instance
 * @return {void}
 */
export function destroyEventProcessors(store: GeoviewStoreType): void {
  // core stores
  appEventProcessor.destroy();
  featureInfoEventProcessor.destroy();
  legendEventProcessor.destroy();
  mapEventProcessor.destroy();
  uiEventProcessor.destroy();
  dataTableEventProcessor.destroy();

  // package stores, only destroy if created
  if (hasTimeSliderPlugin(store)) timeSliderEventProcessor.destroy();
  if (hasGeochartPlugin(store)) geochartEventProcessor.destroy();
  if (hasSwiperPlugin(store)) swiperEventProcessor.destroy();
  if (hasDrawerPlugin(store)) drawerEventProcessor.destroy();
}
