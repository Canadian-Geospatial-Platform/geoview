/** Properties for the Crosshair component. */
type CrosshairProps = {
    mapTargetElement: HTMLElement;
};
/**
 * Renders a crosshair when the map is focused with the keyboard so the user can click on the map.
 *
 * Memoized because the single prop is a stable DOM element reference that maintains identity across parent renders.
 *
 * @param props - Crosshair properties containing the map target element
 * @returns The crosshair component, or null if inactive
 */
export declare const Crosshair: import("react").MemoExoticComponent<({ mapTargetElement }: CrosshairProps) => JSX.Element | null>;
export {};
//# sourceMappingURL=crosshair.d.ts.map