import type { TypeButtonPanel } from '@/ui/panel/panel-types';
/** The properties for the navbar panel button. */
interface NavbarPanelButtonType {
    /** The button panel configuration. */
    buttonPanel: TypeButtonPanel;
    /** Whether the button is in an active state. */
    isActive?: boolean;
}
/**
 * Creates a navbar button with a popover panel.
 *
 * @param props - The navbar panel button properties
 * @returns The navbar panel button component
 */
export default function NavbarPanelButton({ buttonPanel, isActive }: NavbarPanelButtonType): JSX.Element;
export {};
//# sourceMappingURL=nav-bar-panel-button.d.ts.map