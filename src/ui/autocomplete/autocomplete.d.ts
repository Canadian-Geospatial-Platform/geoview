import { Ref } from 'react';
import { AutocompleteProps } from '@mui/material';
/**
 * Properties for the Autocomplete component extending Material-UI's AutocompleteProps
 */
export interface AutocompletePropsExtend<T, Multiple extends boolean | undefined = undefined, DisableClearable extends boolean | undefined = undefined, FreeSolo extends boolean | undefined = undefined> extends AutocompleteProps<T, Multiple, DisableClearable, FreeSolo> {
    fullWidth: boolean;
}
/**
 * A customized Material-UI Autocomplete component with enhanced functionality.
 *
 * @component
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
 * @param {AutocompletePropsExtend} props - The properties for the Autocomplete component
 * @param {Ref<HTMLElement>} ref - The ref forwarded to the underlying MaterialAutocomplete
 * @returns {JSX.Element} A rendered Autocomplete component
 *
 * @note For performance optimization in cases of frequent parent re-renders,
 * consider wrapping this component with React.memo at the consumption level.
 *
 * @see {@link https://mui.com/material-ui/react-autocomplete/}
 */
declare function AutocompleteUI<T, Multiple extends boolean | undefined = undefined, DisableClearable extends boolean | undefined = undefined, FreeSolo extends boolean | undefined = undefined>(props: AutocompletePropsExtend<T, Multiple, DisableClearable, FreeSolo>, ref: Ref<HTMLElement>): JSX.Element;
export declare const Autocomplete: typeof AutocompleteUI;
export {};
