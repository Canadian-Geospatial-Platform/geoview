import { MutableRefObject, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { camelCase } from 'lodash';
import { useTheme } from '@mui/material/styles';

import { Box, IconButton, Tabs, TypeTabs, MoveDownRoundedIcon, MoveUpRoundedIcon } from '@/ui';
import { api } from '@/app';
import { getSxClasses } from './footer-bar-style';
import { ResizeFooterPanel } from '@/core/components/resize-footer-panel/resize-footer-panel';
import { useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useDetailsLayerDataArrayBatch } from '@/core/stores/store-interface-and-intial-values/feature-info-state';
import {
  useUIActiveFooterBarTabId,
  useUIFooterPanelResizeValue,
  useUIFooterPanelResizeValues,
  useUIStoreActions,
  useUIActiveTrapGeoView,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { FooterBarApi, FooterTabCreatedEvent, FooterTabRemovedEvent } from '@/core/components';

import { toJsonObject, TypeJsonObject, TypeJsonValue } from '@/core/types/global-types';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';

// default tabs icon and class
import { HubOutlinedIcon, InfoOutlinedIcon, LayersOutlinedIcon, StorageIcon, SchoolIcon } from '@/ui/icons';
import { Legend } from '@/core/components/legend/legend';
import { LayersPanel } from '@/core/components/layers/layers-panel';
import { DetailsPanel } from '@/core/components/details/details-panel';
import { Datapanel } from '@/core/components/data-table/data-panel';
import { logger } from '@/core/utils/logger';
import { GuidePanel } from '@/core/components/guide/guide-panel';

interface ShellContainerCssProperties {
  mapVisibility: string;
  mapHeight: number;
  tabHeight: number | string;
  tabMaxHeight: number;
}

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

  // internal state
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isFocusToMap, setIsFocusToMap] = useState<boolean>(true);

  const tabsContainerRef = useRef<HTMLDivElement>();
  const mapContainerRef = useRef<HTMLElement | null>(null);

  // get map div and follow state of original map height
  const mapDiv = document.getElementById(mapId)!;
  const [origHeight, setOrigHeight] = useState<number>(0);

  // get store values and actions
  const isMapFullScreen = useAppFullscreenActive();
  const arrayOfLayerDataBatch = useDetailsLayerDataArrayBatch();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const footerPanelResizeValues = useUIFooterPanelResizeValues();
  const selectedTab = useUIActiveFooterBarTabId();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const { setFooterPanelResizeValue, setActiveFooterBarTab, openModal, closeModal } = useUIStoreActions();

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
      guide: { icon: <SchoolIcon />, content: <GuidePanel /> },
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
        id: tab,
        value: index,
        label: `${camelCase(tab)}.title`,
        icon: allTabs[tab]?.icon ?? '',
        content: allTabs[tab]?.content ?? '',
      };
    }) as unknown as TypeTabs[];
  }, [memoTabs, tabsList]);

  /**
   * Calculate resize values from popover values defined in store.
   */
  const memoResizeValues = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - memoResizeValues', footerPanelResizeValue, footerPanelResizeValues);

    return footerPanelResizeValues.reduce((acc, curr) => {
      const windowHeight = window.screen.height;
      let values: [string, number, number | string, number] = [
        'visible',
        windowHeight - (windowHeight * footerPanelResizeValue) / 100,
        windowHeight - (windowHeight * footerPanelResizeValue) / 100,
        windowHeight - (windowHeight * footerPanelResizeValue) / 100,
      ];
      if (curr === footerPanelResizeValues[0]) {
        values = [
          'visible',
          windowHeight - (windowHeight * footerPanelResizeValue) / 100,
          (windowHeight * footerPanelResizeValue) / 100,
          (windowHeight * footerPanelResizeValue) / 100,
        ];
      }
      if (curr === footerPanelResizeValues[footerPanelResizeValues.length - 1]) {
        values = ['hidden', 0, windowHeight, windowHeight];
      }

      acc[curr] = {
        mapVisibility: values[0],
        mapHeight: values[1],
        tabHeight: values[2],
        tabMaxHeight: values[3],
      };
      return acc;
    }, {} as Record<number, ShellContainerCssProperties>);
  }, [footerPanelResizeValue, footerPanelResizeValues]);

  /**
   * Add a tab
   */
  const handleAddTab = useCallback(
    (sender: FooterBarApi, event: FooterTabCreatedEvent) => {
      // Log
      logger.logTraceUseCallback('FOOTER-BAR - handleAddTab', event);

      const newTab = { [event.tab.id]: { icon: event.tab.icon, content: event.tab.content } } as Record<string, Tab>;
      setTabsList({ ...tabsList, ...newTab });
    },
    [tabsList]
  );

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

  // on map creation, get original height to set the foorter collapse/expand height
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-TABS - mapDiv');

    setOrigHeight(mapDiv!.clientHeight + 55);
  }, [mapDiv]); // GV Is a useEffect on a dom element recommented here? Consider using useRef?

  /**
   * Whenever the array layer data batch changes if we're on 'details' tab and it's collapsed, make sure we uncollapse it
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-TABS - arrayOfLayerDataBatch', arrayOfLayerDataBatch, selectedTab, isCollapsed);

    // If we're on the details panel and the footer is collapsed
    if (selectedTab === 'details' && isCollapsed) {
      // Uncollapse it
      setIsCollapsed(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrayOfLayerDataBatch, selectedTab]);
  // Don't add isCollapsed in the dependency array, because it'll retrigger the useEffect

  // TODO: need a refactor to use proper sx classes and style
  // GV https://github.com/Canadian-Geospatial-Platform/geoview/issues/1136
  /**
   * Handle the collapse/expand state effect
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR - isCollapsed.mapDiv.origHeight', isCollapsed);

    // map div
    mapDiv.style.height = 'fit-content';
    mapDiv.style.transition = 'height 0.2s ease-out 0.2s';

    // ol map container div
    mapContainerRef.current = mapDiv.querySelector('.mapContainer') as HTMLElement | null;
    if (mapContainerRef.current) {
      mapContainerRef.current.style.visibility = 'visible';
      mapContainerRef.current.style.minHeight = `${origHeight}px`;
      mapContainerRef.current.style.height = `${origHeight}px`;
    }

    // tabs container div
    const tabsContainers = mapDiv.querySelectorAll('.tabsContainer') as NodeListOf<HTMLElement>;
    if (tabsContainers.length > 0) {
      const tabsContainer = tabsContainers[0];
      tabsContainer.style.height = 'fit-content';
      const lastChild = tabsContainer.firstElementChild?.lastElementChild as HTMLElement | null;
      if (lastChild) {
        lastChild.style.overflow = isCollapsed ? 'unset' : '';
        lastChild.style.maxHeight = isCollapsed ? '0px' : '';
      }
    }
  }, [isCollapsed, mapDiv, origHeight]); // GV Is a useEffect on a dom element recommented here? Consider using useRef?

  /**
   * Handle a collapse, expand event for the tabs component
   */
  const handleToggleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  /**
   * Handles when the selected tab changes
   * @param tab The newly selected tab
   */
  const handleSelectedTabChanged = (tab: TypeTabs) => {
    setActiveFooterBarTab(tab.id);
  };

  useEffect(() => {
    // If clicked on a tab with a plugin
    if (api.maps[mapId].plugins[selectedTab]) {
      // Get the plugin
      const theSelectedPlugin = api.maps[mapId].plugins[selectedTab];

      // A bit hacky, but not much other choice for now...
      // ? unknown type cannot be use, need to escape
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (typeof (theSelectedPlugin as any).onSelected === 'function') {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (theSelectedPlugin as any).onSelected();
      }
    }
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
   * Update map and footer panel height when switch to fullscreen
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-TABS - isMapFullScreen', isMapFullScreen, isCollapsed);

    if (isMapFullScreen && tabsContainerRef.current && mapContainerRef.current && !isCollapsed) {
      const { mapVisibility, mapHeight, tabHeight } = memoResizeValues[footerPanelResizeValue];

      // #region i have set the map height and tabCOnatiner height.
      mapContainerRef.current.style.visibility = mapVisibility;
      mapContainerRef.current.style.minHeight = `${mapHeight}px`;
      mapContainerRef.current.style.height = `${mapHeight}px`;
      tabsContainerRef.current.style.height = typeof tabHeight === 'string' ? tabHeight : `${tabHeight}px`;
      // #endregion
    }
    if (!isMapFullScreen && tabsContainerRef.current && mapContainerRef.current) {
      mapContainerRef.current.style.visibility = 'visible';
      mapContainerRef.current.style.minHeight = `${origHeight}px`;
      mapContainerRef.current.style.height = `${origHeight}px`;
      tabsContainerRef.current.style.height = 'fit-content';
      setFooterPanelResizeValue(footerPanelResizeValues[0]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapFullScreen, footerPanelResizeValue, memoResizeValues, isCollapsed]);

  /**
   * Update the map and footer panel height after footer panel is collapsed.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-TABS - isCollapsed.isMapFullScreen', isCollapsed, isMapFullScreen);

    if (isMapFullScreen && isCollapsed && mapContainerRef.current && tabsContainerRef.current) {
      mapContainerRef.current.style.minHeight = `${window.screen.height - tabsContainerRef.current.clientHeight}px`;
      mapContainerRef.current.style.height = `${window.screen.height - tabsContainerRef.current.clientHeight}px`;
    }
  }, [isCollapsed, isMapFullScreen]);

  /**
   * Create default tabs from configuration parameters (similar logic as in app-bar).
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-BAR - footerBarTabsConfig');
    // Packages tab
    if (footerBarTabsConfig && footerBarTabsConfig.tabs.core.includes('time-slider')) {
      // create a new tab by loading the time-slider plugin
      api.plugin
        .loadScript('time-slider')
        .then((constructor: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue)) => {
          api.plugin.addPlugin(
            'time-slider',
            mapId,
            constructor,
            toJsonObject({
              mapId,
            })
          );
        });
    }

    if (footerBarTabsConfig && footerBarTabsConfig.tabs.core.includes('geochart')) {
      // create a new tab by loading the geo chart plugin
      api.plugin
        .loadScript('geochart')
        .then((constructor: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue)) => {
          api.plugin.addPlugin(
            'geochart',
            mapId,
            constructor,
            toJsonObject({
              mapId,
            })
          );
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footerBarTabsConfig, mapId]);

  // Handle focus using dynamic focus button
  const handleDynamicFocus = () => {
    const shell = document.getElementById(`shell-${mapId}`);
    const block = isFocusToMap ? 'start' : 'end';
    shell?.scrollIntoView({ behavior: 'smooth', block });
    setIsFocusToMap(!isFocusToMap);
  };

  return memoFooterBarTabs.length > 0 ? (
    <Box
      ref={tabsContainerRef as MutableRefObject<HTMLDivElement>}
      sx={sxClasses.tabsContainer}
      className="tabsContainer"
      id={`${mapId}-tabsContainer`}
    >
      <Tabs
        activeTrap={activeTrapGeoView}
        isCollapsed={isCollapsed}
        onToggleCollapse={handleToggleCollapse}
        onSelectedTabChanged={handleSelectedTabChanged}
        onOpenKeyboard={openModal}
        onCloseKeyboard={closeModal}
        selectedTab={memoFooterBarTabs.findIndex((t) => t.id === selectedTab)}
        tabsProps={{ variant: 'scrollable' }}
        tabs={memoFooterBarTabs}
        TabContentVisibilty={!isCollapsed ? 'visible' : 'hidden'}
        rightButtons={
          <>
            {!isCollapsed && isMapFullScreen && <ResizeFooterPanel />}
            <IconButton
              onClick={handleDynamicFocus}
              tooltip={isFocusToMap ? 'footerBar.focusToMap' : 'footerBar.focusToFooter'}
              className="style3"
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
