import type { InputLabelProps, FormControlProps, SelectProps, SelectChangeEvent, MenuProps, SxProps, Theme } from '@mui/material';
/** Requires exactly one source for the Select's accessible name. */
type TypeSelectLabelProps = {
    label: string;
    'aria-label'?: never;
} | {
    label?: never;
    'aria-label': string;
};
/** Custom MUI Select properties. */
type TypeSelectProps = {
    /** Optional ID of the visible label associated with the select. */
    labelId?: string;
    /** Properties passed to the wrapping form control. */
    formControlProps?: FormControlProps;
    /** ID applied to the underlying select element. */
    id?: string;
    /** Whether the select fills the available width. */
    fullWidth?: boolean;
    /** Current selected value. */
    value: unknown;
    /** Callback invoked when the selected value changes. */
    onChange: (event: SelectChangeEvent<unknown>) => void;
    /** Optional label styling and behaviour; the wrapper owns the label ID. */
    inputLabel?: Omit<InputLabelProps, 'id'> & {
        id?: never;
    };
    /** Input attributes forwarded to MUI; aria-label is controlled by the top-level naming strategy. */
    inputProps?: SelectProps['inputProps'];
    /** Menu entries displayed by the select. */
    menuItems: TypeMenuItemProps[];
    /** Whether the select is disabled. */
    disabled?: boolean;
    /** Visual variant of the select. */
    variant?: 'standard' | 'outlined' | 'filled';
    /**
     * Props applied to the Menu component.
     * Use this to specify a container element for the menu dropdown.
     * This is particularly important when the Select is inside a fullscreen element,
     * to ensure the menu renders within the fullscreen container.
     * Example: MenuProps={{ container: shellContainer }}
     */
    MenuProps?: Partial<MenuProps>;
    /** Styles applied to the wrapping form control. */
    sx?: SxProps<Theme>;
    /**
     * If true, the selected value is rendered when the value is empty.
     * Used with renderValue to display placeholder-style content.
     */
    displayEmpty?: boolean;
    /**
     * Render function for the selected value display.
     * Allows custom rendering of the selected value in the input.
     */
    renderValue?: (value: unknown) => React.ReactNode;
} & Omit<React.AriaAttributes, 'aria-label'> & TypeSelectLabelProps;
/** Properties for a select menu entry. */
export interface TypeMenuItemProps {
    /** Whether this entry is a selectable item or a group header. */
    type?: 'item' | 'header';
    /** Value and display content of the menu entry. */
    item: {
        /** Value emitted when the menu entry is selected. */
        value: string | number;
        /** Content rendered for the menu entry. */
        children: React.ReactNode;
    };
}
export declare const Select: import("react").ForwardRefExoticComponent<TypeSelectProps & import("react").RefAttributes<HTMLDivElement>>;
export {};
//# sourceMappingURL=select.d.ts.map