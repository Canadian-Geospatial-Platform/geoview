import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { CheckboxProps } from '@mui/material';
import { Checkbox as MaterialCheckbox } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Material-UI Checkbox component for boolean selections.
 *
 * Wraps Material-UI's Checkbox to provide a styled boolean input control.
 * Supports all Material-UI Checkbox props. Use with FormControlLabel for
 * labeled checkboxes or controlled/uncontrolled state management.
 *
 * @param props - Checkbox configuration (see MUI docs for all available props)
 * @param ref - Reference forwarded to underlying Material-UI Checkbox
 * @returns Checkbox component for boolean state selection
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Checkbox />
 *
 * // Controlled checkbox
 * <Checkbox
 *   checked={checked}
 *   onChange={(e) => setChecked(e.target.checked)}
 * />
 *
 * // With label and color
 * <Checkbox
 *   color="primary"
 *   defaultChecked
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-checkbox/}
 */
function CheckboxUI(props: CheckboxProps, ref: Ref<HTMLButtonElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/checkbox/checkbox');

  return <MaterialCheckbox ref={ref} {...props} />;
}

// Export the Button  using forwardRef so that passing ref is permitted and functional in the react standards
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(CheckboxUI);
