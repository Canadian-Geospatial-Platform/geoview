/* eslint-disable react/require-default-props */
import { ReactNode } from 'react';
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
}

/**
 * Create a tab panel that will be used to display the content of a tab
 *
 * @param {TypeTabPanelProps} props properties for the tab panel
 * @returns {JSX.Element} returns the tab panel
 */
export function TabPanel(props: TypeTabPanelProps): JSX.Element {
  const { children, value, index, id, containerType, ...other } = props;

  return (
    <Box role="tabpanel" hidden={value !== index} id={id} aria-labelledby={`simple-tab-${index}`} {...other}>
      <FocusTrapContainer id={`panel-${index}`} containerType={containerType}>
        {children}
      </FocusTrapContainer>
    </Box>
  );
}
