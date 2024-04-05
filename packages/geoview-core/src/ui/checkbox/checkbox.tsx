import { forwardRef } from 'react';

import { Checkbox as MaterialCheckbox, CheckboxProps } from '@mui/material';

/**
 * Create a Material UI Checkbox component
 *
 * @param {CheckboxProps} props custom checkbox properties
 * @returns {JSX.Element} the auto complete ui component
 */
// eslint-disable-next-line react/display-name
export const Checkbox = forwardRef((props: CheckboxProps, ref): JSX.Element => {
  return <MaterialCheckbox ref={ref as React.RefObject<HTMLButtonElement>} {...props} />;
});
