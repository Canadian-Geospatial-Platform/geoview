import type { ReactNode } from 'react';
import type { TypeTabs } from '@/ui/tabs/tabs';
import type { UIController } from '@/core/controllers/ui-controller';
/** Content entry for a footer tab (icon and content are ReactNodes kept outside the store). */
export type FooterTabContent = {
    /** The tab icon element. */
    icon?: ReactNode;
    /** The tab content element. */
    content?: ReactNode;
};
/**
 * API to manage tabs on the footer bar component.
 */
export declare class FooterBarApi {
    #private;
    /**
     * Instantiates a FooterBarApi class.
     *
     * @param uiController - The UI controller this footer bar api belongs to
     */
    constructor(uiController: UIController);
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
     * Gets the content entry for a tab by id.
     *
     * @param id - The tab id to look up
     * @returns The tab content entry, or undefined if not registered
     */
    getTabContent(id: string): FooterTabContent | undefined;
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
//# sourceMappingURL=footer-bar-api.d.ts.map