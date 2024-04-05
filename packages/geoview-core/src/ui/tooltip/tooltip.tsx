import { Tooltip as MaterialTooltip, TooltipProps } from '@mui/material';

/**
 * Create a Material UI Tooltip component
 *
 * @param {TooltipProps} props custom tooltip properties
 * @returns {JSX.Element} the tooltip ui component
 */
export function Tooltip(props: TooltipProps): JSX.Element {
  return <MaterialTooltip enterDelay={1000} leaveDelay={200} {...props} />;
}
