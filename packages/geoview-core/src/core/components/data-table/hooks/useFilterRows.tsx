import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  TypeColumnFiltersState,
  useDataTableStoreActions,
  useDataTableLayerSettings,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';

export interface UseFilterRowsProps {
  layerPath: string;
}

/**
 * Custom hook to set the filtered row  for data table.
 * @param {string} layerPath key of the layer selected.
 * @returns {Object}
 */
export function useFilterRows({ layerPath }: UseFilterRowsProps): {
  columnFilters: TypeColumnFiltersState;
  setColumnFilters: Dispatch<SetStateAction<TypeColumnFiltersState>>;
} {
  const datatableSettings = useDataTableLayerSettings();

  const { setColumnFiltersEntry } = useDataTableStoreActions();

  const { columnFiltersRecord } = datatableSettings[layerPath];

  const [columnFilters, setColumnFilters] = useState<TypeColumnFiltersState>(columnFiltersRecord || []);

  // update store column filters
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEFILTERROWS - columnFilters', columnFilters);

    setColumnFiltersEntry(columnFilters, layerPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  return { columnFilters, setColumnFilters };
}
