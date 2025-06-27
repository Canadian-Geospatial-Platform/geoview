import { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import { MappedLayerDataType } from '@/core/components/data-table/data-table-types';
/**
 * Custom hook for caching the mapping of fieldInfos aka columns for data table.
 * @param {TypeAllFeatureInfoResultSetEntry[]} layerData data from the query
 * @returns {MappedLayerDataType[]} layerData with columns.
 */
export declare function useFeatureFieldInfos(layerData: TypeAllFeatureInfoResultSetEntry[]): MappedLayerDataType[];
//# sourceMappingURL=useFeatureFieldInfos.d.ts.map