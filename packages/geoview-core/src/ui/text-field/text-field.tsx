import { forwardRef, Ref } from 'react';
import { TextField as MaterialTextField } from '@mui/material';

import { TypeTextFieldProps } from '@/ui/panel/panel-types';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Text Field component.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <TextField
 *   label="Username"
 *   value={username}
 *   onChange={handleChange}
 * />
 *
 * // With validation
 * <TextField
 *   label="Email"
 *   error={!!emailError}
 *   helperText={emailError}
 *   required
 * />
 *
 * // With different variants
 * <TextField
 *   label="Password"
 *   type="password"
 *   variant="outlined"
 *   size="small"
 * />
 * ```
 *
 * @param {TypeTextFieldProps} props - All valid Material-UI Text Field props
 * @param {Ref<HTMLDivElement>} ref - Reference to the underlying div element
 * @returns {JSX.Element} The Text Field component
 *
 * @see {@link https://mui.com/material-ui/react-text-field/}
 */
function TextFieldUI(props: TypeTextFieldProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/text-field/text-field', props);

  return <MaterialTextField {...props} ref={ref} />;
}

// Export the Text Field using forwardRef so that passing ref is permitted and functional in the react standards
export const TextField = forwardRef<HTMLDivElement, TypeTextFieldProps>(TextFieldUI);
