import { SyntheticEvent, ReactNode, useState, useEffect, useMemo } from 'react';
import { useTranslation } from 'react-i18next';

import { Grid, Tab as MaterialTab, Tabs as MaterialTabs, TabsProps, TabProps, BoxProps, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { HtmlToReact } from '@/core/containers/html-to-react';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId, useMapSize } from '@/app';

import { Select, TypeMenuItemProps } from '../select/select';
import { getSxClasses } from './tabs-style';
import { TabPanel } from './tab-panel';

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
}

/**
 * Create a tabs ui
 *
 * @param {TypeTabsProps} props properties for the tabs ui
 * @returns {JSX.Element} returns the tabs ui
 */
export function Tabs(props: TypeTabsProps): JSX.Element {
  const {
    tabs,
    rightButtons,
    selectedTab,
    isCollapsed,
    activeTrap,
    onToggleCollapse,
    onSelectedTabChanged,
    onOpenKeyboard,
    onCloseKeyboard,
    TabContentVisibilty = 'inherit',
  } = props;
  const mapId = useGeoViewMapId();
  const mapElem = document.getElementById(`shell-${mapId}`);
  const { t } = useTranslation<string>();

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);
  // internal state
  const [value, setValue] = useState(0);
  const [tabPanels, setTabPanels] = useState([tabs[0]]);

  // get store values and actions
  const mapSize = useMapSize();

  // show/hide dropdown based on map size
  const [showMobileDropdown, setShowMobileDropdown] = useState(mapSize[0] < theme.breakpoints.values.sm);

  /**
   * Update Tab panel when value change from tabs and dropdown.
   * @param {number} tabValue index of the tab or dropdown.
   */
  const updateTabPanel = (tabValue: number) => {
    // Update panel refs when tab value is changed.
    // handle no tab when mobile dropdown is displayed.
    if (typeof tabValue === 'string') {
      setValue(tabValue);
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
  };

  /**
   * Handle a tab change
   * @param {number} newValue value of the new tab
   */
  const handleChange = (event: SyntheticEvent<Element, Event>, newValue: number) => {
    updateTabPanel(newValue);
  };

  /**
   * Handle a tab click
   * If the panel is collapsed when tab is clicked, expand the panel
   */
  const handleClick = (index: number) => {
    if (value === index) onToggleCollapse?.();

    // WCAG - if keyboard navigation is on and the tabs gets expanded, set the trap store info to open, close otherwise
    if (activeTrap) onOpenKeyboard?.({ activeElementId: `panel-${index}`, callbackElementId: `tab-${index}` });
    else onCloseKeyboard?.();
  };

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

      // Make sure it's visible
      if (isCollapsed) onToggleCollapse?.();
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
              // eslint-disable-next-line react/destructuring-assignment
              {...props.tabsProps}
              variant="scrollable"
              scrollButtons
              allowScrollButtonsMobile
              value={value}
              onChange={handleChange}
              aria-label="basic tabs"
              sx={{
                '& .MuiTabs-indicator': {
                  backgroundColor: (bgTheme) => bgTheme.palette.secondary.main,
                },
              }}
            >
              {tabs.map((tab, index) => {
                return (
                  <MaterialTab
                    label={t(tab.label)}
                    key={`${t(tab.label)}`}
                    icon={tab.icon}
                    iconPosition="start"
                    // eslint-disable-next-line react/destructuring-assignment
                    {...props.tabProps}
                    id={`tab-${index}`}
                    onClick={() => handleClick(index)}
                    sx={sxClasses.tab}
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
                inputLabel={{ id: 'footerBarDropdownLabel' }}
                menuItems={mobileTabsDropdownValues}
                value={value}
                onChange={(e) => updateTabPanel(e.target.value as number)}
                MenuProps={{ container: mapElem }}
                variant="outlined"
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
            <TabPanel value={value} index={index} key={tab.id}>
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
