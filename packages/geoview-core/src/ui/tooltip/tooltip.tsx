import { Tooltip as MaterialTooltip, TooltipProps } from '@mui/material';

/**
 * Custom MUI Tooltip properties
 */
interface TypeTooltipProps extends TooltipProps {
  // eslint-disable-next-line react/require-default-props
  mapId?: string;
}

/**
 * Create a Material UI Tooltip component
 *
 * @param {TypeTooltipProps} props custom tooltip properties
 * @returns {JSX.Element} the tooltip ui component
 */
export function Tooltip(props: TypeTooltipProps): JSX.Element {
  return <MaterialTooltip enterDelay={500} leaveDelay={200} {...props} />;
}
