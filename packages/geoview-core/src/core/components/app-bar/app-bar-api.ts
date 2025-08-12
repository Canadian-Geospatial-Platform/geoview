import { CONST_PANEL_TYPES, TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';

import { generateId } from '@/core/utils/utilities';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { UIEventProcessor } from '@/api/event-processors/event-processor-children/ui-event-processor';
import { logger } from '@/core/utils/logger';
import { ActiveAppBarTabType } from '@/core/stores/store-interface-and-intial-values/ui-state';

/**
 * Class to manage buttons on the app-bar
 *
 * @exports
 * @class
 */
export class AppBarApi {
  mapId: string;

  // groups of array of button panels to hold all buttons created on the app-bar
  buttons: Record<string, TypeButtonPanel> = {};

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
   * Creates a button on the app-bar that will open a panel
   *
   * @param {IconButtonPropsExtend} buttonProps - Button properties (icon, tooltip)
   * @param {TypePanelProps} panelProps - Panel properties (icon, title, content)
   * @returns {TypeButtonPanel | null} The created panel
   */
  createAppbarPanel(buttonProps: IconButtonPropsExtend, panelProps: TypePanelProps): TypeButtonPanel | null {
    if (buttonProps && panelProps) {
      const buttonPanelId = buttonProps.id || generateId(18);

      const button: IconButtonPropsExtend = {
        ...buttonProps,
        id: buttonPanelId,
        visible: buttonProps.visible === undefined ? true : buttonProps.visible,
      };

      const thePanelProps: TypePanelProps = {
        ...panelProps,
        type: CONST_PANEL_TYPES.APPBAR,
      };

      const buttonPanel: TypeButtonPanel = {
        buttonPanelId,
        panel: thePanelProps,
        button,
      };

      // add the new button panel
      if (buttonPanelId !== '__proto__') this.buttons[buttonPanelId] = buttonPanel;

      // trigger an event that a new button panel has been created to update the state and re-render
      this.#emitAppBarCreated({ buttonPanelId, buttonPanel });

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
      const buttonPanel: TypeButtonPanel = this.buttons[i];

      if (buttonPanel.buttonPanelId === buttonPanelId) {
        return buttonPanel;
      }
    }

    return null;
  }

  /**
   * Selects a tab by id and tab group
   * @return {ActiveAppBarTabType} The active app bar tab info.
   */
  getActiveAppBarTab(): ActiveAppBarTabType {
    return UIEventProcessor.getActiveAppBarTab(this.mapId);
  }

  /**
   * Removes an app-bar panel using an id
   *
   * @param {string} buttonPanelId - The id of the panel to remove
   */
  removeAppbarPanel(buttonPanelId: string): void {
    try {
      // delete the panel from the group
      delete this.buttons[buttonPanelId];

      // trigger an event that a panel has been removed to update the state and re-render
      this.#emitAppBarRemoved({ buttonPanelId });
    } catch (error: unknown) {
      // Log
      logger.logError(`Failed to get app bar panel button ${buttonPanelId}`, error);
    }
  }

  /**
   * Selects a tab by id
   *
   * @param {string} tabId - The id of the tab to be selected
   * @param {boolean} open - Open (true) or closed (false) panel: default = true
   */
  selectTab(tabId: string, open: boolean = true, isFocusTrapped: boolean = true): void {
    UIEventProcessor.setActiveAppBarTab(this.mapId, tabId, open, isFocusTrapped);
  }
}

/**
 * Define an event for the delegate
 */
export type AppBarCreatedEvent = {
  buttonPanelId: string;
  buttonPanel: TypeButtonPanel;
};

/**
 * Define a delegate for the event handler function signature
 */
type AppBarCreatedDelegate = EventDelegateBase<AppBarApi, AppBarCreatedEvent, void>;

/**
 * Define an event for the delegate
 */
export type AppBarRemovedEvent = {
  buttonPanelId: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type AppBarRemovedDelegate = EventDelegateBase<AppBarApi, AppBarRemovedEvent, void>;
