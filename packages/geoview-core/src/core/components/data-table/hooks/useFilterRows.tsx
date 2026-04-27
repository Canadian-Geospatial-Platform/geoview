import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import type { TypeColumnFiltersState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useStoreDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { useDataTableController } from '@/core/controllers/use-controllers';

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
  const datatableSettings = useStoreDataTableLayerSettings();
  const dataTableController = useDataTableController();

  const [columnFilters, setColumnFilters] = useState<TypeColumnFiltersState>(datatableSettings[layerPath].columnFiltersRecord || []);

  /**
   * Syncs column filters to the store when they change.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEFILTERROWS - columnFilters', columnFilters);

    dataTableController.setColumnFiltersRecord(layerPath, columnFilters);
  }, [dataTableController, columnFilters, layerPath]);

  return { columnFilters, setColumnFilters };
}
