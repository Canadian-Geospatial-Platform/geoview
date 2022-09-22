import MaterialTooltip from '@mui/material/Tooltip';

import { TooltipProps } from '@mui/material';

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
 * @returns {JSX.Element} the auto complete ui component
 */
export function Tooltip(props: TypeTooltipProps): JSX.Element {
  return <MaterialTooltip {...props} />;
}
