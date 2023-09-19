/// <reference types="react" />
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
export declare const Checkbox: import("react").ForwardRefExoticComponent<Omit<TypeCheckboxProps, "ref"> & import("react").RefAttributes<unknown>>;
export {};
