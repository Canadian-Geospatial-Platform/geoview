/** Props for the MapInfoExpandButton component. */
interface MapInfoExpandButtonProps {
    /** Callback to toggle the expanded state. */
    onExpand: (value: boolean) => void;
    /** Whether the map info bar is expanded. */
    expanded: boolean;
}
/**
 * Creates the map information expand button component.
 *
 * Memoized to prevent re-renders when parent updates but props have not changed.
 *
 * @returns The expand button
 */
export declare const MapInfoExpandButton: import("react").NamedExoticComponent<MapInfoExpandButtonProps>;
export {};
//# sourceMappingURL=map-info-expand-button.d.ts.map