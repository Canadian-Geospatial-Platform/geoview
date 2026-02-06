interface UseMapResizeProps {
    isMapFullScreen: boolean;
    isFooterBarOpen: boolean;
    footerPanelResizeValue: number;
    isFooterBar: boolean;
    geoviewElement: HTMLElement;
    footerTabContainer: HTMLElement | null;
    appHeight: number;
}
type TypeUseMapResize = {
    mapShellContainerRef: React.RefObject<HTMLDivElement>;
};
export declare const useMapResize: ({ isMapFullScreen, isFooterBarOpen, footerPanelResizeValue, isFooterBar, geoviewElement, footerTabContainer, appHeight, }: UseMapResizeProps) => TypeUseMapResize;
export {};
//# sourceMappingURL=use-map-resize.d.ts.map