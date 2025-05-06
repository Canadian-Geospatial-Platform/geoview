import { MutableRefObject, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { camelCase } from 'lodash';
import { useTheme } from '@mui/material/styles';

import { Box, Tabs, TypeTabs } from '@/ui';
import { Plugin } from '@/api/plugin/plugin';
import { getSxClasses } from './footer-bar-style';
import { ResizeFooterPanel } from '@/core/components/footer-bar/hooks/resize-footer-panel';
import { useAppFullscreenActive, useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useDetailsLayerDataArrayBatch } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  useUIActiveFooterBarTabId,
  useUIFooterPanelResizeValue,
  useUIStoreActions,
  useUIActiveTrapGeoView,
  useUIFooterBarIsCollapsed,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { FooterBarApi, FooterTabCreatedEvent, FooterTabRemovedEvent } from '@/core/components';

import { toJsonObject, TypeJsonObject, TypeJsonValue } from '@/api/config/types/config-types';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';

// default tabs icon and class
import { LegendIcon, InfoOutlinedIcon, LayersOutlinedIcon, StorageIcon, QuestionMarkIcon } from '@/ui/icons';
import { Legend } from '@/core/components/legend/legend';
import { LayersPanel } from '@/core/components/layers/layers-panel';
import { DetailsPanel } from '@/core/components/details/details-panel';
import { Datapanel } from '@/core/components/data-table/data-panel';
import { logger } from '@/core/utils/logger';
import { Guide } from '@/core/components/guide/guide';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeRecordOfPlugin } from '@/api/plugin/plugin-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { isElementInViewport } from '@/core/utils/utilities';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';

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
  const sxClasses = useMemo(
    () => getSxClasses(theme, isMapFullScreen, footerPanelResizeValue),
    [theme, isMapFullScreen, footerPanelResizeValue]
  );

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

    // TODO: Use the indexValue coming from the tab to order so custom tab can be place anywhere
    // inject guide tab at last position of tabs.
    return Object.keys({ ...tabsList, ...{ guide: {} } }).map((tab, index) => {
      return {
        id: `${tab}`,
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
        content:
          typeof event.tab.content === 'string' ? <UseHtmlToReact htmlContent={(event.tab.content as string) ?? ''} /> : event.tab.content,
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

    // If we're on the details panel and the footer is collapsed
    if (selectedTab === `details` && isCollapsed) {
      // Uncollapse it
      setFooterBarIsCollapsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayOfLayerDataBatch, selectedTab]);
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
        lastChild.style.maxHeight = isCollapsed ? '0px' : '';
      }
    }
  }, [isCollapsed, setActiveFooterBarTab]);

  /**
   * Handle a collapse, expand event for the tabs component
   */
  const handleToggleCollapse = (): void => {
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
   * Add plugins
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR - selectedTab', selectedTab);

    // If clicked on a tab with a plugin
    MapEventProcessor.getMapViewerPlugins(mapId)
      .then((plugins) => {
        if (plugins[selectedTab as keyof TypeRecordOfPlugin]) {
          // Get the plugin
          const theSelectedPlugin = plugins[selectedTab];

          // A bit hacky, but not much other choice for now...
          if (typeof theSelectedPlugin.onSelected === 'function') {
            theSelectedPlugin.onSelected();
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
    // Packages tab
    if (footerBarTabsConfig && footerBarTabsConfig.tabs.core.includes('time-slider')) {
      // create a new tab by loading the time-slider plugin
      Plugin.loadScript('time-slider')
        .then((constructor: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue)) => {
          Plugin.addPlugin(
            'time-slider',
            mapId,
            constructor,
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
        .then((constructor: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue)) => {
          Plugin.addPlugin(
            'geochart',
            mapId,
            constructor,
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footerBarTabsConfig, mapId]);

  // Scroll the footer into view on mouse click
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER BAR - scrollIntoViewListener');

    if (!tabsContainerRef?.current) return () => {};

    const handleClick = (): void => {
      const behaviorScroll = (window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth') as ScrollBehavior;

      if (!isElementInViewport(tabsContainerRef.current!)) {
        tabsContainerRef.current?.scrollIntoView({
          behavior: behaviorScroll,
          block: 'center',
        });
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
      />
    </Box>
  ) : null;
}
