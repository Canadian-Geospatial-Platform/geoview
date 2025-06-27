import { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { AbstractPlugin } from './abstract-plugin';
import { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
export type TypeNavBarButtonConfig = {
    buttonProps: IconButtonPropsExtend;
    panelProps?: TypePanelProps;
    groupName: string;
};
/**
 * NavBar Plugin abstract class.
 */
export declare abstract class NavBarPlugin extends AbstractPlugin {
    buttonPanels: Record<string, TypeButtonPanel>;
    /**
     * Overridable function to create nav bar button props content
     * @returns IconButtonPropsExtend The nav bar button props content
     */
    protected onCreateButtonConfigs(): Record<string, TypeNavBarButtonConfig>;
    /**
     * Called when a nav bar plugin is being added
     */
    protected onAdd(): void;
    /**
     * Called when a nav bar plugin is being removed
     */
    protected onRemove(): void;
}
//# sourceMappingURL=navbar-plugin.d.ts.map