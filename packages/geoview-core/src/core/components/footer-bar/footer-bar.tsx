/* eslint-disable no-param-reassign */
import { MutableRefObject, ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { camelCase } from 'lodash';
import { useTheme } from '@mui/material/styles';

import { Box, IconButton, Tabs, TypeTabs, MoveDownRoundedIcon, MoveUpRoundedIcon } from '@/ui';
import { api, useGeoViewMapId } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { FooterBarPayload, PayloadBaseClass, payloadIsAFooterBar } from '@/api/events/payloads';
import { getSxClasses } from './footer-bar-style';
import { ResizeFooterPanel } from '../resize-footer-panel/resize-footer-panel';
import { useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import {
  useUIActiveFooterBarTabId,
  useUIFooterPanelResizeValue,
  useUIFooterPanelResizeValues,
  useUIStoreActions,
  useUIActiveTrapGeoView,
} from '@/core/stores/store-interface-and-intial-values/ui-state';

import { toJsonObject, TypeJsonObject, TypeJsonValue } from '@/core/types/global-types';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { useGeoViewConfig } from '@/core/stores/geoview-store';

// default tabs icon and class
import { HubOutlinedIcon, InfoOutlinedIcon, LayersOutlinedIcon, StorageIcon } from '@/ui/icons';
import { Legend } from '@/core/components/legend/legend';
import { LayersPanel } from '@/core/components/layers/layers-panel';
import { DetailsPanel } from '@/core/components/details/details-panel';
import { logger } from '@/core/utils/logger';

interface ShellContainerCssProperties {
  mapVisibility: string;
  mapHeight: number;
  tabHeight: number | string;
  tabMaxHeight: number;
}

/**
 * The FooterBar component is used to display a list of tabs and their content.
 *
 * @returns {JSX.Element} returns the FooterBar Tabs component
 */
export function FooterBar(): JSX.Element | null {
  // Log
  logger.logTraceRender('components/footer-bar/footer-bar');

  const mapId = useGeoViewMapId();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const [footerBarTabs, setFooterBarTabs] = useState<TypeTabs[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(false);

  const [isFocusToMap, setIsFocusToMap] = useState<boolean>(true);
  const [table, setTable] = useState<JSX.Element | undefined>();

  const tabsContainerRef = useRef<HTMLDivElement>();
  const mapContainerRef = useRef<HTMLElement | null>(null);

  // get map div and follow state of original map height
  const mapDiv = document.getElementById(mapId)!;
  const [origHeight, setOrigHeight] = useState<number>(0);

  // get store values and actions
  const isMapFullScreen = useAppFullscreenActive();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const footerPanelResizeValues = useUIFooterPanelResizeValues();
  const selectedTab = useUIActiveFooterBarTabId();
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const { setFooterPanelResizeValue, setActiveFooterBarTab, openModal, closeModal } = useUIStoreActions();

  // get store config for footer bar tabs to add (similar logic as in app-bar)
  const footerBarTabsConfig = useGeoViewConfig()?.footerBar;

  const tabs = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - tabs', table);

    return {
      legend: { icon: <HubOutlinedIcon />, content: <Legend /> },
      layers: { icon: <LayersOutlinedIcon />, content: <LayersPanel /> },
      details: { icon: <InfoOutlinedIcon />, content: <DetailsPanel /> },
      'data-table': { icon: <StorageIcon />, content: table },
    } as Record<string, Record<string, ReactNode>>;
  }, [table]);

  const defaultFooterBarTabs = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - defaultFooterBarTabs', footerBarTabs);

    return (footerBarTabsConfig?.tabs?.core ?? []).map((tab, index) => {
      return {
        id: tab,
        value: index,
        label: `${camelCase(tab)}.title`,
        icon: tabs[tab]?.icon ?? '',
        content: tabs[tab]?.content ?? '',
      };
    }) as TypeTabs[];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footerBarTabs]); // TODO: Investigate - shouldn't this be footerBarTabsConfig (and tabs?) instead of footerBarTabs?

  /**
   * Calculate resize values from popover values defined in store.
   */
  const resizeValues = useMemo(() => {
    // Log
    logger.logTraceUseMemo('FOOTER-BAR - resizeValues', footerPanelResizeValue, footerPanelResizeValues);

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
  const addTab = useCallback(
    (payload: FooterBarPayload) => {
      // Log
      logger.logTraceUseCallback('FOOTER-BAR - defaultFooterBarTabs', defaultFooterBarTabs);

      const idx = defaultFooterBarTabs.findIndex((tab) => tab.id === payload.tab.id);
      if (idx !== -1) {
        defaultFooterBarTabs[idx].content = payload.tab.content;
        defaultFooterBarTabs[idx].icon = payload.tab.icon;
        defaultFooterBarTabs[idx].label = payload.tab.label;
      } else {
        defaultFooterBarTabs.push(payload.tab);
      }
      setFooterBarTabs(defaultFooterBarTabs);
      // eslint-disable-next-line react-hooks/exhaustive-deps
    },
    [defaultFooterBarTabs]
  );

  /**
   * Remove a tab
   */
  const removeTab = useCallback(
    (payload: FooterBarPayload) => {
      // remove the tab from the list
      setFooterBarTabs((prevState) => {
        const state = [...prevState];
        const index = state.findIndex((tab) => tab.value === payload.tab.value);
        if (index > -1) {
          state.splice(index, 1);
          return state;
        }
        return state;
      });
    },
    [setFooterBarTabs]
  );

  // on map creation, get original height to set the foorter collapse/expand height
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-TABS - mapDiv');

    setOrigHeight(mapDiv!.clientHeight + 55);
  }, [mapDiv]); // ! Is a useEffect on a dom element recommented here? Consider using useRef?

  // TODO: need a refactor to use proper sx classes and style
  // !https://github.com/Canadian-Geospatial-Platform/geoview/issues/1136
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
  }, [isCollapsed, mapDiv, origHeight]); // ! Is a useEffect on a dom element recommented here? Consider using useRef?

  /**
   * Handle a collapse, expand event for the tabs component
   */
  const handleCollapse = () => {
    setIsCollapsed(!isCollapsed);
  };

  /**
   * Handles when the selected tab changes
   * @param tab The newly selected tab
   */
  const handleSelectedTabChanged = (tab: TypeTabs) => {
    setActiveFooterBarTab(tab.id);
  };

  const eventFooterBarCreateListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFooterBar(payload)) {
      addTab(payload);
    }
  };

  const eventFooterBarRemoveListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFooterBar(payload)) removeTab(payload);
  };

  useEffect(() => {
    // If clicked on a tab with a plugin
    if (api.maps[mapId].plugins[selectedTab]) {
      // Get the plugin
      const theSelectedPlugin = api.maps[mapId].plugins[selectedTab];

      // A bit hacky, but not much other choice for now...
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
    logger.logTraceUseEffect('FOOTER-BAR - addTab.removeTab', mapId);

    // listen to new tab creation
    api.event.on(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_CREATE, eventFooterBarCreateListenerFunction, mapId);

    // listen on tab removal
    api.event.on(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_REMOVE, eventFooterBarRemoveListenerFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_CREATE, mapId, eventFooterBarCreateListenerFunction);
      api.event.off(EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_REMOVE, mapId, eventFooterBarRemoveListenerFunction);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addTab, mapId, removeTab]);

  /**
   * Update map and footer panel height when switch to fullscreen
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('FOOTER-TABS - isMapFullScreen', isMapFullScreen, isCollapsed);

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
    logger.logTraceUseEffect('FOOTER-BAR - mount');

    if (footerBarTabsConfig && footerBarTabsConfig.tabs.core.includes('data-table')) {
      // create new tab and add the Data Table component to the footer tab
      // TODO: This will be refactor after new store for data table is implemented.
      // Right now `geoviewLayerInstance.getFeatureInfo('all', layer.layerKey);` is returning empty features, which leads to no table shown.
      api.maps[mapId].dataTable.createDataPanel().then((newTable) => {
        const tableTab = {
          id: 'data-table',
          value: 3,
          label: 'dataTable.title',
          icon: <StorageIcon />,
          content: newTable,
        };

        setTable(newTable);
        addTab({ tab: tableTab, event: EVENT_NAMES.FOOTERBAR.EVENT_FOOTERBAR_TAB_CREATE, handlerName: 'TABLE' });
      });
    }

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
    setFooterBarTabs(defaultFooterBarTabs!);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [footerBarTabsConfig, mapId]);

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

  return footerBarTabs.length > 0 ? (
    <Box
      ref={tabsContainerRef as MutableRefObject<HTMLDivElement>}
      sx={sxClasses.tabsContainer}
      className="tabsContainer"
      id="tabsContainer"
    >
      <Tabs
        activeTrap={activeTrapGeoView}
        isCollapsed={isCollapsed}
        onCollapse={handleCollapse}
        onSelectedTabChanged={handleSelectedTabChanged}
        onOpenKeyboard={openModal}
        onCloseKeyboard={closeModal}
        selectedTab={footerBarTabs.findIndex((t) => t.id === selectedTab)}
        tabsProps={{ variant: 'scrollable' }}
        tabs={footerBarTabs}
        TabContentVisibilty={!isCollapsed ? 'visible' : 'hidden'}
        rightButtons={
          <>
            {!isCollapsed && isMapFullScreen && <ResizeFooterPanel />}
            <IconButton
              onClick={handleDynamicFocus}
              tooltip={isFocusToMap ? 'footerBar.focusToMap' : 'footerBar.focusToFooter'}
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
