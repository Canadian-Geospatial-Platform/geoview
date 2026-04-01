import type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { CONST_PANEL_TYPES } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';

import { generateId } from '@/core/utils/utilities';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';
import { getStoreUIActiveAppBarTab, type ActiveAppBarTabType } from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { UIController } from '@/core/controllers/ui-controller';
import { logger } from '@/core/utils/logger';

/**
 * Class to manage buttons on the app-bar.
 */
export class AppBarApi {
  /** The UI controller */
  #uiController: UIController;

  /** Button panels registered on the app-bar, keyed by panel id. */
  buttons: Record<string, TypeButtonPanel> = {};

  /** Callback handlers for the AppBar created event. */
  #onAppBarCreatedHandlers: AppBarCreatedDelegate[] = [];

  /** Callback handlers for the AppBar removed event. */
  #onAppBarRemovedHandlers: AppBarRemovedDelegate[] = [];

  /**
   * Instantiates an AppBarApi class.
   *
   * @param uiController - The UI controller this app bar api belongs to
   */
  constructor(uiController: UIController) {
    // Keep the controller, for actions.
    this.#uiController = uiController;
  }

  /**
   * Emits an event to all registered AppBar created event handlers.
   *
   * @param event - The event to emit
   */
  #emitAppBarCreated(event: AppBarCreatedEvent): void {
    // Emit the AppBar created event
    EventHelper.emitEvent(this, this.#onAppBarCreatedHandlers, event);
  }

  /**
   * Registers an event handler for AppBar created events.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onAppBarCreated(callback: AppBarCreatedDelegate): void {
    // Register the AppBar created event callback
    EventHelper.onEvent(this.#onAppBarCreatedHandlers, callback);
  }

  /**
   * Unregisters an event handler for AppBar created events.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offAppBarCreated(callback: AppBarCreatedDelegate): void {
    // Unregister the AppBar created event callback
    EventHelper.offEvent(this.#onAppBarCreatedHandlers, callback);
  }

  /**
   * Emits an event to all registered AppBar removed event handlers.
   *
   * @param event - The event to emit
   */
  #emitAppBarRemoved(event: AppBarRemovedEvent): void {
    // Emit the AppBar removed event
    EventHelper.emitEvent(this, this.#onAppBarRemovedHandlers, event);
  }

  /**
   * Registers an event handler for AppBar removed events.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onAppBarRemoved(callback: AppBarRemovedDelegate): void {
    // Register the AppBar removed event callback
    EventHelper.onEvent(this.#onAppBarRemovedHandlers, callback);
  }

  /**
   * Unregisters an event handler for AppBar removed events.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offAppBarRemoved(callback: AppBarRemovedDelegate): void {
    // Unregister the AppBar removed event callback
    EventHelper.offEvent(this.#onAppBarRemovedHandlers, callback);
  }

  /**
   * Creates a button on the app-bar that will open a panel.
   *
   * @param buttonProps - Button properties (icon, tooltip)
   * @param panelProps - Panel properties (icon, title, content)
   * @returns The created button panel, or null if inputs are missing
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
        panelId: buttonPanelId,
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
   * Gets a button panel from the app-bar by its id.
   *
   * @param buttonPanelId - The id of the button panel to get
   * @returns The matching button panel, or null if not found
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
   * Gets the active app bar tab.
   *
   * @returns The active app bar tab info.
   * @deprecated Legacy support. Should be removed.
   */
  getActiveAppBarTab(): ActiveAppBarTabType {
    return getStoreUIActiveAppBarTab(this.#uiController.getMapId());
  }

  /**
   * Removes an app-bar panel using an id.
   *
   * @param buttonPanelId - The id of the panel to remove
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
   * Selects a tab by id.
   *
   * @param tabId - The id of the tab to be selected
   * @param open - Optional open (true) or closed (false) panel (default: true)
   * @param isFocusTrapped - Optional whether focus should be trapped (default: true)
   * @deprecated Legacy support. Should use uiController.setActiveAppBarTab directly instead.
   */
  selectTab(tabId: string, open: boolean = true, isFocusTrapped: boolean = true): void {
    // Redirect to ui controller
    this.#uiController.setActiveAppBarTab(tabId, open, isFocusTrapped);
  }
}

/** Event payload emitted when an AppBar button panel is created. */
export type AppBarCreatedEvent = {
  buttonPanelId: string;
  buttonPanel: TypeButtonPanel;
};

/** Delegate type for AppBar created event handlers. */
type AppBarCreatedDelegate = EventDelegateBase<AppBarApi, AppBarCreatedEvent, void>;

/** Event payload emitted when an AppBar button panel is removed. */
export type AppBarRemovedEvent = {
  buttonPanelId: string;
};

/** Delegate type for AppBar removed event handlers. */
type AppBarRemovedDelegate = EventDelegateBase<AppBarApi, AppBarRemovedEvent, void>;
