import { CircularProgress as MaterialCircularProgress, CircularProgressProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * A customized Material UI Circular Progress Base component.
 *
 * @component
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
 * @param {CircularProgressProps} props - The properties for the CircularProgressBase component
 * @returns {JSX.Element} A rendered CircularProgressBase component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
function CircularProgressBaseUI(props: CircularProgressProps): JSX.Element {
  logger.logTraceRender('ui/circular-progress/circular-progress-base');

  return <MaterialCircularProgress {...props} />;
}

export const CircularProgressBase = CircularProgressBaseUI;
