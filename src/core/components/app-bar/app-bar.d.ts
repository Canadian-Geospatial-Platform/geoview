import type { TypeButtonPanel } from '@/ui/panel/panel-types';
import type { AppBarApi } from '@/core/components';
/** Props for the AppBar component. */
type AppBarProps = {
    api: AppBarApi;
    onScrollShellIntoView: () => void;
};
/** Record of button panel ids to their configuration. */
export interface ButtonPanelType {
    [panelType: string]: TypeButtonPanel;
}
/**
 * Creates an app-bar with buttons that can open a panel.
 */
export declare function AppBar(props: AppBarProps): JSX.Element;
export {};
//# sourceMappingURL=app-bar.d.ts.map