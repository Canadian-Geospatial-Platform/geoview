import MaterialTooltip from '@mui/material/Tooltip';

import { TypeTooltipProps } from '../../core/types/cgpv-types';

/**
 * Create a Material UI Tooltip component
 *
 * @param {TypeTooltipProps} props custom tooltip properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Tooltip(props: TypeTooltipProps): JSX.Element {
  return <MaterialTooltip {...props} />;
}
