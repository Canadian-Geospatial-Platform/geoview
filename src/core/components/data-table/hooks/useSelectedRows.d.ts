/// <reference types="react" />
interface UseSelectedRowMessageProps {
    layerPath: string;
}
/**
 * Custom hook to set the selected rows for data table.
 * @param {string} layerPath key of the layer selected.
 * @returns {Object}
 */
export declare function useSelectedRows({ layerPath }: UseSelectedRowMessageProps): {
    rowSelection: Record<number, boolean>;
    setRowSelection: import("react").Dispatch<import("react").SetStateAction<Record<number, boolean>>>;
};
export {};
