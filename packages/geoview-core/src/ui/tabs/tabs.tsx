import { SyntheticEvent, ReactNode, useState, useEffect } from 'react';

import { useTranslation } from 'react-i18next';

import { Grid, Tab as MaterialTab, Tabs as MaterialTabs, TabsProps, TabProps, BoxProps } from '@mui/material';

import { HtmlToReact } from '@/core/containers/html-to-react';
import { TabPanel } from './tab-panel';
import { useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';
import { getSxClasses } from './tabs-style';

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
  handleCollapse?: () => void | undefined;
  TabContentVisibilty?: string | undefined;
}

/**
 * Create a tabs ui
 *
 * @param {TypeTabsProps} props properties for the tabs ui
 * @returns {JSX.Element} returns the tabs ui
 */
export function Tabs(props: TypeTabsProps): JSX.Element {
  const { tabs, rightButtons, selectedTab, isCollapsed, handleCollapse, TabContentVisibilty = 'inherit' } = props;

  const { t } = useTranslation<string>();

  const sxClasses = getSxClasses();
  // internal state
  const [value, setValue] = useState(0);

  // get store values and actions
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const { closeModal, openModal, setActiveFooterTab } = useUIStoreActions();

  /**
   * Handle a tab change
   *
   * @param {SyntheticEvent<Element, Event>} event the event used on a tab change
   * @param {number} newValue value of the new tab
   */
  const handleChange = (event: SyntheticEvent<Element, Event>, newValue: number) => {
    setValue(newValue);
    setActiveFooterTab(t(tabs[newValue].label).toLowerCase());
  };

  /**
   * Handle a tab click
   * If the panel is collapsed when tab is clicked, expand the panel
   */
  const handleClick = (index: number) => {
    if (handleCollapse !== undefined && (isCollapsed || value === index)) handleCollapse();

    // WCAG - if keyboard navigation is on and the tabs gets expanded, set the trap store info to open, close otherwise
    if (activeTrapGeoView) openModal({ activeElementId: `panel-${index}`, callbackElementId: `tab-${index}` });
    else closeModal();
  };

  useEffect(() => {
    if (selectedTab && value !== selectedTab) setValue(selectedTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  return (
    <Grid container sx={{ width: '100%', height: '100%' }}>
      <Grid container>
        <Grid item xs={7} sm={10} sx={{ background: 'white' }}>
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
                backgroundColor: (theme) => theme.palette.secondary.main,
              },
            }}
          >
            {tabs.map((tab, index) => {
              // eslint-disable-next-line prettier/prettier
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
        <TabPanel value={value} index={value}>
          {typeof tabs[value]?.content === 'string' ? (
            <HtmlToReact htmlContent={(tabs[value]?.content as string) ?? ''} />
          ) : (
            tabs[value].content
          )}
        </TabPanel>
      </Grid>
    </Grid>
  );
}
