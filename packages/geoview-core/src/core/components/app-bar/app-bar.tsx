import { useTranslation } from 'react-i18next';
import type { ReactNode, KeyboardEvent } from 'react';
import { useState, useEffect, useCallback, Fragment, useMemo } from 'react';
import { useTheme } from '@mui/material/styles';
import type { IconButtonPropsExtend } from '@/ui';
import {
  Box,
  List,
  ListItem,
  Panel,
  QuestionMarkIcon,
  InfoOutlinedIcon,
  LegendIcon,
  StorageIcon,
  SearchIcon,
  LayersOutlinedIcon,
} from '@/ui';

import { Geolocator } from '@/core/components/geolocator/geolocator';
import type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import ExportButton from '@/core/components/export/export-modal-button';
import {
  useUIActiveFocusItem,
  useUIActiveTrapGeoView,
  useUIAppbarComponents,
  useUIActiveAppBarTab,
  useUIHiddenTabs,
  useUIStoreActions,
} from '@/core/stores/store-interface-and-intial-values/ui-state';
import { useMapInteraction, useMapStoreActions } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useAppGeoviewHTMLElement } from '@/core/stores/store-interface-and-intial-values/app-state';
import { useGeoViewConfig, useGeoViewMapId } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import type { AppBarApi, AppBarCreatedEvent, AppBarRemovedEvent } from '@/core/components';
import { Guide, Legend, DetailsPanel, Datapanel, LayersPanel } from '@/core/components';
import Notifications from '@/core/components/notifications/notifications';

import Version from './buttons/version';
import Share from './buttons/share';
import { getSxClasses } from './app-bar-style';
import { enforceArrayOrder, helpClosePanelById, helpOpenPanelById } from './app-bar-helper';
import { CONTAINER_TYPE, LIGHTBOX_SELECTORS, TIMEOUT } from '@/core/utils/constant';
import type { TypeValidAppBarCoreProps } from '@/api/types/map-schema-types';
import { DEFAULT_APPBAR_CORE, DEFAULT_APPBAR_TABS_ORDER } from '@/api/types/map-schema-types';
import { camelCase, handleEscapeKey } from '@/core/utils/utilities';
import { IconButton } from '@/ui/icon-button/icon-button';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

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
  const hiddenTabs = useUIHiddenTabs();
  const { hideClickMarker } = useMapStoreActions();
  const activeTrapGeoView = useUIActiveTrapGeoView();

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
      guide: { icon: <QuestionMarkIcon />, content: <Guide containerType={CONTAINER_TYPE.APP_BAR} /> },
      details: { icon: <InfoOutlinedIcon />, content: <DetailsPanel containerType={CONTAINER_TYPE.APP_BAR} /> },
      legend: { icon: <LegendIcon />, content: <Legend containerType={CONTAINER_TYPE.APP_BAR} /> },
      layers: { icon: <LayersOutlinedIcon />, content: <LayersPanel containerType={CONTAINER_TYPE.APP_BAR} /> },
      'data-table': { icon: <StorageIcon />, content: <Datapanel containerType={CONTAINER_TYPE.APP_BAR} /> },
    } as Record<string, GroupPanelType>;
  }, [interaction]);

  /**
   * Constructs the AppBar element ID for buttons and panels.
   *
   * @param buttonId - The button identifier
   * @param suffix - Optional suffix to append (e.g., '-panel-btn', '-panel')
   * @returns The full element ID
   */
  const getButtonElementId = useCallback(
    (buttonId: string, suffix?: string): string => {
      return `${mapId}-${CONTAINER_TYPE.APP_BAR}-${buttonId}${suffix ?? ''}`;
    },
    [mapId]
  );

  const closePanelById = useCallback(
    (buttonId: string) => {
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
      // Redirect to helper
      helpOpenPanelById(buttonId, setButtonPanels, isFocusTrapped);
    },
    [isFocusTrapped]
  );

  const handleButtonClicked = useCallback(
    (buttonId: string) => {
      // Get the button panel
      const buttonPanel = buttonPanels[buttonId];
      setActiveAppBarTab(buttonId, !buttonPanel.panel?.status, !buttonPanel.panel?.status);
    },
    [buttonPanels, setActiveAppBarTab]
  );

  const handleGeneralCloseClicked = useCallback(
    (buttonId: string) => {
      // Return focus to the AppBar button that opened this panel
      if (isFocusTrapped) {
        setTimeout(() => {
          document.getElementById(getButtonElementId(buttonId, '-panel-btn'))?.focus();
        }, TIMEOUT.dataPanelLoading);
      }

      setActiveAppBarTab(buttonId, false, false);
    },
    [setActiveAppBarTab, isFocusTrapped, getButtonElementId]
  );

  const handleAddButtonPanel = useCallback(
    (sender: AppBarApi, event: AppBarCreatedEvent) => {
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
      setButtonPanels((prevState) => {
        const state = { ...prevState };

        delete state[event.buttonPanelId];

        return state;
      });
    },
    [setButtonPanels]
  );

  /**
   * Panels default to a 100% width of the map container, legend and details panels are set to be slimmer
   *
   * @param {string} tab - The id of the panel
   * @returns {number} The width for the panel
   */
  const getPanelWidth = useCallback((tab: string): number => {
    let width = 100;

    // set these panels to be slimmer
    if (tab === DEFAULT_APPBAR_CORE.LEGEND || tab === DEFAULT_APPBAR_CORE.DETAILS) {
      width = 30;
    }

    return width;
  }, []);

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

    // Get built-in core components
    const builtInCoreComponents = Object.values(DEFAULT_APPBAR_CORE) as TypeValidAppBarCoreProps[];

    // Process all configured plugins dynamically
    if (appBarConfig?.tabs.core) {
      appBarConfig.tabs.core.forEach((pluginName) => {
        // Skip built-in components
        if (builtInCoreComponents.includes(pluginName)) {
          return;
        }

        // Load and add the plugin
        MapEventProcessor.loadAndAddPlugin(mapId, pluginName).catch((error: unknown) => {
          // Log
          logger.logPromiseFailed('loadAndAddPlugin(time-slider) in processPlugin in app-bar', error);
        });
      });
    }
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
          'aria-label': t(`${camelCase(tab)}.title`),
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
    // Map through panel names and create ListItems for visible buttons
    const visibleButtons = panelNames
      .filter((name) => !hiddenTabs.includes(name))
      .map((panelName: string) => {
        // Get the button panel configuration for this panel name
        const buttonPanel = buttonPanels[panelName];

        // Only render if the button is explicitly set to visible
        if (buttonPanel?.button.visible !== undefined && buttonPanel?.button.visible) {
          // WCAG - Compute ARIA attributes before rendering
          const isPanelOpen: boolean = tabId === buttonPanel.button.id && isOpen;
          const expandedState: 'true' | 'false' = isPanelOpen ? 'true' : 'false';
          const ariaControls: string | undefined = activeTrapGeoView ? undefined : getButtonElementId(buttonPanel.button.id!, '-panel');
          const ariaExpanded: 'true' | 'false' | undefined = activeTrapGeoView ? undefined : expandedState;

          return (
            <ListItem key={buttonPanel.button.id}>
              <IconButton
                id={getButtonElementId(buttonPanel.button.id!, '-panel-btn')}
                aria-label={t(buttonPanel.button['aria-label'])}
                // In WCAG mode, panels are treated as dialogs because they are focus-trapped, so we set aria-haspopup to dialog to indicate that.
                aria-haspopup={activeTrapGeoView ? 'dialog' : undefined}
                // In default mode, panels are treated as regions, so we use aria-controls and aria-expanded to indicate the relationship and state.
                aria-controls={ariaControls}
                aria-expanded={ariaExpanded}
                tooltipPlacement="right"
                className={`buttonFilled ${tabId === buttonPanel.button.id && isOpen ? 'active' : ''}`}
                size="small"
                onClick={() => handleButtonClicked(buttonPanel.button.id!)}
              >
                {buttonPanel.button.children}
              </IconButton>
            </ListItem>
          );
        }
        // Return null for buttons that aren't visible
        return null;
      })
      // Filter out all null values to get only visible buttons
      .filter(Boolean);

    // Don't render an empty list if there are no visible buttons
    if (visibleButtons.length === 0) {
      return null;
    }

    // Render a single List containing all visible button ListItems
    return <List sx={sxClasses.appBarList}>{visibleButtons}</List>;
  };

  return (
    <Box sx={sxClasses.appBar} className={`interaction-${interaction}`} id={`${mapId}-appBar`} onClick={onScrollShellIntoView}>
      <Box sx={sxClasses.appBarButtons} component="nav" aria-label={t('appbar.navLabel')!}>
        {renderButtonPanel(topPanelNames)}
        <Box sx={sxClasses.versionButtonDiv}>
          {renderButtonPanel(bottomPanelNames)}
          <List sx={sxClasses.appBarList}>
            {appBarComponents.includes(DEFAULT_APPBAR_CORE.EXPORT) && interaction === 'dynamic' && (
              <ListItem>
                <ExportButton
                  id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-export-modal-btn`}
                  className={` buttonFilled ${activeModalId === DEFAULT_APPBAR_CORE.EXPORT ? 'active' : ''}`}
                />
              </ListItem>
            )}
            <ListItem>
              <Share />
            </ListItem>
            <ListItem sx={sxClasses.appBarSeparator}>
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
              onKeyDown={(event: KeyboardEvent) => {
                // Early exit if lightbox is handling ESC
                if (event.key === 'Escape') {
                  const isLightboxOpen = document.querySelector(LIGHTBOX_SELECTORS.ROOT) !== null;
                  if (isLightboxOpen) {
                    return;
                  }
                }
                handleEscapeKey(event.key, getButtonElementId(buttonPanel.button?.id ?? '', '-panel-btn'), isFocusTrapped, () => {
                  setActiveAppBarTab(buttonPanel.button?.id ?? '', false, false);
                });
              }}
              onGeneralClose={() => {
                handleGeneralCloseClicked(buttonPanel.button?.id ?? '');
              }}
            />
          );
        }
        // display the panels in the list
        return <Fragment key={panelName}>{content}</Fragment>;
      })}
    </Box>
  );
}
