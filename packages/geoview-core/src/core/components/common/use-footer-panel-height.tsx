import { RefObject, useCallback, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';
import { useMediaQuery } from '@mui/material';
import { useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  useUIActiveAppBarTab,
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
import { usePerformanceMonitor, useWhatChanged } from '@/core/utils/useWhatChanged';

interface UseFooterPanelHeightType {
  footerPanelTab: 'legend' | 'default';
}

interface UseFooterPanelHeightReturnType {
  leftPanelRef: RefObject<HTMLDivElement>;
  rightPanelRef: RefObject<HTMLDivElement>;
  panelTitleRef: (node: HTMLDivElement) => void;
  activeFooterBarTabId: string;
}

// Constants outside component to prevent recreating every render
const DEFAULT_HEIGHT = 600;
const MOBILE_OFFSET = 200;
const PADDING_BOTTOM = '24px';
const TABLE_HEIGHT_OFFSET = 100;

const defaultPanelStyle = {
  overflow: 'auto',
  overflowY: 'auto' as const,
};

// Pure calculation function outside the hook
const calculateLeftPanelHeight = (
  footerBarHeight: number,
  currentTabGroup: string,
  currentResizeValue: number,
  panelTitleHeight: number
): number => {
  if (currentTabGroup === CV_DEFAULT_APPBAR_CORE.DATA_TABLE || currentTabGroup === CV_DEFAULT_APPBAR_CORE.LAYERS) {
    return window.screen.height - MOBILE_OFFSET;
  }
  return (window.screen.height * currentResizeValue) / 100 - panelTitleHeight - footerBarHeight - 10;
};

/**
 * Custom Hook to calculate the height of footer panel content when we set the map in fullscreen mode.
 * @param {'legend' | 'default'} footerPanelTab type of footer tab.
 * @returns {UseFooterPanelHeightReturnType} An object of ref objects that are attached to DOM.
 */
export function useFooterPanelHeight({ footerPanelTab = 'default' }: UseFooterPanelHeightType): UseFooterPanelHeightReturnType {
  logger.logTraceRender('components/common/useFooterPanelHeight');

  // Hooks
  const theme = useTheme();
  const mobileView = useMediaQuery(theme.breakpoints.down('md'));

  // State
  const leftPanelRef = useRef<HTMLDivElement>(null);
  const rightPanelRef = useRef<HTMLDivElement>(null);
  const panelTitleRefHeight = useRef<number>(0);

  // Store
  const mapId = useGeoViewMapId();
  const isMapFullScreen = useAppFullscreenActive();
  const mapSize = useMapSize();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const activeFooterBarTabId = useUIActiveFooterBarTabId();
  const { setTableHeight } = useDataTableStoreActions();
  const { tabGroup } = useUIActiveAppBarTab();

  // Store - Tracking dependencies for data updates
  const arrayOfLayerData = useDetailsLayerDataArray();
  const allFeaturesLayerData = useDataTableAllFeaturesDataArray();

  // Callbacks
  // NOTE: this will keep the reference of panel title when tabs are changed.
  const panelTitleRef = useCallback((node: HTMLDivElement) => {
    if (node) {
      panelTitleRefHeight.current = node.getBoundingClientRect()?.height ?? 0;
    }
  }, []);

  const updatePanelHeight = useCallback((panel: HTMLElement, height: string) => {
    // eslint-disable-next-line no-param-reassign
    panel.style.maxHeight = height;

    Object.assign(panel.style, defaultPanelStyle);
  }, []);

  // Memoize the panel height calculation
  const panelHeight = useMemo(() => {
    if (!leftPanelRef.current) return null;

    const tabsContainer = document.getElementById(`${mapId}-tabsContainer`);
    const footerBarHeight = tabsContainer?.firstElementChild?.firstElementChild?.clientHeight ?? 0;

    return calculateLeftPanelHeight(footerBarHeight, tabGroup, footerPanelResizeValue, panelTitleRefHeight.current);
  }, [mapId, tabGroup, footerPanelResizeValue]);

  // First effect - Handle non-fullscreen updates
  useEffect(() => {
    logger.logDebug('HEIGHT 3', tabGroup)
    if (leftPanelRef.current && !isMapFullScreen) {
      logger.logTraceUseEffect('USE-FOOTER-PANEL-HEIGHT', 'non-fullscreen updates');

      const height =
        (tabGroup === CV_DEFAULT_APPBAR_CORE.DATA_TABLE || tabGroup === CV_DEFAULT_APPBAR_CORE.LAYERS) && mobileView
          ? '100%'
          : `${DEFAULT_HEIGHT}px`;

          logger.logDebug('HEIGHT 2', height, tabGroup)
      updatePanelHeight(leftPanelRef.current, `${DEFAULT_HEIGHT}px`);
      
      if (rightPanelRef.current) updatePanelHeight(rightPanelRef.current, `${DEFAULT_HEIGHT}px`);
    }
  }, [mapSize, isMapFullScreen, activeFooterBarTabId, tabGroup, mobileView, updatePanelHeight]);

  // Second effect - Handle fullscreen updates
  useEffect(() => {
    // Early return
    if (!leftPanelRef.current || panelHeight === null) return;
    logger.logTraceUseEffect('USE-FOOTER-PANEL-HEIGHT', 'Handle fullscreen updates', isMapFullScreen);

    const shouldUpdateFullscreen = isMapFullScreen && (activeFooterBarTabId === footerPanelTab || footerPanelTab === 'default');

    if (shouldUpdateFullscreen) {
      updatePanelHeight(leftPanelRef.current, `${panelHeight}px`);
      leftPanelRef.current.style.paddingBottom = PADDING_BOTTOM;

      // Handle right panel updates
      const rightPanel = rightPanelRef.current?.firstElementChild as HTMLElement;
      if (rightPanel) {
        if (activeFooterBarTabId === TABS.DATA_TABLE || tabGroup === CV_DEFAULT_APPBAR_CORE.DATA_TABLE) {
          updatePanelHeight(rightPanel, `${panelHeight}px`);
          setTableHeight(`${panelHeight - TABLE_HEIGHT_OFFSET}px`);
        } else if (activeFooterBarTabId === TABS.GEO_CHART) {
          updatePanelHeight(rightPanel, `${panelHeight}px`);
        } else {
          updatePanelHeight(rightPanel, `${panelHeight}px`);
        }
      }
    } else {
      // Non-fullscreen updates
      updatePanelHeight(leftPanelRef.current, `${DEFAULT_HEIGHT}px`);

      const rightPanel = rightPanelRef.current?.firstElementChild as HTMLElement;
      if (rightPanel) {
        if (activeFooterBarTabId === TABS.DATA_TABLE || tabGroup === CV_DEFAULT_APPBAR_CORE.DATA_TABLE) {
          setTableHeight(`${DEFAULT_HEIGHT - TABLE_HEIGHT_OFFSET}px`);
        }
        updatePanelHeight(rightPanel, `${DEFAULT_HEIGHT}px`);
      }
    }
  }, [isMapFullScreen, activeFooterBarTabId, footerPanelTab, mapId, panelHeight, setTableHeight, tabGroup, updatePanelHeight]);

  logger.logDebug('HEIGHT',  { leftPanelRef, rightPanelRef, panelTitleRef, activeFooterBarTabId })
  return { leftPanelRef, rightPanelRef, panelTitleRef, activeFooterBarTabId };
}
