import { RefObject } from 'react';
interface UseFooterPanelHeightType {
    footerPanelTab: 'legend' | 'default';
}
interface UseFooterPanelHeightReturnType {
    leftPanelRef: RefObject<HTMLDivElement>;
    rightPanelRef: RefObject<HTMLDivElement>;
    panelTitleRef: (node: HTMLDivElement) => void;
    activeFooterBarTabId: string;
}
/**
 * Custom Hook to calculate the height of footer panel content when we set the map in fullscreen mode.
 * @param {'legend' | 'default'} footerPanelTab type of footer tab.
 * @returns {UseFooterPanelHeightReturnType} An object of ref objects that are attached to DOM.
 */
export declare function useFooterPanelHeight({ footerPanelTab }: UseFooterPanelHeightType): UseFooterPanelHeightReturnType;
export {};
