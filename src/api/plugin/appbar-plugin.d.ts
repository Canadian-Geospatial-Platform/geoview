import type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { AbstractPlugin } from './abstract-plugin';
/**
 * AppBar Plugin abstract class.
 */
export declare abstract class AppBarPlugin extends AbstractPlugin {
    /** The created button panel object */
    buttonPanel?: TypeButtonPanel;
    /** The button props */
    buttonProps?: IconButtonPropsExtend;
    /** The panel props */
    panelProps?: TypePanelProps;
    /**
     * Overrides the get config.
     *
     * @returns The config
     */
    getConfig(): AppBarPluginConfig;
    /**
     * Overridable function to create app bar button props content.
     *
     * @returns The app bar button props content
     */
    protected onCreateButtonProps(): IconButtonPropsExtend;
    /**
     * Overridable function to create app bar props content.
     *
     * @returns The app bar props content
     */
    protected onCreateContentProps(): TypePanelProps;
    /**
     * Overridable function to create app bar actual content.
     *
     * @returns The app bar actual content
     */
    protected onCreateContent(): JSX.Element;
    /**
     * Called when an app bar plugin is being added
     */
    protected onAdd(): void;
    /**
     * Called when an app bar plugin is being removed
     */
    protected onRemove(): void;
}
export type AppBarPluginConfig = {
    isOpen: boolean;
};
//# sourceMappingURL=appbar-plugin.d.ts.map