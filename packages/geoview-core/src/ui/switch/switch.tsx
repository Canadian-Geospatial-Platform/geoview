import { useMemo } from 'react';
import { FormControlLabel as MaterialFormControlLabel, Switch as MaterialSwitch, SwitchProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from '@/ui/switch/switch-style';
import { logger } from '@/core/utils/logger';

// Extend SwitchProps to include some FormControlLabel Props
interface ExtendedSwitchProps extends SwitchProps {
  label?: string;
}

/**
 * Create a customized Material UI Switch component.
 * This is a simple wrapper around MaterialSwitch that maintains
 * full compatibility with Material-UI's Switch props while providing
 * a form control label.
 *
 * @component
 * @example
 * ```tsx
 * // Basic usage
 * <Switch
 *   title="Toggle Switch"
 *   checked={isChecked}
 *   onChange={handleChange}
 * />
 *
 * // Disabled state
 * <Switch
 *   title="Disabled Switch"
 *   disabled
 *   checked={false}
 * />
 *
 * // With size variant
 * <Switch
 *   title="Small Switch"
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
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  return <MaterialFormControlLabel control={<MaterialSwitch {...otherProps} />} label={label} sx={sxClasses.formControl} />;
}

export const Switch = SwitchUI;
