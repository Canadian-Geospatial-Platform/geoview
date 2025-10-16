import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { CheckboxProps } from '@mui/material';
import { Checkbox as MaterialCheckbox } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * A customized Material UI Checkbox component.
 *
 * @component
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
 *
 * @param {CheckboxProps} props - The properties for the Checkbox component
 * @param {Ref<HTMLButtonElement>} ref - The ref forwarded to the underlying MaterialCheckbox
 * @returns {JSX.Element} A rendered Checkbox component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-checkbox/}
 */
function CheckboxUI(props: CheckboxProps, ref: Ref<HTMLButtonElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/checkbox/checkbox');

  return <MaterialCheckbox ref={ref} {...props} />;
}

// Export the Button  using forwardRef so that passing ref is permitted and functional in the react standards
export const Checkbox = forwardRef<HTMLButtonElement, CheckboxProps>(CheckboxUI);
