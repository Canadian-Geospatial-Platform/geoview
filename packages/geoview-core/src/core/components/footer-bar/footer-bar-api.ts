import { TypeTabs } from '@/ui/tabs/tabs';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { sanitizeHtmlContent } from '@/core/utils/utilities';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { TypeLegendLayer } from '../layers/types';
import { GeoChartStoreByLayerPath, TypeGeochartResultSetEntry } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { TypeTimeSliderValues } from '@/core/stores/store-interface-and-intial-values/time-slider-state';

/**
 * API to manage tabs on the tabs component
 *
 * @exports
 * @class
 */
export class FooterBarApi {
  mapId: string;

  // array that hold added tabs
  tabs: TypeTabs[] = [];

  /** Callback handlers for the footerbar tab created event. */
  #onFooterTabCreatedHandlers: FooterTabCreatedDelegate[] = [];

  /** Callback handlers for the footerbar tab removed event. */
  #onFooterTabRemovedHandlers: FooterTabRemovedDelegate[] = [];

  /**
   * Instantiates a FooterBarApi class.
   *
   * @param {string} mapId - The map id this footer bar api belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Get a specific layer panel state.
   * @param {'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'} state - The state to get
   * @returns {string | boolean | null | undefined} The requested state
   */
  getLayerPanelState(
    state: 'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'
  ): string | boolean | null | undefined {
    return LegendEventProcessor.getLayerPanelState(this.mapId, state);
  }

  /**
   * Get a legend layer.
   * @param {string} layerPath - The path of the layer to get
   * @returns {TypeLegendLayer | undefined} The requested legend layer
   */
  getLegendLayerInfo(layerPath: string): TypeLegendLayer | undefined {
    return LegendEventProcessor.getLegendLayerInfo(this.mapId, layerPath);
  }

  /**
   * Get array of layer paths that are collapsed in legend/layers.
   * @returns {string[]} The layer path array.
   */
  getLayersCollapsedInLegend(): string[] {
    // Redirect to event processor
    return UIEventProcessor.getLayersCollapsedInLegend(this.mapId);
  }

  /**
   * Get a specific state.
   * @param {'geochartChartsConfig' | 'layerDataArray' | 'layerDataArrayBatchLayerPathBypass' | 'selectedLayerPath'} state - The state to get
   * @returns {string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath | undefined} The requested state
   */
  getSingleGeochartState(
    state: 'geochartChartsConfig' | 'layerDataArray' | 'layerDataArrayBatchLayerPathBypass' | 'selectedLayerPath'
  ): string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath | undefined {
    return GeochartEventProcessor.getSingleGeochartState(this.mapId, state);
  }

  /**
   * Gets time slider layers.
   * @returns {TypeTimeSliderValues | undefined} The time slider layer set or undefined
   */
  getTimeSliderLayers(): TypeTimeSliderValues | undefined {
    return TimeSliderEventProcessor.getTimeSliderLayers(this.mapId)?.timeSliderLayers;
  }

  /**
   * Set selected layer in layers tab.
   * @param {string} layerPath - The path of the layer to set
   */
  setSelectedLayersTabLayer(layerPath: string): void {
    LegendEventProcessor.setSelectedLayersTabLayer(this.mapId, layerPath);
  }

  /**
   * Emits an event to all registered footerbar tab created event handlers.
   * @param {FooterTabCreatedEvent} event - The event to emit.
   * @private
   */
  #emitFooterTabCreated(event: FooterTabCreatedEvent): void {
    // Emit the footerbar tab created event
    EventHelper.emitEvent(this, this.#onFooterTabCreatedHandlers, event);
  }

  /**
   * Registers an event handler for footerbar tab created events.
   * @param {FooterTabCreatedDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onFooterTabCreated(callback: FooterTabCreatedDelegate): void {
    // Register the footerbar tab created event callback
    EventHelper.onEvent(this.#onFooterTabCreatedHandlers, callback);
  }

  /**
   * Unregisters an event handler for footerbar tab created events.
   * @param {FooterTabCreatedDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offFooterTabCreated(callback: FooterTabCreatedDelegate): void {
    // Unregister the footerbar tab created event callback
    EventHelper.offEvent(this.#onFooterTabCreatedHandlers, callback);
  }

  /**
   * Emits an event to all registered footerbar tab removed event handlers.
   * @param {FooterTabRemovedEvent} event - The event to emit.
   * @private
   */
  #emitFooterTabRemoved(event: FooterTabRemovedEvent): void {
    // Emit the footerbar tab removed event
    EventHelper.emitEvent(this, this.#onFooterTabRemovedHandlers, event);
  }

  /**
   * Registers an event handler for footerbar tab removed events.
   * @param {FooterTabRemovedDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onFooterTabRemoved(callback: FooterTabRemovedDelegate): void {
    // Register the footerbar tab removed event callback
    EventHelper.onEvent(this.#onFooterTabRemovedHandlers, callback);
  }

  /**
   * Unregisters an event handler for footerbar removed events.
   * @param {FooterTabRemovedDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offFooterTabRemoved(callback: FooterTabRemovedDelegate): void {
    // Unregister the footerbar removed event callback
    EventHelper.offEvent(this.#onFooterTabRemovedHandlers, callback);
  }

  /**
   * Creates a tab on the footer bar
   *
   * @param {TypeTabs} tabProps - The properties of the tab to be created
   *
   */
  createTab(tabProps: TypeTabs): void {
    if (tabProps) {
      // find if tab value exists
      const tab = this.tabs.find((t) => t.id === tabProps.id);

      // if tab does not exist, create it
      if (!tab) {
        // if tab content is string HTML, sanitize
        // eslint-disable-next-line no-param-reassign
        if (typeof tabProps.content === 'string') tabProps.content = sanitizeHtmlContent(tabProps.content);

        // add the new tab to the footer tabs array
        this.tabs.push(tabProps);

        // trigger an event that a new tab has been created
        this.#emitFooterTabCreated({ tab: tabProps });
      }
    }
  }

  /**
   * Removes a tab by id
   *
   * @param {string} id - The id of the tab to be removed
   */
  removeTab(id: string): void {
    // find the tab to be removed
    const tabToRemove = this.tabs.find((tab) => tab.id === id);

    if (tabToRemove) {
      // remove the tab from the footer tabs array
      this.tabs = this.tabs.filter((tab) => tab.id !== id);

      // trigger an event that a tab has been removed
      this.#emitFooterTabRemoved({ tabid: id });
    }
  }

  /**
   * Selects a tab by id, if the id is not a tab, the footer bar will close
   *
   * @param {string} id - The id of the tab to be selected
   */
  selectTab(id: string): void {
    UIEventProcessor.setActiveFooterBarTab(this.mapId, id);
  }
}

/**
 * Define an event for the delegate
 */
export type FooterTabCreatedEvent = {
  tab: TypeTabs;
};

/**
 * Define a delegate for the event handler function signature
 */
type FooterTabCreatedDelegate = EventDelegateBase<FooterBarApi, FooterTabCreatedEvent>;

/**
 * Define an event for the delegate
 */
export type FooterTabRemovedEvent = {
  tabid: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type FooterTabRemovedDelegate = EventDelegateBase<FooterBarApi, FooterTabRemovedEvent>;
