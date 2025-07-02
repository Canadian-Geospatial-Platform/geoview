import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { DatePrecision, TimePrecision } from '@/core/utils/date-mgt';
type TimeSliderActions = ITimeSliderState['actions'];
export interface ITimeSliderState {
    timeSliderLayers: TimeSliderLayerSet;
    selectedLayerPath: string;
    sliderFilters: Record<string, string>;
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;
    actions: {
        addOrUpdateSliderFilter(layerPath: string, filter: string): void;
        setTitle: (layerPath: string, title: string) => void;
        setDescription: (layerPath: string, description: string) => void;
        setDelay: (layerPath: string, delay: number) => void;
        setFiltering: (layerPath: string, filter: boolean) => void;
        setLocked: (layerPath: string, locked: boolean) => void;
        setReversed: (layerPath: string, locked: boolean) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setStep: (layerPath: string, step: number) => void;
        setDefaultValue: (layerPath: string, defaultValue: string) => void;
        setValues: (layerPath: string, values: number[]) => void;
        setDisplayPattern: (layerPath: string, value: [DatePrecision, TimePrecision]) => void;
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
        setSliderFilters: (newSliderFilters: Record<string, string>) => void;
        setStep: (layerPath: string, step: number) => void;
        setDefaultValue: (layerPath: string, defaultValue: string) => void;
        setValues: (layerPath: string, values: number[]) => void;
        setDisplayPattern: (layerPath: string, value: [DatePrecision, TimePrecision]) => void;
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
    step?: number;
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
    displayPattern: [DatePrecision, TimePrecision];
}
export declare const useTimeSliderLayers: () => TimeSliderLayerSet;
export declare const useTimeSliderSelectedLayerPath: () => string;
export declare const useTimeSliderFilters: () => Record<string, string>;
export declare const useTimeSliderStoreActions: () => TimeSliderActions;
export {};
//# sourceMappingURL=time-slider-state.d.ts.map