import type { TypeTabs } from '@/ui/tabs/tabs';
import { AbstractPlugin } from './abstract-plugin';
/**
 * Footer Plugin abstract class.
 */
export declare abstract class FooterPlugin extends AbstractPlugin {
    /** The index of the tab */
    value?: number;
    /** The footer props */
    footerProps?: TypeTabs;
    /**
     * Overrides the get config.
     *
     * @returns The config
     */
    getConfig(): unknown;
    /**
     * Overridable function to create footer props content.
     *
     * @returns The footer props content
     */
    protected onCreateContentProps(): TypeTabs;
    /**
     * Called when a footer plugin is being added
     */
    protected onAdd(): void;
    /**
     * Called when a footer plugin is being removed
     */
    protected onRemove(): void;
    /**
     * Selects the Plugin.
     */
    select(): void;
    /**
     * Overridable function called when the Plugin is being selected.
     */
    protected onSelect(): void;
}
//# sourceMappingURL=footer-plugin.d.ts.map