import { FormControlLabel as MaterialFormControlLabel, Switch as MaterialSwitch, SwitchProps, useTheme } from '@mui/material';
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
  const theme = useTheme();
  const sxClasses = getSxClasses(theme);

  const { title, ...otherProps } = props;

  return <MaterialFormControlLabel control={<MaterialSwitch {...otherProps} />} label={title} sx={sxClasses.formControl} />;
}
