import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect, useCallback, Fragment, useMemo, ReactNode, KeyboardEvent } from 'react';
import { capitalize, camelCase } from 'lodash';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  List,
  ListItem,
  Panel,
  IconButton,
  IconButtonPropsExtend,
  QuestionMarkIcon,
  InfoOutlinedIcon,
  LegendIcon,
  StorageIcon,
  SearchIcon,
  SendIcon,
  LayersOutlinedIcon,
} from '@/ui';
import { Plugin } from '@/api/plugin/plugin';
import { Geolocator } from '@/core/components/geolocator/geolocator';
import { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import ExportButton from '@/core/components/export/export-modal-button';
import {
  useUIActiveFocusItem,
  useUIAppbarComponents,
  useUIActiveAppBarTab,
  useUIStoreActions,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapInteraction, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import {
  useAppFullscreenActive,
  useAppGeoviewHTMLElement,
  useAppShow3dMap,
  useAppStoreActions,
} from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { Guide, Legend, DetailsPanel, AppBarApi, AppBarCreatedEvent, AppBarRemovedEvent, Datapanel, LayersPanel } from '@/core/components';
import Notifications from '@/core/components/notifications/notifications';

import Version from './buttons/version';
import { getSxClasses } from './app-bar-style';
import { enforceArrayOrder, helpClosePanelById, helpOpenPanelById } from './app-bar-helper';
import { TypeJsonObject, TypeJsonValue, toJsonObject } from '@/api/config/types/config-types';
import { AbstractPlugin } from '@/api/plugin/abstract-plugin';
import { CV_DEFAULT_APPBAR_CORE, CV_DEFAULT_APPBAR_TABS_ORDER } from '@/api/config/types/config-constants';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { TypeValidAppBarCoreProps } from '@/api/config/types/map-schema-types';
import { handleEscapeKey } from '@/core/utils/utilities';
import { OpenIn3dButton } from '../open-in-3d-button/open-in-3d-button';

interface GroupPanelType {
  icon: ReactNode;
  content: ReactNode;
}

type AppBarProps = {
  api: AppBarApi;
};

export interface ButtonPanelType {
  [panelType: string]: TypeButtonPanel;
}
export interface ButtonPanelGroupType {
  [panelId: string]: ButtonPanelType;
}

/**
 * Create an app-bar with buttons that can open a panel
 */
export function AppBar(props: AppBarProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-bar/app-bar');

  const { api: appBarApi } = props;

  const mapId = useGeoViewMapId();

  const { t } = useTranslation();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state
  const [buttonPanelGroups, setButtonPanelGroups] = useState<ButtonPanelGroupType>({});
  const appBar = useRef<HTMLDivElement>(null);

  // get store values and action
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const interaction = useMapInteraction();
  const appBarComponents = useUIAppbarComponents();
  const { tabId, tabGroup, isOpen, isFocusTrapped } = useUIActiveAppBarTab();
  const { hideClickMarker } = useMapStoreActions();

  const isMapFullScreen = useAppFullscreenActive();
  const show3dMap = useAppShow3dMap();

  const geoviewElement = useAppGeoviewHTMLElement().querySelector('[id^="mapTargetElement-"]') as HTMLElement;

  const { setActiveAppBarTab } = useUIStoreActions();
  const { setShow3dMap } = useAppStoreActions();

  // get store config for app bar to add (similar logic as in footer-bar)
  const appBarConfig = useGeoViewConfig()?.appBar;
  const footerBarConfig = useGeoViewConfig()?.footerBar;

  // #region REACT HOOKS

  const memoPanels = useMemo(() => {
    // Log
    logger.logTraceUseMemo('APP-BAR - panels');

    // TODO: Refactor - We should find a way to make this 'dictionary of supported components' dynamic.
    if (interaction === 'static') {
      return {};
    }
    return {
      geolocator: { icon: <SearchIcon />, content: <Geolocator key="geolocator" /> },
      openIn3dButton: { icon: <SendIcon />, content: <OpenIn3dButton key="openIn3dButton" /> },
      guide: { icon: <QuestionMarkIcon />, content: <Guide fullWidth containerType={CONTAINER_TYPE.APP_BAR} /> },
      details: { icon: <InfoOutlinedIcon />, content: <DetailsPanel fullWidth containerType={CONTAINER_TYPE.APP_BAR} /> },
      legend: { icon: <LegendIcon />, content: <Legend fullWidth containerType={CONTAINER_TYPE.APP_BAR} /> },
      layers: { icon: <LayersOutlinedIcon />, content: <LayersPanel containerType={CONTAINER_TYPE.APP_BAR} /> },
      'data-table': { icon: <StorageIcon />, content: <Datapanel containerType={CONTAINER_TYPE.APP_BAR} /> },
    } as unknown as Record<string, GroupPanelType>;
  }, [interaction]);

  const closePanelById = useCallback(
    (buttonId: string, groupName: string | undefined) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - closePanelById', buttonId);
      // Callback when removing and focus is lost
      const focusWhenNoElementCallback = (): void => {
        const mapCont = geoviewElement;
        mapCont?.focus();

        // if in focus trap mode, trigger the event
        if (mapCont?.closest('.geoview-map')?.classList.contains('map-focus-trap')) {
          mapCont.classList.add('keyboard-focus');
        }
      };

      // Redirect to helper
      helpClosePanelById(mapId, buttonPanelGroups, buttonId, groupName, setButtonPanelGroups, focusWhenNoElementCallback);
    },
    [buttonPanelGroups, geoviewElement, mapId]
  );

  const openPanelById = useCallback(
    (buttonId: string, groupName: string | undefined) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - openPanelById', buttonId);
      // Redirect to helper
      helpOpenPanelById(buttonPanelGroups, buttonId, groupName, setButtonPanelGroups, isFocusTrapped);
    },
    [buttonPanelGroups, isFocusTrapped]
  );

  const handleButtonClicked = useCallback(
    (buttonId: string, groupName: string) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleButtonClicked', buttonId);

      // Get the button panel
      const buttonPanel = buttonPanelGroups[groupName][buttonId];
      if (groupName === 'openIn3dButton') {
        setShow3dMap(!show3dMap);
      }
      setActiveAppBarTab(buttonId, groupName, !buttonPanel.panel?.status, !buttonPanel.panel?.status);
    },
    [buttonPanelGroups, setActiveAppBarTab, show3dMap, setShow3dMap]
  );

  const handleGeneralCloseClicked = useCallback(
    (buttonId: string, groupName: string) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleGeneralCloseClicked');

      setActiveAppBarTab(buttonId, groupName, false, false);
    },
    [setActiveAppBarTab]
  );

  const handleAddButtonPanel = useCallback(
    (sender: AppBarApi, event: AppBarCreatedEvent) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleAddButtonPanel', event);

      setButtonPanelGroups((prevState) => {
        return {
          ...prevState,
          [event.group]: {
            ...buttonPanelGroups[event.group],
            [event.buttonPanelId]: event.buttonPanel,
          },
        };
      });

      if (isOpen && tabId === event.buttonPanelId) openPanelById(tabId, tabGroup);
    },
    // Don't want to update every time active tab changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  /**
   * Get panel width based on window screen for data table and default for other panels
   * @param {string} tab tab which open the panel.
   */
  const getPanelWidth = useCallback(
    (tab: string): number => {
      let width = 400;
      if ((tab === CV_DEFAULT_APPBAR_CORE.DATA_TABLE || tab === CV_DEFAULT_APPBAR_CORE.LAYERS) && isMapFullScreen) {
        width = window.screen.width - 65;
      }
      if ((tab === CV_DEFAULT_APPBAR_CORE.DATA_TABLE || tab === CV_DEFAULT_APPBAR_CORE.LAYERS) && !isMapFullScreen) {
        width = geoviewElement?.clientWidth ?? 0;
      }
      return width;
    },
    [geoviewElement, isMapFullScreen]
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
    logger.logTraceUseEffect('APP-BAR - PANEL - OPEN/CLOSE ', isOpen);

    // Open and close of the panel.
    if (isOpen) {
      openPanelById(tabId, tabGroup);
    } else {
      closePanelById(tabId, tabGroup);
    }
    // NOTE: Run this effect when isOpen, tabId, tabGroup changes
    // should not re-render when openPanelById, closePanelById changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tabId, tabGroup]);

  /**
   * Create default tabs from configuration parameters (similar logic as in footer-bar).
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - appBarConfig');

    const processPlugin = (pluginName: TypeValidAppBarCoreProps): void => {
      // Packages tab
      if (appBarConfig && appBarConfig.tabs.core.includes(pluginName)) {
        // create a new tab by loading the plugin
        Plugin.loadScript(pluginName)
          .then((constructor: AbstractPlugin | ((pluginId: string, props: TypeJsonObject) => TypeJsonValue)) => {
            Plugin.addPlugin(
              pluginName,
              mapId,
              constructor,
              toJsonObject({
                mapId,
              })
            ).catch((error) => {
              // Log
              logger.logPromiseFailed(`api.plugin.addPlugin in useEffect in app-bar for ${pluginName}`, error);
            });
          })
          .catch((error) => {
            // Log
            logger.logPromiseFailed('api.plugin.loadScript in useEffect in app-bar', error);
          });
      }
    };
    processPlugin('aoi-panel');
    processPlugin('custom-legend');
  }, [appBarConfig, mapId]);

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - create group of AppBar buttons');

    // render app bar tabs
    const appBarConfigTabs = appBarConfig?.tabs.core ?? [];
    if (footerBarConfig?.tabs.core === undefined && !appBarConfigTabs.includes('guide')) {
      // inject guide tab if no footer bar config
      appBarConfigTabs.push('guide');
    }

    appBarConfigTabs
      .filter((tab) => CV_DEFAULT_APPBAR_TABS_ORDER.includes(tab) && memoPanels[tab])
      .map((tab): [IconButtonPropsExtend, TypePanelProps, string] => {
        const button: IconButtonPropsExtend = {
          id: `AppbarPanelButton${capitalize(tab)}`,
          tooltip: t(`${camelCase(tab)}.title`)!,
          tooltipPlacement: 'bottom',
          children: memoPanels[tab].icon,
        };
        const panel: TypePanelProps = {
          panelId: `Appbar${capitalize(tab)}PanelId`,
          panelGroupName: tab,
          type: CONTAINER_TYPE.APP_BAR,
          title: capitalize(tab),
          icon: memoPanels[tab].icon,
          content: memoPanels[tab].content,
          width: getPanelWidth(tab),
          panelStyles: {
            panelCardContent: { padding: '0' },
          },
        };
        return [button, panel, tab];
      })
      .forEach((appBarGroup) => appBarApi.createAppbarPanel(appBarGroup[0], appBarGroup[1], appBarGroup[2]));
  }, [footerBarConfig?.tabs.core, appBarConfig?.tabs.core, appBarApi, t, memoPanels, geoviewElement, getPanelWidth]);

  // #endregion

  /**
   * Re-order the appbar buttons.
   */
  const { topGroupNames, bottomGroupNames } = useMemo(() => {
    // Log
    logger.logTraceUseMemo('APP-BAR - panels reorder buttons');

    let buttonPanelGroupNames = Object.keys(buttonPanelGroups);
    buttonPanelGroupNames = enforceArrayOrder(buttonPanelGroupNames, CV_DEFAULT_APPBAR_TABS_ORDER);
    const topGroup = buttonPanelGroupNames.filter((groupName) => groupName !== CV_DEFAULT_APPBAR_CORE.GUIDE);
    const bottomGroup = buttonPanelGroupNames.filter((groupName) => groupName === CV_DEFAULT_APPBAR_CORE.GUIDE);
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
                        aria-label={t(buttonPanel.button.tooltip!) as string}
                        tooltip={t(buttonPanel.button.tooltip!) as string}
                        tooltipPlacement="right"
                        className={`buttonFilled ${tabId === buttonPanel.button.id && isOpen ? 'active' : ''}`}
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
        {renderButtonGroup(topGroupNames)}
        <Box sx={sxClasses.versionButtonDiv}>
          {appBarComponents.includes(CV_DEFAULT_APPBAR_CORE.EXPORT) && interaction === 'dynamic' && (
            <List sx={sxClasses.appBarList}>
              <ListItem>
                <ExportButton className={` buttonFilled ${activeModalId === CV_DEFAULT_APPBAR_CORE.EXPORT ? 'active' : ''}`} />
              </ListItem>
            </List>
          )}
          {renderButtonGroup(bottomGroupNames)}
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
              let content = null;
              const buttonPanel = buttonPanels[buttonPanelsKey];
              if (buttonPanel?.groupName === CV_DEFAULT_APPBAR_CORE.GEOLOCATOR) {
                content = buttonPanel?.panel?.content ?? '';
              } else if (buttonPanel?.groupName === CV_DEFAULT_APPBAR_CORE.OPEN_3D) {
                content = buttonPanel?.panel?.content ?? '';
              } else if (buttonPanel?.panel) {
                content = (
                  <Panel
                    key={`panel-${index.toString()}`}
                    panel={buttonPanel.panel}
                    button={buttonPanel.button}
                    onOpen={buttonPanel.onOpen}
                    onClose={hideClickMarker}
                    onKeyDown={(event: KeyboardEvent) =>
                      handleEscapeKey(event.key, tabId, isFocusTrapped, () => {
                        handleGeneralCloseClicked(buttonPanel.button?.id ?? '', buttonPanel?.groupName ?? '');
                      })
                    }
                    onGeneralClose={() => handleGeneralCloseClicked(buttonPanel.button?.id ?? '', buttonPanel?.groupName ?? '')}
                  />
                );
              }
              return content;
            })}
          </Fragment>
        );
      })}
    </Box>
  );
}
