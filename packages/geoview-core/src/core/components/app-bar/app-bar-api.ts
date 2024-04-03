import { CONST_PANEL_TYPES, TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { TypeIconButtonProps } from '@/ui/icon-button/icon-button-types';

import { generateId } from '@/core/utils/utilities';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';

/**
 * Class to manage buttons on the app-bar
 *
 * @exports
 * @class
 */
export class AppbarApi {
  mapId: string;

  // groups of array of button panels to hold all buttons created on the app-bar
  buttons: Record<string, Record<string, TypeButtonPanel>> = {};

  /** Callback handlers for the appbar created event. */
  #onAppbarCreatedHandlers: AppbarCreatedDelegate[] = [];

  /** Callback handlers for the appbar removed event. */
  #onAppbarRemovedHandlers: AppbarRemovedDelegate[] = [];

  /**
   * Instantiates an AppbarApi class.
   *
   * @param {string} mapId - The map id this app-bar belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;

    this.#createDefaultButtonPanels();
  }

  /**
   * Emits an event to all registered appbar created event handlers.
   * @param {AppbarCreatedEvent} event - The event to emit.
   * @private
   */
  #emitAppbarCreated(event: AppbarCreatedEvent): void {
    // Emit the appbar created event
    EventHelper.emitEvent(this, this.#onAppbarCreatedHandlers, event);
  }

  /**
   * Registers an event handler for appbar created events.
   * @param {AppbarCreatedDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onAppbarCreated(callback: AppbarCreatedDelegate): void {
    // Register the appbar created event callback
    EventHelper.onEvent(this.#onAppbarCreatedHandlers, callback);
  }

  /**
   * Unregisters an event handler for appbar created events.
   * @param {AppbarCreatedDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offAppbarCreated(callback: AppbarCreatedDelegate): void {
    // Unregister the appbar created event callback
    EventHelper.offEvent(this.#onAppbarCreatedHandlers, callback);
  }

  /**
   * Emits an event to all registered appbar removed event handlers.
   * @param {AppbarRemovedDelegate} event - The event to emit.
   * @private
   */
  #emitAppbarRemoved(event: AppbarRemovedEvent): void {
    // Emit the appbar removed event
    EventHelper.emitEvent(this, this.#onAppbarRemovedHandlers, event);
  }

  /**
   * Registers an event handler for appbar removed events.
   * @param {AppbarRemovedDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onAppbarRemoved(callback: AppbarRemovedDelegate): void {
    // Register the appbar removed event callback
    EventHelper.onEvent(this.#onAppbarRemovedHandlers, callback);
  }

  /**
   * Unregisters an event handler for appbar removed events.
   * @param {AppbarRemovedDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offAppbarRemoved(callback: AppbarRemovedDelegate): void {
    // Unregister the appbar removed event callback
    EventHelper.offEvent(this.#onAppbarRemovedHandlers, callback);
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
      this.#emitAppbarCreated({ buttonPanelId, group, buttonPanel });

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
      this.#emitAppbarRemoved({ buttonPanelId, group: groupName });
    });
  }
}

/**
 * Define an event for the delegate
 */
export type AppbarCreatedEvent = {
  buttonPanelId: string;
  group: string;
  buttonPanel: TypeButtonPanel;
};

/**
 * Define a delegate for the event handler function signature
 */
type AppbarCreatedDelegate = EventDelegateBase<AppbarApi, AppbarCreatedEvent>;

/**
 * Define an event for the delegate
 */
export type AppbarRemovedEvent = {
  buttonPanelId: string;
  group: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type AppbarRemovedDelegate = EventDelegateBase<AppbarApi, AppbarRemovedEvent>;
