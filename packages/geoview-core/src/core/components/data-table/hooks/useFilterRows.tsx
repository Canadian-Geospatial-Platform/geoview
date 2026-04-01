import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import type { TypeColumnFiltersState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import {
  useStoreDataTableLayerSettings,
  setStoreColumnFiltersEntry,
} from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useStoreGeoViewMapId } from '@/core/stores/geoview-store';
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
  const mapId = useStoreGeoViewMapId();
  const datatableSettings = useStoreDataTableLayerSettings();

  const [columnFilters, setColumnFilters] = useState<TypeColumnFiltersState>(datatableSettings[layerPath].columnFiltersRecord || []);

  /**
   * Syncs column filters to the store when they change.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEFILTERROWS - columnFilters', columnFilters);

    setStoreColumnFiltersEntry(mapId, columnFilters, layerPath);
  }, [mapId, columnFilters, layerPath]);

  return { columnFilters, setColumnFilters };
}
