import { FormControlLabel as MaterialFormControlLabel, Switch as MaterialSwitch, SwitchProps } from '@mui/material';
import { useTheme } from '@mui/material/styles';

import { getSxClasses } from './switch-style';

/**
 * Custom Material UI Switch properties
 */
// eslint-disable-next-line react/require-default-props
export type TypeSwitchProps = SwitchProps & { mapId?: string };

/**
 * Create a Material UI Swich component
 *
 * @param {TypeSwitchProps} props custom switch properties
 * @returns {JSX.Element} the switch ui component
 */
export function Switch(props: TypeSwitchProps): JSX.Element {
  const { title, ...otherProps } = props;

  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  return <MaterialFormControlLabel control={<MaterialSwitch {...otherProps} />} label={title} sx={sxClasses.formControl} />;
}
