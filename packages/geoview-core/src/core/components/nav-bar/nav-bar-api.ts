import type { TypeButtonGroupConfig, TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';

import type { UIController } from '@/core/controllers/ui-controller';
import { generateId } from '@/core/utils/utilities';

/**
 * Class to manage buttons on the nav-bar.
 */
export class NavBarApi {
  /** Groups of button panels created on the nav-bar. */
  buttons: Record<string, Record<string, TypeButtonPanel>> = {};

  /** Configuration for button groups. */
  groupConfigs: Record<string, TypeButtonGroupConfig> = {};

  /** The UI controller instance for accessing the map id. */
  #uiController: UIController;

  /**
   * Instantiates a NavBarApi class.
   *
   * @param uiController - The UI controller instance
   */
  constructor(uiController: UIController) {
    this.#uiController = uiController;
    this.#createDefaultButtonPanels();
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

      // Bump the store version to trigger a re-render in the nav-bar component
      this.#uiController.bumpNavBarButtonPanelVersion();

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

      // Only remove and emit if the button actually exists in this group
      if (group[buttonPanelId]) {
        // delete the button or panel from the group
        delete group[buttonPanelId];
      }
    });

    // Bump the store version to trigger a re-render in the nav-bar component
    this.#uiController.bumpNavBarButtonPanelVersion();
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
