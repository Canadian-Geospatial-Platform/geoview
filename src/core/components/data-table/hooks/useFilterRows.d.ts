import { Dispatch, SetStateAction } from 'react';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
export interface UseFilterRowsProps {
    layerKey: string;
}
/**
 * Custom hook to set the filtered row  for data table.
 * @param {string} layerKey key of the layer selected.
 * @returns {Object}
 */
export declare function useFilterRows({ layerKey }: UseFilterRowsProps): {
    columnFilters: MRTColumnFiltersState;
    setColumnFilters: Dispatch<SetStateAction<MRTColumnFiltersState>>;
};
