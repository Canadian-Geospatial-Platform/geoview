import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { PaperProps } from '@mui/material';
import { Paper as MaterialPaper } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI Paper component for surface containers.
 *
 * Wraps Material-UI's Paper to provide elevated surface element with customizable
 * elevation, variant, and styling. Useful for card-like containers, panels, and
 * surface elements. All Material-UI Paper props are supported and passed through directly.
 *
 * @param props - Paper configuration (see MUI docs for all available props)
 * @param ref - Reference to the paper element
 * @returns Paper component with elevation and styling support
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Paper>
 *   <Typography>Content</Typography>
 * </Paper>
 *
 * // With elevation
 * <Paper elevation={3}>
 *   <Typography>Elevated content</Typography>
 * </Paper>
 *
 * // With custom styling
 * <Paper
 *   sx={{
 *     p: 2,
 *     backgroundColor: 'background.paper'
 *   }}
 * >
 *   <Typography>Styled content</Typography>
 * </Paper>
 *
 * // Square variant
 * <Paper
 *   variant="outlined"
 *   square
 * >
 *   <Typography>Square paper</Typography>
 * </Paper>
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-paper/}
 */
function MUIPaper(props: PaperProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/paper/paper');

  return <MaterialPaper ref={ref} {...props} />;
}

// Export the Paper using forwardRef so that passing ref is permitted and functional in the react standards
export const Paper = forwardRef<HTMLDivElement, PaperProps>(MUIPaper);
