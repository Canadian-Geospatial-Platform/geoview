import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import { type MRT_ColumnFiltersState as MRTColumnFiltersState } from 'material-react-table';
import {
  useDataTableStoreActions,
  useDataTableStoreColumnFilteredRecord,
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
  columnFilters: MRTColumnFiltersState;
  setColumnFilters: Dispatch<SetStateAction<MRTColumnFiltersState>>;
} {
  const columnFiltersRecord = useDataTableStoreColumnFilteredRecord();

  const { setColumnFiltersEntry } = useDataTableStoreActions();

  const [columnFilters, setColumnFilters] = useState<MRTColumnFiltersState>(columnFiltersRecord[layerPath] || []);

  // update store column filters
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEFILTERROWS - columnFilters', columnFilters);

    setColumnFiltersEntry(columnFilters, layerPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [columnFilters]);

  return { columnFilters, setColumnFilters };
}
