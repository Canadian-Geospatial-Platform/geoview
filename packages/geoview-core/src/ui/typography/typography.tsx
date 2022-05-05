import MaterialTypography from '@mui/material/Typography';

import { TypeTypographyProps } from '../../core/types/cgpv-types';

/**
 * Create a Material UI Typography component
 *
 * @param {TypeTypographyProps} props custom typography properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Typography(props: TypeTypographyProps): JSX.Element {
  return <MaterialTypography {...props} />;
}
