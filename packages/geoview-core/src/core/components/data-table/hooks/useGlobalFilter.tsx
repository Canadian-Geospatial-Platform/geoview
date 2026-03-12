import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { useDataTableLayerSettings, setStoreGlobalFilteredEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

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

  const mapId = useGeoViewMapId();
  const [globalFilter, setGlobalFilter] = useState(datatableSettings[layerPath].globalFilterRecord ?? '');

  /**
   * Syncs global filter to the store when it changes.
   */
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEGLOBALFILTERS - globalFilters', globalFilter);

    setStoreGlobalFilteredEntry(mapId, globalFilter, layerPath);
  }, [mapId, globalFilter, layerPath]);

  return { globalFilter, setGlobalFilter };
}
