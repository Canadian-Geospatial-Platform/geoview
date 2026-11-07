import type { ReactNode } from 'react';
import type { TypeButtonPanel } from '@/ui/panel/panel-types';
/** The properties for the navbar panel button. */
interface NavbarPanelButtonType {
    /** The button panel configuration. */
    buttonPanel: TypeButtonPanel;
    /** Whether the button is in an active state. */
    isActive?: boolean;
    /** Whether to keep the panel mounted while closed so its state is preserved. */
    keepPanelMounted?: boolean;
    /** Accessible live-region content that must remain available when the panel is closed. */
    liveRegionContent?: ReactNode;
    /** Requests a change to the panel's open state. */
    onOpenChange?: (isOpen: boolean) => void;
}
/**
 * Creates a navbar button with a popover panel.
 *
 * @param props - The navbar panel button properties
 * @returns The navbar panel button component
 */
export default function NavbarPanelButton({ buttonPanel, isActive, keepPanelMounted, liveRegionContent, onOpenChange, }: NavbarPanelButtonType): JSX.Element;
export {};
//# sourceMappingURL=nav-bar-panel-button.d.ts.map