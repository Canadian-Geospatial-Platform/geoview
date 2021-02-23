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
    id: string;
    panel?: Panel;
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
    appBarPanels: Record<string, Record<string, ButtonPanelType>> = {};

    // group of array to hold all buttons, button panels created on the navbar
    navBarButtons: Record<string, Record<string, ButtonPanelType>> = {};

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
        this.appBarPanels.default = {};

        // create default group for navbar buttons
        this.navBarButtons.default = {};

        this.createAppbarPanel(LayersPanel.button, LayersPanel.panel, 'default');
    };

    /**
     * Create a group for the appbar buttons
     *
     * @param {string} groupName a group name to be used to manage the group of appbar buttons
     */
    createAppbarButtonGroup = (groupName: string): void => {
        this.appBarPanels[groupName] = {};
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
     * Create a button on the appbar that will open a panel
     *
     * @param {ButtonProps} buttonProps button properties (icon, tooltip)
     * @param {PanelProps} panelProps panel properties (icon, title, content)
     * @param {string} groupName optional value to set this button in a group
     *
     * @returns the created panel
     */
    createAppbarPanel = (
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
            if (!this.appBarPanels[groupName]) {
                this.appBarPanels[groupName] = {};
            }

            // set panel type
            panelProps.type = PANEL_TYPES.APPBAR;

            const buttonPanel: ButtonPanelType = {
                id: buttonProps.id,
                panel: new Panel(panelProps, buttonProps.id),
                button: new Button(buttonProps),
                groupName,
            };

            // add the new button panel to the correct group
            this.appBarPanels[groupName][buttonProps.id] = buttonPanel;

            // trigger an event that a new button panel has been created to update the state and re-render
            api.event.emit(EVENT_NAMES.EVENT_APPBAR_PANEL_CREATE, null, {
                buttonPanel,
            });

            return buttonPanel;
        }

        return null;
    };

    /**
     * Create either a button or a button panel on the navbar
     *
     * @param {ButtonProps} buttonProps button properties
     * @param {PanelProps} panelProps panel properties
     * @param {string} groupName the group to place the button / panel in
     *
     * @returns the create button / button panel
     */
    private createButtonPanel = (
        buttonProps: ButtonProps,
        panelProps: PanelProps | null | undefined,
        groupName: string
    ): ButtonPanelType | null | undefined => {
        if (buttonProps) {
            // generate an id
            buttonProps.id = generateId(null);

            // if group was not specified then add button panels to the default group
            if (!groupName) {
                groupName = 'default';
            }

            // if group does not exist then create it
            if (!this.navBarButtons[groupName]) {
                this.navBarButtons[groupName] = {};
            }

            const buttonPanel: ButtonPanelType = {
                id: buttonProps.id,
                button: new Button(buttonProps),
                groupName,
            };

            // if adding a panel
            if (panelProps) {
                // set panel type
                if (panelProps) panelProps.type = PANEL_TYPES.NAVBAR;

                buttonPanel.panel = new Panel(panelProps, buttonProps.id);
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
     * @param {ButtonProps} buttonProps button properties
     * @param {PanelProps} panelProps panel properties
     * @param {string} groupName group name to add the button panel to
     *
     * @returns the created button panel
     */
    createNavbarButtonPanel = (buttonProps: ButtonProps, panelProps: PanelProps, groupName: string): ButtonPanelType | null | undefined => {
        return this.createButtonPanel(buttonProps, panelProps, groupName);
    };

    /**
     * Create a new navbar button that will trigger a callback when clicked
     *
     * @param {ButtonProps} buttonProps button properties
     * @param {string} groupName group name to add button to
     *
     * @returns the create button
     */
    createNavbarButton = (buttonProps: ButtonProps, groupName: string): ButtonPanelType | null | undefined => {
        return this.createButtonPanel(buttonProps, null, groupName);
    };

    /**
     * Remove an appbar panel using an id
     *
     * @param {string} id the id of the panel to remove
     */
    removeAppbarPanel = (id: string): void => {
        // loop through groups of appbar button panels
        Object.keys(this.appBarPanels).forEach((groupName) => {
            const group = this.appBarPanels[groupName];

            // delete the panel from the group
            delete group[id];

            // trigger an event that a panel has been removed to update the state and re-render
            api.event.emit(EVENT_NAMES.EVENT_APPBAR_PANEL_REMOVE, null, {});
        });
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
