import React from 'react';

import MaterialTextField from '@mui/material/TextField';

import { TypeTextFieldProps } from '../../core/types/cgpv-types';

/**
 * Create a Material UI TextField component
 *
 * @param {TypeTextFieldProps} props custom textfield properties
 * @returns {JSX.Element} the text field ui component
 */
export function TextField(props: TypeTextFieldProps): JSX.Element {
  return <MaterialTextField {...props} />;
}
