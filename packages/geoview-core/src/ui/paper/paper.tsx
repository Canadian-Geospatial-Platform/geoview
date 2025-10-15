import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { PaperProps } from '@mui/material';
import { Paper as MaterialPaper } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Paper component.
 *
 * @component
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
 * @param {PaperProps} props - All valid Material-UI Paper props
 * @param {Ref<HTMLDivElement>} ref - Reference to the paper element
 * @returns {JSX.Element} The Paper component
 *
 * @see {@link https://mui.com/material-ui/react-paper/}
 */
function MUIPaper(props: PaperProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/paper/paper');

  return <MaterialPaper ref={ref} {...props} />;
}

// Export the Paper using forwardRef so that passing ref is permitted and functional in the react standards
export const Paper = forwardRef<HTMLDivElement, PaperProps>(MUIPaper);
