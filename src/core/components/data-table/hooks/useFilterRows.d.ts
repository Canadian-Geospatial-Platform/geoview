import type { Dispatch, SetStateAction } from 'react';
import type { TypeColumnFiltersState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
/** Properties for the useFilterRows hook. */
export interface UseFilterRowsProps {
    layerPath: string;
}
/**
 * Custom hook to manage column filter state for the data table.
 *
 * @param props - Hook properties containing the layer path
 * @returns The column filters state and setter
 */
export declare function useFilterRows({ layerPath }: UseFilterRowsProps): {
    columnFilters: TypeColumnFiltersState;
    setColumnFilters: Dispatch<SetStateAction<TypeColumnFiltersState>>;
};
//# sourceMappingURL=useFilterRows.d.ts.map