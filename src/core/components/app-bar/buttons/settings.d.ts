/** Properties for the Settings button. */
export interface SettingsProps {
    /** Requests a coordinated change to the existing keyboard-navigation mode. */
    onKeyboardNavigationModeChange: (active: boolean) => void;
}
/**
 * Renders the persistent Settings button and its anchored, non-modal panel.
 *
 * @param props - The SettingsProps properties
 * @returns The Settings button and panel
 */
export declare function Settings(props: SettingsProps): JSX.Element;
//# sourceMappingURL=settings.d.ts.map