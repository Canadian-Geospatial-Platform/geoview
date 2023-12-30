/* eslint-disable react/require-default-props */
/* eslint-disable react/destructuring-assignment */
/* eslint-disable react/no-array-index-key */
import { SyntheticEvent, useEffect, useState, ReactNode } from 'react';

import { useTranslation } from 'react-i18next';

import { Grid, Tab as MaterialTab, Tabs as MaterialTabs, TabsProps, TabProps, BoxProps } from '@mui/material';

import { HtmlToReact } from '@/core/containers/html-to-react';
import { TabPanel } from './tab-panel';
import { useUIActiveTrapGeoView, useUIStoreActions } from '@/core/stores/store-interface-and-intial-values/ui-state';

type TypeChildren = React.ElementType;
/**
 * Type used for properties of each tab
 */
export type TypeTabs = {
  id: string;
  value: number;
  label: string;
  content: TypeChildren | string;
  icon?: JSX.Element;
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

  const { t } = useTranslation<string>();

  // internal state
  const [value, setValue] = useState(0);

  // get store values and actions
  const activeTrapGeoView = useUIActiveTrapGeoView();
  const { closeModal, openModal } = useUIStoreActions();

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

    // WCAG - if keyboard navigation is on and the tabs gets expanded, set the trap store info to open, close otherwise
    if (activeTrapGeoView) openModal({ activeElementId: `panel-${index}`, callbackElementId: `tab-${index}` });
    else closeModal();
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
          variant="scrollable"
          scrollButtons
          allowScrollButtonsMobile
          value={value}
          onChange={handleChange}
          aria-label="basic tabs"
          sx={{
            '& .MuiTabs-indicator': {
              backgroundColor: (theme) => theme.palette?.secondary?.main,
            },
          }}
        >
          {tabs.map((tab, index) => {
            // eslint-disable-next-line prettier/prettier
            return (
              <MaterialTab
                label={t(tab.label)}
                key={index}
                icon={tab.icon}
                iconPosition="start"
                {...props.tabProps}
                id={`tab-${index}`}
                onClick={() => handleClick(index)}
                sx={{
                  fontSize: 16,
                  fontWeight: 'bold',
                  minWidth: 'min(4vw, 24px)',
                  padding: '16px 2%',
                  textTransform: 'capitalize',
                  '&.Mui-selected': {
                    color: 'secondary.main',
                  },
                  '.MuiTab-iconWrapper': {
                    marginRight: '7px',
                    maxWidth: '18px',
                  },
                }}
              />
            );
          })}
        </MaterialTabs>
      </Grid>
      <Grid item xs={5} sm={2} sx={{ textAlign: 'right', marginTop: '15px' }}>
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
