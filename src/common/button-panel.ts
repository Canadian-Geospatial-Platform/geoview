/* eslint-disable no-param-reassign */
import { api } from '../api/api';
import { EVENT_NAMES } from '../api/event';

import { LayersPanel } from '../components/panel/default-panels';

import { generateId } from './constant';

export const PANEL_TYPES = {
    APPBAR: 'appbar',
    NAVBAR: 'navbar',
};

/**
 * Interface for the panel properties used when creating a new panel
 */
export interface PanelProps {
    // panel type (appbar, navbar)
    type?: string;
    // panel open status (open/closed)
    status?: boolean;
    // width of the panel
    width?: unknown;
    // panel header icon
    icon: React.ReactNode | Element;
    // panel header title
    title: string;
    // panel body content
    content: Element;
}

/**
 * Interface for the button properties used when creating a new button
 */
export interface ButtonProps {
    // generated button id
    id?: string;
    // button tooltip
    tooltip: string;
    // button icon
    icon: React.ReactNode | Element;
    // optional callback function to run on button click
    callback?: unknown;
}

/**
 * Interface used when creating a new button panel
 */
export interface ButtonPanelType {
    panel: PanelProps;
    button: ButtonProps;
    groupName?: string;
}

/**
 * Class used to manage creating buttons and button panels
 *
 * @export
 * @class ButtonPanel
 */
export class ButtonPanel {
    // array of button panels to hold all buttons created on the appbar
    appBarButtonPanels: ButtonPanelType[] = [];

    // array of button panels to hold all buttons created on the navbar
    navBarButtonPanels: ButtonPanelType[] = [];

    // array to hold all buttons created on the navbar
    navBarButtons: ButtonProps[] = [];

    /**
     * Create default buttons, button panels
     */
    constructor() {
        this.createDefaultButtonPanels();
    }

    /**
     * Function used to create default buttons, button panels
     */
    private createDefaultButtonPanels = () => {
        this.createAppbarButtonPanel(LayersPanel.button, LayersPanel.panel, null);
    };

    /**
     * Create a group for the buttons
     *
     * @param groupName a group name to be used to manage the group of buttons
     */
    createButtonGroup = (groupName: string) => {};

    /**
     * Create a button on the appbar that will open a panel
     *
     * @param buttonProps button properties (icon, tooltip)
     * @param panelProps panel properties (icon, title, content)
     * @param groupName optional value to set this button in a group
     *
     * @returns the created button panel
     */
    createAppbarButtonPanel = (
        buttonProps: ButtonProps,
        panelProps: PanelProps,
        groupName: string | null | undefined
    ): ButtonPanelType | null => {
        if (buttonProps && panelProps) {
            // generate an id if id was not provided
            if (!buttonProps.id) {
                buttonProps.id = generateId(buttonProps.id);
            }

            // set panel type
            panelProps.type = PANEL_TYPES.APPBAR;

            const buttonPanel: ButtonPanelType = {
                panel: panelProps,
                button: buttonProps,
            };

            this.appBarButtonPanels.push(buttonPanel);

            // trigger an event that a new button panel has been created to update the state and re-render\
            api.event.emit(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE, null, {
                buttonPanel,
            });

            return buttonPanel;
        }

        return null;
    };

    createNavbarButtonPanel = (buttonProps: ButtonProps, panelProps: PanelProps, groupName: string) => {};

    createNavbarButton = (buttonProps: ButtonProps, groupName: string, callback) => {};
}
