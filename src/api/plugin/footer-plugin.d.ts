import { TypeTabs } from '@/ui/tabs/tabs';
import { AbstractPlugin } from './abstract-plugin';
/**
 * Footer Plugin abstract class.
 */
export declare abstract class FooterPlugin extends AbstractPlugin {
    value?: number;
    footerProps?: TypeTabs;
    /**
     * Overridable function to create footer props content
     * @returns TypeTabs The footer props content
     */
    onCreateContentProps(): TypeTabs;
    /**
     * Called when a footer plugin is being added
     */
    onAdd(): void;
    /**
     * Called when a footer plugin is being removed
     */
    onRemove(): void;
    /**
     * Called when a footer plugin has been selected in the tabs
     */
    onSelected(): void;
}
