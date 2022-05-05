import FormControl from '@mui/material/FormControl';
import MaterialAutocomplete from '@mui/material/Autocomplete';

import { TypeAutocompleteProps } from '../../core/types/cgpv-types';

/**
 * Create a Material UI Autocomplete component
 *
 * @param {TypeAutocompleteProps} props custom autocomplete properties
 * @returns {JSX.Element} the auto complete ui component
 */
export function Autocomplete<
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined
>(props: TypeAutocompleteProps<T, Multiple, DisableClearable, FreeSolo>): JSX.Element {
  const { fullWidth, ...autoCompleteProps } = props;

  return (
    <FormControl fullWidth={fullWidth}>
      <MaterialAutocomplete {...autoCompleteProps} />
    </FormControl>
  );
}
