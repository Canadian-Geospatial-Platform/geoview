import { useMemo, memo } from 'react';
import { FormControlLabel as MaterialFormControlLabel, Switch as MaterialSwitch, SwitchProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from '@/ui/switch/switch-style';
import { logger } from '@/core/utils/logger';

/**
 * Create a customized Material UI Switch component.
 * This is a simple wrapper around MaterialSwitch that maintains
 * full compatibility with Material-UI's Switch props.
 *
 * @param {SwitchProps} props - All valid Material-UI Switch props
 * @returns {JSX.Element} The Switch component
 */
export const Switch = memo(function Switch(props: SwitchProps): JSX.Element {
  logger.logTraceRender('ui/switch/switch', props);

  // Get constant from props
  const { title, ...otherProps } = props;

  // Hooks
  const theme = useTheme();
  const sxClasses = useMemo(() => getSxClasses(theme), [theme]);

  return <MaterialFormControlLabel control={<MaterialSwitch {...otherProps} />} label={title} sx={sxClasses.formControl} />;
});
