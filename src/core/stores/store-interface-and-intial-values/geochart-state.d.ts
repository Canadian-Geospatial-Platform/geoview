import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import type { TypeFeatureInfoEntry, TypeQueryStatus, TypeResultSet, TypeResultSetEntry } from '@/api/types/map-schema-types';
import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
type GeochartActions = IGeochartState['actions'];
export interface IGeochartState {
    geochartChartsConfig: GeoChartStoreByLayerPath;
    layerDataArray: TypeGeochartResultSetEntry[];
    layerDataArrayBatch: TypeGeochartResultSetEntry[];
    layerDataArrayBatchLayerPathBypass: string;
    selectedLayerPath: string;
    actions: {
        setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
        setLayerDataArray: (layerDataArray: TypeGeochartResultSetEntry[]) => void;
        setLayerDataArrayBatch: (layerDataArray: TypeGeochartResultSetEntry[]) => void;
        setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
        setSelectedLayerPath: (selectedLayerPath: string) => void;
    };
    setterActions: {
        setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
        setLayerDataArray: (layerDataArray: TypeGeochartResultSetEntry[]) => void;
        setLayerDataArrayBatch: (layerDataArray: TypeGeochartResultSetEntry[]) => void;
        setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
        setSelectedLayerPath: (selectedLayerPath: string) => void;
    };
}
/**
 * Initializes a Geochart state object.
 * @param {TypeSetStore} set - The store set callback function
 * @param {TypeSetStore} get - The store get callback function
 * @returns {IGeochartState} - The Geochart state object
 */
export declare function initializeGeochartState(set: TypeSetStore, get: TypeGetStore): IGeochartState;
export type GeoChartResultInfo = {
    queryStatus: TypeQueryStatus;
    features: TypeFeatureInfoEntry[] | undefined | null;
};
export type GeoChartStoreByLayerPath = {
    [layerPath: string]: GeoViewGeoChartConfig;
};
export type TypeGeochartResultSetEntry = TypeResultSetEntry & GeoChartResultInfo;
export type TypeGeochartResultSet = TypeResultSet<TypeGeochartResultSetEntry>;
export declare const useGeochartConfigs: () => GeoChartStoreByLayerPath | undefined;
export declare const useGeochartLayerDataArray: () => TypeGeochartResultSetEntry[] | undefined;
export declare const useGeochartLayerDataArrayBatch: () => TypeGeochartResultSetEntry[] | undefined;
export declare const useGeochartSelectedLayerPath: () => string | undefined;
export declare const useGeochartStoreActions: () => GeochartActions | undefined;
export {};
//# sourceMappingURL=geochart-state.d.ts.map