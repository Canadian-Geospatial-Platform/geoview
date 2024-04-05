import { FormControlLabel as MaterialFormControlLabel, Switch as MaterialSwitch, SwitchProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './switch-style';

/**
 * Create a Material UI Swich component
 *
 * @param {SwitchProps} props custom switch properties
 * @returns {JSX.Element} the switch ui component
 */
export function Switch(props: SwitchProps): JSX.Element {
  const { title, ...otherProps } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return <MaterialFormControlLabel control={<MaterialSwitch {...otherProps} />} label={title} sx={sxClasses.formControl} />;
}
