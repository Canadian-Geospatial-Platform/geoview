import { useId, useMemo } from 'react';
import type { SwitchProps } from '@mui/material';
import { FormControlLabel as MaterialFormControlLabel, Switch as MaterialSwitch } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from '@/ui/switch/switch-style';
import { logger } from '@/core/utils/logger';

// Extend SwitchProps to include some FormControlLabel Props
interface ExtendedSwitchProps extends SwitchProps {
  label: string;
}

/**
 * Create a customized Material UI Switch component.
 *
 * Wraps the Material-UI Switch with a FormControlLabel to ensure
 * proper labeling and accessibility. Generates unique IDs to associate
 * the label with the switch control.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Switch
 *   label="Toggle Switch"
 *   checked={isChecked}
 *   onChange={handleChange}
 * />
 *
 * // Disabled state
 * <Switch
 *   label="Disabled Switch"
 *   disabled
 *   checked={false}
 * />
 *
 * // With size variant
 * <Switch
 *   label="Small Switch"
 *   size="small"
 *   checked={isChecked}
 * />
 * ```
 *
 * @param {ExtendedSwitchProps} props - All valid Material-UI Switch props
 * @returns {JSX.Element} The Switch component wrapped in FormControlLabel
 *
 * @see {@link https://mui.com/material-ui/react-switch/}
 */
function SwitchUI(props: ExtendedSwitchProps): JSX.Element {
  logger.logTraceRenderDetailed('ui/switch/switch', props);

  // Get constant from props
  const { label, ...otherProps } = props;

  // Hooks
  const switchId = useId(); // WCAG - Unique ID to associate label with switch
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  return (
    <MaterialFormControlLabel
      htmlFor={switchId}
      control={<MaterialSwitch id={switchId} {...otherProps} />}
      label={label}
      sx={sxClasses.formControl}
    />
  );
}

export const Switch = SwitchUI;
