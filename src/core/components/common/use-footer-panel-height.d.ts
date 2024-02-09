/// <reference types="react" />
interface UseFooterPanelHeightType {
    footerPanelTab: 'layers' | 'details' | 'data-table' | 'legend' | 'default';
}
/**
 * Custom Hook to calculate the height of footer panel content when we set the map in fullscreen mode.
 * @param {'layers' | 'details' | 'datatable' | 'legend'} footerPanelTab type of footer tab.
 * @returns list of ref objects that are attached to DOM.
 */
export declare function useFooterPanelHeight({ footerPanelTab }: UseFooterPanelHeightType): {
    leftPanelRef: import("react").RefObject<HTMLDivElement>;
    rightPanelRef: import("react").RefObject<HTMLDivElement>;
    panelTitleRef: import("react").RefObject<HTMLDivElement>;
    tableHeight: number;
};
export {};
