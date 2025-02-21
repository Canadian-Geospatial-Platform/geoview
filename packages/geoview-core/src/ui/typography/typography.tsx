import { forwardRef, Ref } from 'react';
import { Typography as MaterialTypography, TypographyProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Typography component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Typography>
 *   Regular text content
 * </Typography>
 *
 * // With variant
 * <Typography
 *   variant="h1"
 *   color="primary"
 * >
 *   Heading Text
 * </Typography>
 * ```
 *
 * @param {TypographyProps} props - All valid Material-UI Typography props
 * @param {Ref<HTMLElement>} ref - Reference to the underlying HTML element
 * @returns {JSX.Element} The Typography component
 *
 * @see {@link https://mui.com/material-ui/react-typography/}
 */
function TypographyUI(props: TypographyProps, ref: Ref<HTMLElement>): JSX.Element {
  logger.logTraceRender('ui/typography/typography', props);

  return <MaterialTypography ref={ref} {...props} />;
}

// Export the Typography using forwardRef so that passing ref is permitted and functional in the react standards
export const Typography = forwardRef<HTMLElement, TypographyProps>(TypographyUI);
