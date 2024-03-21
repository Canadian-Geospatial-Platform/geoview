import { api } from '@/app';

import { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { TypeIconButtonProps } from '@/ui/icon-button/icon-button-types';

import { generateId } from '@/core/utils/utilities';

/**
 * Class to manage buttons on the nav-bar
 *
 * @exports
 * @class
 */
export class NavbarApi {
  mapId!: string;

  // group of array to hold all buttons, button panels created on the nav-bar
  buttons: Record<string, Record<string, TypeButtonPanel>> = {};

  /**
   * Create default buttons, button panels
   *
   * @param {string} mapId the current map
   */
  constructor(mapId: string) {
    this.mapId = mapId;

    this.createDefaultButtonPanels();
  }

  /**
   * Function used to create default buttons, button panels
   */
  private createDefaultButtonPanels = () => {
    // create default group for nav-bar buttons
    this.buttons.default = {};
  };

  /**
   * Create a group for the nav-bar buttons
   *
   * @param {string} groupName a group name to be used to manage the group of nav-bar buttons
   */
  createNavbarButtonGroup = (groupName: string): void => {
    this.buttons[groupName] = {};
  };

  /**
   * Create either a button or a button panel on the nav-bar
   *
   * @param {TypeButtonProps} buttonProps button properties
   * @param {TypePanelProps} panelProps panel properties
   * @param {string} groupName the group to place the button / panel in
   *
   * @returns the create button / button panel
   */
  private createButtonPanel = (
    buttonProps: TypeIconButtonProps,
    panelProps: TypePanelProps | undefined,
    groupName: string
  ): TypeButtonPanel | null => {
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
      api.event.emitCreateNavBarPanel(this.mapId, buttonPanelId, group, buttonPanel);

      return buttonPanel;
    }

    return null;
  };

  /**
   * Create a nav-bar button panel
   *
   * @param {TypeButtonProps} buttonProps button properties
   * @param {TypePanelProps} panelProps panel properties
   * @param {string} groupName group name to add the button panel to
   *
   * @returns the created button panel
   */
  createNavbarButtonPanel = (buttonProps: TypeIconButtonProps, panelProps: TypePanelProps, groupName: string): TypeButtonPanel | null => {
    return this.createButtonPanel(buttonProps, panelProps, groupName);
  };

  /**
   * Create a new nav-bar button that will trigger a callback when clicked
   *
   * @param {TypeButtonProps} buttonProps button properties
   * @param {string} groupName group name to add button to
   *
   * @returns the create button
   */
  createNavbarButton = (buttonProps: TypeIconButtonProps, groupName: string): TypeButtonPanel | null => {
    return this.createButtonPanel(buttonProps, undefined, groupName);
  };

  /**
   * Get a button panel from the nav-bar by using it's id
   *
   * @param {string} id the id of the button panel to get
   * @returns {TypeButtonPanel} the returned button panel
   */
  getNavBarButtonPanelById = (buttonPanelId: string): TypeButtonPanel | null => {
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
  };

  /**
   * Remove a nav-bar button or panel using it's id
   *
   * @param {string} id the id of the panel or button to remove
   */
  removeNavbarButtonPanel = (buttonPanelId: string): void => {
    // loop through groups
    Object.keys(this.buttons).forEach((groupName) => {
      const group = this.buttons[groupName];

      // delete the button or panel from the group
      delete group[buttonPanelId];

      // trigger an event that a button or panel has been removed to update the state and re-render
      api.event.emitRemoveNavBarPanel(this.mapId, buttonPanelId, groupName, group[buttonPanelId]);
    });
  };
}
