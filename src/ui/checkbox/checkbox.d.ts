import React from 'react';
import { CheckboxProps } from '@mui/material';
/**
 * Custom MUI Checkbox properties
 */
interface TypeCheckboxProps extends CheckboxProps {
    mapId?: string;
}
/**
 * Create a Material UI Checkbox component
 *
 * @param {TypeCheckboxProps} props custom checkbox properties
 * @returns {JSX.Element} the auto complete ui component
 */
export declare const Checkbox: React.ForwardRefExoticComponent<Omit<TypeCheckboxProps, "ref"> & React.RefAttributes<unknown>>;
export {};
