/* eslint-disable react/require-default-props */
import { ReactNode } from 'react';

type TypeChildren = ReactNode;

/**
 * Interface used for the tab panel properties
 */
export interface TypeTabPanelProps {
  index: number;
  value: number;
  children?: TypeChildren;
}

/**
 * Create a tab panel that will be used to display the content of a tab
 *
 * @param {TypeTabPanelProps} props properties for the tab panel
 * @returns {JSX.Element} returns the tab panel
 */
export function TabPanel(props: TypeTabPanelProps): JSX.Element {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`${`simple-tabpanel`}-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
      style={{ height: '100%', overflow: 'auto' }}
    >
      {children}
    </div>
  );
}
