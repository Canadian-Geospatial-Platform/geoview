/// <reference types="react" />
import { InputLabelProps, ListSubheaderProps, MenuItemProps, SelectProps, FormControlProps } from '@mui/material';
/**
 * Custom MUI Select properties
 */
interface TypeSelectProps extends SelectProps {
    mapId?: string;
    fullWidth?: boolean;
    menuItems: TypeMenuItemProps[];
    inputLabel: InputLabelProps;
    formControlProps?: FormControlProps;
}
/**
 * Menu Item properties
 */
export interface TypeMenuItemProps {
    type?: 'item' | 'header';
    item: MenuItemProps | ListSubheaderProps | null;
}
/**
 * Create a Material UI Select component
 *
 * @param {TypeSelectProps} props custom select properties
 * @returns {JSX.Element} the auto complete ui component
 */
export declare function Select(props: TypeSelectProps): JSX.Element;
export {};
