/* eslint-disable react/require-default-props */
import { forwardRef, ReactNode } from 'react';
import { Box } from '@/ui';
import { FocusTrapContainer } from '@/core/components/common';
import { TypeContainerBox } from '@/core/types/global-types';

type TypeChildren = ReactNode;

/**
 * Interface used for the tab panel properties
 */
export interface TypeTabPanelProps {
  index: number;
  value: number;
  id: string;
  children?: TypeChildren;
  containerType?: TypeContainerBox;
  tabId: string;
}

/**
 * Create a tab panel that will be used to display the content of a tab
 *
 * @param {TypeTabPanelProps} props properties for the tab panel
 * @returns {JSX.Element} returns the tab panel
 */
export const TabPanel = forwardRef((props: TypeTabPanelProps, ref) => {
  const { children, value, index, id, containerType, tabId, ...other } = props;

  return (
    <Box role="tabpanel" hidden={value !== index} id={id} aria-labelledby={`${tabId} layers`} {...other} ref={ref}>
      <FocusTrapContainer id={tabId} containerType={containerType}>
        {children}
      </FocusTrapContainer>
    </Box>
  );
});

TabPanel.displayName = 'TabPanel';
