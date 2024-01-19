import { useState, useRef, useEffect, useCallback, Fragment } from 'react';

import { useTheme } from '@mui/material/styles';
import { Box, List, ListItem, Panel, IconButton } from '@/ui';

import { AbstractPlugin, TypeJsonObject, TypeJsonValue, api, toJsonObject, useGeoViewMapId } from '@/app';
import { EVENT_NAMES } from '@/api/events/event-types';

import { payloadIsAButtonPanel, ButtonPanelPayload, PayloadBaseClass } from '@/api/events/payloads';
import { TypeButtonPanel } from '@/ui/panel/panel-types';

import ExportButton from '@/core/components/export/export-modal-button';
import Geolocator from './buttons/geolocator';
import Notifications from '@/core/components/notifications/notifications';
import Version from './buttons/version';
import { getSxClasses } from './app-bar-style';
import { useUIActiveFocusItem, useUIAppbarComponents } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapInteraction } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewConfig } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';

/**
 * Create an app-bar with buttons that can open a panel
 */
export function Appbar(): JSX.Element {
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

  const appBarPanelCloseListenerFunction = () => setSelectedAppbarButtonId('');

  // get store config for app bar tabs to add (similar logic as in footer-tabs)
  const appBarTabsConfig = useGeoViewConfig()?.appBarTabs;

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
    // Log
    logger.logTraceUseEffect('APP-BAR - addButtonPanel', mapId);
    logger.logDebug('APP-BAR - addButtonPanel', mapId); // remove this one when things stabilize

    const appBarPanelCreateListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAButtonPanel(payload)) addButtonPanel(payload);
    };
    // listen to new panel creation
    api.event.on(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, appBarPanelCreateListenerFunction, mapId);

    const appBarPanelRemoveListenerFunction = (payload: PayloadBaseClass) => {
      if (payloadIsAButtonPanel(payload)) removeButtonPanel(payload);
    };

    // listen on panel removal
    api.event.on(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, appBarPanelRemoveListenerFunction, mapId);

    // listen on panel close
    api.event.on(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, appBarPanelCloseListenerFunction, `${mapId}/${selectedAppBarButtonId}`);

    return () => {
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_CREATE, mapId, appBarPanelCreateListenerFunction);
      api.event.off(EVENT_NAMES.APPBAR.EVENT_APPBAR_PANEL_REMOVE, mapId, appBarPanelRemoveListenerFunction);
      api.event.off(EVENT_NAMES.PANEL.EVENT_PANEL_CLOSE, mapId, appBarPanelCloseListenerFunction);
    };
  }, [addButtonPanel, mapId, removeButtonPanel, selectedAppBarButtonId]);
  // #endregion

  /**
   * Create default tabs from configuration parameters (similar logic as in footer-tabs).
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('app-bar.appBarTabsConfig');

    // Packages tab
    if (appBarTabsConfig && appBarTabsConfig.tabs.core.includes('basemap-panel')) {
      // create a new tab by loading the time-slider plugin
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
  }, [appBarTabsConfig, mapId]);

  return (
    <Box sx={sxClasses.appBar} ref={appBar}>
      <Box sx={sxClasses.appBarButtons}>
        {appBarComponents.includes('geolocator') && interaction === 'dynamic' && (
          <Box>
            <List sx={sxClasses.appBarList}>
              <ListItem>
                <Geolocator sx={sxClasses.appBarButton} />
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
                        className={`${sxClasses.appBarButton} ${selectedAppBarButtonId === buttonPanel.button.id ? 'active' : ''}`}
                        size="small"
                        onClick={() => {
                          if (!buttonPanel.panel?.status) {
                            buttonPanel.panel?.open();
                            setSelectedAppbarButtonId(buttonPanel?.button?.id ?? '');
                          } else {
                            buttonPanel.panel?.close();
                            setSelectedAppbarButtonId('');
                          }
                        }}
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
                <ExportButton className={`${sxClasses.appBarButton} ${activeModalId ? 'export' : ''}`} />
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
                  handlePanelOpened={buttonPanel.handlePanelOpened}
                />
              ) : null;
            })}
          </Fragment>
        );
      })}
    </Box>
  );
}
