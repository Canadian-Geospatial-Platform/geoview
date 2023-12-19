import { TypeTabs } from '@/ui/tabs/tabs';
/**
 * API to manage tabs on the tabs component
 *
 * @exports
 * @class
 */
export declare class FooterTabsApi {
    mapId: string;
    tabs: TypeTabs[];
    /**
     * initialize the footer tabs api
     *
     * @param mapId the id of the map this footer tabs belongs to
     */
    constructor(mapId: string);
    /**
     * Create a tab on the footer tabs
     *
     * @param {TypeTabs} tabProps the properties of the tab to be created
     *
     */
    createFooterTab: (tabProps: TypeTabs) => void;
    /**
     * Remove a tab by value
     *
     * @param {string} id the id of the tab to be removed
     */
    removeFooterTab: (id: string) => void;
    /**
     * Select a tab by id
     *
     * @param {string} id the id of the tab to be selected
     */
    selectFooterTab: (id: string) => void;
}
