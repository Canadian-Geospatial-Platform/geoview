interface UseMapResizeProps {
    isMapFullScreen: boolean;
    isFooterBarCollapsed: boolean;
    footerPanelResizeValue: number;
    mapLoaded: boolean;
    isFooterBar: boolean;
    geoviewElement: HTMLElement;
    footerTabContainer: HTMLElement | null;
}
type TypeUseMapResize = {
    mapShellContainerRef: React.RefObject<HTMLDivElement>;
};
export declare const useMapResize: ({ isMapFullScreen, isFooterBarCollapsed, footerPanelResizeValue, mapLoaded, isFooterBar, geoviewElement, footerTabContainer, }: UseMapResizeProps) => TypeUseMapResize;
export {};
