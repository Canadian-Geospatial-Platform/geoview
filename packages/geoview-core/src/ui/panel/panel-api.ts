import { createElement, ReactNode } from 'react';

import { api } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { PanelPayload, TypeActionButton } from '@/api/events/payloads';
import { generateId } from '@/core/utils/utilities';
import { PanelStyles, TypePanelProps } from './panel-types';

/**
 * Class used to handle creating a new panel
 *
 * @exports
 * @class PanelApi
 */
export class PanelApi {
  // panel id
  panelId: string;

  // panel type (app-bar, nav-bar)
  type: string | undefined;

  // panel open status (open/closed)
  status: boolean | undefined;

  // width of the panel
  width: string | number;

  // panel header icon
  icon: ReactNode;

  // panel header title
  title: string;

  // panel body content
  content: ReactNode;

  // the linked button id that will open/close the panel
  buttonId: string;

  // reference to the map id
  mapId: string;

  panelStyles?: PanelStyles;

  /**
   * Initialize a new panel
   *
   * @param {TypePanelProps} panel the passed in panel properties when panel is created
   * @param {string} buttonId the button id of the button that will manage the panel
   * @param {string} mapId the map id that this panel belongs to
   */
  constructor(panel: TypePanelProps, buttonId: string, mapId: string) {
    this.panelId = panel.panelId || generateId();
    this.mapId = mapId;
    this.buttonId = buttonId;
    this.type = panel.type;
    this.title = (panel.title as string) || '';
    this.icon = panel.icon;
    this.content = panel.content !== undefined && panel.content !== null ? panel.content : createElement('div');
    this.status = panel.status !== undefined && panel.status !== null ? panel.status : false;
    this.width = panel.width || 350;
    this.panelStyles = panel.panelStyles ?? {};
  }

  /**
   * Trigger an event to open the panel
   */
  open = (): void => {
    this.status = true;

    // close all other panels
    this.closeAll();

    api.event.emit(
      PanelPayload.withButtonIdAndType(EVENT_NAMES.PANEL.EVENT_PANEL_OPEN, `${this.mapId}/${this.buttonId}`, this.buttonId, this.type!)
    );
  };

  /**
   * Close all other panels
   */
  closeAll = (): void => {
    if (this.type === 'app-bar') {
      Object.keys(api.maps[this.mapId].appBarButtons.buttons).forEach((groupName: string) => {
        // get button panels from group
        const buttonPanels = api.maps[this.mapId].appBarButtons.buttons[groupName];

        // get all button panels in each group
        Object.keys(buttonPanels).forEach((buttonPanelId) => {
          const buttonPanel = buttonPanels[buttonPanelId];

          if (this.buttonId !== buttonPanel.buttonPanelId) {
            buttonPanel.panel?.closeAllPanels();
          }
        });
      });
    } else if (this.type === 'nav-bar') {
      Object.keys(api.maps[this.mapId].navBarButtons.buttons).forEach((groupName: string) => {
        // get button panels from group
        const buttonPanels = api.maps[this.mapId].navBarButtons.buttons[groupName];

        // get all button panels in each group
        Object.keys(buttonPanels).forEach((buttonPanelId) => {
          const buttonPanel = buttonPanels[buttonPanelId];

          if (this.buttonId !== buttonPanel.buttonPanelId) {
            buttonPanel.panel?.closeAllPanels();
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
      PanelPayload.withButtonIdAndType(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, `${this.mapId}/${this.buttonId}`, this.buttonId, this.type!)
    );
  };

  closeAllPanels = (): void => {
    this.status = false;

    api.event.emit(
      PanelPayload.withButtonIdAndType(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE_ALL, `${this.mapId}/${this.buttonId}`, this.buttonId, this.type!)
    );
  };

  /**
   * Add a new action button to the header of the panel before the close button
   *
   * @param {string} actionButtonId an id for the new action button to be used later to delete this button
   * @param {string} title the title of the action button, will display in the tooltip
   * @param {string | ReactElement | Element} children the icon of the action button
   * @param {Function} action a function that will be triggered when clicking this action
   * @returns {Panel} the panel
   */
  addActionButton = (
    actionButtonId: string,
    title: string,
    children: string | React.ReactElement | Element,
    action: () => void
  ): PanelApi => {
    const actionButton: TypeActionButton = {
      actionButtonId: `${this.buttonId}_${actionButtonId}`,
      title,
      children,
      action,
    };
    api.event.emit(
      PanelPayload.withButtonIdAndActionButton(
        EVENT_NAMES.PANEL.EVENT_PANEL_ADD_ACTION,
        `${this.mapId}/${this.buttonId}`,
        this.buttonId,
        actionButton
      )
    );

    return this;
  };

  /**
   * Change the content of the panel
   *
   * @param {ReactNode} content the content to update to
   *
   * @returns {Panel} this panel
   */
  changeContent = (content: ReactNode): PanelApi => {
    this.content = content;

    api.event.emit(
      PanelPayload.withButtonIdAndContent(
        EVENT_NAMES.PANEL.EVENT_PANEL_CHANGE_CONTENT,
        `${this.mapId}/${this.buttonId}`,
        this.buttonId,
        content
      )
    );

    return this;
  };

  /**
   * Remove action button
   *
   * @param {string} actionButtonId the id of the action button to be removed
   * @returns {Panel} this panel
   */
  removeActionButton = (actionButtonId: string): PanelApi => {
    const actionButton: TypeActionButton = {
      actionButtonId: `${this.buttonId}_${actionButtonId}`,
    };
    api.event.emit(
      PanelPayload.withButtonIdAndActionButton(
        EVENT_NAMES.PANEL.EVENT_PANEL_REMOVE_ACTION,
        `${this.mapId}/${this.buttonId}`,
        this.buttonId,
        actionButton
      )
    );

    return this;
  };
}
