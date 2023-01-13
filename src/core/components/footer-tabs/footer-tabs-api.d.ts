import { TypeTabs } from '../../../ui/tabs/tabs';
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
     * @param {number} value the value of the tab to be removed
     */
    removeFooterTab: (value: number) => void;
    /**
     * Select a tab by value
     *
     * @param {number} value the value of the tab to be selected
     */
    selectFooterTab: (value: number) => void;
}
