import { forwardRef, memo, Ref } from 'react';
import { Typography as MaterialTypography, TypographyProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Typography component.
 * This is a simple wrapper around MaterialTypography that maintains
 * full compatibility with Material-UI's Typography props.
 *
 * @param {TypographyProps} props - All valid Material-UI Typography props
 * @returns {JSX.Element} The Typography component
 */
function MUITypography(props: TypographyProps, ref: Ref<HTMLElement>): JSX.Element {
  logger.logTraceRender('ui/typography/typography', props);

  return <MaterialTypography ref={ref} {...props} />;
}

// Export the Typography using forwardRef so that passing ref is permitted and functional in the react standards
export const Typography = memo(forwardRef<HTMLElement, TypographyProps>(MUITypography));
