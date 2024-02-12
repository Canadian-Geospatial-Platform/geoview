import { TypeGetStore, TypeSetStore } from '../geoview-store';
import { TypeArrayOfLayerData } from '@/api/events/payloads/get-feature-info-payload';
export type GeoChartStoreByLayerPath = {
    [layerPath: string]: ChartInfo;
};
export type ChartInfo = unknown;
export interface IGeochartState {
    geochartChartsConfig: GeoChartStoreByLayerPath;
    layerDataArray: TypeArrayOfLayerData;
    layerDataArrayBatch: TypeArrayOfLayerData;
    layerDataArrayBatchLayerPathBypass: string;
    selectedLayerPath: string;
    actions: {
        setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
        setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
        setLayerDataArrayBatch: (layerDataArray: TypeArrayOfLayerData) => void;
        setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
        setSelectedLayerPath: (selectedLayerPath: string) => void;
    };
}
export declare function initializeGeochartState(set: TypeSetStore, get: TypeGetStore): IGeochartState;
export declare const useGeochartConfigs: () => GeoChartStoreByLayerPath;
export declare const useGeochartStoreLayerDataArray: () => TypeArrayOfLayerData;
export declare const useGeochartStoreLayerDataArrayBatch: () => TypeArrayOfLayerData;
export declare const useGeochartStoreSelectedLayerPath: () => string;
export declare const useGeochartStoreActions: () => {
    setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
    setLayerDataArray: (layerDataArray: TypeArrayOfLayerData) => void;
    setLayerDataArrayBatch: (layerDataArray: TypeArrayOfLayerData) => void;
    setLayerDataArrayBatchLayerPathBypass: (layerPath: string) => void;
    setSelectedLayerPath: (selectedLayerPath: string) => void;
};
