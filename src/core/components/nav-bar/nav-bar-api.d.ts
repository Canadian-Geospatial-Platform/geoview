import type { TypeButtonGroupConfig, TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import type { EventDelegateBase } from '@/api/events/event-helper';
/**
 * Class to manage buttons on the nav-bar
 *
 * @exports
 * @class
 */
export declare class NavBarApi {
    #private;
    mapId: string;
    buttons: Record<string, Record<string, TypeButtonPanel>>;
    groupConfigs: Record<string, TypeButtonGroupConfig>;
    /**
     * Instantiates a NavbarApi class.
     *
     * @param {string} mapId - The map id this NavBarApi belongs to
     */
    constructor(mapId: string);
    /**
     * Registers an event handler for NavBar created events.
     * @param {NavBarCreatedDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onNavbarCreated(callback: NavBarCreatedDelegate): void;
    /**
     * Unregisters an event handler for NavBar created events.
     * @param {NavBarCreatedDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offNavbarCreated(callback: NavBarCreatedDelegate): void;
    /**
     * Registers an event handler for NavBar removed events.
     * @param {NavBarRemovedDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onNavbarRemoved(callback: NavBarRemovedDelegate): void;
    /**
     * Unregisters an event handler for NavBar removed events.
     * @param {NavBarRemovedDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offNavbarRemoved(callback: NavBarRemovedDelegate): void;
    /**
     * Creates a nav-bar button panel
     *
     * @param {IconButtonPropsExtend} buttonProps - Button properties
     * @param {TypePanelProps} panelProps - Panel properties
     * @param {string} groupName - Group name to add the button panel to
     * @returns {TypeButtonPanel | null} The created button panel
     */
    createNavbarButtonPanel(buttonProps: IconButtonPropsExtend, panelProps: TypePanelProps, groupName: string): TypeButtonPanel | null;
    /**
     * Creates a new nav-bar button that will trigger a callback when clicked
     *
     * @param {TypeButtonProps} buttonProps - Button properties
     * @param {string} groupName - Group name to add button to
     * @returns {TypeButtonPanel | null} The created button
     */
    createNavbarButton(buttonProps: IconButtonPropsExtend, groupName: string): TypeButtonPanel | null;
    /**
     * Gets a button panel from the nav-bar by using its id
     *
     * @param {string} buttonPanelId - The id of the button panel to get
     * @returns {TypeButtonPanel | null} The Button panel
     */
    getNavBarButtonPanelById(buttonPanelId: string): TypeButtonPanel | null;
    /**
     * Removes a nav-bar button or panel using its id
     *
     * @param {string} buttonPanelId - The id of the panel or button to remove
     */
    removeNavbarButtonPanel(buttonPanelId: string): void;
    /**
     * Sets configuration for a button group
     *
     * @param {string} groupName - The group name
     * @param {TypeButtonGroupConfig} config - The group configuration
     */
    setGroupConfig(groupName: string, config: Partial<TypeButtonGroupConfig>): void;
    /**
     * Gets configuration for a button group
     *
     * @param {string} groupName - The group name
     * @returns {TypeButtonGroupConfig} The group configuration
     */
    getGroupConfig(groupName: string): TypeButtonGroupConfig;
}
/**
 * Define an event for the delegate
 */
export type NavBarCreatedEvent = {
    buttonPanelId: string;
    group: string;
    buttonPanel: TypeButtonPanel;
};
/**
 * Define a delegate for the event handler function signature
 */
type NavBarCreatedDelegate = EventDelegateBase<NavBarApi, NavBarCreatedEvent, void>;
/**
 * Define an event for the delegate
 */
export type NavBarRemovedEvent = {
    buttonPanelId: string;
    group: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type NavBarRemovedDelegate = EventDelegateBase<NavBarApi, NavBarRemovedEvent, void>;
export {};
//# sourceMappingURL=nav-bar-api.d.ts.map