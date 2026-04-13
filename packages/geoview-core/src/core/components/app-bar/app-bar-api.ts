import type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { CONST_PANEL_TYPES } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';

import { generateId } from '@/core/utils/utilities';
import { getStoreUIActiveAppBarTab, type ActiveAppBarTabType } from '@/core/stores/store-interface-and-intial-values/ui-state';
import type { UIController } from '@/core/controllers/ui-controller';
import { logger } from '@/core/utils/logger';

/**
 * Class to manage buttons on the app-bar.
 */
export class AppBarApi {
  /** The UI controller. */
  #uiController: UIController;

  /** Button panels registered on the app-bar, keyed by panel id (content registry — ReactNodes stay outside the store). */
  buttons: Record<string, TypeButtonPanel> = {};

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
   * Creates a button on the app-bar that will open a panel.
   *
   * @param buttonProps - Button properties (icon, tooltip)
   * @param panelProps - Panel properties (icon, title, content)
   * @returns The created button panel, or null if inputs are missing
   */
  createAppbarPanel(buttonProps: IconButtonPropsExtend, panelProps: TypePanelProps): TypeButtonPanel | null {
    if (buttonProps && panelProps) {
      const buttonPanelId = buttonProps.id || generateId(18);

      // Skip if already registered
      if (this.buttons[buttonPanelId]) return this.buttons[buttonPanelId];

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

      // Register in the content registry
      if (buttonPanelId !== '__proto__') this.buttons[buttonPanelId] = buttonPanel;

      // Write panel id to the store so the UI reacts immediately
      this.#uiController.addAppBarPanelId(buttonPanelId);

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
    return this.buttons[buttonPanelId] ?? null;
  }

  /**
   * Gets the active app bar tab.
   *
   * @returns The active app bar tab info
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
      // Delete from content registry
      delete this.buttons[buttonPanelId];

      // Remove from the store
      this.#uiController.removeAppBarPanelId(buttonPanelId);
    } catch (error: unknown) {
      // Log
      logger.logError(`Failed to remove app bar panel button ${buttonPanelId}`, error);
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
