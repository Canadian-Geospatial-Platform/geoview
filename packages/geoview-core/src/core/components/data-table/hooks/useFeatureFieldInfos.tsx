import { TypeArrayOfLayerData, TypeFieldEntry } from '@/api/events/payloads/get-feature-info-payload';
import { MappedLayerDataType } from '../data-panel';

/**
 * Custom hook for caching the mapping of fieldInfos aka columns for data table.
 * @param {TypeArrayOfLayerData} layerData data from the query
 * @returns {MappedLayerDataType[]} layerData with columns.
 */
export function useFeatureFieldInfos(layerData: TypeArrayOfLayerData): MappedLayerDataType[] {
  const mappedLayerData = layerData?.map((layer) => {
    let fieldInfos = {} as Record<string, TypeFieldEntry | undefined>;
    if (layer.features?.length) {
      fieldInfos = layer.features[0].fieldInfo;
    }
    return { ...layer, fieldInfos };
  });

  return mappedLayerData;
}
