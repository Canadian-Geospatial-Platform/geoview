import { SyntheticEvent, ReactNode, useState, useEffect, useMemo, MouseEvent, useCallback, useRef, memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Size } from 'ol/size';

import {
  Grid,
  Tab as MaterialTab,
  Tabs as MaterialTabs,
  TabsProps,
  TabProps,
  BoxProps,
  Box,
  SelectChangeEvent,
  TabScrollButton,
  TabScrollButtonProps,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { UseHtmlToReact } from '@/core/components/common/hooks/use-html-to-react';
import { logger } from '@/core/utils/logger';

import { Select, TypeMenuItemProps } from '@/ui/select/select';
import { getSxClasses } from '@/ui/tabs/tabs-style';
import { TabPanel } from '@/ui/tabs/tab-panel';
import { TypeContainerBox } from '@/core/types/global-types';
import { handleEscapeKey } from '@/core/utils/utilities';

/**
 * Type used for properties of each tab
 */
export type TypeTabs = {
  id: string;
  value: number;
  label: string;
  content?: JSX.Element | string;
  icon?: JSX.Element;
};

/**
 * Type used for focus
 */
type FocusItemProps = {
  activeElementId: string | false;
  callbackElementId: string | false;
};

/**
 * Tabs ui properties
 */

export interface TypeTabsProps {
  shellContainer?: HTMLElement;
  tabs: TypeTabs[];
  selectedTab?: number;
  boxProps?: BoxProps;
  tabsProps?: TabsProps;
  tabProps?: TabProps;
  rightButtons?: unknown;
  isCollapsed?: boolean;
  activeTrap?: boolean;
  TabContentVisibilty?: string | undefined;
  onToggleCollapse?: () => void;
  onSelectedTabChanged?: (tab: TypeTabs) => void;
  onOpenKeyboard?: (uiFocus: FocusItemProps) => void;
  onCloseKeyboard?: () => void;
  containerType?: TypeContainerBox;
  sideAppSize: Size;
  appHeight: number;
  hiddenTabs: string[];
  isFullScreen: boolean;
}

// Define scroll button component outside of Tabs
// TODO: Unmemoize this component, probably, because it's in 'ui' folder
const CustomScrollButton = memo(function CustomScrollButton({ direction, ...props }: TabScrollButtonProps) {
  return (
    <TabScrollButton
      {...props}
      direction={direction}
      sx={{
        display: props.disabled ? 'none' : 'flex',
      }}
    />
  );
});

/**
 * Create a tabs ui
 *
 * @param {TypeTabsProps} props properties for the tabs ui
 * @returns {JSX.Element} returns the tabs ui
 */
function TabsUI(props: TypeTabsProps): JSX.Element {
  const {
    // NOTE: need this shellContainer, so that mobile dropdown can be rendered on top fullscreen window.
    shellContainer,
    tabs,
    rightButtons,
    selectedTab = 0,
    activeTrap,
    onToggleCollapse,
    onSelectedTabChanged,
    onOpenKeyboard,
    onCloseKeyboard,
    TabContentVisibilty = 'inherit',
    tabsProps = {},
    tabProps = {},
    containerType,
    isCollapsed,
    sideAppSize,
    appHeight,
    hiddenTabs,
    isFullScreen,
  } = props;

  // Hooks
  const { t } = useTranslation<string>();
  const theme = useTheme();

  // State
  // boolean value in state reflects when tabs will be collapsed state, then value needs to false.
  const [value, setValue] = useState<number | boolean>(0);
  const [tabPanels, setTabPanels] = useState([tabs[0]]);
  const tabPanelRef = useRef<HTMLDivElement | null>(null);

  const sxClasses = useMemo(() => getSxClasses(theme, isFullScreen, appHeight), [theme, isFullScreen, appHeight]);

  // show/hide dropdown based on map size
  const initMobileDropdown = sideAppSize[0] !== 0 ? sideAppSize[0] < theme.breakpoints.values.sm : false;
  const [showMobileDropdown, setShowMobileDropdown] = useState(initMobileDropdown);

  /**
   * Update Tab panel when value change from tabs and dropdown.
   * @param {number} tabValue index of the tab or dropdown.
   */
  const updateTabPanel = useCallback(
    (tabValue: number): void => {
      logger.logTraceUseCallback('UI.TABS - updateTabPanel', tabValue);

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
   * Handle a tab change
   * @param {number} newValue value of the new tab
   */
  const handleChange = useCallback(
    (event: SyntheticEvent<Element, Event>, newValue: number): void => {
      logger.logTraceUseCallback('UI.TABS - handleChange', newValue);

      updateTabPanel(newValue);
    },
    [updateTabPanel]
  );

  /**
   * Handle a tab click
   * If the panel is collapsed when tab is clicked, expand the panel
   */
  const handleClick = useCallback(
    (event: MouseEvent<HTMLDivElement>): void => {
      logger.logTraceUseCallback('UI.TABS - handleClick', event);

      // Get the tab (if already created to extract the value, set -1 if tab does not exist)
      // We need this information to know if we create, switch or collapse a tab
      const { id } = event.target as HTMLDivElement;
      const tab = tabPanels.filter((item) => item !== undefined && item.id === id);
      const index = tab.length > 0 ? tab[0].value : -1;

      // toggle on -1, so that when no tab is selected on fullscreen
      // and tab is selected again to open the panel.
      if (value === index || value === -1) onToggleCollapse?.();

      // WCAG - if keyboard navigation is on and the tabs gets expanded, set the trap store info to open, close otherwise
      if (activeTrap) onOpenKeyboard?.({ activeElementId: id, callbackElementId: id });
      else onCloseKeyboard?.();
    },
    [activeTrap, onCloseKeyboard, onOpenKeyboard, onToggleCollapse, value, tabPanels]
  );

  useEffect(() => {
    logger.logTraceUseEffect('UI.TABS - selectedTab', selectedTab);

    // If a selected tab is defined
    if (selectedTab !== undefined) {
      const newPanels = [...tabPanels];
      newPanels[selectedTab] = tabs[selectedTab];
      setTabPanels(newPanels);
      // Make sure internal state follows
      setValue(selectedTab);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab, tabs]);
  // Do not add dependency on onToggleCollapse or isCollapse, because then on re-render after the change, the useEffect just re-collapses/re-expands...

  /**
   * Build mobile tab dropdown.
   */
  const mobileTabsDropdownValues = useMemo(() => {
    const newTabs = tabs.map((tab) => ({
      type: 'item',
      item: { value: tab.value, children: t(`${tab.label}`) },
    }));

    // no tab field which will be used to collapse the footer panel.
    const noTab = { type: 'item', item: { value: '', children: t('footerBar.noTab') } };
    return [noTab, ...newTabs] as TypeMenuItemProps[];
  }, [tabs, t]);

  useEffect(() => {
    logger.logTraceUseEffect('UI.TABS - mapSize', sideAppSize);

    // show/hide mobile dropdown when screen size change.
    if (sideAppSize[0] < theme.breakpoints.values.sm) {
      setShowMobileDropdown(true);
    } else {
      setShowMobileDropdown(false);
    }
  }, [sideAppSize, theme.breakpoints.values.sm]);

  useEffect(() => {
    logger.logTraceUseEffect('UI.TABS - isCollapsed', isCollapsed);

    const tabPanel = tabPanelRef?.current;
    const handleFooterbarEscapeKey = (event: KeyboardEvent): void => {
      if (!isCollapsed) {
        handleEscapeKey(event.key, tabs[selectedTab ?? 0]?.id, true, () => {
          onCloseKeyboard?.();
        });
      }
    };
    tabPanel?.addEventListener('keydown', handleFooterbarEscapeKey);

    return () => {
      tabPanel?.removeEventListener('keydown', handleFooterbarEscapeKey);
    };
  }, [selectedTab, isCollapsed, tabs, onCloseKeyboard]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sxMerged: any = { ...sxClasses.panel, visibility: TabContentVisibilty };

  // Get the visible tabs
  const visibleTabs = useMemo(() => tabs.filter((tab) => !hiddenTabs.includes(tab.id)), [tabs, hiddenTabs]);

  // Make sure the selected tab is among the visible tabs
  // (it's possible that the store has a selected value set to something that hasn't yet been created as a tab).
  const validSelectedTab = visibleTabs.find((tab) => tab.value === selectedTab)?.value;

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
      }}
    >
      <Grid
        container
        id="footerbar-header"
        sx={{
          width: '100%',
          paddingLeft: '9px',
          border: 'unset',
          borderBottom: isCollapsed ? 'none' : `2px solid ${theme.palette.geoViewColor.primary.main} !important`,
        }}
      >
        <Grid size={{ xs: 7, sm: 10 }}>
          {!showMobileDropdown ? (
            <MaterialTabs
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
              value={validSelectedTab !== undefined ? Math.max(0, validSelectedTab) : false}
              onChange={handleChange}
              aria-label="basic tabs"
              ScrollButtonComponent={CustomScrollButton}
              {...tabsProps}
            >
              {visibleTabs.map((tab) => {
                return (
                  <MaterialTab
                    label={t(tab.label)}
                    key={`${t(tab.label)}`}
                    icon={tab.icon}
                    iconPosition="start"
                    id={tab.id}
                    onClick={handleClick}
                    sx={sxClasses.tab}
                    aria-controls={`${shellContainer?.id ?? ''}-${tab.id}`}
                    tabIndex={0}
                    value={tab.value}
                    {...tabProps}
                  />
                );
              })}
            </MaterialTabs>
          ) : (
            <Box sx={sxClasses.mobileDropdown}>
              <Select
                labelId="footerBarDropdownLabel"
                label=""
                formControlProps={{ size: 'small' }}
                id="footerBarDropdown"
                fullWidth
                variant="standard"
                inputLabel={{ id: 'footerBarDropdownLabel' }}
                menuItems={mobileTabsDropdownValues}
                value={value}
                onChange={(event: SelectChangeEvent<unknown>) => updateTabPanel(event.target.value as number)}
                {...(shellContainer ? { MenuProps: { container: shellContainer } } : {})}
              />
            </Box>
          )}
        </Grid>
        <Grid size={{ xs: 5, sm: 2 }} sx={sxClasses.rightIcons}>
          {rightButtons as ReactNode}
        </Grid>
      </Grid>
      <Box id="tabPanel" sx={sxMerged} className="tab-panels-container">
        {tabPanels.map((tab, index) => {
          return tab ? (
            <TabPanel
              value={value as number}
              index={index}
              key={tab.id}
              id={`${shellContainer?.id ?? ''}-${tab.id}`}
              tabId={tab.id}
              containerType={containerType}
              ref={tabPanelRef}
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
