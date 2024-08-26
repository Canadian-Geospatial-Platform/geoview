/// <reference types="react" />
import { InputLabelProps, ListSubheaderProps, MenuItemProps, FormControlProps } from '@mui/material';
/**
 * Menu Item properties
 */
export interface TypeMenuItemProps {
    type?: 'item' | 'header';
    item: MenuItemProps | ListSubheaderProps | null;
}
export declare const Select: import("react").ForwardRefExoticComponent<(Omit<import("@mui/material").FilledSelectProps & import("@mui/material").BaseSelectProps<unknown> & {
    fullWidth?: boolean | undefined;
    menuItems: TypeMenuItemProps[];
    inputLabel: InputLabelProps;
    formControlProps?: FormControlProps<"div", {}> | undefined;
    container?: HTMLElement | null | undefined;
}, "ref"> | Omit<import("@mui/material").StandardSelectProps & import("@mui/material").BaseSelectProps<unknown> & {
    fullWidth?: boolean | undefined;
    menuItems: TypeMenuItemProps[];
    inputLabel: InputLabelProps;
    formControlProps?: FormControlProps<"div", {}> | undefined;
    container?: HTMLElement | null | undefined;
}, "ref"> | Omit<import("@mui/material").OutlinedSelectProps & import("@mui/material").BaseSelectProps<unknown> & {
    fullWidth?: boolean | undefined;
    menuItems: TypeMenuItemProps[];
    inputLabel: InputLabelProps;
    formControlProps?: FormControlProps<"div", {}> | undefined;
    container?: HTMLElement | null | undefined;
}, "ref">) & import("react").RefAttributes<HTMLDivElement>>;
