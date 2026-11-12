import { useId, useMemo, useState } from 'react';
import type { ChangeEvent } from 'react';
import type { SwitchProps } from '@mui/material';
import { FormControlLabel as MaterialFormControlLabel, Switch as MaterialSwitch } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import type { SxStyles } from '@/ui/style/types';
import { getSxClasses } from '@/ui/switch/switch-style';
import { logger } from '@/core/utils/logger';

// Extend SwitchProps to include some FormControlLabel Props
interface ExtendedSwitchProps extends SwitchProps {
  label: string;
}

/**
 * Creates a Material-UI Switch component with an integrated FormControlLabel.
 *
 * Wraps Material-UI's Switch with FormControlLabel for proper labeling and accessibility.
 * Uses a supplied ID or generates a unique ID to associate labels with switch controls.
 * All Material-UI Switch props are supported and passed through directly.
 *
 * @param props - Properties defined in ExtendedSwitchProps
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
  const { label, id: providedId, slotProps, ...otherProps } = props;

  // Hooks
  const generatedSwitchId = useId();
  const switchId = providedId ?? generatedSwitchId;
  const inputSlotProps = slotProps?.input;
  const [uncontrolledChecked, setUncontrolledChecked] = useState<boolean>(otherProps.defaultChecked ?? false);
  const ariaChecked = otherProps.checked ?? uncontrolledChecked;
  const theme = useTheme();
  const memoSxClasses = useMemo((): SxStyles => {
    logger.logTraceUseMemo('SWITCH - memoSxClasses', theme);
    return getSxClasses(theme);
  }, [theme]);

  // #region HANDLERS

  /** Keeps the uncontrolled input state current and forwards the change to the caller. */
  const handleChange = (event: ChangeEvent<HTMLInputElement>, checked: boolean): void => {
    if (otherProps.checked === undefined) setUncontrolledChecked(checked);
    otherProps.onChange?.(event, checked);
  };

  // #endregion HANDLERS

  return (
    <MaterialFormControlLabel
      htmlFor={switchId}
      control={
        <MaterialSwitch
          id={switchId}
          slotProps={{
            ...slotProps,
            input: (ownerState) => ({
              ...(typeof inputSlotProps === 'function' ? inputSlotProps(ownerState) : inputSlotProps),

              // WCAG - Keep aria-checked consistent with the switch state.
              'aria-checked': ariaChecked,
            }),
          }}
          {...otherProps}
          onChange={handleChange}
        />
      }
      label={label}
      sx={memoSxClasses.formControl}
    />
  );
}

export const Switch = SwitchUI;
