/* eslint-disable no-param-reassign */
import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { useTheme } from '@mui/material/styles';

import { Box, IconButton, Tabs, TypeTabs, MoveDownRoundedIcon, MoveUpRoundedIcon } from '@/ui';
import { api, useGeoViewMapId } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { FooterTabPayload, PayloadBaseClass, payloadIsAFooterTab } from '@/api/events/payloads';
import { getSxClasses } from './footer-tabs-style';
import { ResizeFooterPanel } from '../resize-footer-panel/resize-footer-panel';
import { useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  useUIFooterPanelResizeValue,
  useUIFooterPanelResizeValues,
  useUIStoreActions,
} from '@/core/stores/store-interface-and-intial-values/ui-state';

import { toJsonObject, TypeJsonObject, TypeJsonValue } from '@/core/types/global-types';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { useGeoViewConfig } from '@/core/stores/geoview-store';

// default tabs icon and class
import { HubOutlinedIcon, InfoOutlinedIcon, LayersOutlinedIcon, StorageIcon } from '@/ui/icons';
import { Legend } from '@/core/components/legend/legend';
import { LayersPanel } from '@/core/components/layers/layers-panel';
import { DetailsPanel } from '@/core/components/details/details-panel';

interface ShellContainerCssProperties {
  mapVisibility: string;
  mapHeight: number;
  tabHeight: number | string;
  tabMaxHeight: number;
}

/**
 * The FooterTabs component is used to display a list of tabs and their content.
 *
 * @returns {JSX.Element} returns the Footer Tabs component
 */
export function FooterTabs(): JSX.Element | null {
  const mapId = useGeoViewMapId();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [selectedTab, setSelectedTab] = useState<number | undefined>();
  const [footerTabs, setFooterTabs] = useState<TypeTabs[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isFocusToMap, setIsFocusToMap] = useState<boolean>(true);
  const [table, setTable] = useState<JSX.Element | undefined>();

  const tabsContainerRef = useRef<HTMLDivElement>();
  const mapContainerRef = useRef<HTMLElement | null>(null);

  // get map div and follow state of original map height
  const mapDiv = document.getElementById(mapId)!;
  const [origHeight, setOrigHeight] = useState<number>(0);

  const isMapFullScreen = useAppFullscreenActive();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const footerPanelResizeValues = useUIFooterPanelResizeValues();
  const { setFooterPanelResizeValue } = useUIStoreActions();

  // get store config for footer tabs to add
  const footerTabsConfig = useGeoViewConfig()?.footerTabs;

  /**
   * Calculate resize values from popover values defined in store.
   */
  const resizeValues = useMemo(() => {
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
  const addTab = useCallback((payload: FooterTabPayload) => {
    // push the tab to the end of the list
    setFooterTabs((prevArray) => [...prevArray, payload.tab as TypeTabs]);
  }, []);

  /**
   * Remove a tab
   */
  const removeTab = useCallback(
    (payload: FooterTabPayload) => {
      // remove the tab from the list
      setFooterTabs((prevState) => {
        const state = [...prevState];
        const index = state.findIndex((tab) => tab.value === payload.tab.value);
        if (index > -1) {
          state.splice(index, 1);
          return state;
        }
        return state;
      });
    },
    [setFooterTabs]
  );

  // on map creation, get original height to set the foorter collapse/expand height
  useEffect(() => {
    setOrigHeight(mapDiv!.clientHeight + 55);
  }, [mapDiv]);

  // TODO: need a refactor to use proper sx classes and style
  // !https://github.com/Canadian-Geospatial-Platform/geoview/issues/1136
  /**
   * Handle the collapse/expand state effect
   */
  useEffect(() => {
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
  }, [isCollapsed, mapDiv, origHeight]);

  /**
   * Handle a collapse, expand event for the tabs component
   */
  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  const eventFooterTabsCreateListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFooterTab(payload)) addTab(payload);
    // select the first tab
    setSelectedTab(0);
    handleCollapse();
  };

  const eventFooterTabsRemoveListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFooterTab(payload)) removeTab(payload);
  };

  const eventFooterTabsSelectListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFooterTab(payload)) {
      // for details tab, extand the tab
      // TODO: there is a bug, I need to set another tab from cgpv before it works again
      // Try to add onChange event...
      if (payload.tab.id === 'details') {
        handleCollapse();
      }
      setSelectedTab(payload.tab.value);
    }
  };

  /**
   * Manage the tab 'create', 'remove' and 'select'
   */
  useEffect(() => {
    // listen to new tab creation
    api.event.on(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_CREATE, eventFooterTabsCreateListenerFunction, mapId);

    // listen on tab removal
    api.event.on(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_REMOVE, eventFooterTabsRemoveListenerFunction, mapId);

    // listen for tab selection
    api.event.on(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_SELECT, eventFooterTabsSelectListenerFunction, mapId);
    return () => {
      api.event.off(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_CREATE, mapId, eventFooterTabsCreateListenerFunction);
      api.event.off(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_REMOVE, mapId, eventFooterTabsRemoveListenerFunction);
      api.event.off(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_SELECT, mapId, eventFooterTabsSelectListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addTab, mapId, removeTab]);

  /**
   * Update map and footer panel height when switch to fullscreen
   */
  useEffect(() => {
    if (isMapFullScreen && tabsContainerRef.current && mapContainerRef.current && !isCollapsed) {
      const { mapVisibility, mapHeight, tabHeight } = resizeValues[footerPanelResizeValue];

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
  }, [isMapFullScreen, footerPanelResizeValue, resizeValues, isCollapsed]);

  /**
   * Update the map and footer panel height after footer panel is collapsed.
   */
  useEffect(() => {
    if (isMapFullScreen && isCollapsed && mapContainerRef.current && tabsContainerRef.current) {
      mapContainerRef.current.style.minHeight = `${window.screen.height - tabsContainerRef.current.clientHeight}px`;
      mapContainerRef.current.style.height = `${window.screen.height - tabsContainerRef.current.clientHeight}px`;
    }
  }, [isCollapsed, isMapFullScreen]);

  /**
   * Create default tabs from configuration parameters
   */
  useEffect(() => {
    if (footerTabsConfig && footerTabsConfig.tabs.core.includes('legend')) {
      // create new tab and add the Layers component to the footer tab
      const legendTab = {
        id: 'legend',
        value: 0,
        label: 'legend.title',
        icon: <HubOutlinedIcon />,
      };
      setFooterTabs((prevArray) => [...prevArray, legendTab as TypeTabs]);
    }

    if (footerTabsConfig && footerTabsConfig.tabs.core.includes('layers')) {
      // create new tab and add the Layers component to the footer tab
      const layersTab = {
        id: 'layers',
        value: 1,
        label: 'layers.title',
        icon: <LayersOutlinedIcon />,
      };
      setFooterTabs((prevArray) => [...prevArray, layersTab as TypeTabs]);
    }

    // create new tab and add the Details component to the footer tab
    if (footerTabsConfig && footerTabsConfig.tabs.core.includes('details')) {
      const detailsTab = {
        id: 'details',
        value: 2,
        label: 'details.title',
        icon: <InfoOutlinedIcon />,
      };
      setFooterTabs((prevArray) => [...prevArray, detailsTab as TypeTabs]);
    }

    if (footerTabsConfig && footerTabsConfig.tabs.core.includes('data-table')) {
      // create new tab and add the Data Table component to the footer tab
      api.maps[mapId].dataTable.createDataPanel().then((newTable) => {
        setTable(newTable);
        const tableTab = {
          id: 'data-table',
          value: 3,
          label: 'dataTable.title',
          icon: <StorageIcon />,
        };
        setFooterTabs((prevArray) => [...prevArray, tableTab as TypeTabs]);
      });
    }

    // Packages tab
    if (footerTabsConfig && footerTabsConfig.tabs.core.includes('time-slider')) {
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

    if (footerTabsConfig && footerTabsConfig.tabs.core.includes('geochart')) {
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
  }, []);

  // Handle focus using dynamic focus button
  const handleDynamicFocus = () => {
    const mapIdDiv = document.getElementById(mapId);

    if (mapIdDiv) {
      if (isFocusToMap) {
        // scroll to map
        window.scrollTo({
          top: mapIdDiv.offsetTop - 30,
          behavior: 'smooth',
        });
        setIsFocusToMap(false);
      } else {
        const focusButtonId = document.getElementById(`map-${mapId}`);
        if (focusButtonId) {
          const targetY = focusButtonId.getBoundingClientRect().bottom + window.pageYOffset - 70;
          // scroll to footer
          window.scrollTo({
            top: targetY,
            behavior: 'smooth',
          });
        }

        setIsFocusToMap(true);
      }
    }
  };

  return footerTabs.length > 0 ? (
    <Box
      ref={tabsContainerRef as MutableRefObject<HTMLDivElement>}
      sx={sxClasses.tabsContainer}
      className="tabsContainer"
      id="tabsContainer"
    >
      <Tabs
        isCollapsed={isCollapsed}
        handleCollapse={handleCollapse}
        selectedTab={selectedTab}
        tabsProps={{ variant: 'scrollable' }}
        tabs={footerTabs.map((tab) => {
          if (tab.id === 'legend') tab.content = <Legend />;
          if (tab.id === 'layers') tab.content = <LayersPanel />;
          if (tab.id === 'details') tab.content = <DetailsPanel />;
          if (tab.id === 'table') tab.content = table;

          return {
            ...tab,
          };
        })}
        TabContentVisibilty={!isCollapsed ? 'visible' : 'hidden'}
        rightButtons={
          <>
            {!isCollapsed && isMapFullScreen && <ResizeFooterPanel />}
            <IconButton
              onClick={handleDynamicFocus}
              tooltip={isFocusToMap ? 'footerTabsContainer.focusToMap' : 'footerTabsContainer.focusToFooter'}
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
