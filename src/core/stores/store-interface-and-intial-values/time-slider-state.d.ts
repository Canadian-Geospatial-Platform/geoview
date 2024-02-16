import { TypeGetStore, TypeSetStore } from '../geoview-store';
export type TimeSliderLayerSet = {
    [layerPath: string]: TypeTimeSliderValues;
};
export interface TypeTimeSliderValues {
    title?: string;
    description?: string;
    name: string;
    range: string[];
    defaultValue: string;
    minAndMax: number[];
    field: string;
    fieldAlias: string;
    singleHandle: boolean;
    values: number[];
    filtering: boolean;
    delay: number;
    locked?: boolean;
    reversed?: boolean;
}
export interface ITimeSliderState {
    timeSliderLayers: TimeSliderLayerSet;
    actions: {
        addTimeSliderLayer: (newLayer: TimeSliderLayerSet) => void;
        applyFilters: (layerPath: string, values: number[]) => void;
        removeTimeSliderLayer: (layerPath: string) => void;
        setTitle: (layerPath: string, title: string) => void;
        setDescription: (layerPath: string, description: string) => void;
        setDelay: (layerPath: string, delay: number) => void;
        setFiltering: (layerPath: string, filter: boolean) => void;
        setLocked: (layerPath: string, locked: boolean) => void;
        setReversed: (layerPath: string, locked: boolean) => void;
        setDefaultValue: (layerPath: string, defaultValue: string) => void;
        setValues: (layerPath: string, values: number[]) => void;
    };
}
export declare function initializeTimeSliderState(set: TypeSetStore, get: TypeGetStore): ITimeSliderState;
export declare const useTimeSliderLayers: () => TimeSliderLayerSet;
export declare const useTimeSliderStoreActions: () => {
    addTimeSliderLayer: (newLayer: TimeSliderLayerSet) => void;
    applyFilters: (layerPath: string, values: number[]) => void;
    removeTimeSliderLayer: (layerPath: string) => void;
    setTitle: (layerPath: string, title: string) => void;
    setDescription: (layerPath: string, description: string) => void;
    setDelay: (layerPath: string, delay: number) => void;
    setFiltering: (layerPath: string, filter: boolean) => void;
    setLocked: (layerPath: string, locked: boolean) => void;
    setReversed: (layerPath: string, locked: boolean) => void;
    setDefaultValue: (layerPath: string, defaultValue: string) => void;
    setValues: (layerPath: string, values: number[]) => void;
};
