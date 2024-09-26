import { MutableRefObject, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { camelCase } from 'lodash';
import { useTheme } from '@mui/material/styles';

import { Box, IconButton, Tabs, TypeTabs, MoveDownRoundedIcon, MoveUpRoundedIcon } from '@/ui';
import { Plugin } from '@/api/plugin/plugin';
import { getSxClasses } from './footer-bar-style';
import { ResizeFooterPanel } from '@/core/components/resize-footer-panel/resize-footer-panel';
import { useAppFullscreenActive, useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useDetailsLayerDataArrayBatch } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  useUIActiveFooterBarTabId,
  useUIFooterPanelResizeValue,
  useUIFooterPanelResizeValues,
  useUIStoreActions,
  useUIActiveTrapGeoView,
  useUIFooterBarIsCollapsed,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { FooterBarApi, FooterTabCreatedEvent, FooterTabRemovedEvent } from '@/core/components';

import { toJsonObject, TypeJsonObject, TypeJsonValue } from '@/core/types/global-types';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';

// default tabs icon and class
import { HubOutlinedIcon, InfoOutlinedIcon, LayersOutlinedIcon, StorageIcon, QuestionMarkIcon } from '@/ui/icons';
import { Legend } from '@/core/components/legend/legend';
import { LayersPanel } from '@/core/components/layers/layers-panel';
import { DetailsPanel } from '@/core/components/details/details-panel';
import { Datapanel } from '@/core/components/data-table/data-panel';
import { logger } from '@/core/utils/logger';
import { GuidePanel } from '@/core/components/guide/guide-panel';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';
import { TypeRecordOfPlugin } from '@/api/plugin/plugin-types';
import { CONTAINER_TYPE } from '@/core/utils/constant';

interface Tab {
  icon: ReactNode;
  content: ReactNode;
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

  const { api: footerBarApi } = props;

  const mapId = useGeoViewMapId();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const [isFocusToMap, setIsFocusToMap] = useState<boolean>(true);

  const tabsContainerRef = useRef<HTMLDivElement>();

  // get store values and actions
  const isMapFullScreen = useAppFullscreenActive();
  const arrayOfLayerDataBatch = useDetailsLayerDataArrayBatch();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const footerPanelResizeValues = useUIFooterPanelResizeValues();
  const selectedTab = useUIActiveFooterBarTabId();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const isCollapsed = useUIFooterBarIsCollapsed();
  const geoviewElement = useAppGeoviewHTMLElement();
  const shellContainer = geoviewElement.querySelector(`[id^="shell-${mapId}"]`) as HTMLElement;

  const { setFooterPanelResizeValue, setActiveFooterBarTab, enableFocusTrap, disableFocusTrap, setFooterBarIsCollapsed } =
    useUIStoreActions();

  // get store config for footer bar tabs to add (similar logic as in app-bar)
  const footerBarTabsConfig = useGeoViewConfig()?.footerBar;

  const memoFooterBarTabKeys = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - memoFooterBarTabKeys', footerBarTabsConfig?.tabs?.core);

    return (footerBarTabsConfig?.tabs?.core ?? []).reduce((acc, curr) => {
      acc[curr] = {} as Tab;
      return acc;
    }, {} as Record<string, Tab>);
  }, [footerBarTabsConfig?.tabs?.core]);

  // List of Footer Tabs created from config file.
  const [tabsList, setTabsList] = useState<Record<string, Tab>>(memoFooterBarTabKeys);

  // Panels for each tab in footer config file.
  const memoTabs = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - memoTabs');

    return {
      legend: { icon: <HubOutlinedIcon />, content: <Legend /> },
      layers: { icon: <LayersOutlinedIcon />, content: <LayersPanel /> },
      details: { icon: <InfoOutlinedIcon />, content: <DetailsPanel /> },
      'data-table': { icon: <StorageIcon />, content: <Datapanel /> },
      guide: { icon: <QuestionMarkIcon />, content: <GuidePanel /> },
    } as Record<string, Tab>;
  }, []);

  // Map the panels with footer bar tab keys.
  const memoFooterBarTabs = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - memoFooterBarTabs', tabsList, memoTabs);

    const allTabs = { ...tabsList, ...memoTabs };
    // inject guide tab at last position of tabs.
    return Object.keys({ ...tabsList, ...{ guide: {} } }).map((tab, index) => {
      return {
        id: `${mapId}-${tab}${index}`,
        value: index,
        label: `${camelCase(tab)}.title`,
        icon: allTabs[tab]?.icon ?? '',
        content: allTabs[tab]?.content ?? '',
      } as TypeTabs;
    });
  }, [memoTabs, tabsList, mapId]);

  /**
   * Calculate resize values from popover values defined in store.
   */
  const memoTabHeight = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - memoResizeValues', footerPanelResizeValue, footerPanelResizeValues);

    return footerPanelResizeValues.reduce((acc, curr) => {
      const windowHeight = window.screen.height;
      let tabHeight = windowHeight - (windowHeight * footerPanelResizeValue) / 100;

      if (curr === footerPanelResizeValues[0]) {
        tabHeight = (windowHeight * footerPanelResizeValue) / 100;
      }
      if (curr === footerPanelResizeValues[footerPanelResizeValues.length - 1]) {
        tabHeight = windowHeight;
      }

      acc[curr] = tabHeight;
      return acc;
    }, {} as Record<number, number>);
  }, [footerPanelResizeValue, footerPanelResizeValues]);

  /**
   * Add a tab
   */
  const handleAddTab = useCallback((sender: FooterBarApi, event: FooterTabCreatedEvent) => {
    // Log
    logger.logTraceUseCallback('FOOTER-BAR - handleAddTab', event);
    const newTab = { [event.tab.id]: { icon: event.tab.icon, content: event.tab.content } } as Record<string, Tab>;

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
    if (selectedTab === 'details' && isCollapsed) {
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
      .catch((error) => {
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
   * Update footer panel height when switch to fullscreen
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-TABS - isMapFullScreen', isMapFullScreen, isCollapsed);

    if (isMapFullScreen && tabsContainerRef.current && !isCollapsed) {
      const tabHeight = memoTabHeight[footerPanelResizeValue];
      tabsContainerRef.current.style.height = `${tabHeight}px`;
    }

    if (!isMapFullScreen && tabsContainerRef.current) {
      tabsContainerRef.current.style.height = 'fit-content';
      setFooterPanelResizeValue(footerPanelResizeValues[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapFullScreen, footerPanelResizeValue, memoTabHeight, isCollapsed]);

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
          ).catch((error) => {
            // Log
            logger.logPromiseFailed('api.plugin.addPlugin(time-slider) in useEffect in FooterBar', error);
          });
        })
        .catch((error) => {
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
          ).catch((error) => {
            // Log
            logger.logPromiseFailed('api.plugin.addPlugin(geochart) in useEffect in FooterBar', error);
          });
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('api.plugin.loadScript(geochart) in useEffect in FooterBar', error);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footerBarTabsConfig, mapId]);

  // Handle focus using dynamic focus button
  const handleDynamicFocus = useCallback((): void => {
    // Log
    logger.logTraceUseCallback('FOOTER BAR - handleDynamicFocus', isFocusToMap, mapId);

    const shell = document.getElementById(`shell-${mapId}`);
    const block = isFocusToMap ? 'start' : 'end';
    shell?.scrollIntoView({ behavior: 'smooth', block });
    setIsFocusToMap(!isFocusToMap);
  }, [isFocusToMap, mapId]);

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
        rightButtons={
          <>
            {!isCollapsed && isMapFullScreen && <ResizeFooterPanel />}
            <IconButton
              onClick={handleDynamicFocus}
              tooltip={isFocusToMap ? 'footerBar.focusToMap' : 'footerBar.focusToFooter'}
              className="buttonFilled"
              disabled={
                isCollapsed || isMapFullScreen || footerPanelResizeValues[footerPanelResizeValues.length - 1] === footerPanelResizeValue
              }
            >
              {isFocusToMap ? <MoveUpRoundedIcon /> : <MoveDownRoundedIcon />}
            </IconButton>
          </>
        }
      />
    </Box>
  ) : null;
}
