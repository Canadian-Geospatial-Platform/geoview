import { useTranslation } from 'react-i18next';
import { useState, useEffect, useCallback, Fragment, useMemo, ReactNode, KeyboardEvent } from 'react';
import { camelCase } from 'lodash';
import { useTheme } from '@mui/material/styles';
import {
  Box,
  List,
  ListItem,
  Panel,
  IconButtonPropsExtend,
  QuestionMarkIcon,
  InfoOutlinedIcon,
  LegendIcon,
  StorageIcon,
  SearchIcon,
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
import { useAppFullscreenActive, useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import { Guide, Legend, DetailsPanel, AppBarApi, AppBarCreatedEvent, AppBarRemovedEvent, Datapanel, LayersPanel } from '@/core/components';
import Notifications from '@/core/components/notifications/notifications';

import Version from './buttons/version';
import { getSxClasses } from './app-bar-style';
import { enforceArrayOrder, helpClosePanelById, helpOpenPanelById } from './app-bar-helper';
import { CONTAINER_TYPE } from '@/core/utils/constant';
import { DEFAULT_APPBAR_CORE, DEFAULT_APPBAR_TABS_ORDER, TypeValidAppBarCoreProps } from '@/api/config/types/map-schema-types';
import { handleEscapeKey } from '@/core/utils/utilities';
import { Button } from '@/ui/button/button';

interface GroupPanelType {
  icon: ReactNode;
  content: ReactNode;
}

type AppBarProps = {
  api: AppBarApi;
  onScrollShellIntoView: () => void;
};

export interface ButtonPanelType {
  [panelType: string]: TypeButtonPanel;
}

/**
 * Create an app-bar with buttons that can open a panel
 */
export function AppBar(props: AppBarProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-bar/app-bar');

  const { api: appBarApi, onScrollShellIntoView } = props;

  const mapId = useGeoViewMapId();

  const { t } = useTranslation();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // internal component state
  const [buttonPanels, setButtonPanels] = useState<ButtonPanelType>({});

  // get store values and action
  const activeModalId = useUIActiveFocusItem().activeElementId;
  const interaction = useMapInteraction();
  const appBarComponents = useUIAppbarComponents();
  const { tabId, isOpen, isFocusTrapped } = useUIActiveAppBarTab();
  const { hideClickMarker } = useMapStoreActions();

  const isMapFullScreen = useAppFullscreenActive();

  const geoviewElement = useAppGeoviewHTMLElement().querySelector('[id^="mapTargetElement-"]') as HTMLElement;

  const { setActiveAppBarTab } = useUIStoreActions();

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
      guide: { icon: <QuestionMarkIcon />, content: <Guide fullWidth containerType={CONTAINER_TYPE.APP_BAR} /> },
      details: { icon: <InfoOutlinedIcon />, content: <DetailsPanel fullWidth containerType={CONTAINER_TYPE.APP_BAR} /> },
      legend: { icon: <LegendIcon />, content: <Legend fullWidth containerType={CONTAINER_TYPE.APP_BAR} /> },
      layers: { icon: <LayersOutlinedIcon />, content: <LayersPanel containerType={CONTAINER_TYPE.APP_BAR} /> },
      'data-table': { icon: <StorageIcon />, content: <Datapanel containerType={CONTAINER_TYPE.APP_BAR} /> },
    } as Record<string, GroupPanelType>;
  }, [interaction]);

  const closePanelById = useCallback(
    (buttonId: string) => {
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
      helpClosePanelById(mapId, buttonId, setButtonPanels, focusWhenNoElementCallback);
    },
    [geoviewElement, mapId]
  );

  const openPanelById = useCallback(
    (buttonId: string) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - openPanelById', buttonId);
      // Redirect to helper
      helpOpenPanelById(buttonId, setButtonPanels, isFocusTrapped);
    },
    [isFocusTrapped]
  );

  const handleButtonClicked = useCallback(
    (buttonId: string) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleButtonClicked', buttonId);

      // Get the button panel
      const buttonPanel = buttonPanels[buttonId];
      setActiveAppBarTab(buttonId, !buttonPanel.panel?.status, !buttonPanel.panel?.status);
    },
    [buttonPanels, setActiveAppBarTab]
  );

  const handleGeneralCloseClicked = useCallback(
    (buttonId: string) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleGeneralCloseClicked');

      setActiveAppBarTab(buttonId, false, false);
    },
    [setActiveAppBarTab]
  );

  const handleAddButtonPanel = useCallback(
    (sender: AppBarApi, event: AppBarCreatedEvent) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleAddButtonPanel', event);

      setButtonPanels((prevState) => {
        return {
          ...prevState,
          [event.buttonPanelId]: event.buttonPanel,
        };
      });

      if (isOpen && tabId === event.buttonPanelId) openPanelById(tabId);
    },
    // Don't want to update every time active tab changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [buttonPanels]
  );

  const handleRemoveButtonPanel = useCallback(
    (sender: AppBarApi, event: AppBarRemovedEvent) => {
      // Log
      logger.logTraceUseCallback('APP-BAR - handleRemoveButtonPanel', event);

      setButtonPanels((prevState) => {
        const state = { ...prevState };

        delete state[event.buttonPanelId];

        return state;
      });
    },
    [setButtonPanels]
  );

  /**
   * Get panel width based on window screen for data table and default for other panels
   * @param {string} tab tab which open the panel.
   */
  const getPanelWidth = useCallback(
    (tab: string): number => {
      let width = 400;
      if ((tab === DEFAULT_APPBAR_CORE.DATA_TABLE || tab === DEFAULT_APPBAR_CORE.LAYERS) && isMapFullScreen) {
        width = window.screen.width - 65;
      }
      if ((tab === DEFAULT_APPBAR_CORE.DATA_TABLE || tab === DEFAULT_APPBAR_CORE.LAYERS) && !isMapFullScreen) {
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
      openPanelById(tabId);
    } else {
      closePanelById(tabId);
    }
    // NOTE: Run this effect when isOpen, tabId changes
    // should not re-render when openPanelById, closePanelById changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, tabId]);

  /**
   * Create default tabs from configuration parameters (similar logic as in footer-bar).
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - appBarConfig');

    const processPlugin = (pluginName: TypeValidAppBarCoreProps): void => {
      // Packages tab
      if (appBarConfig && appBarConfig.tabs.core.includes(pluginName)) {
        Plugin.loadScript(pluginName)
          .then((typePlugin) => {
            Plugin.addPlugin(pluginName, typePlugin, mapId).catch((error: unknown) => {
              // Log
              logger.logPromiseFailed(`api.plugin.addPlugin in useEffect in app-bar for ${pluginName}`, error);
            });
          })
          .catch((error: unknown) => {
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
      .filter((tab) => DEFAULT_APPBAR_TABS_ORDER.includes(tab) && memoPanels[tab])
      .map((tab): [IconButtonPropsExtend, TypePanelProps, string] => {
        const button: IconButtonPropsExtend = {
          id: tab,
          tooltip: t(`${camelCase(tab)}.title`)!,
          tooltipPlacement: 'bottom',
          children: memoPanels[tab].icon,
        };
        const panel: TypePanelProps = {
          panelId: tab,
          type: CONTAINER_TYPE.APP_BAR,
          title: `${camelCase(tab)}.title`,
          icon: memoPanels[tab].icon,
          content: memoPanels[tab].content,
          width: getPanelWidth(tab),
          panelStyles: {
            panelCardContent: { padding: '0' },
          },
        };
        return [button, panel, tab];
      })
      .forEach((appBarTab) => appBarApi.createAppbarPanel(appBarTab[0], appBarTab[1]));
  }, [footerBarConfig?.tabs.core, appBarConfig?.tabs.core, appBarApi, t, memoPanels, geoviewElement, getPanelWidth]);

  // #endregion

  /**
   * Re-order the appbar buttons.
   */
  const { topPanelNames, bottomPanelNames } = useMemo(() => {
    // Log
    logger.logTraceUseMemo('APP-BAR - panels reorder buttons');

    let buttonPanelNames = Object.keys(buttonPanels);
    buttonPanelNames = enforceArrayOrder(buttonPanelNames, DEFAULT_APPBAR_TABS_ORDER);
    const topPanel = buttonPanelNames.filter((groupName) => groupName !== DEFAULT_APPBAR_CORE.GUIDE);
    const bottomPanel = buttonPanelNames.filter((groupName) => groupName === DEFAULT_APPBAR_CORE.GUIDE);

    return { topPanelNames: topPanel, bottomPanelNames: bottomPanel };
  }, [buttonPanels]);

  /**
   * Render Tabs in appbar.
   * @param {string[]} panelNames tab that will be rendered in appbar.
   * @returns JSX.Element
   */
  const renderButtonPanel = (panelNames: string[]): ReactNode => {
    return (
      <>
        {panelNames.map((panelName: string) => {
          // get button panels from group
          const buttonPanel = buttonPanels[panelName];

          // display the button panels in the list
          return (
            <List key={panelName} sx={sxClasses.appBarList}>
              {buttonPanel?.button.visible !== undefined && buttonPanel?.button.visible ? (
                <Fragment key={buttonPanel.button.id}>
                  <ListItem>
                    <Button
                      id={buttonPanel.button.id}
                      aria-label={t(buttonPanel.button.tooltip!)!}
                      tooltip={t(buttonPanel.button.tooltip!)!}
                      tooltipPlacement="right"
                      className={`buttonFilled ${tabId === buttonPanel.button.id && isOpen ? 'active' : ''}`}
                      size="small"
                      onClick={() => handleButtonClicked(buttonPanel.button.id!)}
                      startIcon={buttonPanel.button.children}
                      type="icon"
                    />
                  </ListItem>
                </Fragment>
              ) : null}
            </List>
          );
        })}
      </>
    );
  };

  return (
    <Box sx={sxClasses.appBar} className={`interaction-${interaction}`} id={`${mapId}-appBar`} onClick={onScrollShellIntoView}>
      <Box sx={sxClasses.appBarButtons}>
        {renderButtonPanel(topPanelNames)}
        <Box sx={sxClasses.versionButtonDiv}>
          {appBarComponents.includes(DEFAULT_APPBAR_CORE.EXPORT) && interaction === 'dynamic' && (
            <List sx={sxClasses.appBarList}>
              <ListItem>
                <ExportButton className={` buttonFilled ${activeModalId === DEFAULT_APPBAR_CORE.EXPORT ? 'active' : ''}`} />
              </ListItem>
            </List>
          )}
          {renderButtonPanel(bottomPanelNames)}
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
      {Object.keys(buttonPanels).map((panelName: string) => {
        // get button panel
        const buttonPanel = buttonPanels[panelName];
        let content = null;
        if (buttonPanel?.buttonPanelId === DEFAULT_APPBAR_CORE.GEOLOCATOR) {
          content = buttonPanel?.panel?.content ?? '';
        } else if (buttonPanel?.panel) {
          content = (
            <Panel
              panel={buttonPanel.panel}
              button={buttonPanel.button}
              onOpen={buttonPanel.onOpen}
              onClose={hideClickMarker}
              onKeyDown={(event: KeyboardEvent) =>
                handleEscapeKey(event.key, tabId, isFocusTrapped, () => {
                  handleGeneralCloseClicked(buttonPanel.button?.id ?? '');
                })
              }
              onGeneralClose={() => handleGeneralCloseClicked(buttonPanel.button?.id ?? '')}
            />
          );
        }
        // display the panels in the list
        return <Fragment key={panelName}>{content}</Fragment>;
      })}
    </Box>
  );
}
