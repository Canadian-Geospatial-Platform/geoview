/* eslint-disable no-param-reassign */
import { api } from "../../api/api";
import { EVENT_NAMES } from "../../api/event";

import { LayersPanel } from "../panel/default-panels";

import { ButtonApi } from "../button/button-api";
import { PanelApi } from "../panel/panel-api";

import {
  TypeButtonPanel,
  TypeButtonProps,
  TypePanelProps,
  CONST_PANEL_TYPES,
} from "../../core/types/cgpv-types";

import { generateId } from "../../core/utils/utilities";

// TODO: look at code duplication

/**
 * Class used to manage creating buttons and button panels
 *
 * @export
 * @class ButtonPanel
 */
export class ButtonPanel {
  // group of array to hold all buttons, button panels created on the navbar
  navBarButtons: Record<string, Record<string, TypeButtonPanel>> = {};

  // reference to the leaflet map
  private buttonPanelMap: L.Map;

  /**
   * Create default buttons, button panels
   *
   * @param {Map} map the leaflet map
   */
  constructor(map: L.Map) {
    this.buttonPanelMap = map;

    this.createDefaultButtonPanels();
  }

  /**
   * Function used to create default buttons, button panels
   */
  private createDefaultButtonPanels = () => {
    // create default group for navbar buttons
    this.navBarButtons.default = {};
  };

  /**
   * Create a group for the navbar buttons
   *
   * @param {string} groupName a group name to be used to manage the group of navbar buttons
   */
  createNavbarButtonGroup = (groupName: string): void => {
    this.navBarButtons[groupName] = {};
  };

  /**
   * Create either a button or a button panel on the navbar
   *
   * @param {TypeButtonProps} buttonProps button properties
   * @param {TypePanelProps} panelProps panel properties
   * @param {string} groupName the group to place the button / panel in
   *
   * @returns the create button / button panel
   */
  private createButtonPanel = (
    buttonProps: TypeButtonProps,
    panelProps: TypePanelProps | null | undefined,
    groupName: string
  ): TypeButtonPanel | null => {
    if (buttonProps) {
      // generate an id if not provided
      buttonProps.id = generateId(buttonProps.id);

      // if group was not specified then add button panels to the default group
      if (!groupName) {
        groupName = "default";
      }

      // if group does not exist then create it
      if (!this.navBarButtons[groupName]) {
        this.navBarButtons[groupName] = {};
      }

      const buttonPanel: TypeButtonPanel = {
        id: buttonProps.id,
        button: new ButtonApi(buttonProps),
        groupName,
      };

      // if adding a panel
      if (panelProps) {
        // set panel type
        if (panelProps) panelProps.type = CONST_PANEL_TYPES.NAVBAR;

        buttonPanel.panel = new PanelApi(panelProps, buttonProps.id);
      }

      // add the new button panel to the correct group
      this.navBarButtons[groupName][buttonProps.id] = buttonPanel;

      // trigger an event that a new button or button panel has been created to update the state and re-render
      api.event.emit(EVENT_NAMES.EVENT_NAVBAR_BUTTON_PANEL_CREATE, null, {
        buttonPanel,
      });

      return buttonPanel;
    }

    return null;
  };

  /**
   * Create a navbar button panel
   *
   * @param {TypeButtonProps} buttonProps button properties
   * @param {TypePanelProps} panelProps panel properties
   * @param {string} groupName group name to add the button panel to
   *
   * @returns the created button panel
   */
  createNavbarButtonPanel = (
    buttonProps: TypeButtonProps,
    panelProps: TypePanelProps,
    groupName: string
  ): TypeButtonPanel | null => {
    return this.createButtonPanel(buttonProps, panelProps, groupName);
  };

  /**
   * Create a new navbar button that will trigger a callback when clicked
   *
   * @param {TypeButtonProps} buttonProps button properties
   * @param {string} groupName group name to add button to
   *
   * @returns the create button
   */
  createNavbarButton = (
    buttonProps: TypeButtonProps,
    groupName: string
  ): TypeButtonPanel | null => {
    return this.createButtonPanel(buttonProps, null, groupName);
  };

  /**
   * Get a button panel from the navbar by using it's id
   *
   * @param {string} id the id of the button panel to get
   * @returns {TypeButtonPanel} the returned button panel
   */
  getNavBarButtonPanelById = (id: string): TypeButtonPanel | null => {
    // loop through groups of appbar button panels
    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < Object.keys(this.navBarButtons).length; i++) {
      const group = this.navBarButtons[Object.keys(this.navBarButtons)[i]];

      // eslint-disable-next-line no-plusplus
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
   * Remove a navbar button or panel using it's id
   *
   * @param {string} id the id of the panel or button to remove
   */
  removeNavbarButtonPanel = (id: string): void => {
    // loop through groups
    Object.keys(this.navBarButtons).forEach((groupName) => {
      const group = this.navBarButtons[groupName];

      // trigger an event that a button or panel has been removed to update the state and re-render
      api.event.emit(EVENT_NAMES.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, null, {});

      // delete the button or panel from the group
      delete group[id];
    });
  };
}
