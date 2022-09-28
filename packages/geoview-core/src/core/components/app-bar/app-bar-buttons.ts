import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event-types';

import { PanelApi } from '../../../ui';

import { generateId } from '../../utils/utilities';

import { buttonPanelPayload } from '../../../api/events/payloads/button-panel-payload';
import { CONST_PANEL_TYPES, TypeButtonPanel, TypePanelProps } from '../../../ui/panel/panel-types';
import { TypeIconButtonProps } from '../../../ui/icon-button/icon-button-types';

/**
 * Class to manage buttons on the app-bar
 *
 * @exports
 * @class
 */
export class AppbarButtons {
  mapId!: string;

  // groups of array of button panels to hold all buttons created on the app-bar
  buttons: Record<string, Record<string, TypeButtonPanel>> = {};

  /**
   * initialize the buttons for the app-bar
   *
   * @param mapId the id of the map this app-bar belongs to
   */
  constructor(mapId: string) {
    this.mapId = mapId;

    this.createDefaultButtonPanels();
  }

  /**
   * Function used to create default buttons, button panels
   */
  private createDefaultButtonPanels = () => {
    // create default group for app-bar button panels
    this.buttons.default = {};

    // TODO: do not keep, just proof of concept
    // this.createAppbarPanel(
    //   {
    //     ...DefaultPanel.button,
    //     tooltip: "Default",
    //   },
    //   DefaultPanel.panel,
    //   "default"
    // );
  };

  /**
   * Create a group for the app-bar buttons
   *
   * @param {string} groupName a group name to be used to manage the group of app-bar buttons
   */
  createAppbarButtonGroup = (groupName: string): void => {
    this.buttons[groupName] = {};
  };

  /**
   * Create a button on the app-bar that will open a panel
   *
   * @param {TypeIconButtonProps} buttonProps button properties (icon, tooltip)
   * @param {TypePanelProps} panelProps panel properties (icon, title, content)
   * @param {string} groupName optional value to set this button in a group
   *
   * @returns the created panel
   */
  createAppbarPanel = (
    buttonProps: TypeIconButtonProps,
    panelProps: TypePanelProps,
    groupName?: string | null | undefined
  ): TypeButtonPanel | null => {
    if (buttonProps && panelProps) {
      const id = generateId(buttonProps.id);

      const button: TypeIconButtonProps = {
        ...buttonProps,
        id,
        visible: !buttonProps.visible ? true : buttonProps.visible,
      };

      const panel: TypePanelProps = {
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
        id,
        panel: new PanelApi(panel, id, this.mapId),
        button,
        groupName: group,
      };

      // add the new button panel to the correct group
      this.buttons[group][id] = buttonPanel;

      // trigger an event that a new button panel has been created to update the state and re-render
      api.event.emit(buttonPanelPayload(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, this.mapId, id, group, buttonPanel));

      return buttonPanel;
    }

    return null;
  };

  /**
   * Get a button panel from the app-bar by using it's id
   *
   * @param {string} id the id of the button panel to get
   * @returns {TypeButtonPanel} the returned button panel
   */
  getAppBarButtonPanelById = (id: string): TypeButtonPanel | null => {
    // loop through groups of app-bar button panels
    for (let i = 0; i < Object.keys(this.buttons).length; i++) {
      const group = this.buttons[Object.keys(this.buttons)[i]];

      for (let j = 0; j < Object.keys(group).length; j++) {
        const buttonPanel: TypeButtonPanel = group[Object.keys(group)[j]];

        if (buttonPanel.id === id) {
          return buttonPanel;
        }
      }
    }

    return null;
  };

  /**
   * Get all created buttons panels regardless of group
   *
   * @returns {Record<string, TypeButtonPanels>} an object with all the button panels
   */
  getAllButtonPanels = (): Record<string, TypeButtonPanel> => {
    const buttonPanels: Record<string, TypeButtonPanel> = {};

    for (let i = 0; i < Object.keys(this.buttons).length; i += 1) {
      const group = this.buttons[Object.keys(this.buttons)[i]];

      for (let j = 0; j < Object.keys(group).length; j++) {
        const buttonPanel: TypeButtonPanel = group[Object.keys(group)[j]];

        buttonPanels[buttonPanel.id] = buttonPanel;
      }
    }

    return buttonPanels;
  };

  /**
   * Remove an app-bar panel using an id
   *
   * @param {string} id the id of the panel to remove
   */
  removeAppbarPanel = (id: string): void => {
    // loop through groups of app-bar button panels
    Object.keys(this.buttons).forEach((groupName) => {
      const group = this.buttons[groupName];

      // delete the panel from the group
      delete group[id];

      // trigger an event that a panel has been removed to update the state and re-render
      api.event.emit(buttonPanelPayload(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, this.mapId, id, groupName, group[id]));
    });
  };
}
