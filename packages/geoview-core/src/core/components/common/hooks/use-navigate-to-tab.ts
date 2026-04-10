import { useCallback } from 'react';
import {
  useStoreUIActiveFooterBarTab,
  useStoreUIFooterBarComponents,
  useStoreUIAppbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { scrollIfNotVisible } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import type { TypeValidAppBarCoreProps, TypeValidFooterBarTabsCoreProps } from '@/api/types/map-schema-types';
import { TIMEOUT } from '@/core/utils/constant';
import { useUIController } from '@/core/controllers/use-controllers';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';

/** Options for navigating to a tab. */
interface NavigateToTabOptions {
  /** The layer path to select after navigation (optional) */
  layerPath?: string;
  /** Delay before executing post-navigation actions in ms (default: 350) */
  delay?: number;
}

/**
 * Custom hook for navigating to footer or appbar tabs with common functionality.
 *
 * Handles opening the tab, collapsing/expanding footer, and scrolling behavior.
 */
export function useNavigateToTab(tabId: string, onNavigate?: (mapId: string, layerPath: string) => void): (options?: NavigateToTabOptions) => void {
  // Store
  const mapId = useStoreGeoViewMapId();
  const uiController = useUIController();
  const { isOpen: isFooterOpen } = useStoreUIActiveFooterBarTab();
  const footerBarComponents = useStoreUIFooterBarComponents();
  const appBarComponents = useStoreUIAppbarComponents();

  // Check if tab exists in footer or appbar
  const hasFooterTab = footerBarComponents.includes(tabId as TypeValidFooterBarTabsCoreProps);
  const hasAppBarTab = appBarComponents.includes(tabId as TypeValidAppBarCoreProps);
  const hasTab = hasFooterTab || hasAppBarTab;

  return useCallback(
    (options: NavigateToTabOptions = {}): void => {
      // TODO: seems the option for time out is never used different than default, consider removing it
      const { layerPath, delay = TIMEOUT.shortcutToTab } = options;

      if (!hasTab) {
        logger.logWarning(`Tab "${tabId}" not found in footer or appbar components`);
        return;
      }

      // If there are 2 components with the same tab (app bar or footer), prefer footer
      if (hasFooterTab) {
        // Open footer tab
        uiController.setActiveFooterBarTab(tabId as TypeValidFooterBarTabsCoreProps);
        if (!isFooterOpen) uiController.setFooterBarIsOpen(true);

        setTimeout(() => {
          // Execute callback if provided
          if (onNavigate && layerPath) {
            onNavigate(mapId, layerPath);
          }

          // Scroll the footer into view
          const footer = document.querySelector('.tabsContainer');
          if (footer) {
            scrollIfNotVisible(footer as HTMLElement, 'start');
          }
        }, delay);
      } else if (hasAppBarTab) {
        // Open appBar tab
        uiController.setActiveAppBarTab(tabId as TypeValidAppBarCoreProps, true, false);

        setTimeout(() => {
          // Execute callback if provided
          if (onNavigate && layerPath) {
            onNavigate(mapId, layerPath);
          }
        }, delay);
      }
    },
    [
      mapId,
      hasTab,
      hasFooterTab,
      hasAppBarTab,
      isFooterOpen,
      tabId,
      onNavigate,
      uiController,
    ]
  );
}
