import { createElement, ReactNode } from 'react';

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
}
