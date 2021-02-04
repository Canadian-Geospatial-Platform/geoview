import React from 'react';

import { generateId } from './constant';
import { api } from '../api/api';
import { EVENT_NAMES } from '../api/event';
import { LayersPanel } from '../components/panel/default-panels';

/**
 * Interface used when creating a new panel
 */
export interface PanelType {
    // generated panel id
    id?: string;
    // button tooltip
    buttonTooltip: string;
    // button icon
    buttonIcon: React.ReactNode | Element;
    // panel open status (open/closed)
    status?: boolean;
    // panel header icon
    panelIcon: React.ReactNode | Element;
    // panel header title
    panelTitle: string;
    // panel body content
    panelContent: Element;
    // width of the panel
    panelWidth?: unknown;
}

/**
 * Class used to manage creating panels
 *
 * @export
 * @class Panel
 */
export class Panel {
    panels: PanelType[] = [];

    constructor() {
        this.defaultPanels();
    }

    private defaultPanels() {
        this.createPanel(LayersPanel);
    }

    /**
     *
     * @param {PanelType} panel the panel to create
     */
    createPanel = (panel: PanelType): void => {
        // generate an id if id was not provided
        if (!panel.id) {
            // eslint-disable-next-line no-param-reassign
            panel.id = generateId(panel.id);
        }

        this.panels.push(panel);

        // trigger an event that a new panel has been created to update the state and re-render
        api.event.emit(EVENT_NAMES.EVENT_PANEL_CREATE, null, {
            panel,
        });
    };
}
