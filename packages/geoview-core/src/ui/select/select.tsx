import React from 'react';

import { MenuItemProps, ListSubheaderProps } from '@mui/material';

import makeStyles from '@mui/styles/makeStyles';
import ListSubheader from '@mui/material/ListSubheader';
import MaterialSelect from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';

import { TypeSelectProps, TypeMenuItemProps } from '../../core/types/cgpv-types';

const useStyles = makeStyles((theme) => ({
  formControl: {
    width: '100%',
    color: '#fff',
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    '& .MuiOutlinedInput-root.Mui-focused': {
      border: `1px solid ${theme.palette.primary.contrastText}`,
    },
  },
  label: {
    color: '#fff',
  },
}));
/**
 * Create a Material UI Select component
 *
 * @param {TypeSelectProps} props custom select properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Select(props: TypeSelectProps): JSX.Element {
  const { fullWidth, inputLabel, menuItems, ...selectProps } = props;
  const classes = useStyles();

  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel className={classes.label} {...inputLabel}>
        {selectProps.label}
      </InputLabel>
      <MaterialSelect className={classes.formControl} {...selectProps}>
        {menuItems.map((menuItem: TypeMenuItemProps, index) => {
          if (menuItem) {
            if (menuItem.type === 'header') {
              // eslint-disable-next-line react/no-array-index-key
              return <ListSubheader key={index} {...(menuItem.item as ListSubheaderProps)} />;
            }

            // eslint-disable-next-line react/no-array-index-key
            return <MenuItem key={index} {...(menuItem.item as MenuItemProps)} />;
          }

          return null;
        })}
      </MaterialSelect>
    </FormControl>
  );
}
