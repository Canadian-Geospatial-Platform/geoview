import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect, useCallback, Fragment, useMemo, ReactNode } from 'react';
import { capitalize } from 'lodash';
import { useTheme } from '@mui/material/styles';
import { Box, List, ListItem, Panel, IconButton, TypeIconButtonProps, SchoolIcon, InfoOutlinedIcon, HubOutlinedIcon } from '@/ui';

import { Plugin } from '@/api/plugin/plugin';

import { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import ExportButton from '@/core/components/export/export-modal-button';
import {
  useUIActiveAppBarPanelId,
  useUIActiveFocusItem,
  useUIAppbarComponents,
  useUIAppbarGeolocatorActive,
  useUIStoreActions,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapInteraction, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { GuidePanel, Legend, DetailsPanel, AppBarApi, AppBarCreatedEvent, AppBarRemovedEvent } from '@/core/components';
import Notifications from '@/core/components/notifications/notifications';

import Geolocator from './buttons/geolocator';
import Version from './buttons/version';
import { getSxClasses } from './app-bar-style';
import { enforceArrayOrder, helpCloseAll, helpClosePanelById, helpOpenPanelById } from './app-bar-helper';
import { TypeJsonObject, TypeJsonValue, toJsonObject } from '@/core/types/global-types';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';

interface GroupPanelType {
  icon: ReactNode;
  content: ReactNode;
}

type AppBarProps = {
  api: AppBarApi;
};

/**
 * Create an app-bar with buttons that can open a panel
 */
export function AppBar(props: AppBarProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-bar/app-bar');

  const { api: appBarApi } = props;

  const appBarTabRefs = useRef(['legend', 'details', 'guide']);

  const mapId = useGeoViewMapId();

  const { t } = useTranslation();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state
  const [buttonPanelGroups, setButtonPanelGroups] = useState<Record<string, Record<string, TypeButtonPanel>>>({});
  const appBar = useRef<HTMLDivElement>(null);

  // get store values and action
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const interaction = useMapInteraction();
  const appBarComponents = useUIAppbarComponents();
  const { hideClickMarker } = useMapStoreActions();
  const activeAppBarPanelId = useUIActiveAppBarPanelId();
  const geoviewElement = useAppGeoviewHTMLElement().querySelector('[id^="mapTargetElement-"]') as HTMLElement;

  const { setGeolocatorActive, setActiveAppBarPanelId } = useUIStoreActions();
  const isGeolocatorActive = useUIAppbarGeolocatorActive();

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
      const focusWhenNoElementCallback = (): void => {
        const mapCont = geoviewElement;
        mapCont.focus();

        // if in focus trap mode, trigger the event
        if (mapCont.closest('.geoview-map')?.classList.contains('map-focus-trap')) {
          mapCont.classList.add('keyboard-focus');
        }
      };

      // Redirect to helper
      helpClosePanelById(mapId, buttonPanelGroups, buttonId, groupName, setButtonPanelGroups, focusWhenNoElementCallback);
      setActiveAppBarPanelId('');
    },
    [buttonPanelGroups, geoviewElement, mapId, setActiveAppBarPanelId]
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
      setActiveAppBarPanelId(buttonId);
    },
    [buttonPanelGroups, closeAll, setActiveAppBarPanelId]
  );

  const handleButtonClicked = useCallback(
    (buttonId: string, groupName: string) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleButtonClicked', buttonId);

      // close geolocator if opened when panel is open.
      if (isGeolocatorActive) {
        setGeolocatorActive(false);
      }

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
    [buttonPanelGroups, closePanelById, isGeolocatorActive, openPanelById, setGeolocatorActive]
  );

  const handleGeneralCloseClicked = useCallback(() => {
    // Log
    logger.logTraceUseCallback('APP-BAR - handleGeneralCloseClicked', activeAppBarPanelId);

    // Close it
    closePanelById(activeAppBarPanelId, undefined);
  }, [activeAppBarPanelId, closePanelById]);

  const handleAddButtonPanel = useCallback(
    (sender: AppBarApi, event: AppBarCreatedEvent) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleAddButtonPanel', event);

      setButtonPanelGroups((prevState) => {
        return {
          ...prevState,
          ...buttonPanelGroups,
          [event.group]: {
            ...buttonPanelGroups[event.group],
            [event.buttonPanelId]: event.buttonPanel,
          },
        };
      });
    },
    [buttonPanelGroups]
  );

  const handleRemoveButtonPanel = useCallback(
    (sender: AppBarApi, event: AppBarRemovedEvent) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleRemoveButtonPanel', event);

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
    logger.logTraceUseEffect('APP-BAR - mount');

    // Register AppBar created/removed handlers
    appBarApi.onAppBarCreated(handleAddButtonPanel);
    appBarApi.onAppBarRemoved(handleRemoveButtonPanel);

    return () => {
      // Unregister events
      appBarApi.offAppBarCreated(handleAddButtonPanel);
      appBarApi.offAppBarRemoved(handleRemoveButtonPanel);
    };
  }, [appBarApi, handleAddButtonPanel, handleRemoveButtonPanel]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - open detail panel when clicked on map', mapId);
    // open AppBar detail drawer when click on map.
    if (activeAppBarPanelId === 'AppbarPanelButtonDetails' && buttonPanelGroups?.details?.AppbarPanelButtonDetails?.panel) {
      // close geolocator when user click on map layer.
      if (isGeolocatorActive) {
        setGeolocatorActive(false);
      }
      // Open it
      openPanelById(buttonPanelGroups?.details?.AppbarPanelButtonDetails?.button?.id || '', undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeAppBarPanelId]);

  /**
   * Create default tabs from configuration parameters (similar logic as in footer-bar).
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - appBarConfig');

    // Packages tab
    if (appBarConfig && appBarConfig.tabs.core.includes('basemap-panel')) {
      // create a new tab by loading the plugin
      Plugin.loadScript('basemap-panel')
        .then((constructor: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue)) => {
          Plugin.addPlugin(
            'basemap-panel',
            mapId,
            constructor,
            toJsonObject({
              mapId,
            })
          ).catch((error) => {
            // Log
            logger.logPromiseFailed('api.plugin.addPlugin in useEffect in app-bar', error);
          });
        })
        .catch((error) => {
          // Log
          logger.logPromiseFailed('api.plugin.loadScript in useEffect in app-bar', error);
        });
    }
  }, [appBarConfig, mapId]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - create group of AppBar buttons');

    // render footer bar tabs
    (appBarConfig?.tabs.core ?? [])
      .filter((tab) => appBarTabRefs.current.includes(tab))
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
      .forEach((footerGroup) => appBarApi.createAppbarPanel(footerGroup[0], footerGroup[1], footerGroup[2]));
  }, [appBarConfig?.tabs.core, appBarApi, t, memoPanels]);

  // #endregion

  /**
   * Re-order the footer tab buttons.
   */
  const { topGroupNames, bottomGroupNames } = useMemo(() => {
    // Log
    logger.logTraceUseMemo('APP-BAR - panels');

    let buttonPanelGroupNames = Object.keys(buttonPanelGroups);
    buttonPanelGroupNames = enforceArrayOrder(buttonPanelGroupNames, appBarTabRefs.current);
    const topGroup = buttonPanelGroupNames.filter((groupName) => groupName !== 'guide');
    const bottomGroup = buttonPanelGroupNames.filter((groupName) => groupName === 'guide');
    return { topGroupNames: topGroup, bottomGroupNames: bottomGroup };
  }, [buttonPanelGroups]);

  /**
   * Render Tab groups in appbar.
   * @param {string[]} groupNames group that will be rendered in appbar.
   * @returns JSX.Element
   */
  const renderButtonGroup = (groupNames: string[]): ReactNode => {
    return (
      <>
        {groupNames.map((groupName: string) => {
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
                        className={`style3 ${activeAppBarPanelId === buttonPanel.button.id ? 'active' : ''}`}
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
      </>
    );
  };

  return (
    <Box sx={sxClasses.appBar} className={`interaction-${interaction}`} ref={appBar}>
      <Box sx={sxClasses.appBarButtons}>
        {appBarComponents.includes('geolocator') && interaction === 'dynamic' && (
          <Box>
            <List sx={sxClasses.appBarList}>
              <ListItem>
                <Geolocator closeAllPanels={closeAll} />
              </ListItem>
            </List>
          </Box>
        )}

        {renderButtonGroup(topGroupNames)}

        <Box sx={sxClasses.versionButtonDiv}>
          {renderButtonGroup(bottomGroupNames)}
          {appBarComponents.includes('export') && interaction === 'dynamic' && (
            <List sx={sxClasses.appBarList}>
              <ListItem>
                <ExportButton className={` style3 ${activeModalId ? 'active' : ''}`} />
              </ListItem>
            </List>
          )}
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
