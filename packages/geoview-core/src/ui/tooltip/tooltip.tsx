import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { TooltipProps } from '@mui/material';
import { Tooltip as MaterialTooltip } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI Tooltip component for displaying help text on hover.
 *
 * Wraps Material-UI's Tooltip with increased enter delay (1000ms) and next delay (200ms)
 * for better UX. Provides accessible help text that appears on element hover or focus.
 * All Material-UI Tooltip props are supported.
 *
 * @param props - Tooltip configuration (see TooltipProps)
 * @param ref - Reference to underlying HTML element
 * @returns Tooltip component wrapping children with hover help text
 *
 * @example
 * ```tsx
 * <Tooltip title="Click to save">
 *   <Button>Save</Button>
 * </Tooltip>
 *
 * <Tooltip title="Settings" placement="left">
 *   <IconButton>Settings</IconButton>
 * </Tooltip>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-tooltip/}
 */
function TooltipUI(props: TooltipProps, ref: Ref<HTMLElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/Tooltip/Tooltip', props);

  // TODO: open issue about this behavior in the Material-UI GitHub repository (multiple tooltip)
  return <MaterialTooltip enterDelay={1000} enterNextDelay={200} {...props} ref={ref} />;
}

// Export the Tooltip using forwardRef so that passing ref is permitted and functional in the react standards
export const Tooltip = forwardRef<HTMLElement, TooltipProps>(TooltipUI);
