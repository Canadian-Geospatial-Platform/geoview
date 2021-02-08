import { Map } from 'leaflet';

/* eslint-disable no-param-reassign */
import { api } from '../../api/api';
import { EVENT_NAMES } from '../../api/event';

import { LayersPanel } from '../../components/panel/default-panels';

import { generateId } from '../constant';
import { Button, ButtonProps } from './button';
import { Panel, PanelProps, PANEL_TYPES } from './panel';

/**
 * Interface used to initialize a button panel
 */
export interface ButtonPanelProps {
    panel: PanelProps;
    button: ButtonProps;
}

/**
 * Interface used when creating a new button panel
 */
export interface ButtonPanelType {
    panel: Panel;
    button: Button;
    groupName?: string | null | undefined;
}

// TODO: look at code duplication

/**
 * Class used to manage creating buttons and button panels
 *
 * @export
 * @class ButtonPanel
 */
export class ButtonPanel {
    // groups of array of button panels to hold all buttons created on the appbar
    appBarButtonPanels: Record<string, ButtonPanelType[]> = {};

    // group of array to hold all buttons, button panels created on the navbar
    navBarButtons: Record<string, Button[] & ButtonPanelType[]> = {};

    // reference to the leaflet map
    map: Map;

    /**
     * Create default buttons, button panels
     *
     * @param {Map} map the leaflet map
     */
    constructor(map: Map) {
        this.map = map;

        this.createDefaultButtonPanels();
    }

    /**
     * Function used to create default buttons, button panels
     */
    private createDefaultButtonPanels = () => {
        // create default group for appbar button panels
        this.appBarButtonPanels.default = [];

        // create default group for navbar buttons
        this.navBarButtons.default = [];

        this.createAppbarButtonPanel(LayersPanel.button, LayersPanel.panel, 'default');
    };

    /**
     * Create a group for the appbar buttons
     *
     * @param groupName a group name to be used to manage the group of appbar buttons
     */
    createAppbarButtonGroup = (groupName: string): void => {
        this.appBarButtonPanels[groupName] = [];
    };

    /**
     * Create a group for the navbar buttons
     *
     * @param groupName a group name to be used to manage the group of navbar buttons
     */
    createNavbarButtonGroup = (groupName: string): void => {
        this.navBarButtons[groupName] = [];
    };

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
            // generate an id
            buttonProps.id = generateId(null);

            // if group was not specified then add button panels to the default group
            if (!groupName) {
                groupName = 'default';
            }

            // if group does not exist then create it
            if (!this.appBarButtonPanels[groupName]) {
                this.appBarButtonPanels[groupName] = [];
            }

            // set panel type
            panelProps.type = PANEL_TYPES.APPBAR;

            const buttonPanel: ButtonPanelType = {
                panel: new Panel(panelProps, buttonProps.id),
                button: new Button(buttonProps),
                groupName,
            };

            // add the new button panel to the correct group
            this.appBarButtonPanels[groupName].push(buttonPanel);

            // trigger an event that a new button panel has been created to update the state and re-render
            api.event.emit(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE, null, {
                buttonPanel,
            });

            return buttonPanel;
        }

        return null;
    };

    /**
     * Create a navbar button panel
     *
     * @param {ButtonProps} buttonProps button properties
     * @param {PanelProps} panelProps panel properties
     * @param {string} groupName group name to add the button panel to
     */
    createNavbarButtonPanel = (buttonProps: ButtonProps, panelProps: PanelProps, groupName: string): ButtonPanelType | null => {
        if (buttonProps && panelProps) {
            // generate an id
            buttonProps.id = generateId(null);

            // if group was not specified then add button panels to the default group
            if (!groupName) {
                groupName = 'default';
            }

            // if group does not exist then create it
            if (!this.navBarButtons[groupName]) {
                this.navBarButtons[groupName] = [];
            }

            // set panel type
            panelProps.type = PANEL_TYPES.NAVBAR;

            const buttonPanel: ButtonPanelType = {
                panel: new Panel(panelProps, buttonProps.id),
                button: new Button(buttonProps),
                groupName,
            };

            // add the new button panel to the correct group
            this.navBarButtons[groupName].push(buttonPanel);

            // trigger an event that a new button panel has been created to update the state and re-render
            api.event.emit(EVENT_NAMES.EVENT_NAVBAR_PANEL_CREATE, null, {
                buttonPanel,
            });

            return buttonPanel;
        }

        return null;
    };

    /**
     * Create a new navbar button that will trigger a callback when clicked
     *
     * @param {ButtonProps} buttonProps button properties
     * @param {string} groupName group name to add button to
     */
    createNavbarButton = (buttonProps: ButtonProps, groupName: string): Button | null => {
        if (buttonProps) {
            // generate an id
            buttonProps.id = generateId(null);

            // if group was not specified then add button panels to the default group
            if (!groupName) {
                groupName = 'default';
            }

            // if group does not exist then create it
            if (!this.navBarButtons[groupName]) {
                this.navBarButtons[groupName] = [];
            }

            const button = new Button(buttonProps);

            // add the new button to the correct group
            this.navBarButtons[groupName].push(button);

            // trigger an event that a new button has been created to update the state and re-render
            api.event.emit(EVENT_NAMES.EVENT_NAVBAR_BUTTON_CREATE, null, {
                button,
            });

            return button;
        }

        return null;
    };
}
