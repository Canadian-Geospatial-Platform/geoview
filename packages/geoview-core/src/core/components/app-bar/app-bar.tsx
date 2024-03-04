import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect, useCallback, Fragment, useMemo, ReactNode } from 'react';
import { capitalize } from 'lodash';
import { useTheme } from '@mui/material/styles';
import { Box, List, ListItem, Panel, IconButton, TypeIconButtonProps, SchoolIcon, InfoOutlinedIcon, HubOutlinedIcon } from '@/ui';

import { AbstractPlugin, TypeJsonObject, TypeJsonValue, api, toJsonObject, useGeoViewMapId } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { payloadIsAButtonPanel, ButtonPanelPayload, PayloadBaseClass, inKeyfocusPayload } from '@/api/events/payloads';
import { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';

import ExportButton from '@/core/components/export/export-modal-button';
import Geolocator from './buttons/geolocator';
import Notifications from '@/core/components/notifications/notifications';
import Version from './buttons/version';
import { getSxClasses } from './app-bar-style';
import {
  useUIActiveFocusItem,
  useUIActiveFooterBarTabId,
  useUIAppbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapInteraction, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewConfig } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { GuidePanel, Legend, DetailsPanel } from '@/core/components';

interface GroupPanelType {
  icon: ReactNode;
  content: ReactNode;
}
/**
 * Create an app-bar with buttons that can open a panel
 */
export function Appbar(): JSX.Element {
  // Log
  logger.logTraceRender('components/app-bar/app-bar');
  const { t } = useTranslation();

  const mapId = useGeoViewMapId();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state
  const [buttonPanelGroups, setButtonPanelGroups] = useState<Record<string, Record<string, TypeButtonPanel>>>({});
  const [selectedAppBarButtonId, setSelectedAppbarButtonId] = useState<string>('');
  const appBar = useRef<HTMLDivElement>(null);

  // get store values and action
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const interaction = useMapInteraction();
  const appBarComponents = useUIAppbarComponents();
  const { hideClickMarker } = useMapStoreActions();
  // TODO: remove active footerTab Id and create new one for appbar id.
  const activeFooterTabId = useUIActiveFooterBarTabId();

  // get store config for app bar to add (similar logic as in footer-bar)
  const appBarConfig = useGeoViewConfig()?.appBar;

  // #region REACT HOOKS

  const panels = useMemo(() => {
    // TODO: Refactor - We should find a way to make this 'dictionary of supported components' dynamic.
    return {
      legend: { icon: <HubOutlinedIcon />, content: <Legend fullWidth /> },
      guide: { icon: <SchoolIcon />, content: <GuidePanel fullWidth /> },
      details: { icon: <InfoOutlinedIcon />, content: <DetailsPanel fullWidth /> },
    } as unknown as Record<string, GroupPanelType>;
  }, []);

  const findGroupName = useCallback(
    (buttonId: string): string | undefined => {
      let groupName: string | undefined;
      Object.entries(buttonPanelGroups).forEach(([buttonPanelGroupName, buttonPanelGroup]) => {
        if (!groupName) {
          if (Object.keys(buttonPanelGroup).includes(buttonId)) {
            // Found it
            groupName = buttonPanelGroupName;
          }
        }
      });
      return groupName;
    },
    [buttonPanelGroups]
  );

  const addButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - addButtonPanel');

      setButtonPanelGroups((prevState) => {
        return {
          ...prevState,
          ...buttonPanelGroups,
          [payload.appBarGroupName]: {
            ...buttonPanelGroups[payload.appBarGroupName],
            [payload.appBarId]: payload.buttonPanel as TypeButtonPanel,
          },
        };
      });
    },
    [buttonPanelGroups]
  );

  const removeButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - removeButtonPanel');

      setButtonPanelGroups((prevState) => {
        const state = { ...prevState };

        const group = state[payload.appBarGroupName];

        delete group[payload.appBarId];

        return state;
      });
    },
    [setButtonPanelGroups]
  );

  const openClosePanelByIdState = useCallback(
    (buttonId: string, groupName: string | undefined, status: boolean) => {
      // Read the group name
      const theGroupName = groupName || findGroupName(buttonId);
      if (!theGroupName) return;

      // Open or Close it
      setButtonPanelGroups((prevState) => {
        // Check if doing it
        const doIt = !!(
          prevState[theGroupName] &&
          prevState[theGroupName][buttonId] &&
          prevState[theGroupName][buttonId].panel &&
          prevState[theGroupName][buttonId].panel?.status !== status
        );

        // If is open/closed right now
        if (doIt) {
          return {
            ...prevState,
            [theGroupName]: {
              ...prevState[theGroupName],
              [buttonId]: {
                ...prevState[theGroupName][buttonId],
                panel: {
                  ...prevState[theGroupName][buttonId].panel!,
                  status,
                },
              },
            },
          };
        }

        // Leave as-is
        return prevState;
      });
    },
    [findGroupName]
  );

  const closePanelById = useCallback(
    (buttonId: string, groupName: string | undefined) => {
      // Read the group name
      const theGroupName = groupName || findGroupName(buttonId);

      // Close the panel
      openClosePanelByIdState(buttonId, theGroupName, false);
      setSelectedAppbarButtonId('');

      const buttonElement = buttonId && document.getElementById(mapId)?.querySelector(`#${buttonId}`);

      if (buttonElement) {
        // put back focus on calling button
        document.getElementById(buttonId)?.focus();
      } else {
        const mapCont = api.maps[mapId].map.getTargetElement();
        mapCont.focus();

        // if in focus trap mode, trigger the event
        if (mapCont.closest('.geoview-map')?.classList.contains('map-focus-trap')) {
          mapCont.classList.add('keyboard-focus');
          api.event.emit(inKeyfocusPayload(EVENT_NAMES.MAP.EVENT_MAP_IN_KEYFOCUS, `map-${mapId}`));
        }
      }
    },
    [findGroupName, mapId, openClosePanelByIdState]
  );

  const closeAll = useCallback(() => {
    // For each group
    Object.entries(buttonPanelGroups).forEach(([buttonPanelGroupName, buttonPanelGroup]) => {
      // For each button
      Object.keys(buttonPanelGroup).forEach((buttonId) => {
        // Close it
        closePanelById(buttonId, buttonPanelGroupName);
      });
    });
  }, [buttonPanelGroups, closePanelById]);

  const openPanelById = useCallback(
    (buttonId: string, groupName: string | undefined) => {
      // Read the group name
      const theGroupName = groupName || findGroupName(buttonId);

      // Close any already opened panels
      closeAll();

      // Open the panel
      openClosePanelByIdState(buttonId, theGroupName, true);
      setSelectedAppbarButtonId(buttonId);
    },
    [closeAll, findGroupName, openClosePanelByIdState]
  );

  const handleButtonClicked = useCallback(
    (buttonId: string, groupName: string) => {
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

  const handleGeneralCloseClicked = useCallback(() => {
    // Close it
    closePanelById(selectedAppBarButtonId, undefined);
  }, [selectedAppBarButtonId, closePanelById]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - addButtonPanel', mapId);

    const appBarPanelCreateListenerFunction = (payload: PayloadBaseClass) => {
      // Log
      logger.logTraceCoreAPIEvent('APP-BAR - appBarPanelCreateListenerFunction', payload);

      if (payloadIsAButtonPanel(payload)) addButtonPanel(payload);
    };

    const appBarPanelRemoveListenerFunction = (payload: PayloadBaseClass) => {
      // Log
      logger.logTraceCoreAPIEvent('APP-BAR - appBarPanelRemoveListenerFunction', payload);

      if (payloadIsAButtonPanel(payload)) removeButtonPanel(payload);
    };

    // listen to new panel creation
    api.event.on(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, appBarPanelCreateListenerFunction, mapId);

    // listen on panel removal
    api.event.on(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, appBarPanelRemoveListenerFunction, mapId);

    return () => {
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, mapId, appBarPanelCreateListenerFunction);
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, mapId, appBarPanelRemoveListenerFunction);
    };
  }, [addButtonPanel, mapId, removeButtonPanel, selectedAppBarButtonId]);
  // #endregion

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - open detail panel when clicked on map', mapId);
    // TODO: remove active footerTab Id and create new one for appbar id.
    // open appbar detail drawer when click on map.
    if (activeFooterTabId === 'details' && buttonPanelGroups?.details?.AppbarPanelButtonDetails?.panel) {
      // Open it
      openPanelById(buttonPanelGroups?.details?.AppbarPanelButtonDetails?.button?.id || '', undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFooterTabId]);

  /**
   * Create default tabs from configuration parameters (similar logic as in footer-bar).
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - appBarConfig');

    // Packages tab
    if (appBarConfig && appBarConfig.tabs.core.includes('basemap-panel')) {
      // create a new tab by loading the plugin
      api.plugin
        .loadScript('basemap-panel')
        .then((constructor: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue)) => {
          api.plugin.addPlugin(
            'basemap-panel',
            mapId,
            constructor,
            toJsonObject({
              mapId,
            })
          );
        });
    }
  }, [appBarConfig, mapId]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - create group of appbar buttons', mapId);

    // render footer bar tabs
    (appBarConfig?.tabs.core ?? [])
      .filter((tab) => tab === 'guide' || tab === 'details' || tab === 'legend')
      .map((tab): [TypeIconButtonProps, TypePanelProps, string] => {
        const button: TypeIconButtonProps = {
          id: `AppbarPanelButton${capitalize(tab)}`,
          tooltip: t(`${tab}.title`)!,
          tooltipPlacement: 'bottom',
          children: panels[tab].icon,
        };
        const panel: TypePanelProps = {
          panelId: `Appbar${capitalize(tab)}PanelId`,
          type: 'app-bar',
          title: capitalize(tab),
          icon: panels[tab].icon,
          content: panels[tab].content,
          width: 400,
          panelStyles: {
            panelCardContent: { padding: '0' },
          },
        };
        return [button, panel, tab];
      })
      .forEach((footerGroup) => api.maps[mapId].appBarButtons.createAppbarPanel(footerGroup[0], footerGroup[1], footerGroup[2]));

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appBarConfig?.tabs.core, mapId]);

  return (
    <Box sx={sxClasses.appBar} ref={appBar}>
      <Box sx={sxClasses.appBarButtons}>
        {appBarComponents.includes('geolocator') && interaction === 'dynamic' && (
          <Box>
            <List sx={sxClasses.appBarList}>
              <ListItem>
                <Geolocator />
              </ListItem>
            </List>
          </Box>
        )}

        {Object.keys(buttonPanelGroups).map((groupName: string) => {
          // get button panels from group
          const buttonPanels = buttonPanelGroups[groupName];

          // display the button panels in the list
          return (
            <List key={groupName} sx={sxClasses.appBarList}>
              {Object.keys(buttonPanels).map((buttonPanelsKey) => {
                const buttonPanel = buttonPanels[buttonPanelsKey];
                return buttonPanel?.button.visible !== undefined && buttonPanel?.button.visible ? (
                  <Fragment key={buttonPanel.button.id}>
                    <ListItem>
                      <IconButton
                        id={buttonPanel.button.id}
                        aria-label={buttonPanel.button.tooltip}
                        tooltip={buttonPanel.button.tooltip}
                        tooltipPlacement="right"
                        className={`style3 ${selectedAppBarButtonId === buttonPanel.button.id ? 'active' : ''}`}
                        size="small"
                        onClick={() => handleButtonClicked(buttonPanel.button.id!, groupName)}
                      >
                        {buttonPanel.button.children}
                      </IconButton>
                    </ListItem>
                  </Fragment>
                ) : null;
              })}
            </List>
          );
        })}
        {appBarComponents.includes('export') && (
          <Box>
            <List sx={sxClasses.appBarList}>
              <ListItem>
                <ExportButton className={` style3 ${activeModalId ? 'active' : ''}`} />
              </ListItem>
            </List>
          </Box>
        )}
        <Box sx={sxClasses.versionButtonDiv}>
          <List sx={sxClasses.appBarList}>
            <hr />
            <ListItem>
              <Notifications />
            </ListItem>
            <ListItem>
              <Version />
            </ListItem>
          </List>
        </Box>
      </Box>
      {Object.keys(buttonPanelGroups).map((groupName: string) => {
        // get button panels from group
        const buttonPanels = buttonPanelGroups[groupName];

        // display the panels in the list
        return (
          <Fragment key={groupName}>
            {Object.keys(buttonPanels).map((buttonPanelsKey) => {
              const buttonPanel = buttonPanels[buttonPanelsKey];
              return buttonPanel?.panel ? (
                <Panel
                  key={buttonPanel.panel.panelId}
                  panel={buttonPanel.panel}
                  button={buttonPanel.button}
                  onPanelOpened={buttonPanel.onPanelOpened}
                  onPanelClosed={hideClickMarker}
                  onGeneralCloseClicked={handleGeneralCloseClicked}
                />
              ) : null;
            })}
          </Fragment>
        );
      })}
    </Box>
  );
}
