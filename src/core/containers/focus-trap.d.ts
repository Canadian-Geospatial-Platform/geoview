/** Interface for the focus trap properties. */
interface FocusTrapProps {
    /** The map identifier. */
    mapId: string;
    /** Whether the viewer supports dynamic interactions and Settings. */
    isDynamic: boolean;
    /** Registers the coordinated keyboard-navigation mode lifecycle with the viewer shell. */
    registerModeAction: (action: (active: boolean) => void) => () => void;
}
/**
 * Creates a dialog component to explain to keyboard user how to trigger and remove FocusTrap.
 *
 * @param props - The focus trap dialog properties
 * @returns The focus trap dialog component
 */
export declare function FocusTrapDialog(props: FocusTrapProps): JSX.Element;
export {};
//# sourceMappingURL=focus-trap.d.ts.map