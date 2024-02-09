import { forwardRef } from 'react';
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
// eslint-disable-next-line react/display-name
export const Typography = forwardRef((props: TypeTypographyProps, ref): JSX.Element => {
  return <MaterialTypography ref={ref as React.RefObject<HTMLElement>} {...props} />;
});
