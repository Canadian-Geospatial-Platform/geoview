import { RefObject } from 'react';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState, type MRT_TableInstance as MRTTableInstance } from 'material-react-table';
import { MapDataTableData } from '../map-data-table';
interface UseFilteredRowMessageProps {
    data: MapDataTableData;
    layerKey: string;
    tableInstanceRef: RefObject<MRTTableInstance>;
}
/**
 * Custom hook to set the filtered row message for data table.
 * @param {MapDataTableData} data data to be rendered inside data table
 * @param {string} layerKey key of the layer selected.
 * @param {RefObject} tableInstanceRef ref object of the data table.
 * @returns {Object}
 */
export declare function useFilteredRowMessage({ data, layerKey, tableInstanceRef }: UseFilteredRowMessageProps): {
    columnFilters: MRTColumnFiltersState;
    setColumnFilters: import("react").Dispatch<import("react").SetStateAction<MRTColumnFiltersState>>;
};
export {};
