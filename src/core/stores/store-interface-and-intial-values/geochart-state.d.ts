import { TypeGetStore, TypeSetStore } from '../geoview-store';
export type GeoChartStoreByLayerPath = {
    [layerPath: string]: ChartInfo;
};
export type ChartInfo = unknown;
export interface IGeochartState {
    geochartChartsConfig: GeoChartStoreByLayerPath;
    actions: {
        setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
    };
}
export declare function initializeGeochartState(set: TypeSetStore, get: TypeGetStore): IGeochartState;
export declare const useGeochartConfigs: () => GeoChartStoreByLayerPath;
export declare const useGeochartStoreActions: () => {
    setGeochartCharts: (charts: GeoChartStoreByLayerPath) => void;
};
