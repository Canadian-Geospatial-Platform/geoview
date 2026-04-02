/** Props for the MapInfo component. */
interface MapInfoProps {
    /** Callback to scroll the shell into view when the info bar is clicked. */
    onScrollShellIntoView: () => void;
}
/**
 * Creates the map information bar containing attribution, mouse position, and scale.
 *
 * Memoized to prevent re-renders when parent updates but the onScrollShellIntoView callback has not changed.
 *
 * @returns The map information bar
 */
export declare const MapInfo: import("react").NamedExoticComponent<MapInfoProps>;
export {};
//# sourceMappingURL=map-info.d.ts.map