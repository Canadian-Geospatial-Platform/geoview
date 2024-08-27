import { Autocomplete as MaterialAutocomplete, AutocompleteProps, FormControl } from '@mui/material';
import { forwardRef, Ref } from 'react';

/**
 * Customized Material UI Autocomplete properties
 */
export interface TypeAutocompleteProps<
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
> extends AutocompleteProps<T, Multiple, DisableClearable, FreeSolo> {
  fullWidth: boolean;
}

/**
 * Create a Material UI Autocomplete component
 *
 * @param {TypeAutocompleteProps} props custom autocomplete properties
 * @returns {JSX.Element} the auto complete ui component
 */
function MUIAutocomplete<
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
>(props: TypeAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>, ref: Ref<HTMLElement>): JSX.Element {
  const { fullWidth, ...autoCompleteProps } = props;

  return (
    <FormControl fullWidth={fullWidth}>
      <MaterialAutocomplete {...autoCompleteProps} ref={ref} data-id="autocomplete" />
    </FormControl>
  );
}

// Export the Autocomplete  using forwardRef so that passing ref is permitted and functional in the react standards
export const Autocomplete = forwardRef(MUIAutocomplete);
