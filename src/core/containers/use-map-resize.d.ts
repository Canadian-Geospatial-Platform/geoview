/** Props for the useMapResize hook. */
interface UseMapResizeProps {
    isMapFullScreen: boolean;
    isFooterBarOpen: boolean;
    footerPanelResizeValue: number;
    isFooterBar: boolean;
    geoviewElement: HTMLElement;
    footerTabContainer: HTMLElement | null;
    appHeight: number;
}
/** Return type for the useMapResize hook. */
type TypeUseMapResize = {
    mapShellContainerRef: React.RefObject<HTMLDivElement>;
};
/**
 * Hook that manages map shell container resizing based on fullscreen and footer panel state.
 *
 * @param props - The resize hook configuration properties
 * @returns An object containing the mapShellContainerRef
 */
export declare const useMapResize: ({ isMapFullScreen, isFooterBarOpen, footerPanelResizeValue, isFooterBar, geoviewElement, footerTabContainer, appHeight, }: UseMapResizeProps) => TypeUseMapResize;
export {};
//# sourceMappingURL=use-map-resize.d.ts.map