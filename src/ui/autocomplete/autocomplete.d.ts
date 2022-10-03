/// <reference types="react" />
import { AutocompleteProps } from '@mui/material';
/**
 * Customized Material UI Autocomplete properties
 */
export interface TypeAutocompleteProps<T, Multiple extends boolean | undefined = undefined, DisableClearable extends boolean | undefined = undefined, FreeSolo extends boolean | undefined = undefined> extends AutocompleteProps<T, Multiple, DisableClearable, FreeSolo> {
    mapId?: string;
    fullWidth?: boolean;
}
/**
 * Create a Material UI Autocomplete component
 *
 * @param {TypeAutocompleteProps} props custom autocomplete properties
 * @returns {JSX.Element} the auto complete ui component
 */
export declare function Autocomplete<T, Multiple extends boolean | undefined = undefined, DisableClearable extends boolean | undefined = undefined, FreeSolo extends boolean | undefined = undefined>(props: TypeAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>): JSX.Element;
