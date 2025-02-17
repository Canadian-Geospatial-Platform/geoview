import { forwardRef, memo, Ref } from 'react';
import { Paper as MaterialPaper, PaperProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Paper component.
 * This is a simple wrapper around MaterialPaper that maintains
 * full compatibility with Material-UI's Paper props.
 *
 * @param {PaperProps} props - All valid Material-UI Paper props
 * @returns {JSX.Element} The Paper component
 */
function MUIPaper(props: PaperProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRender('ui/paper/paper');

  return <MaterialPaper ref={ref} {...props} />;
}

// Export the Paper using forwardRef so that passing ref is permitted and functional in the react standards
export const Paper = memo(forwardRef<HTMLDivElement, PaperProps>(MUIPaper));
