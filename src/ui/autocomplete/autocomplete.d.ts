import { AutocompleteProps } from '@mui/material';
/**
 * Customized Material UI Autocomplete properties
 */
export interface TypeAutocompleteProps<T, Multiple extends boolean | undefined = undefined, DisableClearable extends boolean | undefined = undefined, FreeSolo extends boolean | undefined = undefined> extends AutocompleteProps<T, Multiple, DisableClearable, FreeSolo> {
    fullWidth: boolean;
}
export declare const Autocomplete: import("react").ForwardRefExoticComponent<Omit<TypeAutocompleteProps<unknown, boolean | undefined, boolean | undefined, boolean | undefined>, "ref"> & import("react").RefAttributes<HTMLElement>>;
