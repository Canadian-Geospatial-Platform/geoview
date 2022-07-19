import React from 'react';

import MaterialTextField from '@mui/material/TextField';
import { TextFieldProps } from '@mui/material';

/**
 * Custom Material UI Textfield properties
 */
// eslint-disable-next-line react/require-default-props
type TypeTextFieldProps = TextFieldProps & { mapId?: string };

/**
 * Create a Material UI TextField component
 *
 * @param {TypeTextFieldProps} props custom textfield properties
 * @returns {JSX.Element} the text field ui component
 */
export function TextField(props: TypeTextFieldProps): JSX.Element {
  return <MaterialTextField {...props} />;
}
