import MaterialCardHeader from '@mui/material/CardHeader';

import { TypeCardHeaderProps } from '../../core/types/cgpv-types';

/**
 * Create a customized Material UI Card Header
 *
 * @param {TypeCardHeaderProps} props the properties passed to the Card Header element
 * @returns {JSX.Element} the created Card Header element
 */
export function CardHeader(props: TypeCardHeaderProps): JSX.Element {
  const { type } = props;

  return <MaterialCardHeader {...props} component={type} />;
}
