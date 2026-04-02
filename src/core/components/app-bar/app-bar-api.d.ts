import type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { ActiveAppBarTabType } from '@/core/stores/store-interface-and-intial-values/ui-state';
/**
 * Class to manage buttons on the app-bar.
 */
export declare class AppBarApi {
    #private;
    /** The map id this AppBarApi belongs to. */
    mapId: string;
    /** Button panels registered on the app-bar, keyed by panel id. */
    buttons: Record<string, TypeButtonPanel>;
    /**
     * Instantiates an AppBarApi class.
     *
     * @param mapId - The map id this AppBarApi belongs to
     */
    constructor(mapId: string);
    /**
     * Registers an event handler for AppBar created events.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onAppBarCreated(callback: AppBarCreatedDelegate): void;
    /**
     * Unregisters an event handler for AppBar created events.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offAppBarCreated(callback: AppBarCreatedDelegate): void;
    /**
     * Registers an event handler for AppBar removed events.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onAppBarRemoved(callback: AppBarRemovedDelegate): void;
    /**
     * Unregisters an event handler for AppBar removed events.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offAppBarRemoved(callback: AppBarRemovedDelegate): void;
    /**
     * Creates a button on the app-bar that will open a panel.
     *
     * @param buttonProps - Button properties (icon, tooltip)
     * @param panelProps - Panel properties (icon, title, content)
     * @returns The created button panel, or null if inputs are missing
     */
    createAppbarPanel(buttonProps: IconButtonPropsExtend, panelProps: TypePanelProps): TypeButtonPanel | null;
    /**
     * Gets a button panel from the app-bar by its id.
     *
     * @param buttonPanelId - The id of the button panel to get
     * @returns The matching button panel, or null if not found
     */
    getAppBarButtonPanelById(buttonPanelId: string): TypeButtonPanel | null;
    /**
     * Gets the currently active app-bar tab.
     *
     * @returns The active app bar tab info
     */
    getActiveAppBarTab(): ActiveAppBarTabType;
    /**
     * Removes an app-bar panel using an id.
     *
     * @param buttonPanelId - The id of the panel to remove
     */
    removeAppbarPanel(buttonPanelId: string): void;
    /**
     * Selects a tab by id.
     *
     * @param tabId - The id of the tab to be selected
     * @param open - Optional open (true) or closed (false) panel (default: true)
     * @param isFocusTrapped - Optional whether focus should be trapped (default: true)
     */
    selectTab(tabId: string, open?: boolean, isFocusTrapped?: boolean): void;
}
/** Event payload emitted when an AppBar button panel is created. */
export type AppBarCreatedEvent = {
    buttonPanelId: string;
    buttonPanel: TypeButtonPanel;
};
/** Delegate type for AppBar created event handlers. */
type AppBarCreatedDelegate = EventDelegateBase<AppBarApi, AppBarCreatedEvent, void>;
/** Event payload emitted when an AppBar button panel is removed. */
export type AppBarRemovedEvent = {
    buttonPanelId: string;
};
/** Delegate type for AppBar removed event handlers. */
type AppBarRemovedDelegate = EventDelegateBase<AppBarApi, AppBarRemovedEvent, void>;
export {};
//# sourceMappingURL=app-bar-api.d.ts.map