import React, { forwardRef, Ref } from 'react';
import { Tooltip as MaterialTooltip, TooltipProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Tooltip component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Tooltip title="Help text">
 *   <Button>Hover me</Button>
 * </Tooltip>
 *
 * // With placement
 * <Tooltip
 *   title="Top placement"
 *   placement="top"
 * >
 *   <IconButton>
 *     <InfoIcon />
 *   </IconButton>
 * </Tooltip>
 * ```
 *
 * @param {TooltipProps} props - All valid Material-UI Tooltip props
 * @param {Ref<HTMLElement>} ref - Reference to the underlying HTML element
 * @returns {JSX.Element} The Tooltip component
 *
 * @see {@link https://mui.com/material-ui/react-tooltip/}
 */
function TooltipUI(props: TooltipProps, ref: Ref<HTMLElement>): JSX.Element {
  logger.logTraceRender('ui/Tooltip/Tooltip', props);

  // TODO: open issue about this behavior in the Material-UI GitHub repository (multiple tooltip)
  return <MaterialTooltip enterDelay={1000} enterNextDelay={200} {...props} ref={ref} />;
}

// Export the Tooltip using forwardRef so that passing ref is permitted and functional in the react standards
export const Tooltip = forwardRef<HTMLElement, TooltipProps>(TooltipUI);
