import { useMemo } from 'react';
import type { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import type { MappedLayerDataType } from '@/core/components/data-table/data-table-types';
import { logger } from '@/core/utils/logger';

/**
 * Custom hook for caching the mapping of fieldInfos columns for the data table.
 *
 * @param layerData - Data from the query
 * @returns The layer data with mapped field info columns
 */
export function useFeatureFieldInfos(layerData: TypeAllFeatureInfoResultSetEntry[]): MappedLayerDataType[] {
  const memoMappedLayerData = useMemo(() => {
    // Log
    logger.logTraceUseEffect('DATA TABLE - useFeatureFieldInfos', layerData);

    return layerData?.map((layer) => {
      return { ...layer, fieldInfos: layer.features?.length ? layer.features[0].fieldInfo : {} };
    });
  }, [layerData]);

  return memoMappedLayerData;
}
