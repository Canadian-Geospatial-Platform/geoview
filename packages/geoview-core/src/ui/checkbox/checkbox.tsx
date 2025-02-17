import { forwardRef, memo, Ref } from 'react';
import { Checkbox as MaterialCheckbox, CheckboxProps } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Checkbox component.
 * This is a simple wrapper around MaterialCheckbox that maintains
 * full compatibility with Material-UI's Checkbox props.
 *
 * @param {CheckboxProps} props - All valid Material-UI Checkbox props
 * @returns {JSX.Element} The Checkbox component
 */
function MUICheckbox(props: CheckboxProps, ref: Ref<HTMLButtonElement>): JSX.Element {
  logger.logTraceRender('ui/checkbox/checkbox');

  return <MaterialCheckbox ref={ref} {...props} />;
}

// Export the Button  using forwardRef so that passing ref is permitted and functional in the react standards
export const Checkbox = memo(forwardRef<HTMLButtonElement, CheckboxProps>(MUICheckbox));
