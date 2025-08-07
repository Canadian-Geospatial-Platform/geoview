import { useCallback, useEffect, useRef, useState, Fragment, useMemo, isValidElement } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import { Plugin } from '@/api/plugin/plugin';

import BasemapSelect from './buttons/basemap-select';
import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';
import Location from './buttons/location';
import Projection from './buttons/projection';
import { ButtonGroup, Box, IconButton, Collapse } from '@/ui';
import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { getSxClasses } from './nav-bar-style';
import { NavBarApi, NavBarCreatedEvent, NavBarRemovedEvent } from '@/core/components';
import { useUINavbarComponents } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from './nav-bar-panel-button';

import { ExpandMoreIcon, ExpandLessIcon } from '@/ui/icons';

import { toJsonObject } from '@/api/config/types/config-types';
import { TypeValidNavBarProps } from '@/api/config/types/map-schema-types';
import { api } from '@/app';

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
  const mapId = useGeoViewMapId();
  const { t } = useTranslation();
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const navBarComponents = useUINavbarComponents();

  // Ref
  const navBarRef = useRef<HTMLDivElement>(null);

  // State
  const [buttonPanelGroups, setButtonPanelGroups] = useState<NavButtonGroups>(defaultButtonGroups);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

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

  // Add navbar plugins
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('NAV-BAR - navBarComponents');

    const processPlugin = (pluginName: TypeValidNavBarProps): void => {
      // Check if the plugin is in navBarComponents but not in corePackages
      if (navBarComponents.includes(pluginName)) {
        Plugin.loadScript(pluginName)
          .then((typePlugin) => {
            Plugin.addPlugin(
              pluginName,
              mapId,
              typePlugin,
              toJsonObject({
                mapId,
                viewer: api.getMapViewer(mapId),
              })
            ).catch((error: unknown) => {
              // Log
              logger.logPromiseFailed(`api.plugin.addPlugin in useEffect in nav-bar for ${pluginName}`, error);
            });
          })
          .catch((error: unknown) => {
            // Log
            logger.logPromiseFailed('api.plugin.loadScript in useEffect in nav-bar', error);
          });
      }
    };

    // Process drawer plugin if it's in the navBar
    processPlugin('drawer');
  }, [navBarComponents, mapId]);

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

    const buttonKeys = Object.keys(buttonPanelGroup);
    const groupConfig = navBarApi.getGroupConfig(groupName);
    const threshold = groupConfig.accordionThreshold;
    // GV Add one because there's no point showing an expand button if there's only one button left to show
    const needsExpansion = buttonKeys.length > threshold! + 1;

    // State for tracking expanded groups
    const isExpanded = expandedGroups.has(groupName);

    const toggleExpansion = (): void => {
      setExpandedGroups((prev) => {
        const newSet = new Set(prev);
        if (newSet.has(groupName)) {
          newSet.delete(groupName);
        } else {
          newSet.add(groupName);
        }
        return newSet;
      });
    };

    const visibleKeys = needsExpansion ? buttonKeys.slice(0, threshold) : buttonKeys;
    const hiddenKeys = buttonKeys.slice(threshold);

    return (
      <Fragment key={groupName}>
        <ButtonGroup
          key={groupName}
          aria-label={t('mapnav.arianavbar')!}
          variant="contained"
          sx={sxClasses.navBtnGroup}
          orientation="vertical"
        >
          {/*  Always visible buttons */}
          {visibleKeys.map((buttonPanelKey) => {
            const buttonPanel: TypeButtonPanel | DefaultNavbar = buttonPanelGroup[buttonPanelKey];
            return renderButtonPanel(buttonPanel, buttonPanelKey);
          })}

          {/*  Collapsible hidden buttons */}
          {needsExpansion && (
            <Collapse in={isExpanded} timeout="auto" unmountOnExit>
              {hiddenKeys.map((buttonPanelKey) => {
                const buttonPanel: TypeButtonPanel | DefaultNavbar = buttonPanelGroup[buttonPanelKey];
                return renderButtonPanel(buttonPanel, buttonPanelKey);
              })}
            </Collapse>
          )}

          {/* Expand/Collapse button */}
          {needsExpansion && (
            <IconButton
              key={`expand-${groupName}`}
              tooltip={isExpanded ? 'Show less' : 'Show more'}
              tooltipPlacement="left"
              sx={sxClasses.navButton}
              onClick={toggleExpansion}
            >
              {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
          )}
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
