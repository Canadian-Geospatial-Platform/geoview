import { useCallback } from 'react';
import {
  useUIStoreActions,
  useUIActiveFooterBarTab,
  useUIFooterBarComponents,
  useUIAppbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { scrollIfNotVisible } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import type { TypeValidAppBarCoreProps, TypeValidFooterBarTabsCoreProps } from '@/api/types/map-schema-types';

/**
 * Options for navigating to a tab
 */
interface NavigateToTabOptions {
  /** The layer path to select after navigation (optional) */
  layerPath?: string;
  /** Delay before executing post-navigation actions in ms (default: 350) */
  delay?: number;
}

/**
 * Custom hook for navigating to footer or appbar tabs with common functionality
 * Handles opening the tab, collapsing/expanding footer, and scrolling behavior
 *
 * @param {string} tabId - The ID of the tab to navigate to (e.g., 'layers', 'data-table', 'time-slider-panel')
 * @param {(layerPath: string) => void} [onNavigate] - Optional callback to execute after navigation (e.g., setSelectedLayerPath)
 * @returns {Function} Navigate function that can be called with optional NavigateToTabOptions
 *
 * @example
 * // Simple usage - navigate to layers tab
 * const navigateToLayers = useNavigateToTab('layers');
 * navigateToLayers();
 *
 * @example
 * // With layer selection
 * const { setSelectedLayerPath } = useLayerStoreActions();
 * const navigateToLayers = useNavigateToTab('layers', setSelectedLayerPath);
 * navigateToLayers({ layerPath: 'layer/path' });
 *
 * @example
 * // With custom options
 * const navigateToDataTable = useNavigateToTab('data-table', setDataTableSelectedLayerPath);
 * navigateToDataTable({
 *   layerPath: 'layer/path',
 *   delay: 500
 * });
 */
export function useNavigateToTab(tabId: string, onNavigate?: (layerPath: string) => void): (options?: NavigateToTabOptions) => void {
  // Store
  const { setActiveFooterBarTab, setActiveAppBarTab, setFooterBarIsOpen } = useUIStoreActions();
  const { isOpen: isFooterOpen } = useUIActiveFooterBarTab();
  const footerBarComponents = useUIFooterBarComponents();
  const appBarComponents = useUIAppbarComponents();

  // Check if tab exists in footer or appbar
  const hasFooterTab = footerBarComponents.includes(tabId as TypeValidFooterBarTabsCoreProps);
  const hasAppBarTab = appBarComponents.includes(tabId as TypeValidAppBarCoreProps);
  const hasTab = hasFooterTab || hasAppBarTab;

  return useCallback(
    (options: NavigateToTabOptions = {}) => {
      // Log
      logger.logTraceUseCallback('USE-NAVIGATE-TO-TAB', tabId, options);

      const { layerPath, delay = 350 } = options;

      if (!hasTab) {
        logger.logWarning(`Tab "${tabId}" not found in footer or appbar components`);
        return;
      }

      // If there are 2 components with the same tab (app bar or footer), prefer footer
      if (hasFooterTab) {
        // Open footer tab
        setActiveFooterBarTab(tabId as TypeValidFooterBarTabsCoreProps);
        if (!isFooterOpen) setFooterBarIsOpen(true);

        // TODO: seems the option for time out is never used
        setTimeout(() => {
          // Execute callback if provided
          if (onNavigate && layerPath) {
            onNavigate(layerPath);
          }

          // Scroll the footer into view
          const footer = document.querySelector('.tabsContainer');
          if (footer) {
            scrollIfNotVisible(footer as HTMLElement, 'start');
          }
        }, delay);
      } else if (hasAppBarTab) {
        // Open appBar tab
        setActiveAppBarTab(tabId as TypeValidAppBarCoreProps, true, false);

        setTimeout(() => {
          // Execute callback if provided
          if (onNavigate && layerPath) {
            onNavigate(layerPath);
          }
        }, delay);
      }
    },
    [
      hasTab,
      hasFooterTab,
      hasAppBarTab,
      isFooterOpen,
      tabId,
      onNavigate,
      setActiveFooterBarTab,
      setActiveAppBarTab,
      setFooterBarIsOpen,
    ]
  );
}
