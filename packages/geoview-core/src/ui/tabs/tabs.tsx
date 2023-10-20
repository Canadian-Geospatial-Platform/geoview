/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-array-index-key */
import { SyntheticEvent, useEffect, useState, ReactNode } from 'react';

import { Grid, Tab as MaterialTab, Tabs as MaterialTabs, TabsProps, TabProps, BoxProps } from '@mui/material';

import { HtmlToReact } from '@/core/containers/html-to-react';

import { TabPanel } from './tab-panel';

type TypeChildren = ReactNode;
/**
 * Type used for properties of each tab
 */
export type TypeTabs = {
  value: number;
  label: string;
  content: TypeChildren | string;
};

/**
 * Tabs ui properties
 */
export interface TypeTabsProps {
  tabs: TypeTabs[];
  selectedTab?: number;
  boxProps?: BoxProps;
  tabsProps?: TabsProps;
  tabProps?: TabProps;
  rightButtons?: unknown;
  isCollapsed?: boolean;
  // eslint-disable-next-line @typescript-eslint/ban-types
  handleCollapse?: Function | undefined;
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
  const [value, setValue] = useState(0);

  /**
   * Handle a tab change
   *
   * @param {SyntheticEvent<Element, Event>} event the event used on a tab change
   * @param {number} newValue value of the new tab
   */
  const handleChange = (event: SyntheticEvent<Element, Event>, newValue: number) => {
    setValue(newValue);
  };

  /**
   * Handle a tab click
   * If the panel is collapsed when tab is clicked, expand the panel
   */
  const handleClick = (index: number) => {
    if (handleCollapse !== undefined && (isCollapsed || value === index)) handleCollapse();
  };

  useEffect(() => {
    if (selectedTab && value !== selectedTab) setValue(selectedTab);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTab]);

  return (
    <Grid container spacing={2} sx={{ width: '100%', height: '100%' }}>
      <Grid item xs={7} sm={10}>
        <MaterialTabs
          {...props.tabsProps}
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
                label={tab.label}
                key={index}
                {...props.tabProps}
                id={`tab-${index}`}
                onClick={() => handleClick(index)}
                sx={{
                  fontSize: 16,
                  minWidth: 'min(4vw, 24px)',
                  padding: '16px 2%',
                  textTransform: 'capitalize',
                  '&.Mui-selected': {
                    color: 'secondary.main',
                  },
                }}
              />
            );
          })}
        </MaterialTabs>
      </Grid>
      <Grid item xs={5} sm={2} sx={{ textAlign: 'right' }}>
        {rightButtons as ReactNode}
      </Grid>
      <Grid item xs={12} sx={{ height: '100%', borderTop: 1, borderColor: 'divider', visibility: TabContentVisibilty }}>
        {tabs.map((tab, index) => {
          const TabContent = tab.content as React.ElementType;
          return (
            <TabPanel key={index} value={value} index={index}>
              {typeof tab.content === 'string' ? <HtmlToReact htmlContent={tab.content} /> : <TabContent />}
            </TabPanel>
          );
        })}
      </Grid>
    </Grid>
  );
}
