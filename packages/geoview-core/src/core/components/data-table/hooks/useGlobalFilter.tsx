import type { Dispatch, SetStateAction } from 'react';
import { useEffect, useState } from 'react';
import { useDataTableLayerSettings, setStoreGlobalFilteredEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { logger } from '@/core/utils/logger';
import { useGeoViewMapId } from '@/core/stores/geoview-store';

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
  const datatableSettings = useDataTableLayerSettings();

  const mapId = useGeoViewMapId();
  const [globalFilter, setGlobalFilter] = useState(datatableSettings[layerPath].globalFilterRecord ?? '');

  // update store column filters
  useEffect(() => {
    // Log
    logger.logTraceUseEffect('USEGLOBALFILTERS - globalFilters', globalFilter);

    setStoreGlobalFilteredEntry(mapId, globalFilter, layerPath);
  }, [mapId, globalFilter, layerPath]);

  return { globalFilter, setGlobalFilter };
}
