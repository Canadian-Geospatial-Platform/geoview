import type { ReactNode, Ref } from 'react';
import { forwardRef } from 'react';
import { Box } from '@/ui';
import { FocusTrapContainer } from '@/core/components/common';
import type { TypeContainerBox } from '@/core/types/global-types';
import { logger } from '@/core/utils/logger';

/**
 * Interface used for the tab panel properties
 */
export interface TypeTabPanelProps {
  index: number;
  value: number;
  id: string;
  children?: ReactNode;
  containerType: TypeContainerBox;
  tabId: string;
  className?: string;
}

/**
 * Accessible tab panel component for displaying tab content.
 *
 * Wraps Box component with proper ARIA attributes (role="tabpanel") and visibility states.
 * Integrates with focus trap for keyboard navigation within fullscreen containers.
 * Maintains hidden state when tab is inactive.
 *
 * @param props - Tab panel configuration (see TypeTabPanelProps)
 * @param ref - Reference to underlying div element
 * @returns Tab panel element with proper ARIA attributes and focus management
 *
 * @example
 * ```tsx
 * <TabPanel
 *   index={0}
 *   value={0}
 *   id="panel-0"
 *   tabId="tab-0"
 *   containerType="panel"
 * >
 *   Panel content here
 * </TabPanel>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-tabs/}
 */
function TabPanelUI(props: TypeTabPanelProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/tabs/tab-panel', props);

  // Get constant from props
  const { children, value, index, id, containerType, tabId, ...other } = props;

  return (
    <Box component="section" role="tabpanel" hidden={value !== index} id={id} aria-labelledby={`${tabId} layers`} {...other} ref={ref}>
      <FocusTrapContainer id={tabId} containerType={containerType}>
        {children}
      </FocusTrapContainer>
    </Box>
  );
}

// Export the Tab Panel using forwardRef so that passing ref is permitted and functional in the react standards
export const TabPanel = forwardRef<HTMLDivElement, TypeTabPanelProps>(TabPanelUI);
