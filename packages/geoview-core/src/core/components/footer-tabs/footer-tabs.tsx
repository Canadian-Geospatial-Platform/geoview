import { MutableRefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';
import makeStyles from '@mui/styles/makeStyles';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event-types';
import { FooterTabPayload, payloadIsAFooterTab } from '../../../api/events/payloads/footer-tab-payload';

import { ExpandLessIcon, ExpandMoreIcon, FullscreenIcon, FullscreenExitIcon, IconButton, Tabs, TypeTabs } from '../../../ui';

export const useStyles = makeStyles((theme) => ({
  tabsContainer: {
    position: 'relative',
    backgroundColor: theme.palette.background.default,
    width: '100%',
    transition: 'height 0.2s ease-out',
  },
}));
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

  const classes = useStyles();

  const mapConfig = useContext(MapContext);

  const tabsContainerRef = useRef<HTMLDivElement>();

  const { mapId } = mapConfig;

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

  /**
   * Handle a collapse, expand event for the tabs component
   */
  const handleCollapse = () => {
    // check if tabs component is created
    if (tabsContainerRef && tabsContainerRef.current) {
      const tabsContainer = tabsContainerRef.current as HTMLDivElement;
      const mapContainer = tabsContainer.previousElementSibling as HTMLDivElement;
      mapContainer.style.transition = 'height 0.2s ease-out';
      // check if the tabs container is collapsed
      if (!isCollapsed) {
        tabsContainer.style.height = '55px';
        mapContainer.style.height = 'calc( 100% - 55px)';
      } else {
        tabsContainer.style.height = '300px';
        mapContainer.style.height = 'calc( 100% - 300px)';
      }
    }
    setIsFullscreen(false);
    setIsCollapsed(!isCollapsed);

    // update map container size
    setTimeout(() => {
      api.map(mapId).map.updateSize();
    }, 1000);
  };

  const handleFullscreen = () => {
    // check if tabs component is created
    if (tabsContainerRef && tabsContainerRef.current) {
      const tabsContaine = tabsContainerRef.current as HTMLDivElement;
      const mapContaine = tabsContaine.previousElementSibling as HTMLDivElement;
      mapContaine.style.transition = 'height 0.2s ease-out';
      // check if the tabs container is collapsed
      if (isFullscreen) {
        // eslint-disable-next-line no-lonely-if
        tabsContaine.style.height = '300px';
        mapContaine.style.height = 'calc( 100% - 300px)';
        setIsCollapsed(false);
      } else {
        tabsContaine.style.height = '100%';
        mapContaine.style.height = '0';
      }
    }

    setIsFullscreen(!isFullscreen);

    // update map container size
    setTimeout(() => {
      api.map(mapId).map.updateSize();
    }, 1500);
  };

  useEffect(() => {
    // listen to new tab creation
    api.event.on(
      EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_CREATE,
      (payload) => {
        if (payloadIsAFooterTab(payload)) {
          if (payload.handlerName && payload.handlerName === mapId) {
            addTab(payload);
            // Check if footer-panel is collapsed or not, and size accordingly
            if (tabsContainerRef && tabsContainerRef.current) {
              const tabsContainer = tabsContainerRef.current as HTMLDivElement;
              const mapContainer = tabsContainer.previousElementSibling as HTMLDivElement;
              if (mapContainer.style.height === 'calc(100% - 300px)') {
                setIsCollapsed(false);
                tabsContainer.style.height = '300px';
              } else {
                tabsContainer.style.height = '55px';
              }
            }
          }
        }
      },
      mapId
    );

    // listen on tab removal
    api.event.on(
      EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_REMOVE,
      (payload) => {
        if (payloadIsAFooterTab(payload)) {
          if (payload.handlerName && payload.handlerName === mapId) {
            removeTab(payload);
          }
        }
      },
      mapId
    );

    // listen for tab selection
    api.event.on(
      EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_SELECT,
      (payload) => {
        if (payloadIsAFooterTab(payload)) {
          if (payload.handlerName && payload.handlerName === mapId) {
            // for details tab, extand the tab
            if (payload.tab.value === 1) {
              handleCollapse();
            }
            setSelectedTab(undefined); // this will always trigger the tab change, needed in case user changes selection
            setSelectedTab(payload.tab.value);
          }
        }
      },
      mapId
    );
    return () => {
      api.event.off(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_CREATE, mapId);
      api.event.off(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_REMOVE, mapId);
      api.event.off(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_SELECT, mapId);
    };
  }, [addTab, mapId, removeTab]);

  return api.map(mapId).footerTabs.tabs.length > 0 ? (
    <div ref={tabsContainerRef as MutableRefObject<HTMLDivElement>} className={classes.tabsContainer}>
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
        rightButtons={
          <>
            {!isFullscreen && <IconButton onClick={handleCollapse}>{!isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}</IconButton>}
            <IconButton onClick={handleFullscreen}>{isFullscreen ? <FullscreenExitIcon /> : <FullscreenIcon />}</IconButton>
          </>
        }
      />
    </div>
  ) : null;
}
function componentDidMount() {
  throw new Error('Function not implemented.');
}
