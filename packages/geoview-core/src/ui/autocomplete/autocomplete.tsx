/* eslint-disable react/require-default-props */
import { ReactNode } from 'react';
import { Autocomplete as MaterialAutocomplete, AutocompleteProps, FormControl } from '@mui/material';

/**
 * Customized Material UI Autocomplete properties
 */
export interface TypeAutocompleteProps<
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
> extends AutocompleteProps<T, Multiple, DisableClearable, FreeSolo> {
  mapId?: string;
  fullWidth?: boolean;
}

/**
 * Create a Material UI Autocomplete component
 *
 * @param {TypeAutocompleteProps} props custom autocomplete properties
 * @returns {ReactNode} the auto complete ui component
 */
export function Autocomplete<
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
>(props: TypeAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>): ReactNode {
  const { fullWidth, ...autoCompleteProps } = props;

  return (
    <FormControl fullWidth={fullWidth}>
      <MaterialAutocomplete {...autoCompleteProps} />
    </FormControl>
  );
}
