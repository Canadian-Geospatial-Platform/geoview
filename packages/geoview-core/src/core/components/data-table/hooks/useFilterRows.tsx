import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import type { TypeColumnFiltersState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useDataTableStoreActions, useDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';

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
export function useFilterRows({ layerPath }: UseFilterRowsProps): {
  columnFilters: TypeColumnFiltersState;
  setColumnFilters: Dispatch<SetStateAction<TypeColumnFiltersState>>;
} {
  const datatableSettings = useDataTableLayerSettings();

  const { setColumnFiltersEntry } = useDataTableStoreActions();

  const [columnFilters, setColumnFilters] = useState<TypeColumnFiltersState>(datatableSettings[layerPath].columnFiltersRecord || []);

  /**
   * Syncs column filters to the store when they change.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEFILTERROWS - columnFilters', columnFilters);

    setColumnFiltersEntry(columnFilters, layerPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  return { columnFilters, setColumnFilters };
}
