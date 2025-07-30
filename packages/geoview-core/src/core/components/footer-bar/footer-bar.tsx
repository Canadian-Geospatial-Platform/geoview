import { MutableRefObject, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { camelCase } from 'lodash';
import { useTheme } from '@mui/material/styles';

import { Box, Tabs, TypeTabs } from '@/ui';
import { Plugin } from '@/api/plugin/plugin';
import { getSxClasses } from './footer-bar-style';
import { ResizeFooterPanel } from '@/core/components/footer-bar/hooks/resize-footer-panel';
import { useAppFullscreenActive, useAppGeoviewHTMLElement, useAppHeight } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useDetailsLayerDataArrayBatch } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  useUIActiveFooterBarTabId,
  useUIFooterPanelResizeValue,
  useUIStoreActions,
  useUIActiveTrapGeoView,
  useUIFooterBarIsCollapsed,
  useUIHiddenTabs,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapSize } from '@/core/stores/store-interface-and-intial-values/map-state';
import { FooterBarApi, FooterTabCreatedEvent, FooterTabRemovedEvent } from '@/core/components';

import { toJsonObject } from '@/api/config/types/config-types';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';

// default tabs icon and class
import { LegendIcon, InfoOutlinedIcon, LayersOutlinedIcon, StorageIcon, QuestionMarkIcon } from '@/ui/icons';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { Legend } from '@/core/components/legend/legend';
import { LayersPanel } from '@/core/components/layers/layers-panel';
import { DetailsPanel } from '@/core/components/details/details-panel';
import { Datapanel } from '@/core/components/data-table/data-panel';
import { logger } from '@/core/utils/logger';
import { Guide } from '@/core/components/guide/guide';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { FooterPlugin } from '@/api/plugin/footer-plugin';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { delay, scrollIfNotVisible } from '@/core/utils/utilities';

interface Tab {
  icon: ReactNode;
  content: ReactNode;
  label?: string;
}

type FooterBarProps = {
  api: FooterBarApi;
};

/**
 * The FooterBar component is used to display a list of tabs and their content.
 *
 * @returns {JSX.Element} returns the FooterBar Tabs component
 */
export function FooterBar(props: FooterBarProps): JSX.Element | null {
  // Log
  logger.logTraceRender('components/footer-bar/footer-bar');

  // Set props
  const { api: footerBarApi } = props;

  // Hooks
  const isMapFullScreen = useAppFullscreenActive();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // State & ref
  const tabsContainerRef = useRef<HTMLDivElement>();

  // Store
  const mapId = useGeoViewMapId();
  const arrayOfLayerDataBatch = useDetailsLayerDataArrayBatch();
  const selectedTab = useUIActiveFooterBarTabId();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const isCollapsed = useUIFooterBarIsCollapsed();
  const geoviewElement = useAppGeoviewHTMLElement();
  const shellContainer = geoviewElement.querySelector(`[id^="shell-${mapId}"]`) as HTMLElement;
  const { setActiveFooterBarTab, enableFocusTrap, disableFocusTrap, setFooterBarIsCollapsed } = useUIStoreActions();
  const mapSize = useMapSize() || [200, 200]; // Default in case the map isn't rendered yet and the Footer tries to render
  const appHeight: number = useAppHeight();
  const hiddenTabs: string[] = useUIHiddenTabs();

  // get store config for footer bar tabs to add (similar logic as in app-bar)
  const footerBarTabsConfig = useGeoViewConfig()?.footerBar;

  const memoFooterBarTabKeys = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - memoFooterBarTabKeys', footerBarTabsConfig?.tabs?.core);

    const coreTabs = (footerBarTabsConfig?.tabs?.core ?? []).reduce(
      (acc, curr) => {
        acc[curr] = {} as Tab;
        return acc;
      },
      {} as Record<string, Tab>
    );

    // Add custom tabs
    const customTabs = (footerBarTabsConfig?.tabs?.custom ?? []).reduce(
      (acc, curr) => {
        acc[curr.id] = {} as Tab;
        return acc;
      },
      {} as Record<string, Tab>
    );

    return { ...coreTabs, ...customTabs };
  }, [footerBarTabsConfig?.tabs]);

  // List of Footer Tabs created from config file.
  const [tabsList, setTabsList] = useState<Record<string, Tab>>(memoFooterBarTabKeys);

  // Create custom tabs from configuration
  useEffect(() => {
    if (footerBarTabsConfig?.tabs?.custom) {
      footerBarTabsConfig.tabs.custom.forEach((customTab) => {
        const newTab = {
          [customTab.id]: {
            icon: <InfoOutlinedIcon />, // TODO: Make it configurable if needed
            label: customTab.label,
            content: <UseHtmlToReact htmlContent={customTab.contentHTML ?? ''} />,
          },
        } as Record<string, Tab>;

        // Add the custom tab to the tabs list
        setTabsList((prevState: Record<string, Tab>) => {
          return { ...prevState, ...newTab };
        });
      });
    }
  }, [footerBarTabsConfig]);

  // Panels for each tab in footer config file.
  const memoTabs = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - memoTabs');

    return {
      legend: { icon: <LegendIcon />, content: <Legend /> },
      layers: { icon: <LayersOutlinedIcon />, content: <LayersPanel containerType={CONTAINER_TYPE.FOOTER_BAR} /> },
      details: { icon: <InfoOutlinedIcon />, content: <DetailsPanel /> },
      'data-table': { icon: <StorageIcon />, content: <Datapanel /> },
      guide: { icon: <QuestionMarkIcon />, content: <Guide /> },
    } as Record<string, Tab>;
  }, []);

  // Map the panels with footer bar tab keys.
  const memoFooterBarTabs = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - memoFooterBarTabs', tabsList, memoTabs);

    const allTabs = { ...tabsList, ...memoTabs };

    // TODO: Use the indexValue coming from the tab to order so custom tab can be placed anywhere
    // inject guide tab at last position of tabs.
    return Object.keys({ ...tabsList, ...{ guide: {} } }).map((tab, index) => {
      return {
        id: tab,
        value: index,
        label: allTabs[tab].label ? allTabs[tab].label : `${camelCase(tab)}.title`,
        icon: allTabs[tab]?.icon ?? '',
        content: <Box sx={sxClasses.tabContent}>{allTabs[tab]?.content ?? ''}</Box>,
      } as TypeTabs;
    });
  }, [memoTabs, tabsList, sxClasses]);

  /**
   * Add a tab
   */
  const handleAddTab = useCallback((sender: FooterBarApi, event: FooterTabCreatedEvent) => {
    // Log
    logger.logTraceUseCallback('FOOTER-BAR - handleAddTab', event);
    const newTab = {
      [event.tab.id]: {
        icon: event.tab.icon || <InfoOutlinedIcon />,
        label: event.tab.label,
        content: typeof event.tab.content === 'string' ? <UseHtmlToReact htmlContent={event.tab.content ?? ''} /> : event.tab.content,
      },
    } as Record<string, Tab>;

    // NOTE: we need prevState because of an async nature of adding plugins.
    setTabsList((prevState: Record<string, Tab>) => {
      return { ...prevState, ...newTab };
    });
  }, []);

  /**
   * Remove a tab
   */
  const handleRemoveTab = useCallback((sender: FooterBarApi, event: FooterTabRemovedEvent) => {
    // Log
    logger.logTraceUseCallback('FOOTER-BAR - handleRemoveTab', event);

    // remove the tab from the list
    setTabsList((prevState) => {
      const state = { ...prevState };
      delete state[event.tabid];
      return state;
    });
  }, []);

  // Update the active footer tab based on footer tabs created from configuration.
  useEffect(() => {
    if (!selectedTab) setActiveFooterBarTab(memoFooterBarTabs?.[0]?.id ?? '');
    // No need to update when selected tab changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memoFooterBarTabs, setActiveFooterBarTab]);

  /**
   * Whenever the array layer data batch changes if we're on 'details' tab and it's collapsed, make sure we uncollapse it
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-TABS - arrayOfLayerDataBatch', arrayOfLayerDataBatch, selectedTab, isCollapsed);

    // If the details tab is not in the footer bar tabs config, return
    if (footerBarTabsConfig && !footerBarTabsConfig.tabs.core.includes('details')) return;

    // If we're on the details panel and the footer is collapsed
    if (selectedTab === 'details' && isCollapsed) {
      // Uncollapse it
      setFooterBarIsCollapsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayOfLayerDataBatch, selectedTab, setFooterBarIsCollapsed]);
  // Don't add isCollapsed in the dependency array, because it'll retrigger the useEffect

  /**
   * Handle the collapse/expand state effect
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR - isCollapsed', isCollapsed);

    if (tabsContainerRef.current) {
      const tabsContainer = tabsContainerRef.current;
      tabsContainer.style.height = 'fit-content';
      const lastChild = tabsContainer.firstElementChild?.lastElementChild as HTMLElement | null;
      if (lastChild) {
        lastChild.style.overflow = isCollapsed ? 'unset' : '';
        lastChild.style.height = isCollapsed ? '0px' : '';
      }
      tabsContainerRef.current = tabsContainer;
    }
  }, [isCollapsed, setActiveFooterBarTab]);

  /**
   * Handle a collapse, expand event for the tabs component
   */
  const handleToggleCollapse = (): void => {
    if (!isCollapsed) setActiveFooterBarTab(undefined);
    setFooterBarIsCollapsed(!isCollapsed);
  };

  /**
   * Handles when the selected tab changes
   * @param {TypeTabs} tab - The newly selected tab
   */
  const handleSelectedTabChanged = (tab: TypeTabs): void => {
    setActiveFooterBarTab(tab.id);
    setFooterBarIsCollapsed(false);
  };

  /**
   * Handles resizing the footerbar when toggling fullscreen
   */
  useEffect(() => {
    if (!tabsContainerRef.current) {
      return;
    }

    logger.logTraceUseEffect('FOOTER-BAR - handle full screen resize', isCollapsed);

    // default values as set by the height of the div
    let footerHeight = 'fit-content';

    // adjust values from px to % to accomodate fullscreen plus page zoom
    if (isMapFullScreen && !isCollapsed) {
      footerHeight = `${footerPanelResizeValue}%`;
    }

    tabsContainerRef.current.style.height = footerHeight;
  }, [tabsContainerRef, isCollapsed, isMapFullScreen, footerPanelResizeValue]);

  /**
   * Add plugins
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR - selectedTab', selectedTab);

    // If clicked on a tab with a plugin
    MapEventProcessor.getMapViewerPlugins(mapId)
      .then((plugins) => {
        if (selectedTab && plugins[selectedTab]) {
          // Get the plugin
          const theSelectedPlugin = plugins[selectedTab];

          // If the Plugin is a FooterPlugin
          if (theSelectedPlugin instanceof FooterPlugin) {
            theSelectedPlugin.select();
          }
        }
      })
      .catch((error: unknown) => {
        // Log
        logger.logPromiseFailed('getMapViewerPluginsInstance in useEffect in footer-bar', error);
      });
  }, [mapId, selectedTab]);

  /**
   * Manage the tab 'create', 'remove'
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR - mount');

    // TODO: Refactor - Registering those handlers only when the component has been mounted can cause issues if 'someone' calls
    // TO.DOCONT: mapViewer('map1').footerBarApi.createTab() before the component is actually mounted.
    // TO.DOCONT: The handler when tabs are created should happen earlier and the ui component should only 'react' to store tabs values.
    // TO.DOCONT: We had an issue where a custom footer tab was never appearing, because the 'createTab()' call was happening before
    // TO.DOCONT: this FooterBar component was actually mounted. That being said, removing the 'mapLoaded' condition, before mounting
    // TO.DOCONT: the FooterBar (in Footer-bar.tsx), was sufficient to fix the issue for now, but it should be addressed eventually.

    // Register footerbar tab created/removed handlers
    footerBarApi.onFooterTabCreated(handleAddTab);
    footerBarApi.onFooterTabRemoved(handleRemoveTab);

    return () => {
      // Unregister events
      footerBarApi.offFooterTabCreated(handleAddTab);
      footerBarApi.offFooterTabRemoved(handleRemoveTab);
    };
  }, [footerBarApi, handleAddTab, handleRemoveTab]);

  /**
   * Create default tabs from configuration parameters (similar logic as in app-bar).
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR - footerBarTabsConfig');

    // TODO: Refactor Footer-bar - This loadScript shouldn't be part of a useEffect, because those happen everytime their depedencies change.
    // TO.DOCONT: In development with StrictMode this is triggered twice to prevent developers from doing stuff like that here.
    // TO.DOCONT: Also, important, the dependencies of this useEffect (and the code herein) isn't meant to be part of a useEffect in the first place.
    // TO.DOCONT: Looking at the other useEffects, it's clear there's a lot of refactoring that should be done in the Footer-bar in general.

    // Packages tab
    if (footerBarTabsConfig && footerBarTabsConfig.tabs.core.includes('time-slider')) {
      // create a new tab by loading the time-slider plugin
      Plugin.loadScript('time-slider')
        .then((typePlugin) => {
          Plugin.addPlugin(
            'time-slider',
            mapId,
            typePlugin,
            toJsonObject({
              mapId,
            })
          ).catch((error: unknown) => {
            // Log
            logger.logPromiseFailed('api.plugin.addPlugin(time-slider) in useEffect in FooterBar', error);
          });
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('api.plugin.loadScript(time-slider) in useEffect in FooterBar', error);
        });
    }

    if (footerBarTabsConfig && footerBarTabsConfig.tabs.core.includes('geochart')) {
      // create a new tab by loading the geo chart plugin
      Plugin.loadScript('geochart')
        .then((typePlugin) => {
          Plugin.addPlugin(
            'geochart',
            mapId,
            typePlugin,
            toJsonObject({
              mapId,
            })
          ).catch((error: unknown) => {
            // Log
            logger.logPromiseFailed('api.plugin.addPlugin(geochart) in useEffect in FooterBar', error);
          });
        })
        .catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('api.plugin.loadScript(geochart) in useEffect in FooterBar', error);
        });
    }
  }, [footerBarTabsConfig, mapId]);

  // Scroll the footer into view on mouse click
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER BAR - scrollIntoViewListener');

    if (!tabsContainerRef?.current) return () => {};

    const handleClick = (): void => {
      if (tabsContainerRef.current) {
        // Need delay to allow tabs container to resize on expand/collapse
        delay(25).then(
          () => scrollIfNotVisible(tabsContainerRef.current!, 'end'),
          (error) => logger.logError('Delay failed', error)
        );
      }
    };

    const header = tabsContainerRef.current.querySelector('#footerbar-header');
    header?.addEventListener('click', handleClick);

    // Cleanup function to remove event listener
    return () => {
      header?.removeEventListener('click', handleClick);
    };
  }, [tabsContainerRef]);

  return memoFooterBarTabs.length > 0 ? (
    <Box
      ref={tabsContainerRef as MutableRefObject<HTMLDivElement>}
      sx={sxClasses.tabsContainer}
      className="tabsContainer"
      id={`${mapId}-tabsContainer`}
    >
      <Tabs
        shellContainer={shellContainer}
        activeTrap={activeTrapGeoView}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onSelectedTabChanged={handleSelectedTabChanged}
        onOpenKeyboard={enableFocusTrap}
        onCloseKeyboard={disableFocusTrap}
        selectedTab={memoFooterBarTabs.findIndex((t) => t.id === selectedTab)}
        tabProps={{ disableRipple: true }}
        tabs={memoFooterBarTabs}
        TabContentVisibilty={!isCollapsed ? 'visible' : 'hidden'}
        containerType={CONTAINER_TYPE.FOOTER_BAR}
        rightButtons={!isCollapsed && isMapFullScreen && <ResizeFooterPanel />}
        sideAppSize={mapSize}
        appHeight={appHeight}
        hiddenTabs={hiddenTabs}
        isFullScreen={isMapFullScreen}
      />
    </Box>
  ) : null;
}
