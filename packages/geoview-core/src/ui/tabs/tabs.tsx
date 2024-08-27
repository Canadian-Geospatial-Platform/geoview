import { SyntheticEvent, ReactNode, useState, useEffect, useMemo, MouseEvent, useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Grid, Tab as MaterialTab, Tabs as MaterialTabs, TabsProps, TabProps, BoxProps, Box, SelectChangeEvent } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { HtmlToReact } from '@/core/containers/html-to-react';
import { logger } from '@/core/utils/logger';

import { Select, TypeMenuItemProps } from '@/ui/select/select';
import { getSxClasses } from './tabs-style';
import { TabPanel } from './tab-panel';
import { useMapSize } from '@/core/stores/store-interface-and-intial-values/map-state';
import { useUIHiddenTabs } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { TypeContainerBox } from '@/core/types/global-types';

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
/* eslint-disable react/require-default-props */
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
}

/**
 * Create a tabs ui
 *
 * @param {TypeTabsProps} props properties for the tabs ui
 * @returns {JSX.Element} returns the tabs ui
 */
export function Tabs(props: TypeTabsProps): JSX.Element {
  const {
    // NOTE: need this shellContainer, so that mobile dropdown can be rendered on top fullscreen window.
    shellContainer,
    tabs,
    rightButtons,
    selectedTab,
    activeTrap,
    onToggleCollapse,
    onSelectedTabChanged,
    onOpenKeyboard,
    onCloseKeyboard,
    TabContentVisibilty = 'inherit',
    tabsProps = {},
    tabProps = {},
    containerType,
  } = props;

  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  // internal state
  // boolean value in state reflects when tabs will be collapsed state, then value needs to false.
  const [value, setValue] = useState<number | boolean>(0);
  const [tabPanels, setTabPanels] = useState([tabs[0]]);

  // get store values and actions
  const mapSize = useMapSize();
  const hiddenTabs = useUIHiddenTabs();

  // show/hide dropdown based on map size
  const initMobileDropdown = mapSize[0] !== 0 ? mapSize[0] < theme.breakpoints.values.sm : false;
  const [showMobileDropdown, setShowMobileDropdown] = useState(initMobileDropdown);

  /**
   * Update Tab panel when value change from tabs and dropdown.
   * @param {number} tabValue index of the tab or dropdown.
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
   * Handle a tab change
   * @param {number} newValue value of the new tab
   */
  const handleChange = useCallback(
    (event: SyntheticEvent<Element, Event>, newValue: number): void => {
      updateTabPanel(newValue);
    },
    [updateTabPanel]
  );

  /**
   * Handle a tab click
   * If the panel is collapsed when tab is clicked, expand the panel
   */
  const handleClick = useCallback(
    (e: MouseEvent<HTMLDivElement>): void => {
      const index = Number((e.target as HTMLDivElement).id.split('-')[1]);
      // toggle on -1, so that when no tab is selected on fullscreen
      // and tab is selected again to open the panel.
      if (value === index || value === -1) onToggleCollapse?.();

      // WCAG - if keyboard navigation is on and the tabs gets expanded, set the trap store info to open, close otherwise
      if (activeTrap) onOpenKeyboard?.({ activeElementId: `panel-${index}`, callbackElementId: `tab-${index}` });
      else onCloseKeyboard?.();
    },
    [activeTrap, onCloseKeyboard, onOpenKeyboard, onToggleCollapse, value]
  );

  useEffect(() => {
    // Log
    logger.logTraceUseEffect('TABS - selectedTab', selectedTab);
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
    // show/hide mobile dropdown when screen size change.
    if (mapSize[0] < theme.breakpoints.values.sm) {
      setShowMobileDropdown(true);
    } else {
      setShowMobileDropdown(false);
    }
  }, [mapSize, theme.breakpoints.values.sm]);

  return (
    <Grid container sx={{ width: '100%', height: '100%' }}>
      <Grid container sx={{ backgroundColor: theme.palette.geoViewColor.bgColor.dark[100] }}>
        <Grid item xs={7} sm={10}>
          {!showMobileDropdown ? (
            <MaterialTabs
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
              value={value}
              onChange={handleChange}
              aria-label="basic tabs"
              {...tabsProps}
            >
              {tabs.map((tab, index) => {
                return (
                  <MaterialTab
                    label={t(tab.label)}
                    key={`${t(tab.label)}`}
                    icon={tab.icon}
                    iconPosition="start"
                    id={`tab-${index}`}
                    onClick={handleClick}
                    sx={hiddenTabs.includes(tab.id) ? { display: 'none' } : sxClasses.tab}
                    aria-controls={`${shellContainer?.id ?? ''}-${tab.id}`}
                    tabIndex={0}
                    {...tabProps}
                  />
                );
              })}
            </MaterialTabs>
          ) : (
            <Box sx={sxClasses.mobileDropdown}>
              <Select
                labelId="footerBarDropdownLabel"
                formControlProps={{ size: 'small' }}
                id="footerBarDropdown"
                fullWidth
                variant="standard"
                inputLabel={{ id: 'footerBarDropdownLabel' }}
                menuItems={mobileTabsDropdownValues}
                value={value}
                onChange={(e: SelectChangeEvent<unknown>) => updateTabPanel(e.target.value as number)}
                {...(shellContainer ? { MenuProps: { container: shellContainer } } : {})}
              />
            </Box>
          )}
        </Grid>
        <Grid item xs={5} sm={2} sx={sxClasses.rightIcons}>
          {rightButtons as ReactNode}
        </Grid>
      </Grid>
      <Grid
        id="tabPanel"
        item
        xs={12}
        sx={{
          ...sxClasses.panel,
          visibility: TabContentVisibilty,
        }}
      >
        {tabPanels.map((tab, index) => {
          return tab ? (
            <TabPanel
              value={value as number}
              index={index}
              key={tab.id}
              id={`${shellContainer?.id ?? ''}-${tab.id}`}
              tabId={tab.id}
              containerType={containerType}
            >
              {typeof tab?.content === 'string' ? <HtmlToReact htmlContent={(tab?.content as string) ?? ''} /> : tab.content}
            </TabPanel>
          ) : (
            ''
          );
        })}
      </Grid>
    </Grid>
  );
}
