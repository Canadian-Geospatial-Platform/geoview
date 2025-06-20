import { useCallback, useEffect, useRef, useState, Fragment, useMemo, isValidElement } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import BasemapSelect from './buttons/basemap-select';
import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';
import Location from './buttons/location';
import Projection from './buttons/projection';
import { ButtonGroup, Box, IconButton } from '@/ui';
import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { getSxClasses } from './nav-bar-style';
import { NavBarApi, NavBarCreatedEvent, NavBarRemovedEvent } from '@/core/components';
import { useUINavbarComponents } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from './nav-bar-panel-button';

type NavBarProps = {
  api: NavBarApi;
};

type DefaultNavbar = 'fullScreen' | 'location' | 'home' | 'zoomIn' | 'zoomOut' | 'basemapSelect' | 'projection';
type NavbarButtonGroup = Record<string, TypeButtonPanel | DefaultNavbar>;
type NavButtonGroups = Record<string, NavbarButtonGroup>;

const defaultNavbar: Record<DefaultNavbar, JSX.Element> = {
  fullScreen: <Fullscreen />,
  location: <Location />,
  home: <Home />,
  basemapSelect: <BasemapSelect />,
  projection: <Projection />,
  zoomIn: <ZoomIn />,
  zoomOut: <ZoomOut />,
};
const defaultButtonGroups: NavButtonGroups = {
  zoom: { zoomIn: 'zoomIn', zoomOut: 'zoomOut' },
};

/**
 * Create a nav-bar with buttons that can call functions or open custom panels
 */
export function NavBar(props: NavBarProps): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/nav-bar');

  const { api: navBarApi } = props;

  // Hooks
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const navBarComponents = useUINavbarComponents();

  // Ref
  const navBarRef = useRef<HTMLDivElement>(null);

  // State
  const [buttonPanelGroups, setButtonPanelGroups] = useState<NavButtonGroups>(defaultButtonGroups);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('navBarComponents store value changed');

    let displayButtons: NavbarButtonGroup = {};
    if (navBarComponents.includes('fullscreen')) {
      displayButtons = { ...displayButtons, fullScreen: 'fullScreen' };
    }

    if (navBarComponents.includes('location')) {
      displayButtons = { ...displayButtons, location: 'location' };
    }

    if (navBarComponents.includes('home')) {
      displayButtons = { ...displayButtons, home: 'home' };
    }

    if (navBarComponents.includes('basemap-select')) {
      displayButtons = { ...displayButtons, basemapSelect: 'basemapSelect' };
    }

    if (navBarComponents.includes('projection')) {
      displayButtons = { ...displayButtons, projection: 'projection' };
    }

    setButtonPanelGroups({
      ...{ display: displayButtons },
      ...buttonPanelGroups,
    });
    // If buttonPanelGroups is in the dependencies, it triggers endless rerenders
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navBarComponents]);

  const handleNavApiAddButtonPanel = useCallback((sender: NavBarApi, event: NavBarCreatedEvent) => {
    // Log
    logger.logTraceUseCallback('NAV-BAR - addButtonPanel');

    setButtonPanelGroups((prevState) => {
      const existingGroup = prevState[event.group] || {};

      return {
        ...prevState,
        [event.group]: {
          ...existingGroup, // Spread existing buttons first
          [event.buttonPanelId]: event.buttonPanel,
        },
      };
    });
  }, []);

  const handleNavApiRemoveButtonPanel = useCallback(
    (sender: NavBarApi, event: NavBarRemovedEvent) => {
      // Log
      logger.logTraceUseCallback('NAV-BAR - handleRemoveButtonPanel');

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
    logger.logTraceUseEffect('NAV-BAR API - mount');

    // Register NavBar created/removed handlers
    navBarApi.onNavbarCreated(handleNavApiAddButtonPanel);
    navBarApi.onNavbarRemoved(handleNavApiRemoveButtonPanel);

    return () => {
      // Unregister events
      navBarApi.offNavbarCreated(handleNavApiAddButtonPanel);
      navBarApi.offNavbarRemoved(handleNavApiRemoveButtonPanel);
    };
  }, [navBarApi, handleNavApiAddButtonPanel, handleNavApiRemoveButtonPanel]);

  function renderButtonPanel(buttonPanel: TypeButtonPanel | DefaultNavbar, key: string): JSX.Element | null {
    if (typeof buttonPanel === 'string') {
      return <Fragment key={`${key}-component`}>{defaultNavbar[buttonPanel]}</Fragment>;
    }

    if (!buttonPanel.button.visible) {
      return null;
    }

    // GV This is specific for NavBar Button Plugins
    // Check if children is a React component that returns a button and return that
    if (isValidElement(buttonPanel.button.children) && !buttonPanel.panel) {
      return <Fragment key={`${key}-component`}>{buttonPanel.button.children}</Fragment>;
    }

    return (
      <Fragment key={`${key}-component`}>
        {!buttonPanel.panel ? (
          <IconButton
            key={buttonPanel.button.id}
            id={buttonPanel.button.id}
            tooltip={t(buttonPanel.button.tooltip!)!}
            tooltipPlacement={buttonPanel.button.tooltipPlacement}
            sx={sxClasses.navButton}
            onClick={buttonPanel.button.onClick}
          >
            {buttonPanel.button.children}
          </IconButton>
        ) : (
          <NavbarPanelButton buttonPanel={buttonPanel} />
        )}
      </Fragment>
    );
  }

  function renderButtonPanelGroup(buttonPanelGroup: NavbarButtonGroup, groupName: string): JSX.Element | null {
    if (Object.keys(buttonPanelGroup).length === 0) {
      return null;
    }

    return (
      <Fragment key={groupName}>
        <ButtonGroup
          key={groupName}
          aria-label={t('mapnav.arianavbar')!}
          variant="contained"
          sx={sxClasses.navBtnGroup}
          orientation="vertical"
        >
          {Object.keys(buttonPanelGroup).map((buttonPanelKey) => {
            const buttonPanel: TypeButtonPanel | DefaultNavbar = buttonPanelGroup[buttonPanelKey];
            return renderButtonPanel(buttonPanel, buttonPanelKey);
          })}
        </ButtonGroup>
      </Fragment>
    );
  }

  return (
    <Box ref={navBarRef} sx={sxClasses.navBarRef}>
      {Object.keys(buttonPanelGroups).map((key) => renderButtonPanelGroup(buttonPanelGroups[key], key))}
    </Box>
  );
}
