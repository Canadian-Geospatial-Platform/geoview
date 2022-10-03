import { TypeButtonPanel, TypePanelProps } from '../../../ui/panel/panel-types';
import { TypeIconButtonProps } from '../../../ui/icon-button/icon-button-types';
/**
 * Class to manage buttons on the app-bar
 *
 * @exports
 * @class
 */
export declare class AppbarButtons {
    mapId: string;
    buttons: Record<string, Record<string, TypeButtonPanel>>;
    /**
     * initialize the buttons for the app-bar
     *
     * @param mapId the id of the map this app-bar belongs to
     */
    constructor(mapId: string);
    /**
     * Function used to create default buttons, button panels
     */
    private createDefaultButtonPanels;
    /**
     * Create a group for the app-bar buttons
     *
     * @param {string} groupName a group name to be used to manage the group of app-bar buttons
     */
    createAppbarButtonGroup: (groupName: string) => void;
    /**
     * Create a button on the app-bar that will open a panel
     *
     * @param {TypeIconButtonProps} buttonProps button properties (icon, tooltip)
     * @param {TypePanelProps} panelProps panel properties (icon, title, content)
     * @param {string} groupName optional value to set this button in a group
     *
     * @returns the created panel
     */
    createAppbarPanel: (buttonProps: TypeIconButtonProps, panelProps: TypePanelProps, groupName?: string | null | undefined) => TypeButtonPanel | null;
    /**
     * Get a button panel from the app-bar by using it's id
     *
     * @param {string} id the id of the button panel to get
     * @returns {TypeButtonPanel} the returned button panel
     */
    getAppBarButtonPanelById: (id: string) => TypeButtonPanel | null;
    /**
     * Get all created buttons panels regardless of group
     *
     * @returns {Record<string, TypeButtonPanels>} an object with all the button panels
     */
    getAllButtonPanels: () => Record<string, TypeButtonPanel>;
    /**
     * Remove an app-bar panel using an id
     *
     * @param {string} id the id of the panel to remove
     */
    removeAppbarPanel: (id: string) => void;
}
