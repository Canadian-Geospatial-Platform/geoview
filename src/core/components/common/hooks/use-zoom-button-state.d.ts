/** The state of a zoom button, as returned by `useZoomButtonState`. */
export type TypeZoomButtonState = {
    /** Whether the map still shows the view of the last zoom to the current target (a new click would have no effect). */
    isZoomed: boolean;
    /** Records that the zoom to a target completed; call it once the zoom promise resolved. */
    markZoomed: (zoomedTargetKey: string) => void;
};
/**
 * Custom hook tracking whether a zoom button's last zoom is still the current map view, so the button can be
 * aria-disabled until the map view changes (a second click would have no effect).
 *
 * The map view is identified by the store map extent, updated on every map move end (pan, zoom, resize), and compared
 * by value so coming back to the exact same view still counts as unchanged. The button becomes available again as soon
 * as the map view or its target changes. Call the hook where it survives target navigation (e.g. the panel, not a
 * per-target component), otherwise the last zoom is forgotten when the target component is recreated.
 *
 * @param targetKey - Identifies what the button zooms to (e.g. a feature or a result group); another key re-enables the button
 * @returns The zoom button state
 */
export declare function useZoomButtonState(targetKey: string): TypeZoomButtonState;
//# sourceMappingURL=use-zoom-button-state.d.ts.map