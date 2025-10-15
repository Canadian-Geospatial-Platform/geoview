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
}

/**
 * A customized Material UI Circular Progress component with fade animation.
 *
 * @component
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
 * @param {CircularProgressPropsExtend} props - The properties for the CircularProgress component
 * @returns {JSX.Element} A rendered CircularProgress component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
function CircularProgressUI(props: CircularProgressPropsExtend): JSX.Element {
  logger.logTraceRenderDetailed('ui/circular-progress/circular-progress');

  // Get constant from props
  const { style = {}, isLoaded, sx = {}, ...rest } = props;

  // Hook
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  const sxMerged = { ...sxClasses.loading, ...sx };
  return (
    <Fade in={!isLoaded} timeout={{ enter: 0, exit: theme.transitions.duration.splash }} mountOnEnter unmountOnExit>
      <Box sx={sxMerged} style={{ ...style }}>
        <MaterialCircularProgress sx={sxClasses.progress} {...rest} />
      </Box>
    </Fade>
  );
}

export const CircularProgress = CircularProgressUI;
