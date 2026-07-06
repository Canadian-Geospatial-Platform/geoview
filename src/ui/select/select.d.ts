import type { InputLabelProps, FormControlProps, SelectChangeEvent, MenuProps, SxProps, Theme } from '@mui/material';
/**
 * Menu Item properties
 */
export interface TypeMenuItemProps {
    type?: 'item' | 'header';
    item: {
        value: string | number;
        children: React.ReactNode;
    };
}
export declare const Select: import("react").ForwardRefExoticComponent<{
    labelId?: string;
    formControlProps?: FormControlProps;
    id?: string;
    fullWidth?: boolean;
    value: unknown;
    onChange: (event: SelectChangeEvent<unknown>) => void;
    label: string;
    inputLabel: InputLabelProps;
    menuItems: TypeMenuItemProps[];
    disabled?: boolean;
    variant?: "standard" | "outlined" | "filled";
    /**
     * Props applied to the Menu component.
     * Use this to specify a container element for the menu dropdown.
     * This is particularly important when the Select is inside a fullscreen element,
     * to ensure the menu renders within the fullscreen container.
     * Example: MenuProps={{ container: shellContainer }}
     */
    MenuProps?: Partial<MenuProps>;
    sx?: SxProps<Theme>;
} & import("react").AriaAttributes & import("react").RefAttributes<HTMLDivElement>>;
//# sourceMappingURL=select.d.ts.map