import { useCallback, useEffect, useRef, useState, useMemo, Fragment } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';
import Location from './buttons/location';
import { useMapLoaded } from '@/core/stores/store-interface-and-intial-values/map-state';

// import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { ButtonGroup, Box, IconButton } from '@/ui';
// import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { getSxClasses } from './nav-bar-style';
import { NavBarApi, NavBarCreatedEvent, NavBarRemovedEvent } from '@/core/components';
// import { helpCloseAll, helpClosePanelById, helpOpenPanelById } from '@/core/components/app-bar/app-bar-helper';
import { useUINavbarComponents } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';
import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';

type NavBarProps = {
  api: NavBarApi;
};

type DefaultNavbar = 'fullScreen' | 'location' | 'home' | 'zoomIn' | 'zoomOut';

/**
 * Create a nav-bar with buttons that can call functions or open custom panels
 */
export function NavBar(props: NavBarProps): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/nav-bar');

  const { api: navBarApi } = props;

  // const mapId = useGeoViewMapId();

  const { t } = useTranslation();

  const defaultNavbar = useMemo(() => {
    return { fullScreen: <Fullscreen />, location: <Location />, home: <Home />, zoomIn: <ZoomIn />, zoomOut: <ZoomOut /> };
  }, []);

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const mapLoaded = useMapLoaded();
  const geoviewElement = useAppGeoviewHTMLElement();
  const shellContainer = geoviewElement.querySelector(`[id^="shell-${navBarApi.mapId}"]`) as HTMLElement;
  // get the expand or collapse from store
  const navBarComponents = useUINavbarComponents();

  // internal state
  const navBarRef = useRef<HTMLDivElement>(null);
  const [buttonPanelGroups, setButtonPanelGroups] = useState<Record<string, Record<string, TypeButtonPanel>>>({});

  const [gridColumns, setGridColumns] = useState<Array<Array<Array<DefaultNavbar | TypeButtonPanel>>>>([[]]);
  const totalColumns = useRef<number>(0);

  useEffect(() => {
    if (navBarRef.current && mapLoaded) {
      //   const overviewMap = Array.from(shellContainer.getElementsByClassName('ol-overviewmap-map'));
      //   if (overviewMap[1]) {
      //     // set the max height of navbar container.
      //     const { scrollTop } = document.documentElement;
      //     const overViewMapBottom = overviewMap[1].getBoundingClientRect().bottom;
      //     const navbarChildRef = Array.from(navBarRef.current.children)[totalColumns.current];
      //     const navbarBottom = navbarChildRef.getBoundingClientRect().bottom;
      //     const navbarTop = navbarChildRef.getBoundingClientRect().top;
      //     navBarRef.current.style.maxHeight = `${scrollTop + navbarBottom - (scrollTop + overViewMapBottom) - 10}px`;
      //     // Set the ref which tells if max height has been reached.
      //     if (scrollTop + overViewMapBottom < scrollTop + navbarTop - 80) {
      //       isMaxHeightReached.current = true;
      //     } else {
      //       isMaxHeightReached.current = false;
      //     }
      //   }
    }
  }, [buttonPanelGroups, mapLoaded, shellContainer]);

  useEffect(() => {
    const row: (DefaultNavbar | TypeButtonPanel)[][][] = [];

    const column: (DefaultNavbar | TypeButtonPanel)[][] = [['zoomIn', 'zoomOut']];
    const navBarArr: DefaultNavbar[] = [];

    if (navBarComponents.includes('fullscreen')) {
      navBarArr.push('fullScreen');
    }
    if (navBarComponents.includes('location')) {
      navBarArr.push('location');
    }
    if (navBarComponents.includes('home')) {
      navBarArr.push('home');
    }

    if (navBarArr.length) {
      column.push(navBarArr);
    }

    Object.values(buttonPanelGroups).forEach((groupBtns) => {
      const btns = Object.values(groupBtns);
      row.unshift([btns]);
    });

    // debugger;
    if (row[0]?.length) {
      const indx = row.length - 1;
      row[indx] = [...row[indx], ...column];
    } else {
      row[0] = [...column];
    }

    setGridColumns(row);
  }, [buttonPanelGroups, navBarComponents]);

  const getGroupName = (navbarEvent: NavBarCreatedEvent, shellWrapper: HTMLElement): string => {
    const overviewMap = Array.from(shellWrapper.getElementsByClassName('ol-overviewmap-map'));

    const { scrollTop } = document.documentElement;
    const overViewMapBottom = overviewMap[1].getBoundingClientRect().bottom;

    const navbarChildRef = Array.from(navBarRef.current!.children)[0];
    const navbarTop = navbarChildRef.getBoundingClientRect().top;

    if (scrollTop + overViewMapBottom > scrollTop + navbarTop - 80) {
      totalColumns.current += 1;
    }
    return `${navbarEvent.group}${totalColumns.current}`;
  };

  const handleAddButtonPanel = useCallback(
    (sender: NavBarApi, event: NavBarCreatedEvent) => {
      // Log
      logger.logTraceUseCallback('NAV-BAR - handleAddButtonPanel', event);
      const groupName = getGroupName(event, shellContainer);

      const d = {
        [groupName]: {
          ...buttonPanelGroups[groupName],
          [event.buttonPanelId]: event.buttonPanel,
        },
      };

      setButtonPanelGroups({
        ...buttonPanelGroups,
        ...d,
      });
    },
    [buttonPanelGroups, shellContainer]
  );
  console.log('buttonPanelGroupsbuttonPanelGroups', buttonPanelGroups);
  const handleRemoveButtonPanel = useCallback(
    (sender: NavBarApi, event: NavBarRemovedEvent) => {
      // Log
      logger.logTraceUseCallback('NAV-BAR - handleRemoveButtonPanel', event);

      setButtonPanelGroups((prevState) => {
        const state = { ...prevState };
        const group = state[event.group];

        delete group[event.buttonPanelId];

        return state;
      });
    },
    [setButtonPanelGroups]
  );

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('NAV-BAR - mount');

    // Register NavBar created/removed handlers
    navBarApi.onNavbarCreated(handleAddButtonPanel);
    navBarApi.onNavbarRemoved(handleRemoveButtonPanel);

    return () => {
      // Unregister events
      navBarApi.offNavbarCreated(handleAddButtonPanel);
      navBarApi.offNavbarRemoved(handleRemoveButtonPanel);
    };
  }, [navBarApi, handleAddButtonPanel, handleRemoveButtonPanel]);

  // #endregion
  // console.log('gridColumnsgridColumns', gridColumns);

  return (
    <Box ref={navBarRef} sx={[sxClasses.navBarRef]}>
      {gridColumns.map((column, idx) => (
        <Box sx={sxClasses.navBtnGroupContainer} key={`${idx.toString()}-column`} id={`${idx.toString()}-column`}>
          {column.map((valuesArray, columnIdx) => {
            return (
              <ButtonGroup
                orientation="vertical"
                aria-label={t('mapnav.arianavbar')!}
                variant="contained"
                sx={sxClasses.navBtnGroup}
                key={`${columnIdx.toString()}-values`}
              >
                {valuesArray.map((component, valuesIdx) => {
                  if (typeof component === 'string') {
                    return <Fragment key={`${valuesIdx.toString()}-component`}>{defaultNavbar[component]}</Fragment>;
                  }
                  const buttonPanel = component as TypeButtonPanel;
                  if (!buttonPanel.button.visible) {
                    return null;
                  }
                  return (
                    <Fragment key={`${valuesIdx.toString()}-component`}>
                      {!buttonPanel.panel ? (
                        <IconButton
                          key={buttonPanel.button.id}
                          id={buttonPanel.button.id}
                          tooltip={buttonPanel.button.tooltip}
                          tooltipPlacement={buttonPanel.button.tooltipPlacement}
                          sx={sxClasses.navButton}
                          onClick={buttonPanel.button.onClick}
                        >
                          {buttonPanel.button.children}
                        </IconButton>
                      ) : (
                        <IconButton
                          key={buttonPanel.button.id}
                          id={buttonPanel.button.id}
                          tooltip={buttonPanel.button.tooltip}
                          tooltipPlacement={buttonPanel.button.tooltipPlacement}
                          sx={sxClasses.navButton}
                          // onClick={(e) => handleClick(e, buttonPanel)}
                        >
                          {buttonPanel.button.children}
                        </IconButton>
                      )}
                    </Fragment>
                  );
                })}
              </ButtonGroup>
            );
          })}
        </Box>
      ))}
    </Box>
  );
}
