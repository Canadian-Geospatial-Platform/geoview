import type { Ref } from 'react';
import { forwardRef } from 'react';
import type { AutocompleteProps } from '@mui/material';
import { Autocomplete as MaterialAutocomplete, FormControl } from '@mui/material';
import { logger } from '@/core/utils/logger';

/**
 * Properties for the Autocomplete component extending Material-UI's AutocompleteProps
 */
export interface AutocompletePropsExtend<
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined,
> extends AutocompleteProps<T, Multiple, DisableClearable, FreeSolo> {
  /** Apply full width to the autocomplete wrapper using FormControl */
  fullWidth: boolean;
}

/**
 * Material-UI Autocomplete with support for full-width layout.
 *
 * Wraps Material-UI's Autocomplete component with FormControl to provide
 * a fullWidth prop that applies width: 100% styling. Maintains all Material-UI
 * Autocomplete functionality including generic type support for strongly-typed
 * option objects. Supports ref forwarding for direct access to the input element.
 *
 * @param props - Autocomplete configuration (see AutocompletePropsExtend interface)
 * @param ref - Ref forwarded to the underlying input element
 * @returns Autocomplete component with FormControl wrapper
 *
 * @example
 * ```tsx
 * // Basic usage
 * <Autocomplete
 *   options={['Option 1', 'Option 2']}
 *   fullWidth
 * />
 *
 * // With objects
 * <Autocomplete
 *   options={[
 *     { id: 1, label: 'Item 1' },
 *     { id: 2, label: 'Item 2' }
 *   ]}
 *   getOptionLabel={(option) => option.label}
 * />
 * ```
 *
 * @see {@link https://mui.com/material-ui/react-autocomplete/}
 */
function AutocompleteUI<
  T,
  Multiple extends boolean | undefined = undefined,
  DisableClearable extends boolean | undefined = undefined,
  FreeSolo extends boolean | undefined = undefined,
>(props: AutocompletePropsExtend<T, Multiple, DisableClearable, FreeSolo>, ref: Ref<HTMLElement>): JSX.Element {
  logger.logTraceRenderDetailed('ui/autocomplete/autocomplete');

  // Get constant from props
  const { fullWidth, ...autoCompleteProps } = props;

  return (
    <FormControl fullWidth={fullWidth}>
      <MaterialAutocomplete {...autoCompleteProps} ref={ref} data-id="autocomplete" />
    </FormControl>
  );
}

// Export the Autocomplete using forwardRef so that passing ref is permitted and functional in the react standards
export const Autocomplete = forwardRef(AutocompleteUI) as typeof AutocompleteUI;
