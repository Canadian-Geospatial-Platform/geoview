import { LinearProgress as LinearProgressBar } from '@mui/material';

import { logger } from '@/core/utils/logger';

/**
 * Properties for the Progress Bar component.
 *
 * Extends Material-UI's LinearProgress functionality with
 * additional accessibility support.
 */
interface ProgressbarProps {
  className?: string;
  variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
  value?: number; // Value between 0 and 100
  'aria-label'?: string; // Optional - Screen reader label
}

/**
 * Material-UI LinearProgress component for progress indication.
 *
 * Wraps Material-UI's LinearProgress to provide horizontal progress bar with
 * multiple variants (determinate, indeterminate, buffer, query). Supports custom
 * values, accessibility labels, and theme-aware styling. All Material-UI
 * LinearProgress props are supported and passed through directly.
 *
 * @param props - ProgressBar configuration (see ProgressbarProps interface)
 * @returns Progress bar component with theme styling
 *
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
 * @see {@link https://mui.com/material-ui/react-progress/}
 */
function ProgressBarUI({ className = '', variant = 'indeterminate', value = 0, ...props }: ProgressbarProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/linear-progress/linear-progress');

  return <LinearProgressBar variant={variant} value={value} className={className} {...props} />;
}

export const ProgressBar = ProgressBarUI;
