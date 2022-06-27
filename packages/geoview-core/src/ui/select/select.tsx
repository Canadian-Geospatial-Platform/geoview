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
    fontSize: 14,
    width: '100%',
    marginBottom: 16,
    color: theme.palette.primary.light,
    '& .MuiOutlinedInput-notchedOutline': {
      border: `1px solid ${theme.basemapPanel.borderDefault}`,
      padding: '0 12px 0 8px',
      '&[aria-hidden="true"]': {
        border: `1px solid ${theme.basemapPanel.borderDefault}`,
      },
    },
    '&:hover': {
      '& .MuiOutlinedInput-notchedOutline': {
        border: `1px solid ${theme.basemapPanel.borderDefault}`,
      },
    },
    '& .MuiFormLabel-root.Mui-focused': {
      color: theme.palette.primary.contrastText,
      background: theme.palette.primary.light,
    },
    '& .MuiSelect-select': {
      padding: '16px 12px',
    },
    '& .MuiSvgIcon-root': {
      color: theme.palette.primary.light,
    },
  },
  label: {
    color: theme.palette.primary.light,
    fontSize: 16,
  },
  menuItem: {
    fontSize: 14,
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
            return <MenuItem key={index} {...(menuItem.item as MenuItemProps)} className={classes.menuItem} />;
          }

          return null;
        })}
      </MaterialSelect>
    </FormControl>
  );
}
