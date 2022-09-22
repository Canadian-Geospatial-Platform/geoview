import { MutableRefObject, useCallback, useContext, useEffect, useRef, useState } from 'react';

import makeStyles from '@mui/styles/makeStyles';

import { MapContext } from '../../app-start';
import { api } from '../../../app';

import { EVENT_NAMES } from '../../../api/events/event-types';
import { FooterTabPayload, payloadIsAFooterTab } from '../../../api/events/payloads/footer-tab-payload';

import { ExpandLessIcon, ExpandMoreIcon, IconButton, Tabs, TypeTabs } from '../../../ui';

export const useStyles = makeStyles((theme) => ({
  tabsContainer: {
    position: 'relative',
    paddingBottom: '50px',
    backgroundColor: theme.palette.primary.light,
    width: '100%',
    height: '400px',
    transition: 'height 0.2s ease-out',
  },
  collapseButton: {
    position: 'absolute',
    top: 5,
    right: 10,
  },
}));

/**
 * The FooterTabs component is used to display a list of tabs and their content.
 *
 * @returns {JSX.Element} returns the Footer Tabs component
 */
export function FooterTabs(): JSX.Element | null {
  const [footerTabs, setFooterTabs] = useState<TypeTabs[]>([]);

  const [isCollapsed, setIsCollapsed] = useState(true);

  const classes = useStyles();

  const mapConfig = useContext(MapContext);

  const tabsContainerRef = useRef<HTMLDivElement>();

  const mapId = mapConfig.id;

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
      const tabsContaine = tabsContainerRef.current as HTMLDivElement;

      // check if the tabs container is collapsed
      if (isCollapsed) {
        tabsContaine.style.height = '55px';
      } else {
        tabsContaine.style.height = '400px';
      }
    }

    setIsCollapsed(!isCollapsed);

    // update map container size
    setTimeout(() => {
      api.map(mapId).map.updateSize();
    }, 200);
  };

  useEffect(() => {
    // listen to new tab creation
    api.event.on(
      EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_CREATE,
      (payload) => {
        if (payloadIsAFooterTab(payload)) {
          if (payload.handlerName && payload.handlerName === mapId) {
            addTab(payload);
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

    return () => {
      api.event.off(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_CREATE, mapId);
      api.event.off(EVENT_NAMES.FOOTER_TABS.EVENT_FOOTER_TABS_TAB_REMOVE, mapId);
    };
  }, [addTab, mapId, removeTab]);

  return api.map(mapId).footerTabs.tabs.length > 0 ? (
    <div ref={tabsContainerRef as MutableRefObject<HTMLDivElement>} className={classes.tabsContainer}>
      <Tabs
        tabsProps={{
          variant: 'scrollable',
        }}
        tabs={footerTabs.map((tab) => {
          return {
            ...tab,
          };
        })}
      />
      <div className={classes.collapseButton}>
        <IconButton onClick={handleCollapse}>{isCollapsed ? <ExpandMoreIcon /> : <ExpandLessIcon />}</IconButton>
      </div>
    </div>
  ) : null;
}
