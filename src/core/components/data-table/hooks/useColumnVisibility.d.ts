import type { Dispatch, SetStateAction } from 'react';
/** Properties for the useColumnVisibility hook. */
export interface UseColumnVisibilityProps {
    layerPath: string;
}
/**
 * Custom hook to manage column visibility state for the data table.
 *
 * Uses a normalization guard in the change handler to prevent the re-render loop
 * caused by MRT calling onColumnVisibilityChange during its own render cycle to
 * register default visibility for columns it has not yet seen.
 *
 * @param props - Hook properties containing the layer path
 * @returns The column visibility state, its setter, and a change handler to pass to MRT
 */
export declare function useColumnVisibility({ layerPath }: UseColumnVisibilityProps): {
    columnVisibility: Record<string, boolean>;
    setColumnVisibility: Dispatch<SetStateAction<Record<string, boolean>>>;
    onColumnVisibilityChange: (updaterOrValue: Record<string, boolean> | ((prev: Record<string, boolean>) => Record<string, boolean>)) => void;
};
//# sourceMappingURL=useColumnVisibility.d.ts.map