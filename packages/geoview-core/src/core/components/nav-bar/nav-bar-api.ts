import type { TypeButtonGroupConfig, TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';

import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import { generateId } from '@/core/utils/utilities';

/**
 * Class to manage buttons on the nav-bar.
 */
export class NavBarApi {
  /** Groups of button panels created on the nav-bar. */
  buttons: Record<string, Record<string, TypeButtonPanel>> = {};

  /** Configuration for button groups. */
  groupConfigs: Record<string, TypeButtonGroupConfig> = {};

  /** Callback handlers for the NavBar created event. */
  #onNavBarCreatedHandlers: NavBarCreatedDelegate[] = [];

  /** Callback handlers for the NavBar removed event. */
  #onNavBarRemovedHandlers: NavBarRemovedDelegate[] = [];

  /**
   * Instantiates a NavBarApi class.
   */
  constructor() {
    this.#createDefaultButtonPanels();
  }

  /**
   * Emits an event to all registered NavBar created event handlers.
   *
   * @param event - The event to emit
   */
  #emitNavbarCreated(event: NavBarCreatedEvent): void {
    // Emit the NavBar created event
    EventHelper.emitEvent(this, this.#onNavBarCreatedHandlers, event);
  }

  /**
   * Registers an event handler for NavBar created events.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onNavbarCreated(callback: NavBarCreatedDelegate): void {
    // Register the NavBar created event callback
    EventHelper.onEvent(this.#onNavBarCreatedHandlers, callback);
  }

  /**
   * Unregisters an event handler for NavBar created events.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offNavbarCreated(callback: NavBarCreatedDelegate): void {
    // Unregister the NavBar created event callback
    EventHelper.offEvent(this.#onNavBarCreatedHandlers, callback);
  }

  /**
   * Emits an event to all registered NavBar removed event handlers.
   *
   * @param event - The event to emit
   */
  #emitNavbarRemoved(event: NavBarRemovedEvent): void {
    // Emit the NavBar removed event
    EventHelper.emitEvent(this, this.#onNavBarRemovedHandlers, event);
  }

  /**
   * Registers an event handler for NavBar removed events.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onNavbarRemoved(callback: NavBarRemovedDelegate): void {
    // Register the NavBar removed event callback
    EventHelper.onEvent(this.#onNavBarRemovedHandlers, callback);
  }

  /**
   * Unregisters an event handler for NavBar removed events.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offNavbarRemoved(callback: NavBarRemovedDelegate): void {
    // Unregister the NavBar removed event callback
    EventHelper.offEvent(this.#onNavBarRemovedHandlers, callback);
  }

  /**
   * Creates default button panel groups.
   */
  #createDefaultButtonPanels(): void {
    // create default group for nav-bar buttons
    this.buttons.default = {};
  }

  /**
   * Creates either a button or a button panel on the nav-bar.
   *
   * @param buttonProps - Button properties
   * @param panelProps - Optional panel properties
   * @param groupName - The group to place the button or panel in
   * @returns The created button or button panel, or null if buttonProps is falsy
   */
  #createButtonPanel(
    buttonProps: IconButtonPropsExtend,
    panelProps: TypePanelProps | undefined,
    groupName: string
  ): TypeButtonPanel | null {
    if (buttonProps) {
      // generate an id if not provided
      const buttonPanelId = buttonProps.id || generateId(18);

      // if group was not specified then add button panels to the default group
      const group = groupName || 'default';

      // if group does not exist then create it
      if (!this.buttons[group]) {
        this.buttons[group] = {};
      }

      const button: IconButtonPropsExtend = {
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
   * Creates a nav-bar button panel.
   *
   * @param buttonProps - Button properties
   * @param panelProps - Panel properties
   * @param groupName - Group name to add the button panel to
   * @returns The created button panel
   */
  createNavbarButtonPanel(buttonProps: IconButtonPropsExtend, panelProps: TypePanelProps, groupName: string): TypeButtonPanel | null {
    return this.#createButtonPanel(buttonProps, panelProps, groupName);
  }

  /**
   * Creates a new nav-bar button that will trigger a callback when clicked.
   *
   * @param buttonProps - Button properties
   * @param groupName - Group name to add button to
   * @returns The created button
   */
  createNavbarButton(buttonProps: IconButtonPropsExtend, groupName: string): TypeButtonPanel | null {
    return this.#createButtonPanel(buttonProps, undefined, groupName);
  }

  /**
   * Gets a button panel from the nav-bar by using its id.
   *
   * @param buttonPanelId - The id of the button panel to get
   * @returns The button panel, or null if not found
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
   * Removes a nav-bar button or panel using its id.
   *
   * @param buttonPanelId - The id of the panel or button to remove
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

  /**
   * Sets configuration for a button group.
   *
   * @param groupName - The group name
   * @param config - The group configuration
   */
  setGroupConfig(groupName: string, config: Partial<TypeButtonGroupConfig>): void {
    this.groupConfigs[groupName] = {
      groupName,
      accordionThreshold: 10, // default will likely show all buttons
      ...config,
    };
  }

  /**
   * Gets configuration for a button group.
   *
   * @param groupName - The group name
   * @returns The group configuration
   */
  getGroupConfig(groupName: string): TypeButtonGroupConfig {
    return this.groupConfigs[groupName] || { groupName, accordionThreshold: 10 };
  }
}

/** Event payload when a nav-bar button panel is created. */
export type NavBarCreatedEvent = {
  /** The button panel identifier. */
  buttonPanelId: string;
  /** The group the button panel belongs to. */
  group: string;
  /** The created button panel. */
  buttonPanel: TypeButtonPanel;
};

/** Delegate type for NavBar created event handlers. */
type NavBarCreatedDelegate = EventDelegateBase<NavBarApi, NavBarCreatedEvent, void>;

/** Event payload when a nav-bar button panel is removed. */
export type NavBarRemovedEvent = {
  /** The button panel identifier. */
  buttonPanelId: string;
  /** The group the button panel belonged to. */
  group: string;
};

/** Delegate type for NavBar removed event handlers. */
type NavBarRemovedDelegate = EventDelegateBase<NavBarApi, NavBarRemovedEvent, void>;
