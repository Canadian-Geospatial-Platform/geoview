import { GeoChartConfig } from '@/core/utils/config/reader/uuid-config-reader';
import { TypeQueryStatus, TypeResultSet, TypeResultSetEntry } from '@/geo/map/map-schema-types';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
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
};
export type GeoChartStoreByLayerPath = {
    [layerPath: string]: GeoChartConfig;
};
export type TypeGeochartResultSetEntry = TypeResultSetEntry & GeoChartResultInfo;
export type TypeGeochartResultSet = TypeResultSet<TypeGeochartResultSetEntry>;
export declare const useGeochartConfigs: () => GeoChartStoreByLayerPath;
export declare const useGeochartLayerDataArray: () => TypeGeochartResultSetEntry[];
export declare const useGeochartLayerDataArrayBatch: () => TypeGeochartResultSetEntry[];
export declare const useGeochartSelectedLayerPath: () => string;
export declare const useGeochartStoreActions: () => GeochartActions;
export {};
