import { Typography as MaterialTypography, TypographyProps } from '@mui/material';

/**
 * Custom Material UI Typography properties
 */
interface TypeTypographyProps extends TypographyProps {
  // eslint-disable-next-line react/require-default-props
  mapId?: string;
}

/**
 * Create a Material UI Typography component
 *
 * @param {TypeTypographyProps} props custom typography properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Typography(props: TypeTypographyProps): JSX.Element {
  return <MaterialTypography {...props} />;
}
