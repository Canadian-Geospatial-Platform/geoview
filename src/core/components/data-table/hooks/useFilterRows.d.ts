import { Dispatch, SetStateAction } from 'react';
import { TypeColumnFiltersState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
export interface UseFilterRowsProps {
    layerPath: string;
}
/**
 * Custom hook to set the filtered row  for data table.
 * @param {string} layerPath key of the layer selected.
 * @returns {Object}
 */
export declare function useFilterRows({ layerPath }: UseFilterRowsProps): {
    columnFilters: TypeColumnFiltersState;
    setColumnFilters: Dispatch<SetStateAction<TypeColumnFiltersState>>;
};
