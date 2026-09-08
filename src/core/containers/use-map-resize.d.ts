/** Props for the useMapResize hook. */
interface UseMapResizeProps {
    /** Whether the map is displayed in fullscreen mode. */
    isMapFullScreen: boolean;
    /** Whether the footer bar panel is open. */
    isFooterBarOpen: boolean;
    /** The footer panel resize percentage. */
    footerPanelResizeValue: number;
    /** Whether the map has a footer bar. */
    isFooterBar: boolean;
    /** The measured height of the collapsed footer chrome. */
    collapsedFooterHeight: number;
    /** The root GeoView element whose height accommodates the footer bar. */
    geoviewElement: HTMLElement;
    /** The configured application height in pixels. */
    appHeight: number;
}
/** Return type for the useMapResize hook. */
type TypeUseMapResize = {
    /** The ref for the map shell container. */
    mapShellContainerRef: React.RefObject<HTMLDivElement | null>;
};
/**
 * Hook that manages map shell container resizing based on fullscreen and footer panel state.
 *
 * @param props - The resize hook configuration properties
 * @returns An object containing the mapShellContainerRef
 */
export declare const useMapResize: ({ isMapFullScreen, isFooterBarOpen, footerPanelResizeValue, isFooterBar, collapsedFooterHeight, geoviewElement, appHeight, }: UseMapResizeProps) => TypeUseMapResize;
export {};
//# sourceMappingURL=use-map-resize.d.ts.map