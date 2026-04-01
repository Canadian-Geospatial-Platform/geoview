import { useCallback, useEffect, useRef, useState, Fragment, useMemo, isValidElement } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme } from '@mui/material/styles';

import BasemapSelect from './buttons/basemap-select';
import Measurement from './buttons/measurement';
import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';
import Location from './buttons/location';
import Projection from './buttons/projection';
import MapRotation from './buttons/map-rotation';
import { ButtonGroup, Box, IconButton, Collapse } from '@/ui';
import { ExpandLessIcon, ExpandMoreIcon } from '@/ui/icons';
import type { TypeButtonPanel } from '@/ui/panel/panel-types';
import { getSxClasses } from './nav-bar-style';
import type { NavBarApi, NavBarCreatedEvent, NavBarRemovedEvent } from '@/core/components';
import type { TypeValidNavBarProps } from '@/api/types/map-schema-types';
import { useStoreUINavbarComponents } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from './nav-bar-panel-button';
import { usePluginController } from '@/core/controllers/plugin-controller';

/** The properties for the nav-bar component. */
type NavBarProps = {
  /** The nav-bar API instance. */
  api: NavBarApi;
};

/** Valid default navbar button identifiers. */
type DefaultNavbar =
  | 'fullScreen'
  | 'location'
  | 'home'
  | 'zoomIn'
  | 'zoomOut'
  | 'basemapSelect'
  | 'measurement'
  | 'projection'
  | 'mapRotation';
/** A group of button panels indexed by key. */
type NavbarButtonGroup = Record<string, TypeButtonPanel | DefaultNavbar>;
/** All button panel groups indexed by group name. */
type NavButtonGroups = Record<string, NavbarButtonGroup>;

/** Mapping of default navbar identifiers to their component elements. */
const defaultNavbar: Record<DefaultNavbar, JSX.Element> = {
  fullScreen: <Fullscreen />,
  location: <Location />,
  home: <Home />,
  basemapSelect: <BasemapSelect />,
  measurement: <Measurement />,
  projection: <Projection />,
  zoomIn: <ZoomIn />,
  zoomOut: <ZoomOut />,
  mapRotation: <MapRotation />,
};

/**
 * Creates a nav-bar with buttons that can call functions or open custom panels.
 *
 * @param props - The nav-bar properties
 * @returns The nav-bar component
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
  const navBarComponents = useStoreUINavbarComponents();
  const pluginController = usePluginController();

  // Ref
  const navBarRef = useRef<HTMLDivElement>(null);

  // State
  const [buttonPanelGroups, setButtonPanelGroups] = useState<NavButtonGroups>({});
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  /**
   * Builds the initial button panel groups from the navbar component configuration.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('navBarComponents store value changed');

    let zoomRotateButtons: NavbarButtonGroup = {};
    if (navBarComponents.includes('zoom')) {
      zoomRotateButtons = { ...zoomRotateButtons, zoomIn: 'zoomIn', zoomOut: 'zoomOut' };
    }
    if (navBarComponents.includes('rotation')) {
      zoomRotateButtons = { ...zoomRotateButtons, mapRotation: 'mapRotation' };
    }

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

    if (navBarComponents.includes('measurement')) {
      displayButtons = { ...displayButtons, measurement: 'measurement' };
    }

    if (navBarComponents.includes('projection')) {
      displayButtons = { ...displayButtons, projection: 'projection' };
    }

    setButtonPanelGroups((prevState) => ({
      ...(Object.keys(zoomRotateButtons).length > 0 && { zoom: zoomRotateButtons }),
      ...(Object.keys(displayButtons).length > 0 && { display: displayButtons }),
      ...prevState,
    }));
    // If buttonPanelGroups is in the dependencies, it triggers endless rerenders
  }, [navBarComponents]);

  /**
   * Handles when a button panel is added via the NavBar API.
   */
  const handleNavApiAddButtonPanel = useCallback((sender: NavBarApi, event: NavBarCreatedEvent): void => {
    setButtonPanelGroups((prevState) => {
      const existingGroup = prevState?.[event.group] || {};

      return {
        ...prevState,
        [event.group]: {
          ...existingGroup, // Spread existing buttons first
          [event.buttonPanelId]: event.buttonPanel,
        },
      };
    });
  }, []);

  /**
   * Handles when a button panel is removed via the NavBar API.
   */
  const handleNavApiRemoveButtonPanel = useCallback(
    (sender: NavBarApi, event: NavBarRemovedEvent): void => {
      setButtonPanelGroups((prevState) => {
        const state = { ...prevState };
        const group = state[event.group];
        delete group[event.buttonPanelId];
        return state;
      });
    },
    [setButtonPanelGroups]
  );

  /**
   * Loads and adds navbar plugins from the configuration.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('NAV-BAR - navBarComponents');

    const processPlugin = (pluginName: TypeValidNavBarProps): void => {
      // Check if the plugin is in navBarComponents but not in corePackages
      if (navBarComponents.includes(pluginName)) {
        // Load and add the plugin
        pluginController.loadAndAddPlugin(pluginName).catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('loadAndAddPlugin(time-slider) in processPlugin in nav-bar', error);
        });
      }
    };

    // Process drawer plugin if it's in the navBar
    processPlugin('drawer');
  }, [navBarComponents, pluginController]);

  /**
   * Registers NavBar API event listeners on mount and cleans up on unmount.
   */
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

  /**
   * Renders a single button panel or default button.
   *
   * @param buttonPanel - The button panel or default navbar key
   * @param key - The unique key for the element
   * @returns The rendered button panel element, or null if not visible
   */
  function renderButtonPanel(buttonPanel: TypeButtonPanel | DefaultNavbar, key: string): JSX.Element | null {
    if (typeof buttonPanel === 'string') {
      return <Fragment key={`${key}-component`}>{defaultNavbar[buttonPanel]}</Fragment>;
    }

    if (!buttonPanel.button.visible) {
      return null;
    }

    // GV This is specific for NavBar Button Plugins
    // Check if children is a React component that returns a complete button (not just an icon with onClick)
    // If there's an onClick handler, we need to wrap the children in an IconButton
    if (isValidElement(buttonPanel.button.children) && !buttonPanel.panel && !buttonPanel.button.onClick) {
      return <Fragment key={`${key}-component`}>{buttonPanel.button.children}</Fragment>;
    }

    return (
      <Fragment key={`${key}-component`}>
        {!buttonPanel.panel ? (
          <IconButton
            key={buttonPanel.button.id}
            id={buttonPanel.button.id}
            aria-label={buttonPanel.button['aria-label']}
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

  /**
   * Renders a group of button panels with optional expansion.
   *
   * @param buttonPanelGroup - The group of button panels
   * @param groupName - The name of the group
   * @returns The rendered button group element, or null if empty
   */
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
              aria-label={isExpanded ? t('general.close') : t('general.open')}
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
      {[...Object.keys(buttonPanelGroups)].map((key) => renderButtonPanelGroup(buttonPanelGroups[key], key))}
    </Box>
  );
}
