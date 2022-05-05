import React from 'react';

import { MenuItemProps } from '@mui/material';

import MaterialSelect from '@mui/material/Select';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';

import { TypeSelectProps } from '../../core/types/cgpv-types';

import { generateId } from '../../core/utils/utilities';

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
      <InputLabel {...inputLabel} />
      <MaterialSelect {...selectProps}>
        {menuItems.map((menuItem: MenuItemProps | null) => {
          if (menuItem) {
            const menuId = generateId(menuItem.id);

            return <MenuItem key={menuId} {...menuItem} />;
          }

          return null;
        })}
      </MaterialSelect>
    </FormControl>
  );
}
