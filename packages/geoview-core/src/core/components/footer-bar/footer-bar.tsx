import { useCallback, useEffect, useMemo, useRef } from 'react';
import { useTheme } from '@mui/material/styles';

import type { TypeTabs } from '@/ui';
import { Box, Tabs } from '@/ui';
// default tabs icon and class
import { LegendIcon, InfoIcon, LayersIcon, StorageIcon, QuestionMarkIcon } from '@/ui/icons';

import { usePluginController, useUIController } from '@/core/controllers/use-controllers';
import { getSxClasses } from './footer-bar-style';
import { ResizeFooterPanel } from '@/core/components/footer-bar/hooks/resize-footer-panel';
import {
  useStoreAppIsFullscreenActive,
  useStoreAppHeight,
  useStoreAppShellContainer,
} from '@/core/stores/store-interface-and-intial-values/app-state';
import { useStoreDetailsLayerDataArrayBatch } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  useStoreUIActiveFooterBarTab,
  useStoreUIFooterPanelResizeValue,
  useStoreUIActiveTrapGeoView,
  useStoreUIHiddenTabs,
  useStoreUIFooterTabs,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { DEFAULT_FOOTER_TABS_ORDER } from '@/api/types/map-schema-types';
import { CONTAINER_TYPE, TABS } from '@/core/utils/constant';
import { useStoreGeoViewConfig, useStoreGeoViewMapId } from '@/core/stores/geoview-store';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { Legend } from '@/core/components/legend/legend';
import { LayersPanel } from '@/core/components/layers/layers-panel';
import { DetailsPanel } from '@/core/components/details/details-panel';
import { Datapanel } from '@/core/components/data-table/data-panel';
import { camelCase, delay, scrollIfNotVisible } from '@/core/utils/utilities';
import { logger } from '@/core/utils/logger';
import { Guide } from '@/core/components/guide/guide';
import { FooterPlugin } from '@/api/plugin/footer-plugin';
import type { FooterBarApi } from './footer-bar-api';

/** Props for the FooterBar component. */
type FooterBarProps = {
  /** The footer bar API instance. */
  api: FooterBarApi;
};

/**
 * Creates the FooterBar component to display a list of tabs and their content.
 *
 * @param props - The footer bar props
 * @returns The FooterBar tabs component, or null if no tabs
 */
export function FooterBar(props: FooterBarProps): JSX.Element | null {
  // Log
  logger.logTraceRender('components/footer-bar/footer-bar');

  // Set props
  const { api: footerBarApi } = props;

  // Hooks
  const theme = useTheme();
  const memoSxClasses = useMemo(() => {
    logger.logTraceUseMemo('FOOTER-BAR - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // State & ref
  const tabsContainerRef = useRef<HTMLDivElement>();

  // Store
  const mapId = useStoreGeoViewMapId();
  const isMapFullScreen = useStoreAppIsFullscreenActive();
  const footerPanelResizeValue = useStoreUIFooterPanelResizeValue();
  const arrayOfLayerDataBatch = useStoreDetailsLayerDataArrayBatch();
  const activeFooterBarTab = useStoreUIActiveFooterBarTab();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();
  const shellContainer = useStoreAppShellContainer();
  const backupAppHeight: number = useStoreAppHeight();
  const appHeight = document.getElementById(mapId)?.getAttribute('data-footer-height') ?? `${backupAppHeight}px`;
  const hiddenTabs: string[] = useStoreUIHiddenTabs();
  const uiController = useUIController();
  const pluginController = usePluginController();

  // get store config for footer bar tabs to add (similar logic as in app-bar)
  const footerBarTabsConfig = useStoreGeoViewConfig()?.footerBar;

  // Ref so the seed effect reads the initial config without it being a dep (must only run once on mount)
  const footerBarTabsConfigRef = useRef(footerBarTabsConfig);

  // #region HANDLERS

  /**
   * Handles the collapse/expand toggle.
   */
  const handleToggleCollapse = useCallback((): void => {
    if (activeFooterBarTab.isOpen) uiController.setActiveFooterBarTab(undefined);
    uiController.setFooterBarIsOpen(!activeFooterBarTab.isOpen);
  }, [activeFooterBarTab.isOpen, uiController]);

  /**
   * Handles when the selected tab changes.
   */
  const handleSelectedTabChanged = useCallback(
    (tab: TypeTabs): void => {
      uiController.setActiveFooterBarTab(tab.id);
      uiController.setFooterBarIsOpen(true);
    },
    [uiController]
  );

  // #endregion HANDLERS

  /**
   * Registers custom footer tab entries from configuration on mount.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR - seed custom footer tabs from config', footerBarTabsConfigRef.current?.tabs?.custom);

    // Seed custom tabs and register their content (core tabs are seeded in setDefaultConfigValues)
    (footerBarTabsConfigRef.current?.tabs?.custom ?? []).forEach((customTab) => {
      footerBarApi.createTab({
        id: customTab.id,
        value: 0,
        label: customTab.label ?? '',
        icon: <InfoIcon />,
        content: <UseHtmlToReact htmlContent={customTab.contentHTML ?? ''} />,
      });
    });
  }, [footerBarApi]);

  // Read footer tabs from the store (reactive — no event handlers needed)
  const footerTabs = useStoreUIFooterTabs();

  /**
   * Builds the panel definitions for each core tab.
   */
  const memoTabs: Record<string, { icon: JSX.Element; content: JSX.Element }> = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - memoTabs');

    return {
      legend: { icon: <LegendIcon />, content: <Legend containerType={CONTAINER_TYPE.FOOTER_BAR} /> },
      layers: { icon: <LayersIcon />, content: <LayersPanel containerType={CONTAINER_TYPE.FOOTER_BAR} /> },
      details: { icon: <InfoIcon />, content: <DetailsPanel containerType={CONTAINER_TYPE.FOOTER_BAR} /> },
      'data-table': { icon: <StorageIcon />, content: <Datapanel containerType={CONTAINER_TYPE.FOOTER_BAR} /> },
      guide: { icon: <QuestionMarkIcon />, content: <Guide containerType={CONTAINER_TYPE.FOOTER_BAR} /> },
    };
  }, []);

  /**
   * Maps the panels with footer bar tab keys in display order.
   */
  const memoFooterBarTabs = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - memoFooterBarTabs', footerTabs, memoTabs);

    // Early return if no footer tab provided
    if (!footerTabs || footerTabs.length === 0) return [];

    // Build lookup of tab ids from the store
    const tabIds = footerTabs.map((t) => t.id);
    const tabLabelMap = new Map(footerTabs.map((t) => [t.id, t.label]));
    const availableTabKeys: string[] = tabIds.includes('guide') ? tabIds : [...tabIds, 'guide'];

    // Custom tabs first, then core tabs in DEFAULT_FOOTER_TABS_ORDER ... last guide
    const customTabKeys = availableTabKeys.filter((tabKey) => !DEFAULT_FOOTER_TABS_ORDER.includes(tabKey));
    const coreTabKeys = DEFAULT_FOOTER_TABS_ORDER.filter((tabKey) => availableTabKeys.includes(tabKey));
    const orderedTabKeys = customTabKeys.concat(coreTabKeys);

    return orderedTabKeys.map((tabId, index) => {
      // Look up content: first from core memoTabs, then from the API content registry
      const coreTab = memoTabs[tabId];
      const registryContent = footerBarApi.getTabContent(tabId);
      const icon = coreTab?.icon ?? registryContent?.icon ?? '';
      const content = coreTab?.content ?? registryContent?.content ?? '';
      const label = tabLabelMap.get(tabId) || `${camelCase(tabId)}.title`;

      return {
        id: tabId,
        value: index,
        label,
        icon,
        content: <Box sx={memoSxClasses.tabContent}>{content}</Box>,
      };
    });
  }, [memoTabs, footerTabs, memoSxClasses, footerBarApi]);

  /**
   * Whenever the array layer data batch changes if we're on 'details' tab and it's collapsed, make sure we uncollapse it
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-TABS - arrayOfLayerDataBatch', arrayOfLayerDataBatch, activeFooterBarTab);

    // If the details tab is not in the footer bar tabs config, return
    if (footerBarTabsConfig && !footerBarTabsConfig.tabs.core.includes(TABS.DETAILS)) return;

    // If we're on the details panel and the footer is collapsed
    if (activeFooterBarTab.tabId === TABS.DETAILS && !activeFooterBarTab.isOpen) {
      // Uncollapse it
      uiController.setFooterBarIsOpen(true);
    }
  }, [arrayOfLayerDataBatch, activeFooterBarTab, uiController, footerBarTabsConfig]);
  // Don't add isCollapsed in the dependency array, because it'll retrigger the useEffect

  /**
   * Handle the collapse/expand state effect
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR - isFooterBarOpen', activeFooterBarTab.isOpen);

    if (tabsContainerRef.current) {
      const tabsContainer = tabsContainerRef.current;
      tabsContainer.style.height = 'fit-content';
      const lastChild = tabsContainer.firstElementChild?.lastElementChild as HTMLElement | null;
      if (lastChild) {
        lastChild.style.overflow = !activeFooterBarTab.isOpen ? 'unset' : '';
        lastChild.style.height = !activeFooterBarTab.isOpen ? '0px' : '';
      }
      tabsContainerRef.current = tabsContainer;
    }
  }, [activeFooterBarTab.isOpen, uiController]);

  /**
   * Handles resizing the footerbar when toggling fullscreen.
   */
  useEffect(() => {
    if (!tabsContainerRef.current) {
      return;
    }

    logger.logTraceUseEffect('FOOTER-BAR - handle full screen resize', activeFooterBarTab.isOpen);

    // default values as set by the height of the div
    let footerHeight = 'fit-content';

    // adjust values from px to % to accomodate fullscreen plus page zoom
    if (isMapFullScreen && activeFooterBarTab.isOpen) {
      footerHeight = `${footerPanelResizeValue}%`;
    }

    tabsContainerRef.current.style.height = footerHeight;
  }, [tabsContainerRef, activeFooterBarTab.isOpen, isMapFullScreen, footerPanelResizeValue]);

  /**
   * Selects the active plugin when the tab changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR - selectedTab', activeFooterBarTab);

    // If clicked on a tab with a plugin
    if (activeFooterBarTab.tabId) {
      // Get the plugin if it exists
      pluginController
        .getMapViewerPluginIfExists(activeFooterBarTab.tabId)
        .then((plugin) => {
          // If the Plugin is a FooterPlugin
          if (plugin instanceof FooterPlugin) {
            // Select it
            plugin.select();
          }
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('getMapViewerPlugin in useEffect in footer-bar', error);
        });
    }
  }, [pluginController, activeFooterBarTab]);

  /**
   * Scrolls the footer into view on mouse click.
   *
   * TODO: WCAG issue #3418 - Replace querySelector + addEventListener with declarative pattern
   * TO.DOCONT: Use useRef for headerRef and forward to Tabs component
   * TO.DOCONT: Replace addEventListener with onClick prop on header element
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER BAR - scrollIntoViewListener');

    if (!tabsContainerRef?.current) return () => {};

    const handleClick = (): void => {
      // Need delay to allow tabs container to resize on expand/collapse
      delay(25).then(
        () => {
          if (tabsContainerRef.current) {
            scrollIfNotVisible(tabsContainerRef.current, 'end');
          }
        },
        (error: unknown) => logger.logPromiseFailed('Delay failed', error)
      );
    };

    const header = tabsContainerRef.current.querySelector(`#${mapId}-footerbar-header`);
    header?.addEventListener('click', handleClick);

    // Cleanup function to remove event listener
    return () => {
      header?.removeEventListener('click', handleClick);
    };
  }, [mapId]);

  return memoFooterBarTabs.length > 0 ? (
    <Box ref={tabsContainerRef} sx={memoSxClasses.tabsContainer} className="tabsContainer" id={`${mapId}-tabsContainer`}>
      <Tabs
        mapId={mapId}
        shellContainer={shellContainer}
        activeTrap={activeTrapGeoView}
        isCollapsed={!activeFooterBarTab.isOpen}
        onToggleCollapse={handleToggleCollapse}
        onSelectedTabChanged={handleSelectedTabChanged}
        onOpenKeyboard={(e) => uiController.enableFocusTrap(e)}
        onCloseKeyboard={() => uiController.disableFocusTrap()}
        selectedTab={memoFooterBarTabs.findIndex((t) => t.id === activeFooterBarTab.tabId)}
        tabProps={{ disableRipple: true }}
        tabs={memoFooterBarTabs}
        TabContentVisibilty={activeFooterBarTab.isOpen ? 'visible' : 'hidden'}
        containerType={CONTAINER_TYPE.FOOTER_BAR}
        rightButtons={activeFooterBarTab.isOpen && isMapFullScreen && <ResizeFooterPanel />}
        appHeight={appHeight}
        hiddenTabs={hiddenTabs}
        isFullScreen={isMapFullScreen}
      />
    </Box>
  ) : null;
}
