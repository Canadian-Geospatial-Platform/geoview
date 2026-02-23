import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TemporalMode, TimeDimension, TimeIANA, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
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
        setDisplayDateFormat: (layerPath: string, displayDateFormat: TypeDisplayDateFormat) => void;
        setDisplayDateFormatShort: (layerPath: string, displayDateFormatShort: TypeDisplayDateFormat) => void;
        setDisplayDateTimezone: (layerPath: string, displayDateTimezone: TimeIANA) => void;
        setFiltering: (layerPath: string, filter: boolean) => void;
        setLocked: (layerPath: string, locked: boolean) => void;
        setReversed: (layerPath: string, locked: boolean) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setStep: (layerPath: string, step: number) => void;
        setValues: (layerPath: string, values: number[]) => void;
    };
    setterActions: {
        addTimeSliderLayer: (newLayer: TimeSliderLayerSet) => void;
        removeTimeSliderLayer: (layerPath: string) => void;
        setTitle: (layerPath: string, title: string) => void;
        setDescription: (layerPath: string, description: string) => void;
        setDelay: (layerPath: string, delay: number) => void;
        setDisplayDateFormat: (layerPath: string, displayDateFormat: TypeDisplayDateFormat) => void;
        setDisplayDateFormatShort: (layerPath: string, displayDateFormatShort: TypeDisplayDateFormat) => void;
        setDisplayDateTimezone: (layerPath: string, displayDateTimezone: TimeIANA) => void;
        setFiltering: (layerPath: string, filter: boolean) => void;
        setLocked: (layerPath: string, locked: boolean) => void;
        setReversed: (layerPath: string, locked: boolean) => void;
        setSelectedLayerPath: (layerPath: string) => void;
        setSliderFilters: (newSliderFilters: Record<string, string>) => void;
        setStep: (layerPath: string, step: number) => void;
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
    additionalLayerpaths?: string[];
    delay: number;
    description?: string;
    discreteValues: boolean;
    step?: number;
    field: string;
    fieldAlias: string;
    filtering: boolean;
    isMainLayerPath: boolean;
    locked?: boolean;
    minAndMax: number[];
    range: string[];
    reversed?: boolean;
    singleHandle: boolean;
    title?: string;
    values: number[];
    displayDateFormat?: TypeDisplayDateFormat;
    displayDateFormatShort?: TypeDisplayDateFormat;
    serviceDateTemporalMode?: TemporalMode;
    displayDateTimezone?: TimeIANA;
}
export type TypeTimeSliderProps = {
    layerPaths: string[];
    fields?: string[];
    title?: string;
    delay?: number;
    filtering?: boolean;
    description?: string;
    locked?: boolean;
    reversed?: boolean;
    timeDimension?: TimeDimension;
};
export declare const useTimeSliderLayers: () => TimeSliderLayerSet | undefined;
export declare const useTimeSliderLayersSelector: (layerPath: string) => TypeTimeSliderValues | undefined;
export declare const useTimeSliderSelectedLayerPath: () => string;
export declare const useTimeSliderFilters: () => Record<string, string>;
export declare const useTimeSliderFiltersSelector: (layerPath: string) => string | undefined;
export declare const useTimeSliderStoreActions: () => TimeSliderActions | undefined;
export {};
//# sourceMappingURL=time-slider-state.d.ts.map