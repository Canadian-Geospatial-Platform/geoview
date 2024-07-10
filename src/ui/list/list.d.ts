import { ListProps } from '@mui/material';
import React from 'react';
/**
 * Properties for the List UI
 */
export interface TypeListProps extends ListProps {
    type?: 'ul' | 'ol';
}
/**
 * Create a customized Material UI List
 *
 * @param {TypeListProps} props the properties passed to the List element
 * @returns {JSX.Element} the created List element
 */
export declare const List: React.ForwardRefExoticComponent<Omit<TypeListProps, "ref"> & React.RefAttributes<HTMLUListElement>>;
