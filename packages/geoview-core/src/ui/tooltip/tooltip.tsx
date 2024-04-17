import { Tooltip as MaterialTooltip, TooltipProps } from '@mui/material';
import React from 'react';

/**
 * Create a Material UI Tooltip component
 *
 * @param {TooltipProps} props custom tooltip properties
 * @returns {JSX.Element} the tooltip ui component
 */
export const Tooltip = React.forwardRef((props: TooltipProps, ref): JSX.Element => {
  return <MaterialTooltip enterDelay={1000} leaveDelay={200} {...props} ref={ref} />;
});

Tooltip.displayName = 'Tooltip';
