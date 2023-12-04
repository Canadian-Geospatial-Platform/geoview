import { RefObject } from 'react';
import { type MRT_TableInstance as MRTTableInstance } from 'material-react-table';
import { MapDataTableData } from '../map-data-table';
interface UseSelectedRowMessageProps {
    data: MapDataTableData;
    layerKey: string;
    tableInstanceRef: RefObject<MRTTableInstance>;
}
/**
 * Custom hook to set the selected row message for data table.
 * @param {MapDataTableData} data data to be rendered inside data table
 * @param {string} layerKey key of the layer selected.
 * @param {RefObject} tableInstanceRef ref object of the data table.
 * @returns {Object}
 */
export declare function useSelectedRowMessage({ data, layerKey, tableInstanceRef }: UseSelectedRowMessageProps): {
    rowSelection: Record<number, boolean>;
    setRowSelection: import("react").Dispatch<import("react").SetStateAction<Record<number, boolean>>>;
};
export {};
