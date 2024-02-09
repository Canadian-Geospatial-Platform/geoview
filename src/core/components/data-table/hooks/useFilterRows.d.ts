import { Dispatch, SetStateAction } from 'react';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
export interface UseFilterRowsProps {
    layerPath: string;
}
/**
 * Custom hook to set the filtered row  for data table.
 * @param {string} layerPath key of the layer selected.
 * @returns {Object}
 */
export declare function useFilterRows({ layerPath }: UseFilterRowsProps): {
    columnFilters: MRTColumnFiltersState;
    setColumnFilters: Dispatch<SetStateAction<MRTColumnFiltersState>>;
};
