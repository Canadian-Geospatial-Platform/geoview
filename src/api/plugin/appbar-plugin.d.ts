import type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
import { AbstractPlugin } from './abstract-plugin';
/**
 * AppBar Plugin abstract class.
 */
export declare abstract class AppBarPlugin extends AbstractPlugin {
    buttonPanel?: TypeButtonPanel;
    buttonProps?: IconButtonPropsExtend;
    panelProps?: TypePanelProps;
    /**
     * Overrides the get config
     * @override
     * @returns {AppBarPluginConfig} The config
     */
    getConfig(): AppBarPluginConfig;
    /**
     * Overridable function to create app bar button props content
     * @returns IconButtonPropsExtend The app bar button props content
     */
    protected onCreateButtonProps(): IconButtonPropsExtend;
    /**
     * Overridable function to create app bar props content
     * @returns TypePanelProps The app bar props content
     */
    protected onCreateContentProps(): TypePanelProps;
    /**
     * Overridable function to create app bar actual content
     * @returns JSX.Element The app bar actual content
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