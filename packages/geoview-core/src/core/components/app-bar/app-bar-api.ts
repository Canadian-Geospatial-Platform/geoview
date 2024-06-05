import { CONST_PANEL_TYPES, TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { TypeIconButtonProps } from '@/ui/icon-button/icon-button-types';

import { generateId } from '@/core/utils/utilities';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';
import { LegendEventProcessor } from '@/api/event-processors/event-processor-children/legend-event-processor';
import { TypeLegendLayer } from '../layers/types';
import { GeoChartStoreByLayerPath, TypeGeochartResultSetEntry } from '@/core/stores/store-interface-and-intial-values/geochart-state';
import { GeochartEventProcessor } from '@/api/event-processors/event-processor-children/geochart-event-processor';
import { TypeTimeSliderValues } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

/**
 * Class to manage buttons on the app-bar
 *
 * @exports
 * @class
 */
export class AppBarApi {
  mapId: string;

  // groups of array of button panels to hold all buttons created on the app-bar
  buttons: Record<string, Record<string, TypeButtonPanel>> = {};

  /** Callback handlers for the AppBar created event. */
  #onAppBarCreatedHandlers: AppBarCreatedDelegate[] = [];

  /** Callback handlers for the AppBar removed event. */
  #onAppBarRemovedHandlers: AppBarRemovedDelegate[] = [];

  /**
   * Instantiates an AppBarApi class.
   *
   * @param {string} mapId - The map id this AppBarApi belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;

    this.#createDefaultButtonPanels();
  }

  /**
   * Emits an event to all registered AppBar created event handlers.
   * @param {AppBarCreatedEvent} event - The event to emit.
   * @private
   */
  #emitAppBarCreated(event: AppBarCreatedEvent): void {
    // Emit the AppBar created event
    EventHelper.emitEvent(this, this.#onAppBarCreatedHandlers, event);
  }

  /**
   * Registers an event handler for AppBar created events.
   * @param {AppBarCreatedDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onAppBarCreated(callback: AppBarCreatedDelegate): void {
    // Register the AppBar created event callback
    EventHelper.onEvent(this.#onAppBarCreatedHandlers, callback);
  }

  /**
   * Unregisters an event handler for AppBar created events.
   * @param {AppBarCreatedDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offAppBarCreated(callback: AppBarCreatedDelegate): void {
    // Unregister the AppBar created event callback
    EventHelper.offEvent(this.#onAppBarCreatedHandlers, callback);
  }

  /**
   * Emits an event to all registered AppBar removed event handlers.
   * @param {AppBarRemovedEvent} event - The event to emit.
   * @private
   */
  #emitAppBarRemoved(event: AppBarRemovedEvent): void {
    // Emit the AppBar removed event
    EventHelper.emitEvent(this, this.#onAppBarRemovedHandlers, event);
  }

  /**
   * Registers an event handler for AppBar removed events.
   * @param {AppBarRemovedDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onAppBarRemoved(callback: AppBarRemovedDelegate): void {
    // Register the AppBar removed event callback
    EventHelper.onEvent(this.#onAppBarRemovedHandlers, callback);
  }

  /**
   * Unregisters an event handler for AppBar removed events.
   * @param {AppBarRemovedDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offAppBarRemoved(callback: AppBarRemovedDelegate): void {
    // Unregister the AppBar removed event callback
    EventHelper.offEvent(this.#onAppBarRemovedHandlers, callback);
  }

  /**
   * Function used to create default buttons, button panels
   */
  #createDefaultButtonPanels(): void {
    // create default group for app-bar button panels
    this.buttons.default = {};
  }

  /**
   * Creates a button on the app-bar that will open a panel
   *
   * @param {TypeIconButtonProps} buttonProps - Button properties (icon, tooltip)
   * @param {TypePanelProps} panelProps - Panel properties (icon, title, content)
   * @param {string | null | undefined} groupName - Optional value to set this button in a group
   * @returns {TypeButtonPanel | null} The created panel
   */
  createAppbarPanel(
    buttonProps: TypeIconButtonProps,
    panelProps: TypePanelProps,
    groupName?: string | null | undefined
  ): TypeButtonPanel | null {
    if (buttonProps && panelProps) {
      const buttonPanelId = generateId(buttonProps.id);

      const button: TypeIconButtonProps = {
        ...buttonProps,
        id: buttonPanelId,
        visible: buttonProps.visible === undefined ? true : buttonProps.visible,
      };

      const thePanelProps: TypePanelProps = {
        ...panelProps,
        type: CONST_PANEL_TYPES.APPBAR,
      };

      // if group was not specified then add button panels to the default group
      const group = groupName || 'default';

      // if group does not exist then create it
      if (!this.buttons[group]) {
        this.buttons[group] = {};
      }

      const buttonPanel: TypeButtonPanel = {
        buttonPanelId,
        panel: thePanelProps,
        button,
        groupName: group,
      };

      // add the new button panel to the correct group
      if (group !== '__proto__' && buttonPanelId !== '__proto__') this.buttons[group][buttonPanelId] = buttonPanel;

      // trigger an event that a new button panel has been created to update the state and re-render
      this.#emitAppBarCreated({ buttonPanelId, group, buttonPanel });

      return buttonPanel;
    }

    return null;
  }

  /**
   * Gets a button panel from the app-bar by using it's id
   *
   * @param {string} buttonPanelId - The id of the button panel to get
   * @returns {TypeButtonPanel | null} The button panel
   */
  getAppBarButtonPanelById(buttonPanelId: string): TypeButtonPanel | null {
    // loop through groups of app-bar button panels
    for (let i = 0; i < Object.keys(this.buttons).length; i++) {
      const group = this.buttons[Object.keys(this.buttons)[i]];

      for (let j = 0; j < Object.keys(group).length; j++) {
        const buttonPanel: TypeButtonPanel = group[Object.keys(group)[j]];

        if (buttonPanel.buttonPanelId === buttonPanelId) {
          return buttonPanel;
        }
      }
    }

    return null;
  }

  /**
   * Gets all created buttons panels regardless of group
   *
   * @returns {Record<string, TypeButtonPanels>} An object with all the button panels
   */
  getAllButtonPanels(): Record<string, TypeButtonPanel> {
    const buttonPanels: Record<string, TypeButtonPanel> = {};

    for (let i = 0; i < Object.keys(this.buttons).length; i += 1) {
      const group = this.buttons[Object.keys(this.buttons)[i]];

      for (let j = 0; j < Object.keys(group).length; j++) {
        const buttonPanel: TypeButtonPanel = group[Object.keys(group)[j]];

        buttonPanels[buttonPanel.buttonPanelId] = buttonPanel;
      }
    }

    return buttonPanels;
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
   * Get the collapsed state of layer's legend.
   * @param {string} layerPath - Path of the layer to get state for.
   * @returns {boolean} If the legend is collapsed.
   */
  getLegendCollapsedState(layerPath: string): boolean {
    // Redirect to event processor
    return MapEventProcessor.getMapLegendCollapsedFromOrderedLayerInfo(this.mapId, layerPath);
  }

  /**
   * Get the collapsed state of layer's legend.
   * @param {string} layerPath - Path of the layer to get state for.
   * @param {boolean} collapsed - The new state
   * @returns {boolean} If the legend is collapsed.
   */
  setLegendCollapsedState(layerPath: string, collapsed?: boolean): void {
    // Redirect to event processor
    MapEventProcessor.setMapLegendCollapsed(this.mapId, layerPath, collapsed);
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
   * Removes an app-bar panel using an id
   *
   * @param {string} buttonPanelId - The id of the panel to remove
   */
  removeAppbarPanel(buttonPanelId: string): void {
    // loop through groups of app-bar button panels
    Object.keys(this.buttons).forEach((groupName) => {
      const group = this.buttons[groupName];

      // delete the panel from the group
      delete group[buttonPanelId];

      // trigger an event that a panel has been removed to update the state and re-render
      this.#emitAppBarRemoved({ buttonPanelId, group: groupName });
    });
  }

  /**
   * Selects a tab by id and tab group
   *
   * @param {string} tabId - The id of the tab to be selected
   * @param {string} tabGroup - The id of the panel
   * @param {boolean} open - Open (true) or closed (false) panel: default = true
   */
  selectAppBarTab(tabId: string, tabGroup: string, open: boolean = true): void {
    UIEventProcessor.setActiveAppBarTab(this.mapId, tabId, tabGroup, open);
  }
}

/**
 * Define an event for the delegate
 */
export type AppBarCreatedEvent = {
  buttonPanelId: string;
  group: string;
  buttonPanel: TypeButtonPanel;
};

/**
 * Define a delegate for the event handler function signature
 */
type AppBarCreatedDelegate = EventDelegateBase<AppBarApi, AppBarCreatedEvent>;

/**
 * Define an event for the delegate
 */
export type AppBarRemovedEvent = {
  buttonPanelId: string;
  group: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type AppBarRemovedDelegate = EventDelegateBase<AppBarApi, AppBarRemovedEvent>;
