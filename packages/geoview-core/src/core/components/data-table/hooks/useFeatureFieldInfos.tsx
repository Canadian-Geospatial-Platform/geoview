import { useMemo } from 'react';
import { TypeLayerData, TypeFieldEntry } from '@/geo/layer/layer-sets/abstract-layer-set';
import { MappedLayerDataType } from '@/core/components/data-table/data-table-type';

/**
 * Custom hook for caching the mapping of fieldInfos aka columns for data table.
 * @param {TypeLayerData[]} layerData data from the query
 * @returns {MappedLayerDataType[]} layerData with columns.
 */
export function useFeatureFieldInfos(layerData: TypeLayerData[]): MappedLayerDataType[] {
  const mappedLayerData = useMemo(() => {
    return layerData?.map((layer) => {
      let fieldInfos = {} as Record<string, TypeFieldEntry | undefined>;
      if (layer.features?.length) {
        fieldInfos = layer.features[0].fieldInfo;
      }
      return { ...layer, fieldInfos };
    });
  }, [layerData]);

  return mappedLayerData;
}
