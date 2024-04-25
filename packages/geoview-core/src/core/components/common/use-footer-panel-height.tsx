import { useEffect, useRef } from 'react';
import { useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useUIActiveFooterBarTabId, useUIFooterPanelResizeValue } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useDetailsLayerDataArray } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  useDataTableAllFeaturesDataArray,
  useDataTableSelectedLayerPath,
  useDataTableStoreActions,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { TABS } from '@/core/utils/constant';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

interface UseFooterPanelHeightType {
  footerPanelTab: 'layers' | 'details' | 'data-table' | 'legend' | 'default' | 'guide';
}

/**
 * Custom Hook to calculate the height of footer panel content when we set the map in fullscreen mode.
 * @param {'layers' | 'details' | 'datatable' | 'legend'} footerPanelTab type of footer tab.
 * @returns {any} An object of ref objects that are attached to DOM.
 */
// ? I doubt we want to define an explicit type for that utility hook?
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useFooterPanelHeight({ footerPanelTab }: UseFooterPanelHeightType): any {
  const defaultHeight = 600;
  const mapId = useGeoViewMapId();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const panelTitleRef = useRef<HTMLDivElement>(null);

  const isMapFullScreen = useAppFullscreenActive();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const activeFooterBarTabId = useUIActiveFooterBarTabId();
  const arrayOfLayerData = useDetailsLayerDataArray();
  const allFeaturesLayerData = useDataTableAllFeaturesDataArray();
  const { setTableHeight } = useDataTableStoreActions();
  const dataTableSelectedLayerPath = useDataTableSelectedLayerPath();

  /**
   * Set the height of right panel
   * @param {number} height calculate height of the right panel based on footerPanelTab
   */
  const rightPanelHeight = (height?: number): void => {
    const rightPanel = (rightPanelRef.current?.firstElementChild ?? null) as HTMLElement | null;
    if (rightPanel) {
      rightPanel.style.maxHeight = `${height ?? defaultHeight}px`;
      rightPanel.style.overflowY = 'auto';
    }
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USE-FOOTER-PANEL-HEIGHT - footerPanelResizeValue', footerPanelResizeValue, isMapFullScreen);

    if (leftPanelRef.current && isMapFullScreen && (activeFooterBarTabId === footerPanelTab || footerPanelTab === 'default')) {
      const panelTitleHeight = panelTitleRef.current?.clientHeight || 0;
      const tabsContainer = document.getElementById(`${mapId}-tabsContainer`)!;
      const footerBar = tabsContainer?.firstElementChild?.firstElementChild;

      const footerBarHeight = footerBar?.clientHeight ?? 0;

      const leftPanelHeight = (window.screen.height * footerPanelResizeValue) / 100 - panelTitleHeight - footerBarHeight - 10;

      leftPanelRef.current.style.maxHeight = `${leftPanelHeight}px`;
      leftPanelRef.current.style.overflow = 'auto';
      leftPanelRef.current.style.paddingBottom = '24px';

      if (activeFooterBarTabId === TABS.DATA_TABLE) {
        const rightPanel = (rightPanelRef.current?.firstElementChild ?? null) as HTMLElement | null;
       if (rightPanel && dataTableSelectedLayerPath) {
        rightPanel.removeAttribute('style');
        setTableHeight(leftPanelHeight);
       } else {
        rightPanelHeight(leftPanelHeight);
       }
      } else if (activeFooterBarTabId === TABS.GEO_CHART && rightPanelRef.current) {
        const childElem = rightPanelRef.current?.firstElementChild as HTMLElement | null;
        if (childElem) {
          childElem.style.maxHeight = `${leftPanelHeight}px`;
          childElem.style.overflowY = footerPanelResizeValue !== 100 ? 'auto' : 'visible';
        }
      } else {
        rightPanelHeight(leftPanelHeight);
      }
    }
    // reset the footer panel after map is not in fullscreen.
    if (!isMapFullScreen && leftPanelRef.current) {
      leftPanelRef.current.style.maxHeight = `${defaultHeight}px`;
      leftPanelRef.current.style.overflow = 'auto';
      rightPanelHeight();
      if (activeFooterBarTabId === TABS.DATA_TABLE) {
        setTableHeight(defaultHeight);
        // check if table exist as child in right panel.
      } else if (activeFooterBarTabId === TABS.GEO_CHART && rightPanelRef.current) {
        const childElem = rightPanelRef.current?.firstElementChild as HTMLElement | null;
        if (childElem) {
          childElem.style.maxHeight = `${defaultHeight}px`;
          childElem.style.overflowY = 'auto';
        }
      }
    }
  }, [
    footerPanelResizeValue,
    isMapFullScreen,
    activeFooterBarTabId,
    footerPanelTab,
    mapId,
    setTableHeight,
    arrayOfLayerData,
    allFeaturesLayerData,
    dataTableSelectedLayerPath
  ]);

  return { leftPanelRef, rightPanelRef, panelTitleRef, activeFooterBarTabId };
}
