/** Mouse position component props. */
interface MousePositionProps {
    /** Whether the mouse position display is expanded. */
    expanded: boolean;
}
/**
 * Creates the mouse position component.
 *
 * Memoized to prevent re-renders when parent updates but expanded prop hasn't changed.
 *
 * @returns The mouse position component
 */
export declare const MousePosition: import("react").NamedExoticComponent<MousePositionProps>;
export {};
//# sourceMappingURL=mouse-position.d.ts.map