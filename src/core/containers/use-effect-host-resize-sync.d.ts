/** Props for the useHostResizeSync hook. */
interface UseHostResizeSyncProps {
    /** The map identifier. */
    mapId: string;
    /** The root GeoView element whose authored height drives the viewer height. */
    geoviewElement: HTMLElement;
    /** Whether the map is displayed in fullscreen mode. */
    isMapFullScreen: boolean;
    /** The host inline height captured before it was overridden with 'fit-content', if overridden. */
    hostOriginalHeightRef: React.RefObject<string | undefined>;
    /** Callback invoked with the new viewer height when the host height changes. */
    onHostHeightChange: (height: number) => void;
}
/**
 * Hook that keeps the stored viewer height in sync with the host element when an external layout resizes it.
 *
 * Observes the host and its parent (plus window resizes for viewport-relative heights) and reports the new
 * height only when it differs from the stored one. Fullscreen sizing is handled separately and is skipped.
 *
 * @param props - The hook configuration properties
 */
export declare const useEffectHostResizeSync: ({ mapId, geoviewElement, isMapFullScreen, hostOriginalHeightRef, onHostHeightChange, }: UseHostResizeSyncProps) => void;
export {};
//# sourceMappingURL=use-effect-host-resize-sync.d.ts.map