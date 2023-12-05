import { useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useTranslation } from 'react-i18next';

import { useTheme } from '@mui/material/styles';

import Focus from './buttons/focus';
import ZoomIn from './buttons/zoom-in';
import ZoomOut from './buttons/zoom-out';
import Fullscreen from './buttons/fullscreen';
import Home from './buttons/home';
import ExportButton from '@/core/components/export/export-modal-button';
import Location from './buttons/location';

import { api } from '@/app';
import { Panel, ButtonGroup, IconButton, Box } from '@/ui';
import { MapContext } from '@/core/app-start';
import { EVENT_NAMES } from '@/api/events/event-types';
import { payloadIsAButtonPanel, ButtonPanelPayload, PayloadBaseClass } from '@/api/events/payloads';
import { TypeButtonPanel } from '@/ui/panel/panel-types';
import { getSxClasses } from './nav-bar-style';
import {
  useUIActiveFocusItem,
  useUIFooterBarExpanded,
  useUINavbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';

/**
 * Create a nav-bar with buttons that can call functions or open custom panels
 */
export function Navbar(): JSX.Element {
  const mapConfig = useContext(MapContext);
  const { mapId } = mapConfig;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal state
  const navBarRef = useRef<HTMLDivElement>(null);
  const [buttonPanelGroups, setButtonPanelGroups] = useState<Record<string, Record<string, TypeButtonPanel>>>({});

  // get the expand or collapse from store
  const footerBarExpanded = useUIFooterBarExpanded();
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const navBarComponents = useUINavbarComponents();

  // #region REACT HOOKS
  const addButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
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

  const removeButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
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
    const navbarBtnPanelCreateListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAButtonPanel(payload)) addButtonPanel(payload);
    };
    // listen to new nav-bar panel creation
    api.event.on(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE, navbarBtnPanelCreateListenerFunction, mapId);

    const navbarBtnPanelRemoveListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAButtonPanel(payload)) removeButtonPanel(payload);
    };
    // listen to new nav-bar panel removal
    api.event.on(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, navbarBtnPanelRemoveListenerFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_CREATE, mapId, navbarBtnPanelCreateListenerFunction);
      api.event.off(EVENT_NAMES.NAVBAR.EVENT_NAVBAR_BUTTON_PANEL_REMOVE, mapId, navbarBtnPanelRemoveListenerFunction);
    };
  }, [addButtonPanel, mapId, removeButtonPanel]);
  // #endregion

  return (
    /** TODO - KenChase Need to add styling for scenario when more buttons that can fit vertically occurs (or limit number of buttons that can be added) */
    <Box ref={navBarRef} sx={[sxClasses.navBarRef, { bottom: footerBarExpanded ? 80 : 40 }]}>
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
                        onClick={() => {
                          if (!buttonPanel.panel?.status) {
                            buttonPanel.panel?.open();
                          } else {
                            buttonPanel.panel?.close();
                          }
                        }}
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
          {navBarComponents.includes('export') && <ExportButton className={`${sxClasses.navButton} ${activeModalId ? 'export' : ''}`} />}
          {/* // TODO We might need to refactor code below based on the best solution, issue #1448 */}
          {navBarComponents.includes('focus') && <Focus />}
        </ButtonGroup>
      </Box>
    </Box>
  );
}
