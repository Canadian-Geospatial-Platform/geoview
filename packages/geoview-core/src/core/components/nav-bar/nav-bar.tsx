import { useRef, useState, useEffect, Fragment, useMemo, isValidElement } from 'react';
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
import { ButtonGroup, Box, IconButton } from '@/ui';
import { ExpandLessIcon, ExpandMoreIcon } from '@/ui/icons';
import type { TypeButtonPanel } from '@/ui/panel/panel-types';
import { getSxClasses } from './nav-bar-style';
import type { NavBarApi } from '@/core/components';
import { useStoreUINavbarComponents, useStoreUINavBarButtonPanelVersion } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';
import NavbarPanelButton from './nav-bar-panel-button';

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
  const memoSxClasses = useMemo(() => getSxClasses(theme), [theme]);

  // Store
  const navBarComponents = useStoreUINavbarComponents();
  const navBarButtonPanelVersion = useStoreUINavBarButtonPanelVersion();

  // Ref
  const navBarRef = useRef<HTMLDivElement>(null);

  // State
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());
  const [maxButtonsPerColumn, setMaxButtonsPerColumn] = useState<number>(10);

  /**
   * Derives button panel groups from config and the NavBar API registry.
   */
  const memoButtonPanelGroups = useMemo<NavButtonGroups>((): NavButtonGroups => {
    // Log
    logger.logTraceUseMemo('NAV-BAR - memoButtonPanelGroups', navBarComponents, navBarButtonPanelVersion);

    // Build built-in button groups from config
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

    // Start with built-in groups
    const groups: NavButtonGroups = {
      ...(Object.keys(zoomRotateButtons).length > 0 && { zoom: zoomRotateButtons }),
      ...(Object.keys(displayButtons).length > 0 && { display: displayButtons }),
    };

    // Merge plugin button panels from the NavBar API registry
    Object.entries(navBarApi.buttons).forEach(([groupName, groupButtons]) => {
      if (Object.keys(groupButtons).length > 0) {
        groups[groupName] = { ...groups[groupName], ...groupButtons };
      }
    });

    return groups;
    // navBarButtonPanelVersion triggers re-computation when plugins add/remove button panels
  }, [navBarComponents, navBarButtonPanelVersion, navBarApi.buttons]);

  /**
   * Calculates and updates the maximum buttons per column based on available height.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('NAV-BAR - calculate max buttons per column');

    const calculateMaxButtons = (): void => {
      if (!navBarRef.current) return;

      const mapContainer = navBarRef.current.parentElement;
      if (!mapContainer) return;

      const mapHeight = mapContainer.clientHeight;
      const overviewMapSpace = 167; // 150px + 6px margin top + 6px margin bottom + 5px from top
      const infoBarHeight = 40; // Map info bar at bottom
      const navbarPadding = 12; // 6px top + 6px bottom
      const buttonGroupGap = 15; // Gap between button groups

      const availableHeight = mapHeight - overviewMapSpace - infoBarHeight - navbarPadding - buttonGroupGap;

      const buttonHeight = 44; // Each button is 44px
      const maxButtons = Math.floor(availableHeight / buttonHeight);

      // Set minimum of 3 buttons per column to avoid too many columns
      setMaxButtonsPerColumn(Math.max(3, maxButtons));
    };

    // Calculate on mount
    calculateMaxButtons();

    // Watch for resize
    const resizeObserver = new ResizeObserver(() => {
      calculateMaxButtons();
    });

    const mapContainer = navBarRef.current?.parentElement;
    if (mapContainer) {
      resizeObserver.observe(mapContainer);
    }

    return () => {
      resizeObserver.disconnect();
    };
  }, []);

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
            sx={memoSxClasses.navButton}
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
    const threshold = groupConfig.accordionThreshold || 10; // Default threshold for collapse
    const needsExpansion = buttonKeys.length > threshold + 1;

    const isExpanded = expandedGroups.has(groupName);

    // Determine which buttons to show
    const visibleButtonKeys = needsExpansion && !isExpanded ? buttonKeys.slice(0, threshold) : buttonKeys;

    // Use dynamic maxButtonsPerColumn from state instead of config
    const buttonsPerColumn = maxButtonsPerColumn;

    // Split buttons into columns
    const columns: string[][] = [];
    for (let i = 0; i < visibleButtonKeys.length; i += buttonsPerColumn) {
      columns.push(visibleButtonKeys.slice(i, i + buttonsPerColumn));
    }

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

    return (
      <Box key={groupName} sx={memoSxClasses.navBtnGroupColumns}>
        {columns.map((columnKeys, columnIndex) => (
          <ButtonGroup
            // eslint-disable-next-line react/no-array-index-key
            key={`${groupName}-column-${columnIndex}`}
            aria-label={t('mapnav.arianavbar')!}
            variant="contained"
            sx={memoSxClasses.navBtnGroup}
            orientation="vertical"
          >
            {columnKeys.map((buttonPanelKey) => {
              const buttonPanel: TypeButtonPanel | DefaultNavbar = buttonPanelGroup[buttonPanelKey];
              return renderButtonPanel(buttonPanel, buttonPanelKey);
            })}

            {/* Add expand button to the last column when collapsed */}
            {needsExpansion && columnIndex === columns.length - 1 && (
              <IconButton
                key={`expand-${groupName}`}
                aria-label={isExpanded ? t('general.close') : t('general.open')}
                tooltipPlacement="left"
                sx={memoSxClasses.navButton}
                onClick={toggleExpansion}
              >
                {isExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              </IconButton>
            )}
          </ButtonGroup>
        ))}
      </Box>
    );
  }

  return (
    <Box ref={navBarRef} sx={memoSxClasses.navBarRef}>
      {[...Object.keys(memoButtonPanelGroups)].map((key) => renderButtonPanelGroup(memoButtonPanelGroups[key], key))}
    </Box>
  );
}
