import MaterialCardContent from '@mui/material/CardContent';

import { TypeCardContentProps } from '../../core/types/cgpv-types';

/**
 * Create a customized Material UI Card Header
 *
 * @param {TypeCardHeaderProps} props the properties passed to the Card Header element
 * @returns {JSX.Element} the created Card Header element
 */
export function CardContent(props: TypeCardContentProps): JSX.Element {
  return <MaterialCardContent {...props} />;
}
