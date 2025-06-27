import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { AppBarApi } from '@/core/components';
type AppBarProps = {
    api: AppBarApi;
    onScrollShellIntoView: () => void;
};
export interface ButtonPanelType {
    [panelType: string]: TypeButtonPanel;
}
export interface ButtonPanelGroupType {
    [panelId: string]: ButtonPanelType;
}
/**
 * Create an app-bar with buttons that can open a panel
 */
export declare function AppBar(props: AppBarProps): JSX.Element;
export {};
//# sourceMappingURL=app-bar.d.ts.map