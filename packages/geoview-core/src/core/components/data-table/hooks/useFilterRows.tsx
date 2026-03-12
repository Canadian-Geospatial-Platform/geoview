import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import type { TypeColumnFiltersState } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useDataTableLayerSettings, setStoreColumnFiltersEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { useGeoViewMapId } from '@/core/stores/geoview-store';
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
  const mapId = useGeoViewMapId();
  const datatableSettings = useDataTableLayerSettings();

  const [columnFilters, setColumnFilters] = useState<TypeColumnFiltersState>(datatableSettings[layerPath].columnFiltersRecord || []);

  // update store column filters
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEFILTERROWS - columnFilters', columnFilters);

    setStoreColumnFiltersEntry(mapId, columnFilters, layerPath);
  }, [mapId, columnFilters, layerPath]);

  return { columnFilters, setColumnFilters };
}
