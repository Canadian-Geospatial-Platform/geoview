import React from 'react';

import MaterialSwitch from '@mui/material/Switch';
import MaterialFormControlLabel from '@mui/material/FormControlLabel';
import makeStyles from '@mui/styles/makeStyles';

import { TypeSwitchProps } from '../../core/types/cgpv-types';

const useStyles = makeStyles((theme) => ({
  formControl: {
    width: '100%',
    marginRight: '5px',
    marginLeft: '5px',
    '& .MuiSwitch-switchBase.Mui-focusVisible': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    '& .MuiFormControlLabel-label': {
      fontSize: theme.typography.subtitle2.fontSize,
      color: theme.palette.primary.light,
      whiteSpace: 'nowrap',
    },
  },
}));

/**
 * Create a Material UI Swich component
 *
 * @param {TypeSwitchProps} props custom switch properties
 * @returns {JSX.Element} the switch ui component
 */
export function Switch(props: TypeSwitchProps): JSX.Element {
  const classes = useStyles();

  const { title, ...otherProps } = props;

  return <MaterialFormControlLabel control={<MaterialSwitch {...otherProps} />} label={title} className={classes.formControl} />;
}
