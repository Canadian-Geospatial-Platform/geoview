import { InputLabelProps, ListSubheaderProps, MenuItemProps, FormControlProps } from '@mui/material';
/**
 * Menu Item properties
 */
export interface TypeMenuItemProps {
    type?: 'item' | 'header';
    item: MenuItemProps | ListSubheaderProps | null;
}
export declare const Select: import("react").ForwardRefExoticComponent<(Omit<import("@mui/material").FilledSelectProps & import("@mui/material").BaseSelectProps<unknown> & {
    fullWidth?: boolean;
    menuItems: TypeMenuItemProps[];
    inputLabel: InputLabelProps;
    formControlProps?: FormControlProps;
    container?: HTMLElement | null;
}, "ref"> | Omit<import("@mui/material").StandardSelectProps & import("@mui/material").BaseSelectProps<unknown> & {
    fullWidth?: boolean;
    menuItems: TypeMenuItemProps[];
    inputLabel: InputLabelProps;
    formControlProps?: FormControlProps;
    container?: HTMLElement | null;
}, "ref"> | Omit<import("@mui/material").OutlinedSelectProps & import("@mui/material").BaseSelectProps<unknown> & {
    fullWidth?: boolean;
    menuItems: TypeMenuItemProps[];
    inputLabel: InputLabelProps;
    formControlProps?: FormControlProps;
    container?: HTMLElement | null;
}, "ref">) & import("react").RefAttributes<HTMLDivElement>>;
