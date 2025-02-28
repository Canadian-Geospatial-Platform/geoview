import { LinearProgress as LinearProgressBar } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Progress Bar component extending Material-UI's LinearProgressProps
 */
interface ProgressbarProps {
  className?: string;
  variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
  value?: number; // Value between 0 and 100
}

/**
 * Create a customized Material UI Linear Progress Bar component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <ProgressBar />
 *
 * // With determinate value
 * <ProgressBar
 *   variant="determinate"
 *   value={75}
 * />
 *
 * // With custom styling
 * <ProgressBar
 *   className="custom-progress"
 *   variant="buffer"
 * />
 *
 * // Indeterminate loading
 * <ProgressBar variant="indeterminate" />
 * ```
 *
 * @param {ProgressbarProps} props - The properties passed to the Progress Bar element
 * @returns {JSX.Element} The Progress Bar component
 *
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
function ProgressBarUI({ className = '', variant = 'indeterminate', value = 0, ...props }: ProgressbarProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/linear-progress/linear-progress');

  return <LinearProgressBar variant={variant} value={value} className={className} {...props} />;
}

export const ProgressBar = ProgressBarUI;
