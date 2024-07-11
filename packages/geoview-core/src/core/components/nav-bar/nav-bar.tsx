import { useCallback, useEffect, useRef, useState, Fragment } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';
import Location from './buttons/location';
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

type DefaultNavbar = 'fullScreen' | 'location' | 'home' | 'zoomIn' | 'zoomOut';
type NavbarButtonGroup = Record<string, TypeButtonPanel | DefaultNavbar>;
type NavButtonGroups = Record<string, NavbarButtonGroup>;

/**
 * Create a nav-bar with buttons that can call functions or open custom panels
 */
export function NavBar(props: NavBarProps): JSX.Element {
  // Log
  logger.logTraceRender('components/nav-bar/nav-bar');

  const { api: navBarApi } = props;

  const { t } = useTranslation();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get the expand or collapse from store
  const navBarComponents = useUINavbarComponents();

  const defaultNavbar: Record<DefaultNavbar, JSX.Element> = {
    fullScreen: <Fullscreen />,
    location: <Location />,
    home: <Home />,
    zoomIn: <ZoomIn />,
    zoomOut: <ZoomOut />,
  };

  // internal state
  const navBarRef = useRef<HTMLDivElement>(null);
  const defaultButtonGroups: NavButtonGroups = {
    zoom: { zoomIn: 'zoomIn', zoomOut: 'zoomOut' },
  };
  const [buttonPanelGroups, setButtonPanelGroups] = useState<NavButtonGroups>(defaultButtonGroups);

  useEffect(() => {
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

    setButtonPanelGroups({
      ...{ display: displayButtons },
      ...buttonPanelGroups,
    });
  }, [navBarComponents, buttonPanelGroups]);

  const addButtonPanel = useCallback(
    (buttonPanel: TypeButtonPanel | DefaultNavbar, buttonId: string, group: string) => {
      // Log
      logger.logTraceUseCallback('NAV-BAR - addButtonPanel', { buttonPanel, buttonId, group });

      const d = {
        [group]: {
          [buttonId]: buttonPanel,
          ...buttonPanelGroups[group],
        },
      };

      setButtonPanelGroups({
        ...buttonPanelGroups,
        ...d,
      });
    },
    [buttonPanelGroups]
  );

  const removeButtonPanel = useCallback(
    (buttonPanelId: string, groupId: string) => {
      logger.logTraceUseCallback('NAV-BAR - handleRemoveButtonPanel');
      setButtonPanelGroups((prevState) => {
        const state = { ...prevState };
        const group = state[groupId];
        delete group[buttonPanelId];
        return state;
      });
    },
    [setButtonPanelGroups]
  );

  const handleNavApiAddButtonPanel = useCallback((sender: NavBarApi, event: NavBarCreatedEvent) => {
    addButtonPanel(event.buttonPanel, event.buttonPanelId, event.group);
  }, []);

  const handleNavApiRemoveButtonPanel = useCallback((sender: NavBarApi, event: NavBarRemovedEvent) => {
    removeButtonPanel(event.buttonPanelId, event.group);
  }, []);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('NAV-BAR - mount');

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
      return <Fragment key={`${key}-component`}>{defaultNavbar[buttonPanel as DefaultNavbar]}</Fragment>;
    }

    if (!buttonPanel.button.visible) {
      return null;
    }
    return (
      <Fragment key={`${key}-component`}>
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
    <Box ref={navBarRef} sx={[sxClasses.navBarRef]}>
      {Object.keys(buttonPanelGroups).map((key) => renderButtonPanelGroup(buttonPanelGroups[key], key))}
    </Box>
  );
}
