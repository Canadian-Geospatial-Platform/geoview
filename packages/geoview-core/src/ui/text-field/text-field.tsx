import { forwardRef, memo, Ref } from 'react';
import { TextField as MaterialTextField } from '@mui/material';

import { TypeTextFieldProps } from '@/ui/panel/panel-types';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Text Field component.
 * This is a simple wrapper around MaterialText Field that maintains
 * full compatibility with Material-UI's Text Field props.
 *
 * @param {TypeTextFieldProps} props - All valid Material-UI Text Field props
 * @returns {JSX.Element} The Text Field component
 */
function MUITextField(props: TypeTextFieldProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRender('ui/text-field/text-field', props);

  return <MaterialTextField {...props} ref={ref} />;
}

// Export the Text Field using forwardRef so that passing ref is permitted and functional in the react standards
export const TextField = memo(forwardRef<HTMLDivElement, TypeTextFieldProps>(MUITextField));
