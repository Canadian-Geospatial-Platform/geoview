import { MutableRefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useTheme } from '@mui/material/styles';
import { Box, IconButton, Tabs, TypeTabs, MoveDownRoundedIcon, MoveUpRoundedIcon } from '@/ui';
import { api, useGeoViewMapId } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';
import { FooterTabPayload, PayloadBaseClass, payloadIsAFooterTab } from '@/api/events/payloads';
import { getSxClasses } from './footer-tabs-style';
import { ResizeFooterPanel } from '../resize-footer-panel/resize-footer-panel';
import { useAppFullscreenActive } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useUIFooterPanelResizeValue, useUIFooterPanelResizeValues } from '@/core/stores/store-interface-and-intial-values/ui-state';

interface MapContainerCssProperties {
  mapVisibility: string;
  mapMinHeight: number;
  mapHeight: number;
  tabMinHeight: number | string;
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
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isFocusToMap, setIsFocusToMap] = useState<boolean>(true);

  const tabsContainerRef = useRef<HTMLDivElement>();
  const mapContainerRef = useRef<HTMLElement | null>(null);

  // get map div and follow state of original map height
  const mapDiv = document.getElementById(mapId)!;
  const [origHeight, setOrigHeight] = useState<number>(0);

  const isMapFullScreen = useAppFullscreenActive();
  const footerPanelResizeValue = useUIFooterPanelResizeValue();
  const footerPanelResizeValues = useUIFooterPanelResizeValues();

  /**
   * Calculate resize values from popover values defined in store.
   */
  const resizeValues = useMemo(() => {
    return footerPanelResizeValues.reduce((acc, curr) => {
      const windowHeight = window.screen.height;
      let values: [string, number, number, number | string, number] = [
        'visible',
        windowHeight - (windowHeight * footerPanelResizeValue) / 100,
        windowHeight - (windowHeight * footerPanelResizeValue) / 100,
        origHeight,
        (windowHeight * footerPanelResizeValue) / 100,
      ];

      if (curr === 10) {
        values = ['visible', origHeight, origHeight, '', windowHeight - origHeight];
      } else if (curr === 100) {
        values = ['hidden', 0, 0, '', windowHeight];
      }

      acc[curr] = {
        mapVisibility: values[0],
        mapMinHeight: values[1],
        mapHeight: values[2],
        tabMinHeight: values[3],
        tabMaxHeight: values[4],
      };
      return acc;
    }, {} as Record<number, MapContainerCssProperties>);
  }, [origHeight, footerPanelResizeValue, footerPanelResizeValues]);

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
        lastChild.style.overflow = isCollapsed ? 'unset' : 'auto';
        lastChild.style.maxHeight = isCollapsed ? '0px' : `${origHeight}px`;
      }
    }
  }, [isCollapsed, mapDiv, origHeight]);

  // TODO: need a refactor to use proper sx classes and style.
  // TODO: maybe this component should all be in the package-footer-panel.
  // !https://github.com/Canadian-Geospatial-Platform/geoview/issues/1136

  useEffect(() => {
    // Update the height of mapContainer and footer tabs Container based on resize value in store.
    mapContainerRef.current = mapDiv.querySelector('.mapContainer');
    if (tabsContainerRef.current && mapContainerRef.current) {
      const { mapVisibility, mapHeight, mapMinHeight, tabMaxHeight } = resizeValues[footerPanelResizeValue];

      mapContainerRef.current.style.visibility = mapVisibility;
      mapContainerRef.current.style.minHeight = `${mapMinHeight}px`;
      mapContainerRef.current.style.height = `${mapHeight}px`;

      const lastChild = tabsContainerRef.current.firstElementChild?.lastElementChild as HTMLElement | null;
      const firstChild = tabsContainerRef.current.firstElementChild?.firstElementChild as HTMLElement | null;
      if (lastChild && firstChild) {
        const height = tabMaxHeight - firstChild.clientHeight;
        lastChild.style.height = `${height}px`;
        lastChild.style.maxHeight = `${height}px`;
        // reset the height of the footer tab panel after comes out of fullscreen.
        if (!isMapFullScreen) {
          lastChild.style.maxHeight = `${origHeight}px`;
          lastChild.style.height = `${origHeight}px`;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapFullScreen, footerPanelResizeValue]);

  /**
   * Handle a collapse, expand event for the tabs component
   */
  const handleCollapse = () => {
    setIsFullscreen(false);
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

  return api.maps[mapId].footerTabs.tabs.length > 0 ? (
    <Box ref={tabsContainerRef as MutableRefObject<HTMLDivElement>} sx={sxClasses.tabsContainer} className="tabsContainer">
      <Tabs
        isCollapsed={isCollapsed}
        handleCollapse={handleCollapse}
        selectedTab={selectedTab}
        tabsProps={{ variant: 'scrollable' }}
        tabs={footerTabs.map((tab) => {
          return {
            ...tab,
          };
        })}
        TabContentVisibilty={!isCollapsed ? 'visible' : 'hidden'}
        rightButtons={
          <>
            {!isCollapsed && <ResizeFooterPanel />}
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
