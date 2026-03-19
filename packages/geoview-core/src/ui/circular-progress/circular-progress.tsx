import type { CSSProperties } from 'react';
import { useMemo } from 'react';
import type { SxProps, Theme } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';
import type { CircularProgressProps } from '@mui/material';
import { CircularProgress as MaterialCircularProgress, Box, Fade } from '@mui/material';

import { getSxClasses } from '@/ui/circular-progress/circular-progress-style';
import { logger } from '@/core/utils/logger';

/**
 * Circular Progress Properties
 */
export interface CircularProgressPropsExtend extends CircularProgressProps {
  isLoaded: boolean;
  style?: CSSProperties;
  sx?: SxProps<Theme>;
  sxCircular?: SxProps<Theme>;
}

/**
 * Material-UI CircularProgress with fade-in/out animation.
 *
 * Wraps Material-UI's CircularProgress with Fade animation controlled by the
 * `isLoaded` prop. Shows loading spinner when isLoaded is false, fades out when
 * true using theme transitions. All Material-UI CircularProgress props are supported.
 * Useful for displaying loading states with smooth visibility transitions.
 *
 * @param props - CircularProgress configuration (see CircularProgressPropsExtend interface)
 * @returns Fading CircularProgress component showing when not loaded
 *
 * @example
 * ```tsx
 * // Basic usage with loading state
 * <CircularProgress isLoaded={false} />
 *
 * // With custom size and color
 * <CircularProgress
 *   isLoaded={false}
 *   size={40}
 *   color="secondary"
 * />
 *
 * // With custom styling
 * <CircularProgress
 *   isLoaded={false}
 *   sx={{
 *     color: 'primary.main',
 *     position: 'absolute'
 *   }}
 * />
 *
 * // With custom thickness
 * <CircularProgress
 *   isLoaded={false}
 *   thickness={4}
 *   size={50}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
function CircularProgressUI(props: CircularProgressPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/circular-progress/circular-progress');

  // Get constant from props
  const { style = {}, isLoaded, sx = {}, sxCircular = {}, ...rest } = props;

  // Hook
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const sxMerged = { ...sxClasses.loading, ...sx };
  const sxCircularMerged = { ...sxClasses.progress, ...sxCircular };

  return (
    <Fade in={!isLoaded} timeout={{ enter: 0, exit: theme.transitions.duration.splash }} mountOnEnter unmountOnExit>
      <Box sx={sxMerged} style={{ ...style }}>
        <MaterialCircularProgress sx={sxCircularMerged} {...rest} />
      </Box>
    </Fade>
  );
}

export const CircularProgress = CircularProgressUI;
