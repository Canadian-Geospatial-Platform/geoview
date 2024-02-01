import { useEffect, useRef, useState } from 'react';
import { useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useUIActiveFooterTabId, useUIFooterPanelResizeValue } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useDetailsStoreLayerDataArray } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import { logger } from '@/core/utils/logger';

interface UseFooterPanelHeightType {
  footerPanelTab: 'layers' | 'details' | 'datatable' | 'legend' | 'default';
}

/**
 * Custom Hook to calculate the height of footer panel content when we set the map in fullscreen mode.
 * @param {'layers' | 'details' | 'datatable' | 'legend'} footerPanelTab type of footer tab.
 * @returns list of ref objects that are attached to DOM.
 */
export function useFooterPanelHeight({ footerPanelTab }: UseFooterPanelHeightType) {
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const panelTitleRef = useRef<HTMLDivElement>(null);

  const [tableHeight, setTableHeight] = useState<number>(600);

  const isMapFullScreen = useAppFullscreenActive();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const activeFooterTabId = useUIActiveFooterTabId();
  const arrayOfLayerData = useDetailsStoreLayerDataArray();

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USE-FOOTER-PANEL-HEIGHT - footerPanelResizeValue', footerPanelResizeValue, isMapFullScreen);

    const defaultHeight = 700;

    if (leftPanelRef.current && isMapFullScreen && (activeFooterTabId === footerPanelTab || footerPanelTab === 'default')) {
      const panelTitleHeight = panelTitleRef.current?.clientHeight ?? 0;
      const tabsContainer = document.getElementById('tabsContainer')!;
      const firstChild = tabsContainer.firstElementChild?.firstElementChild;
      const firstChildHeight = firstChild?.clientHeight ?? 0;
      const leftPanelHeight = (window.screen.height * footerPanelResizeValue) / 100 - panelTitleHeight - firstChildHeight;

      leftPanelRef.current.style.maxHeight = `${leftPanelHeight}px`;
      leftPanelRef.current.style.height = `${leftPanelHeight}px`;
      leftPanelRef.current.style.overflow = 'auto';
      leftPanelRef.current.style.paddingBottom = '24px';

      if (footerPanelTab === 'datatable') {
        setTableHeight(leftPanelHeight - 10);
      } else {
        let rightPanel;
        if (footerPanelTab === 'details') {
          rightPanel = (rightPanelRef.current?.firstElementChild ?? null) as HTMLElement | null;
        } else if (footerPanelTab === 'layers' || footerPanelTab === 'default') {
          rightPanel = (rightPanelRef.current?.firstElementChild?.firstElementChild ?? null) as HTMLElement | null;
        }
        if (rightPanel) {
          rightPanel.style.maxHeight = `${leftPanelHeight}px`;
          rightPanel.style.overflow = `auto`;
          rightPanel.style.paddingBottom = `24px`;
        }
      }
    }
    // reset the footer panel after map is not in fullscreen.
    if (!isMapFullScreen && leftPanelRef.current) {
      leftPanelRef.current.style.maxHeight = `${defaultHeight}px`;
      leftPanelRef.current.style.overflow = 'auto';
      if (footerPanelTab === 'datatable') {
        setTableHeight(defaultHeight);
      } else {
        let rightPanel;
        if (footerPanelTab === 'details') {
          rightPanel = (rightPanelRef.current?.firstElementChild ?? null) as HTMLElement | null;
        } else if (footerPanelTab === 'layers' || footerPanelTab === 'default') {
          rightPanel = (rightPanelRef.current?.firstElementChild?.firstElementChild ?? null) as HTMLElement | null;
        }

        if (rightPanel) {
          rightPanel.style.maxHeight = `${defaultHeight}px`;
          rightPanel.style.overflow = `auto`;
        }
      }
    }
  }, [footerPanelResizeValue, isMapFullScreen, activeFooterTabId, footerPanelTab, arrayOfLayerData]);

  return { leftPanelRef, rightPanelRef, panelTitleRef, tableHeight };
}
