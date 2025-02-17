/* eslint-disable react/require-default-props */
import { forwardRef, memo, ReactNode, Ref } from 'react';
import { Box } from '@/ui';
import { FocusTrapContainer } from '@/core/components/common';
import { TypeContainerBox } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';

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
function MUITabPanel(props: TypeTabPanelProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRender('ui/tabs/tab-panel', props);

  // Get constant from props
  const { children, value, index, id, containerType, tabId, ...other } = props;

  return (
    <Box role="tabpanel" hidden={value !== index} id={id} aria-labelledby={`${tabId} layers`} {...other} ref={ref}>
      <FocusTrapContainer id={tabId} containerType={containerType}>
        {children}
      </FocusTrapContainer>
    </Box>
  );
}

// Export the Tab Panel using forwardRef so that passing ref is permitted and functional in the react standards
export const TabPanel = memo(forwardRef<HTMLDivElement, TypeTabPanelProps>(MUITabPanel));
