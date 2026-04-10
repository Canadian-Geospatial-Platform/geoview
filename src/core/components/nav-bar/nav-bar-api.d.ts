import type { TypeButtonGroupConfig, TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import type { EventDelegateBase } from '@/api/events/event-helper';
/**
 * Class to manage buttons on the nav-bar.
 */
export declare class NavBarApi {
    #private;
    /** Groups of button panels created on the nav-bar. */
    buttons: Record<string, Record<string, TypeButtonPanel>>;
    /** Configuration for button groups. */
    groupConfigs: Record<string, TypeButtonGroupConfig>;
    /**
     * Instantiates a NavBarApi class.
     */
    constructor();
    /**
     * Registers an event handler for NavBar created events.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onNavbarCreated(callback: NavBarCreatedDelegate): void;
    /**
     * Unregisters an event handler for NavBar created events.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offNavbarCreated(callback: NavBarCreatedDelegate): void;
    /**
     * Registers an event handler for NavBar removed events.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onNavbarRemoved(callback: NavBarRemovedDelegate): void;
    /**
     * Unregisters an event handler for NavBar removed events.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offNavbarRemoved(callback: NavBarRemovedDelegate): void;
    /**
     * Creates a nav-bar button panel.
     *
     * @param buttonProps - Button properties
     * @param panelProps - Panel properties
     * @param groupName - Group name to add the button panel to
     * @returns The created button panel
     */
    createNavbarButtonPanel(buttonProps: IconButtonPropsExtend, panelProps: TypePanelProps, groupName: string): TypeButtonPanel | null;
    /**
     * Creates a new nav-bar button that will trigger a callback when clicked.
     *
     * @param buttonProps - Button properties
     * @param groupName - Group name to add button to
     * @returns The created button
     */
    createNavbarButton(buttonProps: IconButtonPropsExtend, groupName: string): TypeButtonPanel | null;
    /**
     * Gets a button panel from the nav-bar by using its id.
     *
     * @param buttonPanelId - The id of the button panel to get
     * @returns The button panel, or null if not found
     */
    getNavBarButtonPanelById(buttonPanelId: string): TypeButtonPanel | null;
    /**
     * Removes a nav-bar button or panel using its id.
     *
     * @param buttonPanelId - The id of the panel or button to remove
     */
    removeNavbarButtonPanel(buttonPanelId: string): void;
    /**
     * Sets configuration for a button group.
     *
     * @param groupName - The group name
     * @param config - The group configuration
     */
    setGroupConfig(groupName: string, config: Partial<TypeButtonGroupConfig>): void;
    /**
     * Gets configuration for a button group.
     *
     * @param groupName - The group name
     * @returns The group configuration
     */
    getGroupConfig(groupName: string): TypeButtonGroupConfig;
}
/** Event payload when a nav-bar button panel is created. */
export type NavBarCreatedEvent = {
    /** The button panel identifier. */
    buttonPanelId: string;
    /** The group the button panel belongs to. */
    group: string;
    /** The created button panel. */
    buttonPanel: TypeButtonPanel;
};
/** Delegate type for NavBar created event handlers. */
type NavBarCreatedDelegate = EventDelegateBase<NavBarApi, NavBarCreatedEvent, void>;
/** Event payload when a nav-bar button panel is removed. */
export type NavBarRemovedEvent = {
    /** The button panel identifier. */
    buttonPanelId: string;
    /** The group the button panel belonged to. */
    group: string;
};
/** Delegate type for NavBar removed event handlers. */
type NavBarRemovedDelegate = EventDelegateBase<NavBarApi, NavBarRemovedEvent, void>;
export {};
//# sourceMappingURL=nav-bar-api.d.ts.map