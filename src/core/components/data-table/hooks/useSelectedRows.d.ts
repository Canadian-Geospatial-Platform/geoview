/// <reference types="react" />
interface UseSelectedRowMessageProps {
    layerKey: string;
}
/**
 * Custom hook to set the selected rows for data table.
 * @param {string} layerKey key of the layer selected.
 * @returns {Object}
 */
export declare function useSelectedRows({ layerKey }: UseSelectedRowMessageProps): {
    rowSelection: Record<number, boolean>;
    setRowSelection: import("react").Dispatch<import("react").SetStateAction<Record<number, boolean>>>;
};
export {};
