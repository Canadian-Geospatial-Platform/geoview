import React from 'react';

import MaterialCheckbox from '@mui/material/Checkbox';

import { TypeCheckboxProps } from '../../core/types/cgpv-types';

/**
 * Create a Material UI Checkbox component
 *
 * @param {TypeCheckboxProps} props custom checkbox properties
 * @returns {JSX.Element} the auto complete ui component
 */
export const Checkbox = React.forwardRef((props: TypeCheckboxProps, ref): JSX.Element => {
  return <MaterialCheckbox ref={ref as React.RefObject<HTMLButtonElement>} {...props} />;
});
