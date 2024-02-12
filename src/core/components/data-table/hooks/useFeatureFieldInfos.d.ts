import { TypeArrayOfLayerData } from '@/app';
import { MappedLayerDataType } from '../data-panel';
/**
 * Custom hook for caching the mapping of fieldInfos aka columns for data table.
 * @param {TypeArrayOfLayerData} layerData data from the query
 * @returns {MappedLayerDataType[]} layerData with columns.
 */
export declare function useFeatureFieldInfos(layerData: TypeArrayOfLayerData): MappedLayerDataType[];
