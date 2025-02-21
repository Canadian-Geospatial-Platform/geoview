import { useMemo } from 'react';
import { FormControlLabel as MaterialFormControlLabel, Switch as MaterialSwitch, SwitchProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from '@/ui/switch/switch-style';
import { logger } from '@/core/utils/logger';

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
 * @param {SwitchProps} props - All valid Material-UI Switch props
 * @returns {JSX.Element} The Switch component wrapped in FormControlLabel
 *
 * @see {@link https://mui.com/material-ui/react-switch/}
 */
function SwitchUI(props: SwitchProps): JSX.Element {
  logger.logTraceRender('ui/switch/switch', props);

  // Get constant from props
  const { title, ...otherProps } = props;

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  return <MaterialFormControlLabel control={<MaterialSwitch {...otherProps} />} label={title} sx={sxClasses.formControl} />;
}

export const Switch = SwitchUI;
