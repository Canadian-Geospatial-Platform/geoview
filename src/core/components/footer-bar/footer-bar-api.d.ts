import { TypeTabs } from '@/ui/tabs/tabs';
import { EventDelegateBase } from '@/api/events/event-helper';
/**
 * API to manage tabs on the tabs component
 *
 * @exports
 * @class
 */
export declare class FooterBarApi {
    #private;
    mapId: string;
    tabs: TypeTabs[];
    /**
     * Instantiates a FooterBarApi class.
     *
     * @param {string} mapId - The map id this footer bar api belongs to
     */
    constructor(mapId: string);
    /**
     * Registers an event handler for footerbar tab created events.
     * @param {FooterTabCreatedDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onFooterTabCreated(callback: FooterTabCreatedDelegate): void;
    /**
     * Unregisters an event handler for footerbar tab created events.
     * @param {FooterTabCreatedDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offFooterTabCreated(callback: FooterTabCreatedDelegate): void;
    /**
     * Registers an event handler for footerbar tab removed events.
     * @param {FooterTabRemovedDelegate} callback - The callback to be executed whenever the event is emitted.
     */
    onFooterTabRemoved(callback: FooterTabRemovedDelegate): void;
    /**
     * Unregisters an event handler for footerbar removed events.
     * @param {FooterTabRemovedDelegate} callback - The callback to stop being called whenever the event is emitted.
     */
    offFooterTabRemoved(callback: FooterTabRemovedDelegate): void;
    /**
     * Creates a tab on the footer bar
     *
     * @param {TypeTabs} tabProps - The properties of the tab to be created
     *
     */
    createTab(tabProps: TypeTabs): void;
    /**
     * Removes a tab by id
     *
     * @param {string} id - The id of the tab to be removed
     */
    removeTab(id: string): void;
    /**
     * Selects a tab by id, if the id is not a tab, the footer bar will close
     *
     * @param {string} id - The id of the tab to be selected
     */
    selectTab(id: string): void;
}
/**
 * Define an event for the delegate
 */
export type FooterTabCreatedEvent = {
    tab: TypeTabs;
};
/**
 * Define a delegate for the event handler function signature
 */
type FooterTabCreatedDelegate = EventDelegateBase<FooterBarApi, FooterTabCreatedEvent, void>;
/**
 * Define an event for the delegate
 */
export type FooterTabRemovedEvent = {
    tabid: string;
};
/**
 * Define a delegate for the event handler function signature
 */
type FooterTabRemovedDelegate = EventDelegateBase<FooterBarApi, FooterTabRemovedEvent, void>;
export {};
