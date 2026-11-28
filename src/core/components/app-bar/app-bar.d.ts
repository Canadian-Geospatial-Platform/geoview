import type { TypeButtonPanel } from '@/ui/panel/panel-types';
import type { AppBarApi } from '@/core/components/app-bar/app-bar-api';
/** Props for the AppBar component. */
type AppBarProps = {
    /** The app-bar API. */
    api: AppBarApi;
    /** Scrolls the shell into view when a panel opens. */
    onScrollShellIntoView: () => void;
    /** Changes the existing keyboard-navigation mode. */
    onKeyboardNavigationModeChange: (active: boolean) => void;
};
/** Record of button panel ids to their configuration. */
export interface ButtonPanelType {
    [panelType: string]: TypeButtonPanel;
}
/**
 * Creates an app-bar with buttons that can open a panel.
 *
 * Not memoized because this component receives props that change frequently
 * (api, onScrollShellIntoView callbacks). Memoization would add overhead without benefit.
 *
 * @param props - Properties defined in AppBarProps interface
 * @returns The app bar component
 */
export declare function AppBar(props: AppBarProps): JSX.Element;
export {};
//# sourceMappingURL=app-bar.d.ts.map