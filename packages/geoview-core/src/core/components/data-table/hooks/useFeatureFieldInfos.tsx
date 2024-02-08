import { useMemo } from 'react';
import { TypeArrayOfLayerData, TypeFieldEntry } from '@/app';
import { MappedLayerDataType } from '../data-panel';

/**
 * Custom hook for caching the mapping of fieldInfos aka columns for data table.
 * @param {TypeArrayOfLayerData} layerData data from the query
 * @returns {MappedLayerDataType[]} layerData with columns.
 */
export function useFeatureFieldInfos(layerData: TypeArrayOfLayerData): MappedLayerDataType[] {
  const mappedLayerData = useMemo(() => {
    return layerData.map((layer) => {
      let fieldInfos = {} as Record<string, TypeFieldEntry | undefined>;
      if (layer.features?.length) {
        layer.features.forEach((feature) => {
          fieldInfos = { ...fieldInfos, ...feature.fieldInfo };
        });
      }
      return { ...layer, fieldInfos };
    });
  }, [layerData]);

  return mappedLayerData;
}
