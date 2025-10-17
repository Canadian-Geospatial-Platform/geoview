import type { Dispatch, SetStateAction } from 'react';
export interface UseGlobalFilterProps {
    layerPath: string;
}
/**
 * Custom hook to set the global filter search  for data table.
 * @param {string} layerPath key of the layer selected.
 * @returns {Object}
 */
export declare function useGlobalFilter({ layerPath }: UseGlobalFilterProps): {
    globalFilter: string;
    setGlobalFilter: Dispatch<SetStateAction<string>>;
};
//# sourceMappingURL=useGlobalFilter.d.ts.map