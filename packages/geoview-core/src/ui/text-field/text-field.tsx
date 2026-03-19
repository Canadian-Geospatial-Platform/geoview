import type { Ref } from 'react';
import { forwardRef } from 'react';
import { TextField as MaterialTextField } from '@mui/material';

import type { TypeTextFieldProps } from '@/ui/panel/panel-types';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI TextField component for text input.
 *
 * Wraps Material-UI's TextField for text input with integrated label, error states,
 * and helper text support. Supports all variant types (standard, outlined, filled)
 * and customizable sizing. All Material-UI TextField props are supported.
 *
 * @param props - TextField configuration (see TypeTextFieldProps)
 * @param ref - Reference to underlying input element
 * @returns TextField component with label and validation support
 *
 * @example
 * ```tsx
 * <TextField
 *   label="Username"
 *   value={username}
 *   onChange={handleChange}
 * />
 *
 * <TextField
 *   label="Email"
 *   error={!!error}
 *   helperText={error}
 *   required
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-text-field/}
 */
function TextFieldUI(props: TypeTextFieldProps, ref: Ref<HTMLDivElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/text-field/text-field', props);

  return <MaterialTextField {...props} ref={ref} />;
}

// Export the Text Field using forwardRef so that passing ref is permitted and functional in the react standards
export const TextField = forwardRef<HTMLDivElement, TypeTextFieldProps>(TextFieldUI);
