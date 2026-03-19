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
 * Material-UI Switch component with integrated label using FormControlLabel.
 *
 * Wraps Material-UI's Switch with FormControlLabel for proper labeling and accessibility.
 * Auto-generates unique IDs to associate labels with switch controls.
 * All Material-UI Switch props are supported and passed through directly.
 *
 * @param props - Switch configuration (see ExtendedSwitchProps)
 * @returns Switch component wrapped in FormControlLabel with label
 *
 * @example
 * ```tsx
 * <Switch
 *   label="Enable notifications"
 *   checked={isEnabled}
 *   onChange={handleChange}
 * />
 *
 * <Switch label="Disabled" disabled checked={false} />
 * ```
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
