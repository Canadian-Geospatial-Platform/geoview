import { RefObject, useCallback, useEffect, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  useActiveAppBarTab,
  useUIActiveFooterBarTabId,
  useUIFooterPanelResizeValue,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useDetailsLayerDataArray } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  useDataTableAllFeaturesDataArray,
  useDataTableStoreActions,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { TABS } from '@/core/utils/constant';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { CV_DEFAULT_APPBAR_CORE } from '@/api/config/types/config-constants';
import { useMapSize } from '@/core/stores/store-interface-and-intial-values/map-state';

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
export function useFooterPanelHeight({ footerPanelTab = 'default' }: UseFooterPanelHeightType): UseFooterPanelHeightReturnType {
  const defaultHeight = 600;
  const theme = useTheme();
  const mapId = useGeoViewMapId();
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);

  const panelTitleRefHeight = useRef<number>(0);

  const mobileView = useMediaQuery(theme.breakpoints.down('md'));

  // NOTE: this will keep the reference of panel title when tabs are changed.
  const panelTitleRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      panelTitleRefHeight.current = node.getBoundingClientRect()?.height ?? 0;
    }
  }, []);

  const isMapFullScreen = useAppFullscreenActive();
  const mapSize = useMapSize();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const activeFooterBarTabId = useUIActiveFooterBarTabId();
  const arrayOfLayerData = useDetailsLayerDataArray();
  const allFeaturesLayerData = useDataTableAllFeaturesDataArray();
  const { setTableHeight } = useDataTableStoreActions();
  const { tabGroup } = useActiveAppBarTab();

  /**
   * Set the height of right panel
   * @param {string} height calculate height of the right panel based on footerPanelTab
   */
  const rightPanelHeight = (height?: string): void => {
    const rightPanel = (rightPanelRef.current?.firstElementChild ?? null) as HTMLElement | null;
    if (rightPanel) {
      rightPanel.style.maxHeight = height ?? `${defaultHeight}px`;
      rightPanel.style.overflowY = 'auto';
    }
  };

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USE-FOOTER-PANEL-HEIGHT - footerPanelResizeValue', footerPanelResizeValue, isMapFullScreen);

    if (leftPanelRef.current && isMapFullScreen && (activeFooterBarTabId === footerPanelTab || footerPanelTab === 'default')) {
      const tabsContainer = document.getElementById(`${mapId}-tabsContainer`)!;
      const footerBar = tabsContainer?.firstElementChild?.firstElementChild;

      const footerBarHeight = footerBar?.clientHeight ?? 0;

      let leftPanelHeight = (window.screen.height * footerPanelResizeValue) / 100 - panelTitleRefHeight.current - footerBarHeight - 10;

      // update the height of left panel when data table and layers is rendered in appbar and map is in fullscreen.
      if (tabGroup === CV_DEFAULT_APPBAR_CORE.DATA_TABLE || tabGroup === CV_DEFAULT_APPBAR_CORE.LAYERS) {
        leftPanelHeight = window.screen.height - 200;
      }

      leftPanelRef.current.style.maxHeight = `${leftPanelHeight}px`;
      leftPanelRef.current.style.overflow = 'auto';
      leftPanelRef.current.style.paddingBottom = '24px';

      if (activeFooterBarTabId === TABS.DATA_TABLE || tabGroup === CV_DEFAULT_APPBAR_CORE.DATA_TABLE) {
        rightPanelHeight(`${leftPanelHeight}px`);
        setTableHeight(`${leftPanelHeight - 100}px`);
      } else if (activeFooterBarTabId === TABS.GEO_CHART && rightPanelRef.current) {
        const childElem = rightPanelRef.current?.firstElementChild as HTMLElement | null;
        if (childElem) {
          childElem.style.maxHeight = `${leftPanelHeight}px`;
          childElem.style.overflowY = 'auto';
        }
      } else {
        rightPanelHeight(`${leftPanelHeight}px`);
      }
    }
    // reset the footer panel after map is not in fullscreen.
    if (!isMapFullScreen && leftPanelRef.current) {
      leftPanelRef.current.style.maxHeight = `${defaultHeight}px`;
      leftPanelRef.current.style.overflow = 'auto';
      rightPanelHeight();
      if (activeFooterBarTabId === TABS.DATA_TABLE || tabGroup === CV_DEFAULT_APPBAR_CORE.DATA_TABLE) {
        setTableHeight(`${defaultHeight - 100}px`);
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
    tabGroup,
  ]);

  /**
   * Update the height of the left panel when data panel and layers rendered in appbar.
   */
  useEffect(() => {
    if (leftPanelRef.current && !isMapFullScreen) {
      if ((tabGroup === CV_DEFAULT_APPBAR_CORE.DATA_TABLE || tabGroup === CV_DEFAULT_APPBAR_CORE.LAYERS) && mobileView) {
        leftPanelRef.current.style.maxHeight = `100%`;
      } else {
        leftPanelRef.current.style.maxHeight = `${defaultHeight}px`;
      }
    }
  }, [mapSize, isMapFullScreen, tabGroup, mobileView]);

  return { leftPanelRef, rightPanelRef, panelTitleRef, activeFooterBarTabId };
}
