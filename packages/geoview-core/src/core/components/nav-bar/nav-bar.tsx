import { useCallback, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';
import ExportButton from '@/core/components/export/export-modal-button';
import Location from './buttons/location';

import { api } from '@/app';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
import { Panel, ButtonGroup, IconButton, Box } from '@/ui';
import { ButtonPanelPayload } from '@/api/events/payloads';
import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { getSxClasses } from './nav-bar-style';
import { helpCloseAll, helpClosePanelById, helpOpenPanelById } from '@/core/components/app-bar/app-bar-helper';
import { useUIMapInfoExpanded, useUINavbarComponents } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { logger } from '@/core/utils/logger';

/**
 * Create a nav-bar with buttons that can call functions or open custom panels
 */
export function Navbar(): JSX.Element {
  // ? No props for this component. Same logic in FooterBar and AppBar.
  // ? We are handling the logic via api.event management, via nav-bar-api, once this component is mounted.

  // Log
  logger.logTraceRender('components/nav-bar/nav-bar');

  const mapId = useGeoViewMapId();

  const { t } = useTranslation();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const navBarRef = useRef<HTMLDivElement>(null);
  const [buttonPanelGroups, setButtonPanelGroups] = useState<Record<string, Record<string, TypeButtonPanel>>>({});

  // get the expand or collapse from store
  const mapInfoExpanded = useUIMapInfoExpanded();
  const navBarComponents = useUINavbarComponents();

  // #region REACT HOOKS

  const closePanelById = useCallback(
    (buttonId: string, groupName: string | undefined) => {
      // Log
      logger.logTraceUseCallback('NAV-BAR - closePanelById', buttonId);

      // Redirect to helper
      helpClosePanelById(mapId, buttonPanelGroups, buttonId, groupName, setButtonPanelGroups);
    },
    [buttonPanelGroups, mapId]
  );

  const closeAll = useCallback(() => {
    // Log
    logger.logTraceUseCallback('NAV-BAR - closeAll');

    // Redirect to helper
    helpCloseAll(buttonPanelGroups, closePanelById);
  }, [buttonPanelGroups, closePanelById]);

  const openPanelById = useCallback(
    (buttonId: string, groupName: string | undefined) => {
      // Log
      logger.logTraceUseCallback('NAV-BAR - openPanelById', buttonId);

      // Redirect to helper
      helpOpenPanelById(buttonPanelGroups, buttonId, groupName, setButtonPanelGroups, closeAll);
    },
    [buttonPanelGroups, closeAll]
  );

  const handleButtonClicked = useCallback(
    (buttonId: string, groupName: string) => {
      // Log
      logger.logTraceUseCallback('NAV-BAR - handleButtonClicked', buttonId);

      // Get the button panel
      const buttonPanel = buttonPanelGroups[groupName][buttonId];

      if (!buttonPanel.panel?.status) {
        // Redirect
        openPanelById(buttonId, groupName);
      } else {
        // Redirect
        closePanelById(buttonId, groupName);
      }
    },
    [buttonPanelGroups, closePanelById, openPanelById]
  );

  const handleAddButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
      // Log
      logger.logTraceUseCallback('NAV-BAR - handleAddButtonPanel', payload);

      setButtonPanelGroups({
        ...buttonPanelGroups,
        [payload.appBarGroupName]: {
          ...buttonPanelGroups[payload.appBarGroupName],
          [payload.appBarId]: payload.buttonPanel as TypeButtonPanel,
        },
      });
    },
    [buttonPanelGroups]
  );

  const handleRemoveButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
      // Log
      logger.logTraceUseCallback('NAV-BAR - handleRemoveButtonPanel', payload);

      setButtonPanelGroups((prevState) => {
        const state = { ...prevState };
        const group = state[payload.appBarGroupName];

        delete group[payload.appBarId];

        return state;
      });
    },
    [setButtonPanelGroups]
  );

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('NAV-BAR - mount', mapId);

    // listen to new nav-bar panel creation
    api.event.onCreateNavBarPanel(mapId, handleAddButtonPanel);

    // listen to new nav-bar panel removal
    api.event.onRemoveNavBarPanel(mapId, handleRemoveButtonPanel);

    return () => {
      // Unwire events
      api.event.offCreateNavBarPanel(mapId, handleAddButtonPanel);
      api.event.offRemoveNavBarPanel(mapId, handleRemoveButtonPanel);
    };
  }, [mapId, handleAddButtonPanel, handleRemoveButtonPanel]);

  // #endregion

  return (
    /** TODO - KenChase Need to add styling for scenario when more buttons that can fit vertically occurs (or limit number of buttons that can be added) */
    <Box ref={navBarRef} sx={[sxClasses.navBarRef, { bottom: mapInfoExpanded ? 80 : 40 }]}>
      {Object.keys(buttonPanelGroups).map((groupName) => {
        const buttonPanelGroup = buttonPanelGroups[groupName];

        // display the panels in the list
        const panels = Object.keys(buttonPanelGroup).map((buttonPanelKey) => {
          const buttonPanel = buttonPanelGroup[buttonPanelKey];

          return buttonPanel.panel ? <Panel key={buttonPanel.button.id} button={buttonPanel.button} panel={buttonPanel.panel} /> : null;
        });

        if (panels.length > 0) {
          return <div key={groupName}>{panels}</div>;
        }
        return null;
      })}
      <Box sx={sxClasses.navBtnGroupContainer}>
        {Object.keys(buttonPanelGroups).map((groupName) => {
          const buttonPanelGroup = buttonPanelGroups[groupName];

          // if not an empty object, only then render any HTML
          if (Object.keys(buttonPanelGroup).length !== 0) {
            return (
              <ButtonGroup
                key={groupName}
                orientation="vertical"
                aria-label={t('mapnav.arianavbar')!}
                variant="contained"
                sx={sxClasses.navBtnGroup}
              >
                {Object.keys(buttonPanelGroup).map((buttonPanelKey) => {
                  const buttonPanel: TypeButtonPanel = buttonPanelGroup[buttonPanelKey];
                  // eslint-disable-next-line no-nested-ternary
                  return buttonPanel.button.visible ? (
                    !buttonPanel.panel ? (
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
                        onClick={() => handleButtonClicked(buttonPanel.button.id!, groupName)}
                      >
                        {buttonPanel.button.children}
                      </IconButton>
                    )
                  ) : null;
                })}
              </ButtonGroup>
            );
          }
          return null;
        })}
        <ButtonGroup orientation="vertical" aria-label={t('mapnav.arianavbar')!} variant="contained" sx={sxClasses.navBtnGroup}>
          <ZoomIn />
          <ZoomOut />
        </ButtonGroup>
        <ButtonGroup orientation="vertical" aria-label={t('mapnav.arianavbar')!} variant="contained" sx={sxClasses.navBtnGroup}>
          {navBarComponents.includes('fullscreen') && <Fullscreen />}
          {navBarComponents.includes('location') && <Location />}
          {navBarComponents.includes('home') && <Home />}
          {navBarComponents.includes('export') && <ExportButton sxDetails={sxClasses.navButton} />}
        </ButtonGroup>
      </Box>
    </Box>
  );
}
