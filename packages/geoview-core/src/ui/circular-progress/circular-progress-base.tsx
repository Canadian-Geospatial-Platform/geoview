import { CircularProgress as MaterialCircularProgress, CircularProgressProps } from '@mui/material';
import { memo } from 'react';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Circular Progress Base component.
 * This is a simple wrapper around MaterialCircularProgress that maintains
 * full compatibility with Material-UI's CircularProgress props.
 *
 * @param {CircularProgressProps} props - All valid Material-UI CircularProgress props
 * @returns {JSX.Element} The CircularProgress component
 */
export const CircularProgressBase = memo(function CircularProgressBase(props: CircularProgressProps): JSX.Element {
  logger.logTraceRender('ui/circular-progress/circular-progress-base');

  return <MaterialCircularProgress {...props} />;
});
