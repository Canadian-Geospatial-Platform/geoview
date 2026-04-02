import type { TypeAllFeatureInfoResultSetEntry } from '@/core/stores/store-interface-and-intial-values/data-table-state';
import type { MappedLayerDataType } from '@/core/components/data-table/data-table-types';
/**
 * Custom hook for caching the mapping of fieldInfos columns for the data table.
 *
 * @param layerData - Data from the query
 * @returns The layer data with mapped field info columns
 */
export declare function useFeatureFieldInfos(layerData: TypeAllFeatureInfoResultSetEntry[]): MappedLayerDataType[];
//# sourceMappingURL=useFeatureFieldInfos.d.ts.map