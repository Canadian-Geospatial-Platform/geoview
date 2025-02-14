import { memo } from 'react';
import { LinearProgress as LinearProgressBar } from '@mui/material';
import { logger } from '@/core/utils/logger';

interface ProgressbarProps {
  className?: string;
  variant?: 'determinate' | 'indeterminate' | 'buffer' | 'query';
  value?: number; // Value between 0 and 100
}

/**
 * Create a customized Material UI Linear Progres Bar component.
 * This is a simple wrapper around MaterialLinearProgress that maintains
 * full compatibility with Material-UI's Progress Bar props.
 *
 * @param {ProgressbarProps} props - All valid Material-UI Progress Bar props
 * @returns {JSX.Element} The ProgressBar component
 */
export const ProgressBar = memo(function ProgressBar({
  className = '',
  variant = 'indeterminate',
  value = 0,
  ...props
}: ProgressbarProps): JSX.Element {
  logger.logTraceRender('ui/linear-progress/linear-progress');

  return <LinearProgressBar variant={variant} value={value} className={className} {...props} />;
});

/**
 * Example of usage by application code
 * <ProgressBar variant='determinate' value={progress}></ProgressBar>
 */
