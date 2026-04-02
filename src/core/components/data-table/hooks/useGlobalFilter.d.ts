import type { Dispatch, SetStateAction } from 'react';
/** Properties for the useGlobalFilter hook. */
export interface UseGlobalFilterProps {
    layerPath: string;
}
/**
 * Custom hook to manage global filter search state for the data table.
 *
 * @param props - Hook properties containing the layer path
 * @returns The global filter state and setter
 */
export declare function useGlobalFilter({ layerPath }: UseGlobalFilterProps): {
    globalFilter: string;
    setGlobalFilter: Dispatch<SetStateAction<string>>;
};
//# sourceMappingURL=useGlobalFilter.d.ts.map