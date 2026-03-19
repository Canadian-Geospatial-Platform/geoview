import type { CircularProgressProps } from '@mui/material';
import { CircularProgress as MaterialCircularProgress } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI CircularProgress without animation wrapper.
 *
 * Base circular progress component with direct Material-UI CircularProgress
 * rendering without fade animation or additional container. Use this for simple
 * progress indicators where animation is not needed. All Material-UI CircularProgress
 * props are supported and passed through directly.
 *
 * @param props - CircularProgress configuration (see MUI docs for all available props)
 * @returns Base CircularProgress component without animation
 *
 * @example
 * ```tsx
 * // Basic usage
 * <CircularProgressBase />
 *
 * // With specific value
 * <CircularProgressBase value={75} />
 *
 * // Indeterminate with color
 * <CircularProgressBase
 *   color="secondary"
 *   variant="indeterminate"
 * />
 *
 * // With custom size and thickness
 * <CircularProgressBase
 *   size={60}
 *   thickness={4}
 *   value={80}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
function CircularProgressBaseUI(props: CircularProgressProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/circular-progress/circular-progress-base');

  return <MaterialCircularProgress {...props} />;
}

export const CircularProgressBase = CircularProgressBaseUI;
