import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect, useCallback, Fragment, useMemo, ReactNode } from 'react';
import { capitalize } from 'lodash';
import { useTheme } from '@mui/material/styles';
import { Box, List, ListItem, Panel, IconButton, TypeIconButtonProps, SchoolIcon, InfoOutlinedIcon, HubOutlinedIcon } from '@/ui';

import { api } from '@/app';

import { ButtonPanelPayload } from '@/api/events/payloads';

import { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import ExportButton from '@/core/components/export/export-modal-button';
import {
  useUIActiveFocusItem,
  useUIActiveFooterBarTabId,
  useUIAppbarComponents,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapInteraction, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { GuidePanel, Legend, DetailsPanel } from '@/core/components';
import Notifications from '@/core/components/notifications/notifications';

import Geolocator from './buttons/geolocator';
import Version from './buttons/version';
import { getSxClasses } from './app-bar-style';
import { helpCloseAll, helpClosePanelById, helpOpenPanelById } from './app-bar-helper';
import { TypeJsonObject, TypeJsonValue, toJsonObject } from '@/core/types/global-types';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';

interface GroupPanelType {
  icon: ReactNode;
  content: ReactNode;
}

/**
 * Create an app-bar with buttons that can open a panel
 */
export function Appbar(): JSX.Element {
  // ? No props for this component. Same logic in FooterBar and NavBar.
  // ? We are handling the logic via api.event management, via app-bar-api, once this component is mounted.

  // Log
  logger.logTraceRender('components/app-bar/app-bar');

  const mapId = useGeoViewMapId();

  const { t } = useTranslation();

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

  const memoPanels = useMemo(() => {
    // Log
    logger.logTraceUseMemo('APP-BAR - panels');

    // TODO: Refactor - We should find a way to make this 'dictionary of supported components' dynamic.
    return {
      legend: { icon: <HubOutlinedIcon />, content: <Legend fullWidth /> },
      guide: { icon: <SchoolIcon />, content: <GuidePanel fullWidth /> },
      details: { icon: <InfoOutlinedIcon />, content: <DetailsPanel fullWidth /> },
    } as unknown as Record<string, GroupPanelType>;
  }, []);

  const closePanelById = useCallback(
    (buttonId: string, groupName: string | undefined) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - closePanelById', buttonId);

      // Callback when removing and focus is lost
      const focusWhenNoElementCallback = () => {
        const mapCont = api.maps[mapId].map.getTargetElement();
        mapCont.focus();

        // if in focus trap mode, trigger the event
        if (mapCont.closest('.geoview-map')?.classList.contains('map-focus-trap')) {
          mapCont.classList.add('keyboard-focus');
          api.event.emitMapInKeyFocus(mapId);
        }
      };

      // Redirect to helper
      helpClosePanelById(mapId, buttonPanelGroups, buttonId, groupName, setButtonPanelGroups, focusWhenNoElementCallback);
      setSelectedAppbarButtonId('');
    },
    [buttonPanelGroups, mapId]
  );

  const closeAll = useCallback(() => {
    // Log
    logger.logTraceUseCallback('APP-BAR - closeAll');

    // Redirect to helper
    helpCloseAll(buttonPanelGroups, closePanelById);
  }, [buttonPanelGroups, closePanelById]);

  const openPanelById = useCallback(
    (buttonId: string, groupName: string | undefined) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - openPanelById', buttonId);

      // Redirect to helper
      helpOpenPanelById(buttonPanelGroups, buttonId, groupName, setButtonPanelGroups, closeAll);
      setSelectedAppbarButtonId(buttonId);
    },
    [buttonPanelGroups, closeAll]
  );

  const handleButtonClicked = useCallback(
    (buttonId: string, groupName: string) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleButtonClicked', buttonId);

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
    // Log
    logger.logTraceUseCallback('APP-BAR - handleGeneralCloseClicked', selectedAppBarButtonId);

    // Close it
    closePanelById(selectedAppBarButtonId, undefined);
  }, [selectedAppBarButtonId, closePanelById]);

  const handleAddButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleAddButtonPanel');

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

  const handleRemoveButtonPanel = useCallback(
    (payload: ButtonPanelPayload) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleRemoveButtonPanel');

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
    logger.logTraceUseEffect('APP-BAR - mount', mapId);

    // listen to new panel creation
    api.event.onCreateAppBarPanel(mapId, handleAddButtonPanel);

    // listen on panel removal
    api.event.onRemoveAppBarPanel(mapId, handleRemoveButtonPanel);

    return () => {
      // Unregister events
      api.event.offCreateAppBarPanel(mapId, handleAddButtonPanel);
      api.event.offRemoveAppBarPanel(mapId, handleRemoveButtonPanel);
    };
  }, [mapId, handleAddButtonPanel, handleRemoveButtonPanel, selectedAppBarButtonId]);

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
          children: memoPanels[tab].icon,
        };
        const panel: TypePanelProps = {
          panelId: `Appbar${capitalize(tab)}PanelId`,
          type: 'app-bar',
          title: capitalize(tab),
          icon: memoPanels[tab].icon,
          content: memoPanels[tab].content,
          width: 400,
          panelStyles: {
            panelCardContent: { padding: '0' },
          },
        };
        return [button, panel, tab];
      })
      .forEach((footerGroup) => api.maps[mapId].appBarApi.createAppbarPanel(footerGroup[0], footerGroup[1], footerGroup[2]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appBarConfig?.tabs.core, mapId]); // Not exhaustive, because it'd be dangerous to trigger on `panels` or on `t`, because of how the appbar panels are just recreated all the time (should refactor this, maybe..)

  // #endregion

  return (
    <Box sx={sxClasses.appBar} className={`interaction-${interaction}`} ref={appBar}>
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
        {appBarComponents.includes('export') && interaction === 'dynamic' && (
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
            {interaction === 'dynamic' && <hr />}
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
            {Object.keys(buttonPanels).map((buttonPanelsKey, index) => {
              const buttonPanel = buttonPanels[buttonPanelsKey];

              return buttonPanel?.panel ? (
                <Panel
                  // eslint-disable-next-line react/no-array-index-key
                  key={`panel-${index}`}
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
