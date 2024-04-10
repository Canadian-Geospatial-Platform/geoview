import { forwardRef } from 'react';
import { Typography as MaterialTypography, TypographyProps } from '@mui/material';

/**
 * Create a Material UI Typography component
 *
 * @param {TypographyProps} props custom typography properties
 * @returns {JSX.Element} the auto complete ui component
 */
// eslint-disable-next-line react/display-name
export const Typography = forwardRef((props: TypographyProps, ref): JSX.Element => {
  return <MaterialTypography ref={ref as React.RefObject<HTMLElement>} {...props} />;
});
