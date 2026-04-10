import type { TypeTabs } from '@/ui/tabs/tabs';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { UIController } from '@/core/controllers/ui-controller';
/**
 * API to manage tabs on the footer bar component.
 */
export declare class FooterBarApi {
    #private;
    /** Array that holds added tabs. */
    tabs: TypeTabs[];
    /**
     * Instantiates a FooterBarApi class.
     *
     * @param uiController - The UI controller this footer bar api belongs to
     */
    constructor(uiController: UIController);
    /**
     * Registers an event handler for footerbar tab created events.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onFooterTabCreated(callback: FooterTabCreatedDelegate): void;
    /**
     * Unregisters an event handler for footerbar tab created events.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offFooterTabCreated(callback: FooterTabCreatedDelegate): void;
    /**
     * Registers an event handler for footerbar tab removed events.
     *
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onFooterTabRemoved(callback: FooterTabRemovedDelegate): void;
    /**
     * Unregisters an event handler for footerbar removed events.
     *
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    offFooterTabRemoved(callback: FooterTabRemovedDelegate): void;
    /**
     * Creates a tab on the footer bar.
     *
     * @param tabProps - The properties of the tab to be created
     */
    createTab(tabProps: TypeTabs): void;
    /**
     * Removes a tab by id.
     *
     * @param id - The id of the tab to be removed
     */
    removeTab(id: string): void;
    /**
     * Shows a tab by id.
     *
     * @param id - The id of the tab to be shown
     * @deprecated Legacy support. Should use uiController.showTabButton directly instead.
     */
    showTabButton(id: string): void;
    /**
     * Selects a tab by id, if the id is not a tab, the footer bar will close.
     *
     * @param id - The id of the tab to be selected
     * @deprecated Legacy support. Should use uiController.setActiveFooterBarTab directly instead.
     */
    selectTab(id: string): void;
}
/** Event emitted when a footer tab is created. */
export type FooterTabCreatedEvent = {
    /** The tab that was created. */
    tab: TypeTabs;
};
/** Delegate for the footer tab created event handler. */
type FooterTabCreatedDelegate = EventDelegateBase<FooterBarApi, FooterTabCreatedEvent, void>;
/** Event emitted when a footer tab is removed. */
export type FooterTabRemovedEvent = {
    /** The id of the tab that was removed. */
    tabid: string;
};
/** Delegate for the footer tab removed event handler. */
type FooterTabRemovedDelegate = EventDelegateBase<FooterBarApi, FooterTabRemovedEvent, void>;
export {};
//# sourceMappingURL=footer-bar-api.d.ts.map