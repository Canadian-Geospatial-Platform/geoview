import { useMemo } from 'react';
import type { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import type { MappedLayerDataType } from '@/core/components/data-table/data-table-types';
import { logger } from '@/core/utils/logger';

/**
 * Custom hook for caching the mapping of fieldInfos aka columns for data table.
 * @param {TypeAllFeatureInfoResultSetEntry[]} layerData data from the query
 * @returns {MappedLayerDataType[]} layerData with columns.
 */
export function useFeatureFieldInfos(layerData: TypeAllFeatureInfoResultSetEntry[]): MappedLayerDataType[] {
  const mappedLayerData = useMemo(() => {
    // Log
    logger.logTraceUseEffect('DATA TABLE - useFeatureFieldInfos', layerData);

    return layerData?.map((layer) => {
      return { ...layer, fieldInfos: layer.features?.length ? layer.features[0].fieldInfo : {} };
    });
  }, [layerData]);

  return mappedLayerData;
}
