import type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import { AbstractPlugin } from './abstract-plugin';
import type { IconButtonPropsExtend } from '@/ui/icon-button/icon-button';
export type TypeNavBarButtonConfig = {
    buttonProps: IconButtonPropsExtend;
    panelProps?: TypePanelProps;
    groupName: string;
    groupConfig?: {
        accordionThreshold?: number;
    };
};
/**
 * NavBar Plugin abstract class.
 */
export declare abstract class NavBarPlugin extends AbstractPlugin {
    /** The buttons with or without panels, to be rendered in the NavBar */
    buttonPanels: Record<string, TypeButtonPanel>;
    /**
     * Overridable function to create nav bar button props content.
     *
     * Note: Both `aria-label` and `tooltip` should be translation keys (e.g., 'myPlugin.buttonLabel')
     * for proper localization support. The NavBar component will translate them at render time.
     * Omitting `tooltip` will cause it to fall back to the `aria-label` value.
     *
     * @returns The nav bar button props content
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