/* eslint-disable react/require-default-props */
import { forwardRef, ReactNode, Ref } from 'react';
import { Box } from '@/ui';
import { FocusTrapContainer } from '@/core/components/common';
import { TypeContainerBox } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';

/**
 * Interface used for the tab panel properties
 */
export interface TypeTabPanelProps {
  index: number;
  value: number;
  id: string;
  children?: ReactNode;
  containerType?: TypeContainerBox;
  tabId: string;
  className?: string;
}

/**
 * Create a tab panel that will be used to display the content of a tab.
 * This is a wrapper around Box component that maintains proper ARIA attributes
 * and visibility states while providing focus trap functionality.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <TabPanel
 *   index={0}
 *   value={0}
 *   id="panel-0"
 *   tabId="tab-0"
 * >
 *   Panel Content
 * </TabPanel>
 *
 * // With container type
 * <TabPanel
 *   index={1}
 *   value={1}
 *   id="panel-1"
 *   tabId="tab-1"
 *   containerType="panel"
 * >
 *   Panel Content
 * </TabPanel>
 * ```
 *
 * @param {TypeTabPanelProps} props - Properties for the tab panel
 * @param {Ref<HTMLDivElement>} ref - Reference to the underlying div element
 * @returns {JSX.Element} The tab panel component
 *
 * @see {@link https://mui.com/material-ui/react-tabs/}
 */
function TabPanelUI(props: TypeTabPanelProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/tabs/tab-panel', props);

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
export const TabPanel = forwardRef<HTMLDivElement, TypeTabPanelProps>(TabPanelUI);
