/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-array-index-key */
import { SyntheticEvent, useState } from 'react';

import { TabsProps, TabProps, BoxProps } from '@mui/material';
import MaterialTabs from '@mui/material/Tabs';
import MaterialTab from '@mui/material/Tab';
import Grid from '@mui/material/Grid';

import { HtmlToReact } from '../../core/containers/html-to-react';

import { TabPanel } from './tab-panel';

type TypeChildren = React.ReactNode;

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
  boxProps?: BoxProps;
  tabsProps?: TabsProps;
  tabProps?: TabProps;
  rightButtons?: unknown;
}

/**
 * Create a tabs ui
 *
 * @param {TypeTabsProps} props properties for the tabs ui
 * @returns {JSX.Element} returns the tabs ui
 */
export function Tabs(props: TypeTabsProps): JSX.Element {
  const { tabs, rightButtons } = props;

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

  return (
    <Grid container spacing={2} sx={{ width: '100%', height: '100%' }}>
      <Grid item xs={10}>
        <MaterialTabs {...props.tabsProps} value={value} onChange={handleChange} aria-label="basic tabs">
          {tabs.map((tab, index) => {
            return <MaterialTab label={tab.label} key={index} {...props.tabProps} id={`tab-${index}`} />;
          })}
        </MaterialTabs>
      </Grid>
      <Grid item xs={2} sx={{ textAlign: 'right' }}>
        {rightButtons}
      </Grid>
      <Grid item xs={12} sx={{ height: 'calc( 100% - 55px )', borderTop: 1, borderColor: 'divider' }}>
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
