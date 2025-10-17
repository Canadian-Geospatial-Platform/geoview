import type { InputLabelProps, FormControlProps, SelectChangeEvent } from '@mui/material';
/**
 * Custom MUI Select properties
 */
type TypeSelectProps = {
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
    variant?: 'standard' | 'outlined' | 'filled';
};
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
export declare const Select: import("react").ForwardRefExoticComponent<TypeSelectProps & import("react").RefAttributes<HTMLDivElement>>;
export {};
//# sourceMappingURL=select.d.ts.map