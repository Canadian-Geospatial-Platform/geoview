import React, { forwardRef, memo, Ref } from 'react';
import { Tooltip as MaterialTooltip, TooltipProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Tooltip component.
 * This is a simple wrapper around MaterialTooltip that maintains
 * full compatibility with Material-UI's Tooltip props.
 *
 * @param {TooltipProps} props - All valid Material-UI Tooltip props
 * @returns {JSX.Element} The Tooltip component
 */
function MUITooltip(props: TooltipProps, ref: Ref<HTMLElement>): JSX.Element {
  logger.logTraceRender('ui/Tooltip/Tooltip', props);

  // TODO: open issue about this behavior in the Material-UI GitHub repository (multiple tooltip)
  return <MaterialTooltip enterDelay={1000} enterNextDelay={200} {...props} ref={ref} />;
}

// Export the Tooltip using forwardRef so that passing ref is permitted and functional in the react standards
export const Tooltip = memo(forwardRef<HTMLElement, TooltipProps>(MUITooltip));
