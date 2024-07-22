import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
type TimeSliderActions = ITimeSliderState['actions'];
export interface ITimeSliderState {
    timeSliderLayers: TimeSliderLayerSet;
    selectedLayerPath: string;
    actions: {
        setTitle: (layerPath: string, title: string) => void;
        setDescription: (layerPath: string, description: string) => void;
        setDelay: (layerPath: string, delay: number) => void;
        setFiltering: (layerPath: string, filter: boolean) => void;
        setLocked: (layerPath: string, locked: boolean) => void;
        setReversed: (layerPath: string, locked: boolean) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setDefaultValue: (layerPath: string, defaultValue: string) => void;
        setValues: (layerPath: string, values: number[]) => void;
    };
    setterActions: {
        addTimeSliderLayer: (newLayer: TimeSliderLayerSet) => void;
        removeTimeSliderLayer: (layerPath: string) => void;
        setTitle: (layerPath: string, title: string) => void;
        setDescription: (layerPath: string, description: string) => void;
        setDelay: (layerPath: string, delay: number) => void;
        setFiltering: (layerPath: string, filter: boolean) => void;
        setLocked: (layerPath: string, locked: boolean) => void;
        setReversed: (layerPath: string, locked: boolean) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setDefaultValue: (layerPath: string, defaultValue: string) => void;
        setValues: (layerPath: string, values: number[]) => void;
    };
}
/**
 * Initializes an TimeSlider State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {ITimeSliderState} - The initialized TimeSlider State
 */
export declare function initializeTimeSliderState(set: TypeSetStore, get: TypeGetStore): ITimeSliderState;
export type TimeSliderLayerSet = {
    [layerPath: string]: TypeTimeSliderValues;
};
export interface TypeTimeSliderValues {
    defaultValue: string;
    delay: number;
    description?: string;
    discreteValues: boolean;
    field: string;
    fieldAlias: string;
    filtering: boolean;
    locked?: boolean;
    minAndMax: number[];
    range: string[];
    reversed?: boolean;
    singleHandle: boolean;
    title?: string;
    values: number[];
}
export declare const useTimeSliderLayers: () => TimeSliderLayerSet;
export declare const useTimeSliderSelectedLayerPath: () => string;
export declare const useTimeSliderStoreActions: () => TimeSliderActions;
export {};
