import { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { TypeIconButtonProps } from '@/ui/icon-button/icon-button-types';

import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';
import { generateId } from '@/core/utils/utilities';

/**
 * Class to manage buttons on the nav-bar
 *
 * @exports
 * @class
 */
export class NavbarApi {
  mapId: string;

  // group of array to hold all buttons, button panels created on the nav-bar
  buttons: Record<string, Record<string, TypeButtonPanel>> = {};

  /** Callback handlers for the navbar created event. */
  #onNavbarCreatedHandlers: NavbarCreatedDelegate[] = [];

  /** Callback handlers for the navbar removed event. */
  #onNavbarRemovedHandlers: NavbarRemovedDelegate[] = [];

  /**
   * Instantiates a NavbarApi class.
   *
   * @param {string} mapId - The map id this nav bar belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;

    this.#createDefaultButtonPanels();
  }

  /**
   * Emits an event to all registered navbar created event handlers.
   * @param {NavbarCreatedEvent} event - The event to emit.
   * @private
   */
  #emitNavbarCreated(event: NavbarCreatedEvent): void {
    // Emit the navbar created event
    EventHelper.emitEvent(this, this.#onNavbarCreatedHandlers, event);
  }

  /**
   * Registers an event handler for navbar created events.
   * @param {NavbarCreatedDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onNavbarCreated(callback: NavbarCreatedDelegate): void {
    // Register the navbar created event callback
    EventHelper.onEvent(this.#onNavbarCreatedHandlers, callback);
  }

  /**
   * Unregisters an event handler for navbar created events.
   * @param {NavbarCreatedDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offNavbarCreated(callback: NavbarCreatedDelegate): void {
    // Unregister the navbar created event callback
    EventHelper.offEvent(this.#onNavbarCreatedHandlers, callback);
  }

  /**
   * Emits an event to all registered navbar removed event handlers.
   * @param {NavbarRemovedDelegate} event - The event to emit.
   * @private
   */
  #emitNavbarRemoved(event: NavbarRemovedEvent): void {
    // Emit the navbar removed event
    EventHelper.emitEvent(this, this.#onNavbarRemovedHandlers, event);
  }

  /**
   * Registers an event handler for navbar removed events.
   * @param {NavbarRemovedDelegate} callback - The callback to be executed whenever the event is emitted.
   */
  onNavbarRemoved(callback: NavbarRemovedDelegate): void {
    // Register the navbar removed event callback
    EventHelper.onEvent(this.#onNavbarRemovedHandlers, callback);
  }

  /**
   * Unregisters an event handler for navbar removed events.
   * @param {NavbarRemovedDelegate} callback - The callback to stop being called whenever the event is emitted.
   */
  offNavbarRemoved(callback: NavbarRemovedDelegate): void {
    // Unregister the navbar removed event callback
    EventHelper.offEvent(this.#onNavbarRemovedHandlers, callback);
  }

  /**
   * Function used to create default buttons, button panels
   * @private
   */
  #createDefaultButtonPanels(): void {
    // create default group for nav-bar buttons
    this.buttons.default = {};
  }

  /**
   * Creates either a button or a button panel on the nav-bar
   *
   * @param {TypeIconButtonProps} buttonProps - Button properties
   * @param {TypePanelProps | undefined} panelProps - Optional panel properties
   * @param {string} groupName - The group to place the button / panel in
   * @returns {TypeButtonPanel | null} The created button / button panel
   * @private
   */
  #createButtonPanel(buttonProps: TypeIconButtonProps, panelProps: TypePanelProps | undefined, groupName: string): TypeButtonPanel | null {
    if (buttonProps) {
      // generate an id if not provided
      const buttonPanelId = generateId(buttonProps.id);

      // if group was not specified then add button panels to the default group
      const group = groupName || 'default';

      // if group does not exist then create it
      if (!this.buttons[group]) {
        this.buttons[group] = {};
      }

      const button: TypeIconButtonProps = {
        ...buttonProps,
        id: buttonPanelId,
        visible: !buttonProps.visible ? true : buttonProps.visible,
      };

      const buttonPanel: TypeButtonPanel = {
        buttonPanelId,
        button,
        panel: panelProps,
        groupName: group,
      };

      // add the new button panel to the correct group
      if (group !== '__proto__' && buttonPanelId !== '__proto__') this.buttons[group][buttonPanelId] = buttonPanel;

      // trigger an event that a new button or button panel has been created to update the state and re-render
      this.#emitNavbarCreated({ buttonPanelId, group, buttonPanel });

      return buttonPanel;
    }

    return null;
  }

  /**
   * Creates a nav-bar button panel
   *
   * @param {TypeIconButtonProps} buttonProps - Button properties
   * @param {TypePanelProps} panelProps - Panel properties
   * @param {string} groupName - Group name to add the button panel to
   * @returns {TypeButtonPanel | null} The created button panel
   */
  createNavbarButtonPanel(buttonProps: TypeIconButtonProps, panelProps: TypePanelProps, groupName: string): TypeButtonPanel | null {
    return this.#createButtonPanel(buttonProps, panelProps, groupName);
  }

  /**
   * Creates a new nav-bar button that will trigger a callback when clicked
   *
   * @param {TypeButtonProps} buttonProps - Button properties
   * @param {string} groupName - Group name to add button to
   * @returns {TypeButtonPanel | null} The created button
   */
  createNavbarButton(buttonProps: TypeIconButtonProps, groupName: string): TypeButtonPanel | null {
    return this.#createButtonPanel(buttonProps, undefined, groupName);
  }

  /**
   * Gets a button panel from the nav-bar by using its id
   *
   * @param {string} buttonPanelId - The id of the button panel to get
   * @returns {TypeButtonPanel | null} The Button panel
   */
  getNavBarButtonPanelById(buttonPanelId: string): TypeButtonPanel | null {
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
   * Removes a nav-bar button or panel using its id
   *
   * @param {string} buttonPanelId - The id of the panel or button to remove
   */
  removeNavbarButtonPanel(buttonPanelId: string): void {
    // loop through groups
    Object.keys(this.buttons).forEach((groupName) => {
      const group = this.buttons[groupName];

      // delete the button or panel from the group
      delete group[buttonPanelId];

      // trigger an event that a button or panel has been removed to update the state and re-render
      this.#emitNavbarRemoved({ buttonPanelId, group: groupName });
    });
  }
}

/**
 * Define an event for the delegate
 */
export type NavbarCreatedEvent = {
  buttonPanelId: string;
  group: string;
  buttonPanel: TypeButtonPanel;
};

/**
 * Define a delegate for the event handler function signature
 */
type NavbarCreatedDelegate = EventDelegateBase<NavbarApi, NavbarCreatedEvent>;

/**
 * Define an event for the delegate
 */
export type NavbarRemovedEvent = {
  buttonPanelId: string;
  group: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type NavbarRemovedDelegate = EventDelegateBase<NavbarApi, NavbarRemovedEvent>;
