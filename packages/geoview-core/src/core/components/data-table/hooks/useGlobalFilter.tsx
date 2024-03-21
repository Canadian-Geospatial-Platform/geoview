import { Dispatch, SetStateAction, useEffect, useState } from 'react';
import {
  useDataTableStoreActions,
  useDatatableStoreGlobalFilteredRecord,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';

export interface UseGlobalFilterProps {
  layerPath: string;
}

/**
 * Custom hook to set the global filter search  for data table.
 * @param {string} layerPath key of the layer selected.
 * @returns {Object}
 */
export function useGlobalFilter({ layerPath }: UseGlobalFilterProps): {
  globalFilter: string;
  setGlobalFilter: Dispatch<SetStateAction<string>>;
} {
  const globalFilteredRecord = useDatatableStoreGlobalFilteredRecord();

  const { setGlobalFilteredEntry } = useDataTableStoreActions();

  const [globalFilter, setGlobalFilter] = useState(globalFilteredRecord[layerPath] ?? '');

  // update store column filters
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEGLOBALFILTERS - globalFilters', globalFilter);

    setGlobalFilteredEntry(globalFilter, layerPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter]);

  return { globalFilter, setGlobalFilter };
}
