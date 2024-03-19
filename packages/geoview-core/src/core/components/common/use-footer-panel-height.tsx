import { useEffect, useRef } from 'react';
import { useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useUIActiveFooterBarTabId, useUIFooterPanelResizeValue } from '@/core/stores/store-interface-and-intial-values/ui-state';
import {
  useDetailsStoreAllFeaturesDataArray,
  useDetailsStoreLayerDataArray,
} from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { logger } from '@/core/utils/logger';
import { useDataTableStoreActions } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { TABS } from '@/app';

interface UseFooterPanelHeightType {
  footerPanelTab: 'layers' | 'details' | 'data-table' | 'legend' | 'default' | 'guide';
}

/**
 * Custom Hook to calculate the height of footer panel content when we set the map in fullscreen mode.
 * @param {'layers' | 'details' | 'datatable' | 'legend'} footerPanelTab type of footer tab.
 * @returns list of ref objects that are attached to DOM.
 */
export function useFooterPanelHeight({ footerPanelTab }: UseFooterPanelHeightType) {
  const mapId = useGeoViewMapId();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const panelTitleRef = useRef<HTMLDivElement>(null);

  const isMapFullScreen = useAppFullscreenActive();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const activeFooterBarTabId = useUIActiveFooterBarTabId();
  const arrayOfLayerData = useDetailsStoreLayerDataArray();
  const allFeaturesLayerData = useDetailsStoreAllFeaturesDataArray();
  const { setTableHeight } = useDataTableStoreActions();

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USE-FOOTER-PANEL-HEIGHT - footerPanelResizeValue', footerPanelResizeValue, isMapFullScreen);

    const defaultHeight = 600;

    if (leftPanelRef.current && isMapFullScreen && (activeFooterBarTabId === footerPanelTab || footerPanelTab === 'default')) {
      const panelTitleHeight = panelTitleRef.current?.clientHeight ?? 0;
      const tabsContainer = document.getElementById(`${mapId}-tabsContainer`)!;
      const firstChild = tabsContainer?.firstElementChild?.firstElementChild;

      const firstChildHeight = firstChild?.clientHeight ?? 0;
      const leftPanelHeight = (window.screen.height * footerPanelResizeValue) / 100 - panelTitleHeight - firstChildHeight;

      leftPanelRef.current.style.maxHeight = `${leftPanelHeight}px`;
      leftPanelRef.current.style.overflow = 'auto';
      leftPanelRef.current.style.paddingBottom = '24px';

      if (activeFooterBarTabId === TABS.DATA_TABLE) {
        setTableHeight(leftPanelHeight - 10);
      } else if (activeFooterBarTabId === TABS.GEO_CHART && rightPanelRef.current) {
        rightPanelRef.current.style.maxHeight = `${leftPanelHeight}px`;
        rightPanelRef.current.style.overflowY = footerPanelResizeValue !== 100 ? 'auto' : 'visible';
        rightPanelRef.current.style.paddingBottom = `24px`;
      } else {
        const rightPanel = (rightPanelRef.current?.firstElementChild ?? null) as HTMLElement | null;

        if (rightPanel) {
          rightPanel.style.maxHeight = `${leftPanelHeight}px`;
          rightPanel.style.paddingBottom = `24px`;
        }
      }
    }
    // reset the footer panel after map is not in fullscreen.
    if (!isMapFullScreen && leftPanelRef.current) {
      leftPanelRef.current.style.maxHeight = `${defaultHeight}px`;
      leftPanelRef.current.style.overflow = 'auto';
      if (activeFooterBarTabId === TABS.DATA_TABLE) {
        setTableHeight(defaultHeight);
      } else if (activeFooterBarTabId === TABS.GEO_CHART && rightPanelRef.current) {
        rightPanelRef.current.style.maxHeight = `${defaultHeight}px`;
        rightPanelRef.current.style.overflowY = 'auto';
      } else {
        const rightPanel = (rightPanelRef.current?.firstElementChild ?? null) as HTMLElement | null;
        if (rightPanel) {
          rightPanel.style.maxHeight = `${defaultHeight}px`;
        }
      }
    }
  }, [
    footerPanelResizeValue,
    isMapFullScreen,
    activeFooterBarTabId,
    footerPanelTab,
    arrayOfLayerData,
    allFeaturesLayerData,
    setTableHeight,
  ]);

  return { leftPanelRef, rightPanelRef, panelTitleRef };
}
