import { TypeTabs } from '@/ui/tabs/tabs';
import { AbstractPlugin } from './abstract-plugin';
/**
 * Footer Plugin abstract class.
 */
export declare abstract class FooterPlugin extends AbstractPlugin {
    value?: number;
    footerProps?: TypeTabs;
    /**
     * Overrides the get config
     * @override
     * @returns {unknown} The config
     */
    getConfig(): unknown;
    /**
     * Overridable function to create footer props content
     * @returns TypeTabs The footer props content
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