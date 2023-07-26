import { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { TypeIconButtonProps } from '@/ui/icon-button/icon-button-types';
/**
 * Class to manage buttons on the nav-bar
 *
 * @exports
 * @class
 */
export declare class NavbarButtons {
    mapId: string;
    buttons: Record<string, Record<string, TypeButtonPanel>>;
    /**
     * Create default buttons, button panels
     *
     * @param {string} mapId the current map
     */
    constructor(mapId: string);
    /**
     * Function used to create default buttons, button panels
     */
    private createDefaultButtonPanels;
    /**
     * Create a group for the nav-bar buttons
     *
     * @param {string} groupName a group name to be used to manage the group of nav-bar buttons
     */
    createNavbarButtonGroup: (groupName: string) => void;
    /**
     * Create either a button or a button panel on the nav-bar
     *
     * @param {TypeButtonProps} buttonProps button properties
     * @param {TypePanelProps} panelProps panel properties
     * @param {string} groupName the group to place the button / panel in
     *
     * @returns the create button / button panel
     */
    private createButtonPanel;
    /**
     * Create a nav-bar button panel
     *
     * @param {TypeButtonProps} buttonProps button properties
     * @param {TypePanelProps} panelProps panel properties
     * @param {string} groupName group name to add the button panel to
     *
     * @returns the created button panel
     */
    createNavbarButtonPanel: (buttonProps: TypeIconButtonProps, panelProps: TypePanelProps, groupName: string) => TypeButtonPanel | null;
    /**
     * Create a new nav-bar button that will trigger a callback when clicked
     *
     * @param {TypeButtonProps} buttonProps button properties
     * @param {string} groupName group name to add button to
     *
     * @returns the create button
     */
    createNavbarButton: (buttonProps: TypeIconButtonProps, groupName: string) => TypeButtonPanel | null;
    /**
     * Get a button panel from the nav-bar by using it's id
     *
     * @param {string} id the id of the button panel to get
     * @returns {TypeButtonPanel} the returned button panel
     */
    getNavBarButtonPanelById: (buttonPanelId: string) => TypeButtonPanel | null;
    /**
     * Remove a nav-bar button or panel using it's id
     *
     * @param {string} id the id of the panel or button to remove
     */
    removeNavbarButtonPanel: (buttonPanelId: string) => void;
}
