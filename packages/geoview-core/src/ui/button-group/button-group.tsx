import { Ref, forwardRef } from 'react';
import { ButtonGroup as MaterialButtonGroup, ButtonGroupProps } from '@mui/material';

/**
 * Create a customized Material UI button group
 *
 * @param {ButtonGroupProps} props the properties passed to the button group element
 * @param {Ref<HTMLDivElement>} ref the ref object forwarded to the underlying MaterialButtonGroup
 * @returns {JSX.Element} the created Button Group element
 */
function ButtonGroupElement(props: ButtonGroupProps, ref: Ref<HTMLDivElement>): JSX.Element {
  const { children } = props;

  return (
    <MaterialButtonGroup {...props} ref={ref}>
      {children && children}
    </MaterialButtonGroup>
  );
}

// Export the Button Group using forwardRef so that passing ref is permitted and functional in the react standards
export const ButtonGroup = forwardRef(ButtonGroupElement);
