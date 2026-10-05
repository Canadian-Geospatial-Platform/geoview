import type { SyntheticEvent, ReactNode, MouseEvent } from 'react';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useTranslation } from 'react-i18next';

import type { TabsProps, TabProps, BoxProps, SelectChangeEvent } from '@mui/material';
import { Grid, Tab as MaterialTab, Tabs as MaterialTabs, Box, useMediaQuery } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { logger } from '@/core/utils/logger';

import type { TypeMenuItemProps } from '@/ui/select/select';
import { Select } from '@/ui/select/select';
import { getSxClasses } from '@/ui/tabs/tabs-style';
import { TabPanel } from '@/ui/tabs/tab-panel';
import type { TypeContainerBox } from '@/core/types/global-types';
import { handleEscapeKey } from '@/core/utils/utilities';
import type { SxStyles } from '../style/types';

/** Properties defining a tab and its panel content. */
export type TypeTabs = {
  /** Unique tab identifier. */
  id: string;
  /** Position value used to select the tab. */
  value: number;
  /** Visible tab title. */
  label: string;
  /** Optional tab panel content. */
  content?: JSX.Element | string;
  /** Optional icon shown beside the tab title. */
  icon?: JSX.Element;
};

/** Element IDs used to manage tab panel focus. */
type FocusItemProps = {
  /** ID of the active focusable element. */
  activeElementId: string | false;
  /** ID of the element to receive focus when the trap closes. */
  callbackElementId: string | false;
};

/** Properties for the tabs UI component. */
export interface TypeTabsProps {
  /** The map identifier associated with the tabs component. */
  mapId: string;
  /** Optional container used to portal menus within fullscreen content. */
  shellContainer?: HTMLElement;
  /** Tabs displayed in the component. */
  tabs: TypeTabs[];
  /** Index of the selected tab, synchronized when the prop changes. */
  selectedTab?: number;
  /** Props applied to the tab container. */
  boxProps?: BoxProps;
  /** Props applied to the MUI Tabs component. */
  tabsProps?: TabsProps;
  /** Props applied to each MUI Tab. */
  tabProps?: TabProps;
  /** Optional content rendered beside the tabs. */
  rightButtons?: unknown;
  /** Whether the tab panel is collapsed. */
  isCollapsed?: boolean;
  /** Whether keyboard focus is trapped in the panel. */
  activeTrap?: boolean;
  /** Visibility value applied to the tab content. */
  TabContentVisibilty?: string;
  /** Callback invoked when the panel collapse state changes. */
  onToggleCollapse?: () => void;
  /** Callback invoked when a tab is selected. */
  onSelectedTabChanged?: (tab: TypeTabs) => void;
  /** Callback invoked when the tab header is clicked. */
  onHeaderClick?: () => void;
  /** Callback invoked when keyboard focus enters the panel. */
  onOpenKeyboard?: (uiFocus: FocusItemProps) => void;
  /** Callback invoked when keyboard focus leaves the panel. */
  onCloseKeyboard?: () => void;
  /** Type of container holding the tab panel. */
  containerType: TypeContainerBox;
  /** Available height for the application layout. */
  appHeight: string;
  /** Tab IDs that should not be displayed. */
  hiddenTabs: string[];
  /** Whether the viewer is in fullscreen mode. */
  isFullScreen: boolean;
}

/**
 * Creates a standardized tab element ID.
 *
 * This ensures unique element IDs when multiple map viewers are rendered
 * on the same page. The format must match the extraction logic in extractTabId.
 *
 * @param mapId - The map identifier
 * @param tabId - The tab identifier
 * @returns Formatted tab ID string
 */
const createTabId = (mapId: string, tabId: string): string => `${mapId}-tab-${tabId}`;

/**
 * Creates a standardized tab panel element ID.
 *
 * This ensures unique element IDs when multiple map viewers are rendered
 * on the same page. The format follows the tab ID pattern with a 'panel' infix.
 *
 * @param mapId - The map identifier
 * @param tabId - The tab identifier
 * @returns Formatted panel ID string
 */
const createPanelId = (mapId: string, tabId: string): string => `${mapId}-panel-${tabId}`;

/**
 * Extracts the base tab ID from a full tab element ID.
 *
 * This reverses the ID construction performed by createTabId. The prefix
 * format must remain in sync with createTabId to ensure correct extraction.
 *
 * @param fullId - The complete tab element ID
 * @param mapId - The map identifier
 * @returns The extracted tab ID, or the original ID if it doesn't match the expected pattern
 */
const extractTabId = (fullId: string, mapId: string): string => {
  const prefix = `${mapId}-tab-`;
  return fullId.startsWith(prefix) ? fullId.substring(prefix.length) : fullId;
};

/**
 * Custom tabbed interface component with responsive mobile support.
 *
 * Provides a fully accessible tabs UI with keyboard navigation, focus management,
 * and mobile dropdown support. Handles both horizontal and vertical layouts, with
 * content visibility control and escape key handling for integration with panels.
 *
 * @param props - Tabs configuration (see TypeTabsProps interface)
 * @returns Tabs component with responsive tab switching and panel content
 *
 * @example
 * ```tsx
 * <Tabs
 *   mapId="mapWM"
 *   tabs={[
 *     { id: 'tab1', value: 0, label: 'Tab 1', content: <div>Content 1</div> },
 *     { id: 'tab2', value: 1, label: 'Tab 2', content: <div>Content 2</div> }
 *   ]}
 *   selectedTab={0}
 *   containerType="panel"
 *   appHeight="100vh"
 *   hiddenTabs={[]}
 *   isFullScreen={false}
 *   onSelectedTabChanged={handleTabChange}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-tabs/}
 */
function TabsUI(props: TypeTabsProps): JSX.Element {
  // Log
  logger.logTraceRender('ui/tabs/tabs');

  const {
    // NOTE: need this shellContainer, so that mobile dropdown can be rendered on top fullscreen window.
    mapId,
    shellContainer,
    tabs,
    rightButtons,
    selectedTab = 0,
    activeTrap,
    onToggleCollapse,
    onSelectedTabChanged,
    onHeaderClick,
    onOpenKeyboard,
    onCloseKeyboard,
    TabContentVisibilty = 'inherit',
    tabsProps = {},
    tabProps = {},
    containerType,
    isCollapsed,
    appHeight,
    hiddenTabs,
    isFullScreen,
  } = props;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  // State
  // boolean value in state reflects when tabs will be collapsed state, then value needs to false.
  const [value, setValue] = useState<number | boolean>(0);
  const [tabPanels, setTabPanels] = useState<TypeTabs[]>([tabs[0]]);
  const tabPanelRef = useRef<HTMLDivElement | null>(null);
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('UI.TABS - memoSxClasses', theme, isFullScreen, appHeight);
    return getSxClasses(theme, isFullScreen, appHeight);
  }, [theme, isFullScreen, appHeight]);

  // #region Handlers

  /**
   * Updates the active tab panel and triggers associated callbacks.
   */
  const updateTabPanel = useCallback(
    (tabValue: number): void => {
      // Update panel refs when tab value is changed.
      // handle no tab when mobile dropdown is displayed.
      if (typeof tabValue === 'string') {
        setValue(tabValue);
        onToggleCollapse?.();
      } else {
        // We are adding the new tabs into the state of tabPanels at specific position
        // based on user selection of tabs, so that tabs id and values are in sync with index of tabPanels state.
        //  initialy tab panel will look like [tab1], after user click on details tab ie. 3 tab
        // this can looks like when debugging:- [tab1, undefined, tab3],
        // undefined values are handled when rendering the tabs.
        const newPanels = [...tabPanels];
        newPanels[tabValue] = tabs[tabValue];
        setTabPanels(newPanels);
        setValue(tabValue);
        // Callback
        onSelectedTabChanged?.(tabs[tabValue]);
      }
    },
    [onSelectedTabChanged, onToggleCollapse, tabPanels, tabs]
  );

  /**
   * Handles when the user clicks on a tab to switch tabs.
   */
  const handleChange = useCallback(
    (event: SyntheticEvent<Element, Event>, newValue: number): void => {
      updateTabPanel(newValue);
    },
    [updateTabPanel]
  );

  /**
   * Handles when the user clicks on a tab to expand/collapse the panel.
   */
  const handleClick = useCallback(
    (event: MouseEvent<HTMLElement>): void => {
      // Get the tab (if already created to extract the value, set -1 if tab does not exist)
      // We need this information to know if we create, switch or collapse a tab
      const { id } = event.currentTarget;
      // Extract base tab id by removing the prefix
      const tabId = extractTabId(id, mapId);
      // Look up the tab from the `tabs` prop (always current) rather than `tabPanels` which can
      // hold stale entries with outdated values when tabs are reordered (e.g. custom tabs added at mount).
      const tab = tabs.find((item) => item.id === tabId);
      const index = tab ? tab.value : -1;

      // toggle on -1, so that when no tab is selected on fullscreen
      // and tab is selected again to open the panel.
      if (value === index || value === -1) onToggleCollapse?.();

      // WCAG - if keyboard navigation is on and the tabs gets expanded, set the trap store info to open, close otherwise
      if (activeTrap) onOpenKeyboard?.({ activeElementId: id, callbackElementId: id });
      else onCloseKeyboard?.();
    },
    [activeTrap, onCloseKeyboard, onOpenKeyboard, onToggleCollapse, value, tabs, mapId]
  );

  /**
   * Handles mobile tab selection.
   */
  const handleMobileTabChange = useCallback(
    (event: SelectChangeEvent<unknown>): void => {
      updateTabPanel(event.target.value as number);
    },
    [updateTabPanel]
  );

  // #endregion

  /**
   * Synchronizes the visible tab panels with the selected tab.
   */
  useEffect(() => {
    logger.logTraceUseEffect('UI.TABS - selectedTab', selectedTab, tabs);

    // If a selected tab is defined
    if (selectedTab !== undefined) {
      setTabPanels((prev) => {
        const next = [...prev];
        next[selectedTab] = tabs[selectedTab];
        return next;
      });
      // Make sure internal state follows
      setValue(selectedTab);
    }
  }, [selectedTab, tabs]);
  // Do not add dependency on onToggleCollapse or isCollapse, because then on re-render after the change, the useEffect just re-collapses/re-expands...

  /**
   * Builds mobile tab dropdown.
   */
  const memoMobileTabsDropdownValues = useMemo((): TypeMenuItemProps[] => {
    logger.logTraceUseMemo('UI.TABS - memoMobileTabsDropdownValues', tabs, t);

    const newTabs = tabs.map((tab) => ({
      type: 'item',
      item: { value: tab.value, children: t(`${tab.label}`) },
    }));

    // no tab field which will be used to collapse the footer panel.
    const noTab = { type: 'item', item: { value: '', children: t('footerBar.noTab') } };
    return [noTab, ...newTabs] as TypeMenuItemProps[];
  }, [tabs, t]);

  /**
   * Registers Escape-key handling for the tab panel.
   */
  useEffect(() => {
    logger.logTraceUseEffect('UI.TABS - isCollapsed', selectedTab, isCollapsed, tabs, onCloseKeyboard, mapId);

    const tabPanel = tabPanelRef?.current;
    const handleFooterbarEscapeKey = (event: KeyboardEvent): void => {
      if (!isCollapsed && event.key === 'Escape') {
        // Check if ESC originated from within the right panel content
        // where ResponsiveGridLayout's handler would manage focus
        const target = event.target as HTMLElement;
        const isFromRightPanel = target.closest('.responsive-layout-right-main-content');

        if (isFromRightPanel) {
          // ESC is from right panel - ResponsiveGridLayout will handle it
          // (including proper focus restoration to layer list item when close button is visible)
          return;
        }

        // ESC is from elsewhere (e.g., left panel/layer list when right panel is closed)
        // Handle it the traditional way - focus the tab button
        const targetTabIndex = selectedTab ?? 0;
        const targetTab = tabs[targetTabIndex];

        // Guard: only proceed if we have a valid tab with an id
        if (targetTab?.id) {
          handleEscapeKey(
            event.key,
            () => {
              onCloseKeyboard?.();
            },
            createTabId(mapId, targetTab.id),
            true
          );
        }
      }
    };
    tabPanel?.addEventListener('keydown', handleFooterbarEscapeKey);

    return () => {
      tabPanel?.removeEventListener('keydown', handleFooterbarEscapeKey);
    };
  }, [selectedTab, isCollapsed, tabs, onCloseKeyboard, mapId]);

  // The panel sx object combines a computed style with a dynamic visibility value.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sxMerged: any = { ...memoSxClasses.panel, visibility: TabContentVisibilty };

  /**
   * Filters out hidden tabs from the tab list.
   */
  const memoVisibleTabs = useMemo((): TypeTabs[] => {
    logger.logTraceUseMemo('UI.TABS - memoVisibleTabs', tabs, hiddenTabs);

    return tabs.filter((tab) => !hiddenTabs.includes(tab.id));
  }, [tabs, hiddenTabs]);

  // Make sure the selected tab is among the visible tabs
  // (it's possible that the store has a selected value set to something that hasn't yet been created as a tab).
  const validSelectedTab = memoVisibleTabs.find((tab) => tab.value === selectedTab)?.value;

  return (
    <Box sx={memoSxClasses.wrapper}>
      <Grid container id={`${mapId}-footerbar-header`} onClick={onHeaderClick} sx={memoSxClasses.header}>
        <Grid size={{ xs: 7, sm: 10 }}>
          {!isMobile ? (
            <MaterialTabs
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
              value={validSelectedTab !== undefined ? Math.max(0, validSelectedTab) : false}
              onChange={handleChange}
              aria-label={t('footerBar.tabsLabel')}
              sx={memoSxClasses.tabsContainer}
              {...tabsProps}
            >
              {memoVisibleTabs.map((tab) => {
                return (
                  <MaterialTab
                    label={t(tab.label)}
                    key={`${t(tab.label)}`}
                    icon={tab.icon}
                    iconPosition="start"
                    id={createTabId(mapId, tab.id)}
                    onClick={handleClick}
                    sx={memoSxClasses.tab}
                    aria-controls={createPanelId(mapId, tab.id)}
                    tabIndex={0}
                    value={tab.value}
                    {...tabProps}
                  />
                );
              })}
            </MaterialTabs>
          ) : (
            <Box sx={memoSxClasses.mobileDropdown}>
              <Select
                formControlProps={{ size: 'small' }}
                fullWidth
                variant="standard"
                menuItems={memoMobileTabsDropdownValues}
                value={value}
                onChange={handleMobileTabChange}
                {...(shellContainer ? { MenuProps: { container: shellContainer } } : {})}
                aria-label={t('footerBar.tabsSelectionLabel')}
              />
            </Box>
          )}
        </Grid>
        <Grid size={{ xs: 5, sm: 2 }} sx={memoSxClasses.rightIcons}>
          {rightButtons as ReactNode}
        </Grid>
      </Grid>
      <Box ref={tabPanelRef} id={`${mapId}-tabPanel`} sx={sxMerged} className="tab-panels-container">
        {tabPanels.map((tab, index) => {
          return tab ? (
            <TabPanel
              value={value as number}
              index={index}
              // eslint-disable-next-line react/no-array-index-key
              key={`${tab.id}-${index}`}
              id={createPanelId(mapId, tab.id)}
              tabId={createTabId(mapId, tab.id)}
              containerType={containerType}
              className="tab-panel"
            >
              {typeof tab?.content === 'string' ? <UseHtmlToReact htmlContent={tab?.content ?? ''} /> : tab.content}
            </TabPanel>
          ) : (
            ''
          );
        })}
      </Box>
    </Box>
  );
}

export const Tabs = TabsUI;
