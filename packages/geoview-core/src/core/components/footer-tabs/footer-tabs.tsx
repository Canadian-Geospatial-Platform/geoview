import { MutableRefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { Box, useTheme } from '@mui/material';

import { MapContext } from '@/core/app-start';
import { api } from '@/app';

import { EVENT_NAMES } from '@/api/events/event-types';
import { FooterTabPayload, PayloadBaseClass, payloadIsAFooterTab } from '@/api/events/payloads';

import {
  ExpandLessIcon,
  ExpandMoreIcon,
  FullscreenIcon,
  FullscreenExitIcon,
  IconButton,
  Tabs,
  TypeTabs,
  MoveDownRoundedIcon,
  MoveUpRoundedIcon,
  ArrowUpIcon,
} from '@/ui';
import { getSxClasses } from './footer-tabs-style';

/**
 * The FooterTabs component is used to display a list of tabs and their content.
 *
 * @returns {JSX.Element} returns the Footer Tabs component
 */
export function FooterTabs(): JSX.Element | null {
  const [selectedTab, setSelectedTab] = useState<number | undefined>();
  const [footerTabs, setFooterTabs] = useState<TypeTabs[]>([]);
  const [isCollapsed, setIsCollapsed] = useState(true);

  const [isFullscreen, setIsFullscreen] = useState(false);
  // TODO We might need to refactor code below based on the best solution, issue #1448
  const [isFocusToMap, setIsFocusToMap] = useState<boolean>(true);

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const mapConfig = useContext(MapContext);
  const tabsContainerRef = useRef<HTMLDivElement>();

  const { mapId } = mapConfig;

  // get map div and follow state of original map height
  const mapDiv = document.getElementById(mapId)!;
  const [origHeight, setOrigHeight] = useState<number>(0);

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
    (mapDiv.querySelectorAll('[class*="mapContainer"]')[0] as HTMLElement).style.minHeight = `${origHeight}px`;

    // tabs container div
    const tabs = mapDiv.querySelectorAll('[class*="tabsContainer"]') as NodeListOf<HTMLElement>;
    if (tabs.length > 0) {
      const tab: HTMLElement = tabs[0];
      tab.style.height = 'fit-content';
      (tab.firstChild!.lastChild! as HTMLElement).style.overflow = isCollapsed ? 'unset' : 'auto';
      (tab.firstChild!.lastChild! as HTMLElement).style.maxHeight = isCollapsed ? '0px' : `${origHeight}px`;
    }
  }, [isCollapsed, mapDiv, mapDiv.style, origHeight]);

  // TODO: need a refactor to use proper sx classes and style.
  // TODO: maybe this component should all be in the package-footer-panel.
  // !https://github.com/Canadian-Geospatial-Platform/geoview/issues/1136
  /**
   * Handle the fullscreen state effect
   */
  useEffect(() => {
    // ol map container div
    const olMapDiv: HTMLElement = mapDiv.querySelectorAll('[class*="mapContainer"]')[0] as HTMLElement;
    olMapDiv.style.visibility = isFullscreen ? 'hidden' : 'visible';
    olMapDiv.style.minHeight = isFullscreen ? '0px' : `${origHeight}px`;
    olMapDiv.style.height = isFullscreen ? '0px' : `${origHeight}px`;

    // tabs container div
    if (isFullscreen) setIsCollapsed(false);
    const tabs = mapDiv.querySelectorAll('[class*="tabsContainer"]') as NodeListOf<HTMLElement>;

    if (tabs.length > 0) {
      const tab: HTMLElement = tabs[0];
      tab.style.minHeight = isFullscreen ? `${2 * origHeight}px` : '';
      (tab.firstChild!.lastChild! as HTMLElement).style.maxHeight = isFullscreen ? '' : `${origHeight}px`;
    }
  }, [isFullscreen, mapDiv, origHeight]);

  /**
   * Handle a collapse, expand event for the tabs component
   */
  const handleCollapse = () => {
    setIsFullscreen(false);
    setIsCollapsed(!isCollapsed);
  };

  const eventFooterTabsCreateListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFooterTab(payload)) addTab(payload);
  };

  const eventFooterTabsRemoveListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFooterTab(payload)) removeTab(payload);
  };

  const eventFooterTabsSelectListenerFunction = (payload: PayloadBaseClass) => {
    if (payloadIsAFooterTab(payload)) {
      // for details tab, extand the tab
      if (payload.tab.value === 1) {
        handleCollapse();
      }
      setSelectedTab(undefined); // this will always trigger the tab change, needed in case user changes selection
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
  // TODO We might need to refactor code below based on the best solution, issue #1448
  const handleFocus = () => {
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
        const focusButtonId = document.getElementById(`focuseToMap${mapId}`);
        if (focusButtonId) {
          const yOffset = -30;
          const targetY = focusButtonId.getBoundingClientRect().top + window.pageYOffset + yOffset;

          window.scrollTo({
            top: targetY,
            behavior: 'smooth',
          });
        }

        setIsFocusToMap(true);
      }
    }
  };

  // TODO We might need to refactor code below based on the best solution, issue #1448
  // Move to top of the given map Id
  const moveToMap = () => {
    const mapIdDiv = document.getElementById(mapId);
    if (mapIdDiv) {
      const offsetTop = mapIdDiv.offsetTop - 30;
      window.scrollTo({
        top: offsetTop,
        behavior: 'smooth',
      });
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
            {!isCollapsed && (
              <IconButton onClick={() => setIsFullscreen(!isFullscreen)}>
                {isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}
              </IconButton>
            )}
            {!isFullscreen && <IconButton onClick={handleCollapse}>{!isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}</IconButton>}
            {isFocusToMap ? (
              <IconButton onClick={handleFocus} tooltip="Focus to map">
                <MoveUpRoundedIcon />
              </IconButton>
            ) : (
              <IconButton onClick={handleFocus} tooltip="Focus to footer">
                <MoveDownRoundedIcon />
              </IconButton>
            )}
            {/* // TODO We might need to refactor code below based on the best solution, issue #1448 */}
            <IconButton onClick={moveToMap} tooltip="Focus to map">
              <ArrowUpIcon />
            </IconButton>
          </>
        }
      />
    </Box>
  ) : null;
}
