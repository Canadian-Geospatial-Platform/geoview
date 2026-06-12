/** Props for the MapInfo component. */
interface MapInfoProps {
    /** Callback to scroll the shell into view when the info bar is clicked. */
    onScrollShellIntoView: () => void;
}
/**
 * Creates the map information bar containing attribution, mouse position, and scale.
 *
 * Memoized to prevent re-renders when parent shell updates but the `onScrollShellIntoView`
 * callback reference has not changed. Since the callback is typically stable (wrapped in
 * useCallback in the parent), memo effectively shields MapInfo from unrelated parent re-renders.
 *
 * @param props - Properties defined in MapInfoProps interface
 * @returns The map information bar
 */
export declare const MapInfo: import("react").MemoExoticComponent<({ onScrollShellIntoView }: MapInfoProps) => JSX.Element>;
export {};
//# sourceMappingURL=map-info.d.ts.map