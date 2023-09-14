import { forwardRef } from 'react';

import { Checkbox as MaterialCheckbox, CheckboxProps } from '@mui/material';

/**
 * Custom MUI Checkbox properties
 */
interface TypeCheckboxProps extends CheckboxProps {
  // eslint-disable-next-line react/require-default-props
  mapId?: string;
}

/**
 * Create a Material UI Checkbox component
 *
 * @param {TypeCheckboxProps} props custom checkbox properties
 * @returns {JSX.Element} the auto complete ui component
 */
// eslint-disable-next-line react/display-name
export const Checkbox = forwardRef((props: TypeCheckboxProps, ref): JSX.Element => {
  return <MaterialCheckbox ref={ref as React.RefObject<HTMLButtonElement>} {...props} />;
});
