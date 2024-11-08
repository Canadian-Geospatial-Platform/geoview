import { ListItemProps } from '@mui/material';
import React from 'react';
/**
 * Create a customized Material UI List Item
 *
 * @param {TypeListItemProps} props the properties passed to the List Item element
 * @returns {JSX.Element} the created List Item element
 */
export declare const ListItem: React.ForwardRefExoticComponent<Omit<ListItemProps, "ref"> & React.RefAttributes<HTMLLIElement>>;
