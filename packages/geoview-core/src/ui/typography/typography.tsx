import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { TypographyProps } from '@mui/material';
import { Typography as MaterialTypography } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI Typography component for semantic text rendering.
 *
 * Wraps Material-UI's Typography to provide styled text with semantic HTML elements.
 * Supports multiple font variants (h1-h6, body, caption, etc.) and colors.
 * All Material-UI Typography props are supported and passed through directly.
 *
 * @param props - Typography configuration (see TypographyProps)
 * @param ref - Reference to underlying HTML element
 * @returns Typography element with variant-based styling
 *
 * @example
 * ```tsx
 * <Typography variant="h1">Heading</Typography>
 * <Typography variant="body1">Regular text</Typography>
 * <Typography variant="caption" color="textSecondary">Small text</Typography>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-typography/}
 */
function TypographyUI(props: TypographyProps, ref: Ref<HTMLElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/typography/typography', props);

  return <MaterialTypography ref={ref} {...props} />;
}

// Export the Typography using forwardRef so that passing ref is permitted and functional in the react standards
export const Typography = forwardRef<HTMLElement, TypographyProps>(TypographyUI);
