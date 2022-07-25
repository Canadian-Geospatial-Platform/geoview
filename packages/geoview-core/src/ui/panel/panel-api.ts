import { createElement } from 'react';

import { api } from '../../app';
import { EVENT_NAMES } from '../../api/events/event-types';

import { CheckboxListAPI } from '../list/checkbox-list/checkbox-list-api';

import { PanelPayload, TypeActionButton } from '../../api/events/payloads/panel-payload';
import { generateId } from '../../core/utils/utilities';
import { TypePanelProps } from './panel-types';

/**
 * Class used to handle creating a new panel
 *
 * @exports
 * @class PanelApi
 */
export class PanelApi {
  // panel id
  id: string;

  // panel type (appbar, navbar)
  type: string | undefined;

  // panel open status (open/closed)
  status: boolean | undefined;

  // width of the panel
  width: string | number;

  // panel header icon
  icon: React.ReactNode | Element;

  // panel header title
  title: string;

  // panel body content
  content: React.ElementType | React.ReactNode | Element;

  // the linked button id that will open/close the panel
  buttonId: string;

  // reference to the map id
  mapId: string;

  checkboxListAPI?: CheckboxListAPI;

  /**
   * Initialize a new panel
   *
   * @param {TypePanelProps} panel the passed in panel properties when panel is created
   * @param {string} buttonId the button id of the button that will manage the panel
   * @param {string} mapId the map id that this panel belongs to
   */
  constructor(panel: TypePanelProps, buttonId: string, mapId: string) {
    this.id = panel.id || generateId();
    this.mapId = mapId;
    this.buttonId = buttonId;
    this.type = panel.type;
    this.title = (panel.title as string) || '';
    this.icon = panel.icon;
    this.content = panel.content !== undefined && panel.content !== null ? panel.content : createElement('div');
    this.status = panel.status !== undefined && panel.status !== null ? panel.status : false;
    this.width = panel.width || 300;
  }

  /**
   * Trigger an event to open the panel
   */
  open = (): void => {
    this.status = true;

    // close all other panels
    this.closeAll();

    api.event.emit(
      PanelPayload.withButtonIdAndType(EVENT_NAMES.PANEL.EVENT_PANEL_OPEN, this.mapId, this.buttonId, this.type!),
      this.buttonId
    );
  };

  /**
   * Close all other panels
   */
  closeAll = (): void => {
    if (this.type === 'appbar') {
      Object.keys(api.map(this.mapId).appBarButtons.buttons).forEach((groupName: string) => {
        // get button panels from group
        const buttonPanels = api.map(this.mapId).appBarButtons.buttons[groupName];

        // get all button panels in each group
        Object.keys(buttonPanels).forEach((buttonId) => {
          const buttonPanel = buttonPanels[buttonId];

          if (this.buttonId !== buttonPanel.id) {
            buttonPanel.panel?.close();
          }
        });
      });
    } else if (this.type === 'navbar') {
      Object.keys(api.map(this.mapId).navBarButtons.buttons).forEach((groupName: string) => {
        // get button panels from group
        const buttonPanels = api.map(this.mapId).navBarButtons.buttons[groupName];

        // get all button panels in each group
        Object.keys(buttonPanels).forEach((buttonId) => {
          const buttonPanel = buttonPanels[buttonId];

          if (this.buttonId !== buttonPanel.id) {
            buttonPanel.panel?.close();
          }
        });
      });
    }
  };

  /**
   * Trigger an event to close the panel
   */
  close = (): void => {
    this.status = false;

    api.event.emit(
      PanelPayload.withButtonIdAndType(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, this.mapId, this.buttonId, this.type!),
      this.buttonId
    );
  };

  /**
   * Add a new action button to the header of the panel before the close button
   *
   * @param {string} id an id for the new action button to be used later to delete this button
   * @param {string} title the title of the action button, will display in the tooltip
   * @param {string | ReactElement | Element} children the icon of the action button
   * @param {Function} action a function that will be triggered when clicking this action
   * @returns {Panel} the panel
   */
  addActionButton = (id: string, title: string, children: string | React.ReactElement | Element, action: () => void): PanelApi => {
    const actionButton: TypeActionButton = {
      id: `${this.buttonId}_${id}`,
      title,
      children,
      action,
    };
    api.event.emit(
      PanelPayload.withButtonIdAndActionButton(EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION, this.mapId, this.buttonId, actionButton),
      this.buttonId
    );

    return this;
  };

  /**
   * Create a check list that can be used as a content
   *
   * @param {String[]} elements of the check list the content to update to
   *
   * @returns {CheckboxList} the check list
   */
  attachCheckBoxList = (listItems: string[], multiselectFlag?: boolean, checkedItems?: number[]): void => {
    if (this.checkboxListAPI) delete this.checkboxListAPI;
    this.checkboxListAPI = new CheckboxListAPI(listItems, multiselectFlag, checkedItems);
    this.changeContent(this.checkboxListAPI.CheckboxList);
  };

  /**
   * Change the content of the panel
   *
   * @param {React Element} content the content to update to
   *
   * @returns {Panel} this panel
   */
  changeContent = (content: React.ReactNode | Element): PanelApi => {
    this.content = content;

    api.event.emit(
      PanelPayload.withButtonIdAndContent(EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT, this.mapId, this.buttonId, content),
      this.buttonId
    );

    return this;
  };

  /**
   * Remove action button
   *
   * @param {string} id the id of the action button to be removed
   * @returns {Panel} this panel
   */
  removeActionButton = (id: string): PanelApi => {
    const actionButton: TypeActionButton = {
      id: `${this.buttonId}_${id}`,
    };
    api.event.emit(
      PanelPayload.withButtonIdAndActionButton(EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION, this.mapId, this.buttonId, actionButton),
      this.buttonId
    );

    return this;
  };
}
