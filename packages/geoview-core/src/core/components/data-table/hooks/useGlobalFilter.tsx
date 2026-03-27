import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { useDataTableStoreActions, useDataTableLayerSettings } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';

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
export function useGlobalFilter({ layerPath }: UseGlobalFilterProps): {
  globalFilter: string;
  setGlobalFilter: Dispatch<SetStateAction<string>>;
} {
  const datatableSettings = useDataTableLayerSettings();

  const { setGlobalFilteredEntry } = useDataTableStoreActions();

  const [globalFilter, setGlobalFilter] = useState(datatableSettings[layerPath].globalFilterRecord ?? '');

  /**
   * Syncs global filter to the store when it changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEGLOBALFILTERS - globalFilters', globalFilter);

    setGlobalFilteredEntry(globalFilter, layerPath);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [globalFilter]);

  return { globalFilter, setGlobalFilter };
}
