import type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { ActiveAppBarTabType } from '@/core/stores/store-interface-and-intial-values/ui-state';
/**
 * Class to manage buttons on the app-bar
 *
 * @exports
 * @class
 */
export declare class AppBarApi {
    #private;
    mapId: string;
    buttons: Record<string, TypeButtonPanel>;
    /**
     * Instantiates an AppBarApi class.
     *
     * @param {string} mapId - The map id this AppBarApi belongs to
     */
    constructor(mapId: string);
    /**
     * Registers an event handler for AppBar created events.
     * @param {AppBarCreatedDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onAppBarCreated(callback: AppBarCreatedDelegate): void;
    /**
     * Unregisters an event handler for AppBar created events.
     * @param {AppBarCreatedDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offAppBarCreated(callback: AppBarCreatedDelegate): void;
    /**
     * Registers an event handler for AppBar removed events.
     * @param {AppBarRemovedDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onAppBarRemoved(callback: AppBarRemovedDelegate): void;
    /**
     * Unregisters an event handler for AppBar removed events.
     * @param {AppBarRemovedDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offAppBarRemoved(callback: AppBarRemovedDelegate): void;
    /**
     * Creates a button on the app-bar that will open a panel
     *
     * @param {IconButtonPropsExtend} buttonProps - Button properties (icon, tooltip)
     * @param {TypePanelProps} panelProps - Panel properties (icon, title, content)
     * @returns {TypeButtonPanel | null} The created panel
     */
    createAppbarPanel(buttonProps: IconButtonPropsExtend, panelProps: TypePanelProps): TypeButtonPanel | null;
    /**
     * Gets a button panel from the app-bar by using it's id
     *
     * @param {string} buttonPanelId - The id of the button panel to get
     * @returns {TypeButtonPanel | null} The button panel
     */
    getAppBarButtonPanelById(buttonPanelId: string): TypeButtonPanel | null;
    /**
     * Selects a tab by id and tab group
     * @return {ActiveAppBarTabType} The active app bar tab info.
     */
    getActiveAppBarTab(): ActiveAppBarTabType;
    /**
     * Removes an app-bar panel using an id
     *
     * @param {string} buttonPanelId - The id of the panel to remove
     */
    removeAppbarPanel(buttonPanelId: string): void;
    /**
     * Selects a tab by id
     *
     * @param {string} tabId - The id of the tab to be selected
     * @param {boolean} open - Open (true) or closed (false) panel: default = true
     */
    selectTab(tabId: string, open?: boolean, isFocusTrapped?: boolean): void;
}
/**
 * Define an event for the delegate
 */
export type AppBarCreatedEvent = {
    buttonPanelId: string;
    buttonPanel: TypeButtonPanel;
};
/**
 * Define a delegate for the event handler function signature
 */
type AppBarCreatedDelegate = EventDelegateBase<AppBarApi, AppBarCreatedEvent, void>;
/**
 * Define an event for the delegate
 */
export type AppBarRemovedEvent = {
    buttonPanelId: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type AppBarRemovedDelegate = EventDelegateBase<AppBarApi, AppBarRemovedEvent, void>;
export {};
//# sourceMappingURL=app-bar-api.d.ts.map