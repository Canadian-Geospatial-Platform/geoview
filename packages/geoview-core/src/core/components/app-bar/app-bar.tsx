import { useTranslation } from 'react-i18next';
import {
  type ReactNode,
  type ReactElement,
  type KeyboardEvent,
  useEffect,
  useCallback,
  useState,
  Fragment,
  useMemo,
  useRef,
  isValidElement,
  cloneElement,
} from 'react';
import { useTheme } from '@mui/material/styles';
import type { SxProps } from '@mui/material';
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
  KeyboardArrowUpIcon,
  KeyboardArrowDownIcon,
} from '@/ui';

import { useMapController, useUIController } from '@/core/controllers/use-controllers';
import { Geolocator } from '@/core/components/geolocator/geolocator';
import type { TypeButtonPanel, TypePanelProps } from '@/ui/panel/panel-types';
import ExportButton from '@/core/components/export/export-modal-button';
import {
  useStoreUIActiveFocusItem,
  useStoreUIActiveTrapGeoView,
  useStoreUIAppbarComponents,
  useStoreUIActiveAppBarTab,
  useStoreUIHiddenTabs,
  useStoreUIAppBarPanelIds,
} from '@/core/stores/states/ui-state';
import { useStoreMapInteraction } from '@/core/stores/states/map-state';
import { useStoreAppGeoviewHTMLElement } from '@/core/stores/states/app-state';
import { useStoreGeoViewConfig, useStoreGeoViewMapId, useStoreGeoViewSharedMode } from '@/core/stores/geoview-store';
import { logger } from '@/core/utils/logger';
import type { AppBarApi } from '@/core/components';
import { Guide, Legend, DetailsPanel, Datapanel, LayersPanel } from '@/core/components';
import Notifications from '@/core/components/notifications/notifications';

import Version from './buttons/version';
import Share from './buttons/share';
import { getSxClasses } from './app-bar-style';
import { enforceArrayOrder } from './app-bar-helper';
import { CONTAINER_TYPE, LIGHTBOX_SELECTORS, TIMEOUT } from '@/core/utils/constant';
import { DEFAULT_APPBAR_CORE, DEFAULT_APPBAR_TABS_ORDER } from '@/api/types/map-schema-types';
import { camelCase, handleEscapeKey } from '@/core/utils/utilities';
import { IconButton } from '@/ui/icon-button/icon-button';

/** Scroll step size in pixels (matches single button height). */
const BUTTON_HEIGHT = 54;

/** Mapping of panel id to its icon and content. */
interface GroupPanelType {
  /** The icon element for the panel button. */
  icon: ReactNode;
  /** The content element rendered inside the panel. */
  content: ReactNode;
}

/** Props for the AppBar component. */
type AppBarProps = {
  api: AppBarApi;
  onScrollShellIntoView: () => void;
};

/** Record of button panel ids to their configuration. */
export interface ButtonPanelType {
  [panelType: string]: TypeButtonPanel;
}

/**
 * Creates an app-bar with buttons that can open a panel.
 *
 * @param props - Properties defined in AppBarProps interface
 * @returns The app bar component
 */
export function AppBar(props: AppBarProps): JSX.Element {
  // Log
  logger.logTraceRender('components/app-bar/app-bar');

  const { api: appBarApi, onScrollShellIntoView } = props;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  // get store values and action
  const mapId = useStoreGeoViewMapId();
  const activeModalId = useStoreUIActiveFocusItem().activeElementId;
  const interaction = useStoreMapInteraction();
  const appBarComponents = useStoreUIAppbarComponents();
  const { tabId, isOpen, isFocusTrapped } = useStoreUIActiveAppBarTab();
  const hiddenTabs = useStoreUIHiddenTabs();
  const activeTrapGeoView = useStoreUIActiveTrapGeoView();
  const isSharedModeEnabled = useStoreGeoViewSharedMode();
  const uiController = useUIController();
  const mapController = useMapController();

  const geoviewElement = useStoreAppGeoviewHTMLElement().querySelector('[id^="mapTargetElement-"]') as HTMLElement;

  // get store config for app bar to add (similar logic as in footer-bar)
  const appBarConfig = useStoreGeoViewConfig()?.appBar;
  const footerBarConfig = useStoreGeoViewConfig()?.footerBar;

  // Read app-bar panel ids from the store (reactive — no event handlers needed)
  const appBarPanelIds = useStoreUIAppBarPanelIds();

  // Ref so the focus-restore effect can read the latest geoviewElement without it being a dep
  const geoviewElementRef = useRef(geoviewElement);
  geoviewElementRef.current = geoviewElement;

  // Scroll indicator state (consolidated to reduce re-renders)
  const [scrollState, setScrollState] = useState({ isScrollable: false, canScrollUp: false, canScrollDown: false });
  const appBarListRef = useRef<HTMLUListElement>(null);
  const rafIdRef = useRef<number | undefined>(undefined);

  /**
   * Builds the button panels record from store panel ids and api registry, with open/focus state derived from the active tab.
   */
  const memoButtonPanels = useMemo((): ButtonPanelType => {
    // Log
    logger.logTraceUseMemo('APP-BAR - buttonPanels', appBarPanelIds, tabId, isOpen, isFocusTrapped);

    const panels: ButtonPanelType = {};
    appBarPanelIds.forEach((id) => {
      const panel = appBarApi.buttons[id];
      if (panel) {
        // Derive panel status from the store's active app bar tab
        panels[id] = {
          ...panel,
          ...(panel.panel && {
            panel: {
              ...panel.panel,
              status: id === tabId && isOpen,
              isFocusTrapped: id === tabId ? isFocusTrapped : false,
            },
          }),
        };
      }
    });
    return panels;
  }, [appBarPanelIds, appBarApi, tabId, isOpen, isFocusTrapped]);

  // #region REACT HOOKS

  /**
   * Builds the panel components record mapping panel ids to their icon and content.
   */
  const memoPanels = useMemo((): Record<string, GroupPanelType> => {
    // Log
    logger.logTraceUseMemo('APP-BAR - panels');

    // If the map is static, empty app-bar
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
    };
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

  /**
   * Updates scroll indicator visibility based on overflow and scroll position.
   */
  const updateScrollIndicators = useCallback((): void => {
    const container = appBarListRef.current;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isOverflowing = scrollHeight > clientHeight;

    // Functional update with equality check to prevent unnecessary re-renders
    setScrollState((prev) => {
      const newState = {
        isScrollable: isOverflowing,
        // 1px tolerance to avoid floating-point precision issues
        canScrollUp: isOverflowing && scrollTop > 1,
        canScrollDown: isOverflowing && scrollTop + clientHeight < scrollHeight - 1,
      };

      // Return previous state reference if values haven't changed (avoids re-render)
      if (
        prev.isScrollable === newState.isScrollable &&
        prev.canScrollUp === newState.canScrollUp &&
        prev.canScrollDown === newState.canScrollDown
      ) {
        return prev;
      }

      return newState;
    });
  }, []);

  /**
   * RAF-throttled version for scroll events (limits updates to ~60fps).
   */
  const updateScrollIndicatorsThrottled = useCallback((): void => {
    if (rafIdRef.current) return; // Already scheduled

    rafIdRef.current = requestAnimationFrame(() => {
      rafIdRef.current = undefined;
      updateScrollIndicators();
    });
  }, [updateScrollIndicators]);

  // #region Handlers

  /**
   * Handles when an app-bar button is clicked.
   *
   * @param buttonId - The id of the clicked button
   */
  const handleButtonClicked = useCallback(
    (buttonId: string): void => {
      // Get the button panel
      const buttonPanel = memoButtonPanels[buttonId];
      uiController.setActiveAppBarTab(buttonId, !buttonPanel.panel?.status, !buttonPanel.panel?.status);
    },
    [memoButtonPanels, uiController]
  );

  /**
   * Handles the general close action of a panel.
   *
   * @param buttonId - The id of the panel button to close
   */
  const handleGeneralCloseClicked = useCallback(
    (buttonId: string): void => {
      // Return focus to the AppBar button that opened this panel
      if (isFocusTrapped) {
        setTimeout(() => {
          document.getElementById(getButtonElementId(buttonId, '-panel-btn'))?.focus();
        }, TIMEOUT.dataPanelLoading);
      }

      uiController.setActiveAppBarTab(buttonId, false, false);
    },
    [uiController, isFocusTrapped, getButtonElementId]
  );

  /**
   * Handles clicking the scroll-up button.
   */
  const handleScrollUp = useCallback((): void => {
    if (!scrollState.canScrollUp) return;

    const container = appBarListRef.current;
    if (!container) return;

    // Accessibility-first: default to instant scroll when matchMedia unavailable (SSR/test environments)
    const prefersReducedMotion =
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollBy({
      top: -BUTTON_HEIGHT,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [scrollState.canScrollUp]);

  /**
   * Handles clicking the scroll-down button.
   */
  const handleScrollDown = useCallback((): void => {
    if (!scrollState.canScrollDown) return;

    const container = appBarListRef.current;
    if (!container) return;

    // Accessibility-first: default to instant scroll when matchMedia unavailable (SSR/test environments)
    const prefersReducedMotion =
      typeof window === 'undefined' ||
      typeof window.matchMedia !== 'function' ||
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    container.scrollBy({
      top: BUTTON_HEIGHT,
      behavior: prefersReducedMotion ? 'auto' : 'smooth',
    });
  }, [scrollState.canScrollDown]);

  // #endregion

  /**
   * Gets the panel width based on the tab type.
   *
   * Panels default to 100% width; legend and details panels are set to be slimmer.
   *
   * @param tab - The id of the panel
   * @returns The width percentage for the panel
   */
  const getPanelWidth = useCallback((tab: string): number => {
    let width = 100;

    // set these panels to be slimmer
    if (tab === DEFAULT_APPBAR_CORE.LEGEND || tab === DEFAULT_APPBAR_CORE.DETAILS) {
      width = 30;
    }

    return width;
  }, []);

  /**
   * Handles when the panel opens.
   */
  const handlePanelOpen = useCallback((): void => {
    // Do something
  }, []);

  /**
   * Handles when the panel closes.
   */
  const handlePanelClose = useCallback((): void => {
    // Hide the marker icon
    mapController.clickMarkerIconHide();
  }, [mapController]);

  /**
   * Restores focus when a panel is closed.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - focus restore on close', isOpen, tabId);

    if (!isOpen && tabId) {
      const buttonElementId = `${mapId}-${CONTAINER_TYPE.APP_BAR}-${tabId}-panel-btn`;
      const buttonElement = document.getElementById(buttonElementId);
      if (buttonElement) {
        buttonElement.focus();
      } else {
        const mapCont = geoviewElementRef.current;
        mapCont?.focus();
        if (mapCont?.closest('.geoview-map')?.classList.contains('map-focus-trap')) {
          mapCont.classList.add('keyboard-focus');
        }
      }
    }
  }, [isOpen, tabId, mapId]);

  /**
   * Creates AppBar button panels from configuration tabs.
   */
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
          tooltip: t(`${camelCase(tab)}.title`),
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

  /**
   * Monitors scroll container overflow and scroll position.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - scroll indicators', appBarListRef.current);

    const container = appBarListRef.current;
    if (!container) return undefined;

    // Initial check (immediate, not throttled)
    updateScrollIndicators();

    // ResizeObserver for container size changes (immediate, infrequent events)
    // Feature check: ResizeObserver is supported in all modern browsers (Chrome 64+, Firefox 69+, Safari 13.1+, Edge 79+)
    // Guard prevents crashes in legacy test environments
    let resizeObserver: ResizeObserver | undefined;
    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        updateScrollIndicators();
      });
      resizeObserver.observe(container);
    }

    // Scroll event for boundary detection (throttled via RAF, frequent events)
    container.addEventListener('scroll', updateScrollIndicatorsThrottled, { passive: true });

    return () => {
      resizeObserver?.disconnect();
      container.removeEventListener('scroll', updateScrollIndicatorsThrottled);
      // Cancel any pending RAF
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = undefined;
      }
    };
  }, [updateScrollIndicators, updateScrollIndicatorsThrottled]);

  /**
   * Updates scroll indicators when the button list content changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('APP-BAR - scroll indicators on content change', appBarPanelIds.length);

    // Trigger update when panels are added/removed (ResizeObserver only watches container size, not scrollHeight)
    updateScrollIndicators();
  }, [appBarPanelIds.length, updateScrollIndicators]);

  // #endregion

  /**
   * Re-order the appbar buttons.
   */
  const { topPanelNames, bottomPanelNames } = useMemo<{ topPanelNames: string[]; bottomPanelNames: string[] }>(() => {
    // Log
    logger.logTraceUseMemo('APP-BAR - panels reorder buttons');

    let buttonPanelNames = Object.keys(memoButtonPanels);
    buttonPanelNames = enforceArrayOrder(buttonPanelNames, DEFAULT_APPBAR_TABS_ORDER);
    const topPanel = buttonPanelNames.filter((groupName) => groupName !== DEFAULT_APPBAR_CORE.GUIDE);
    const bottomPanel = buttonPanelNames.filter((groupName) => groupName === DEFAULT_APPBAR_CORE.GUIDE);

    return { topPanelNames: topPanel, bottomPanelNames: bottomPanel };
  }, [memoButtonPanels]);

  /**
   * Renders tab button ListItems for the app-bar.
   *
   * @param panelNames - The panel names to render as buttons
   * @param isBottomSection - Whether this is the bottom section (applies marginTop: auto to first item)
   * @returns Array of ListItem elements, or empty array if none are visible
   */
  const renderButtonPanelItems = useCallback(
    (panelNames: string[], isBottomSection = false): ReactNode[] => {
      // Type helper: button panel with guaranteed button.id (string, not undefined)
      type ButtonPanelWithId = NonNullable<(typeof memoButtonPanels)[string]> & {
        button: { id: string };
      };

      // First pass: collect visible panel configurations with valid button IDs
      const visiblePanels = panelNames
        .filter((name) => !hiddenTabs.includes(name))
        .map((panelName) => ({ panelName, buttonPanel: memoButtonPanels[panelName] }))
        .filter((item): item is { panelName: string; buttonPanel: ButtonPanelWithId } => {
          return item.buttonPanel?.button.visible === true && !!item.buttonPanel?.button.id;
        });

      // Second pass: render ListItems with proper styling based on index
      return visiblePanels.map(({ buttonPanel }, index) => {
        // WCAG - Compute ARIA attributes before rendering
        const isPanelOpen: boolean = tabId === buttonPanel.button.id && isOpen;
        const expandedState: 'true' | 'false' = isPanelOpen ? 'true' : 'false';
        const ariaControls: string | undefined = activeTrapGeoView ? undefined : getButtonElementId(buttonPanel.button.id, '-panel');
        const ariaExpanded: 'true' | 'false' | undefined = activeTrapGeoView ? undefined : expandedState;

        // Apply bottom section style to first visible button only
        const itemSx = isBottomSection && index === 0 ? sxClasses.appBarBottomSection : undefined;

        return (
          <ListItem key={buttonPanel.button.id} sx={itemSx}>
            <IconButton
              id={getButtonElementId(buttonPanel.button.id, '-panel-btn')}
              aria-label={t(buttonPanel.button['aria-label'])}
              // In WCAG mode, panels are treated as dialogs because they are focus-trapped, so we set aria-haspopup to dialog to indicate that.
              aria-haspopup={activeTrapGeoView ? 'dialog' : undefined}
              // In default mode, panels are treated as regions, so we use aria-controls and aria-expanded to indicate the relationship and state.
              aria-controls={ariaControls}
              aria-expanded={ariaExpanded}
              tooltipPlacement="right"
              className={`buttonFilled ${tabId === buttonPanel.button.id && isOpen ? 'active' : ''}`}
              size="small"
              onClick={() => handleButtonClicked(buttonPanel.button.id)}
            >
              {buttonPanel.button.children}
            </IconButton>
          </ListItem>
        );
      });
    },
    [hiddenTabs, memoButtonPanels, tabId, isOpen, activeTrapGeoView, sxClasses, getButtonElementId, t, handleButtonClicked]
  );

  /**
   * Computes bottom section button ListItems.
   */
  const memoBottomItems = useMemo((): ReactNode[] => {
    // Log
    logger.logTraceUseMemo('APP-BAR - memoBottomItems', bottomPanelNames);

    return renderButtonPanelItems(bottomPanelNames, true);
  }, [bottomPanelNames, renderButtonPanelItems]);

  // Compute which fixed buttons are shown (reduces repeated conditionals)
  const showExportButton = appBarComponents.includes(DEFAULT_APPBAR_CORE.EXPORT) && interaction === 'dynamic';
  const showShareButton = isSharedModeEnabled;

  /**
   * Builds all bottom list items (everything after top section buttons).
   */
  const memoBottomListItems = useMemo((): ReactNode[] => {
    // Log
    logger.logTraceUseMemo('APP-BAR - memoBottomListItems', memoBottomItems.length, showExportButton, showShareButton);

    const items: ReactNode[] = [];

    // 1. Bottom panel buttons (guide, etc.)
    items.push(...memoBottomItems);

    // 2. Export button (conditional)
    if (showExportButton) {
      items.push(
        <ListItem key="export">
          <ExportButton
            id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-export-modal-btn`}
            className={` buttonFilled ${activeModalId === DEFAULT_APPBAR_CORE.EXPORT ? 'active' : ''}`}
          />
        </ListItem>
      );
    }

    // 3. Share button (conditional)
    if (showShareButton) {
      items.push(
        <ListItem key="share">
          <Share />
        </ListItem>
      );
    }

    // 4. Notifications (with separator)
    items.push(
      <ListItem key="notifications" sx={sxClasses.appBarSeparator}>
        <Notifications />
      </ListItem>
    );

    // 5. Version
    items.push(
      <ListItem key="version">
        <Version />
      </ListItem>
    );

    return items;
  }, [memoBottomItems, showExportButton, showShareButton, mapId, activeModalId, sxClasses]);

  /**
   * Applies marginTop: auto to the first bottom item to push all items to the bottom.
   */
  const memoBottomListItemsWithStyle = useMemo((): ReactNode[] => {
    // Log
    logger.logTraceUseMemo('APP-BAR - memoBottomListItemsWithStyle', memoBottomListItems.length);

    if (memoBottomListItems.length === 0) return [];

    return memoBottomListItems.map((item, index) => {
      if (index === 0 && isValidElement(item)) {
        // Apply marginTop: auto to first item
        const existingSx = (item.props as { sx?: SxProps }).sx;
        // Flatten sx to avoid nested arrays if existingSx is already an array
        const combinedSx = existingSx
          ? [...(Array.isArray(existingSx) ? existingSx : [existingSx]), sxClasses.appBarBottomSection]
          : sxClasses.appBarBottomSection;
        return cloneElement(item as ReactElement<{ sx?: SxProps }>, { sx: combinedSx as SxProps });
      }
      return item;
    });
  }, [memoBottomListItems, sxClasses]);

  return (
    <Box sx={sxClasses.appBar} className={`interaction-${interaction}`} id={`${mapId}-appBar`} onClick={onScrollShellIntoView}>
      <Box
        sx={[sxClasses.appBarButtons, !scrollState.isScrollable && { paddingTop: '8px' }] as SxProps}
        component="nav"
        aria-label={t('appbar.navLabel')}
      >
        {/* Scroll up button */}
        {scrollState.isScrollable && (
          <IconButton
            id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-scroll-up-btn`}
            aria-label={t('appbar.scrollUp')}
            aria-disabled={!scrollState.canScrollUp}
            tooltip={t('appbar.scrollUp')}
            tooltipPlacement="right"
            onClick={handleScrollUp}
            sx={sxClasses.scrollButtonUp}
          >
            <KeyboardArrowUpIcon />
          </IconButton>
        )}

        <List ref={appBarListRef} sx={sxClasses.appBarList}>
          {/* Top section buttons */}
          {renderButtonPanelItems(topPanelNames, false)}

          {/* All bottom items - first one automatically gets marginTop: auto */}
          {memoBottomListItemsWithStyle}
        </List>

        {/* Scroll down button */}
        {scrollState.isScrollable && (
          <IconButton
            id={`${mapId}-${CONTAINER_TYPE.APP_BAR}-scroll-down-btn`}
            aria-label={t('appbar.scrollDown')}
            aria-disabled={!scrollState.canScrollDown}
            tooltip={t('appbar.scrollDown')}
            tooltipPlacement="right"
            onClick={handleScrollDown}
            sx={sxClasses.scrollButtonDown}
          >
            <KeyboardArrowDownIcon />
          </IconButton>
        )}
      </Box>
      {Object.keys(memoButtonPanels).map((panelName: string) => {
        // get button panel
        const buttonPanel = memoButtonPanels[panelName];
        let content = null;
        if (buttonPanel?.buttonPanelId === DEFAULT_APPBAR_CORE.GEOLOCATOR) {
          content = buttonPanel?.panel?.content ?? '';
        } else if (buttonPanel?.panel) {
          content = (
            <Panel
              panel={buttonPanel.panel}
              button={buttonPanel.button}
              onOpen={handlePanelOpen}
              onClose={handlePanelClose}
              onKeyDown={(event: KeyboardEvent) => {
                // Early exit if lightbox is handling ESC
                if (event.key === 'Escape') {
                  const isLightboxOpen = document.querySelector(LIGHTBOX_SELECTORS.ROOT) !== null;
                  if (isLightboxOpen) {
                    return;
                  }
                }
                handleEscapeKey(
                  event.key,
                  () => {
                    uiController.setActiveAppBarTab(buttonPanel.button?.id ?? '', false, false);
                  },
                  getButtonElementId(buttonPanel.button?.id ?? '', '-panel-btn'),
                  isFocusTrapped
                );
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
