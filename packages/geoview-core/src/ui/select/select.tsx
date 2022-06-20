import React from 'react';

import { MenuItemProps, ListSubheaderProps } from '@mui/material';

import ListSubheader from '@mui/material/ListSubheader';
import MaterialSelect from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';

import { TypeSelectProps, TypeMenuItemProps } from '../../core/types/cgpv-types';

/**
 * Create a Material UI Select component
 *
 * @param {TypeSelectProps} props custom select properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Select(props: TypeSelectProps): JSX.Element {
  const { fullWidth, inputLabel, menuItems, ...selectProps } = props;

  return (
    <FormControl fullWidth={fullWidth}>
      <InputLabel {...inputLabel}>{selectProps.label}</InputLabel>
      <MaterialSelect {...selectProps}>
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
