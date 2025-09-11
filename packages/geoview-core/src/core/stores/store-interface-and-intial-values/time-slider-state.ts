import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { DatePrecision, TimeDimension, TimePrecision } from '@/core/utils/date-mgt';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with TimeSliderEventProcessor vs TimeSliderState

// #region TYPES & INTERFACES

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

// #endregion INTERFACES

/**
 * Initializes an TimeSlider State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {ITimeSliderState} - The initialized TimeSlider State
 */
export function initializeTimeSliderState(set: TypeSetStore, get: TypeGetStore): ITimeSliderState {
  const init = {
    timeSliderLayers: {},
    selectedLayerPath: '',
    sliderFilters: {},
    setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => {
      set({
        timeSliderState: {
          ...get().timeSliderState,
          selectedLayerPath:
            geoviewConfig.footerBar?.selectedTimeSliderLayerPath || geoviewConfig.appBar?.selectedTimeSliderLayerPath || '',
        },
      });
    },

    // #region ACTIONS
    actions: {
      addOrUpdateSliderFilter(layerPath: string, filter: string): void {
        // Redirect to event processor
        TimeSliderEventProcessor.addOrUpdateSliderFilter(get().mapId, layerPath, filter);
      },
      setTitle(layerPath: string, title: string): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setTitle(layerPath, title);
      },
      setDescription(layerPath: string, description: string): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setDescription(layerPath, description);
      },
      setDelay(layerPath: string, delay: number): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setDelay(layerPath, delay);
      },
      setFiltering(layerPath: string, filtering: boolean): void {
        // Redirect to TimeSliderEventProcessor
        const { defaultValue, field, minAndMax, values } = get().timeSliderState.timeSliderLayers[layerPath];
        TimeSliderEventProcessor.updateFilters(get().mapId, layerPath, defaultValue, field, filtering, minAndMax, values);
      },
      setLocked(layerPath: string, locked: boolean): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setLocked(layerPath, locked);
      },
      setReversed(layerPath: string, reversed: boolean): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setReversed(layerPath, reversed);
      },
      setSelectedLayerPath(layerPath: string): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setSelectedLayerPath(layerPath);
      },
      setStep(layerPath: string, step: number): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setStep(layerPath, step);
      },
      setDefaultValue(layerPath: string, defaultValue: string): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setDefaultValue(layerPath, defaultValue);
      },
      setValues(layerPath: string, values: number[]): void {
        // Redirect to TimeSliderEventProcessor
        const { defaultValue, field, minAndMax, filtering } = get().timeSliderState.timeSliderLayers[layerPath];
        TimeSliderEventProcessor.updateFilters(get().mapId, layerPath, defaultValue, field, filtering, minAndMax, values);
      },
      setDisplayPattern(layerPath: string, value: [DatePrecision, TimePrecision]): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setDisplayPattern(layerPath, value);
      },
    },

    setterActions: {
      addTimeSliderLayer(newLayer: TimeSliderLayerSet): void {
        // Set a default displayPattern if it's undefined
        Object.keys(newLayer).forEach((layerPath) => {
          if (newLayer[layerPath].displayPattern === undefined) {
            // eslint-disable-next-line no-param-reassign
            newLayer[layerPath].displayPattern = ['day', undefined];
          }
        });

        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...get().timeSliderState.timeSliderLayers, ...newLayer },
          },
        });
      },
      removeTimeSliderLayer(layerPath: string): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        delete sliderLayers[layerPath];
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
      setTitle(layerPath: string, title: string): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].title = title;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
      setDescription(layerPath: string, description: string): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].description = description;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
      setDelay(layerPath: string, delay: number): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].delay = delay;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
      setFiltering(layerPath: string, filtering: boolean): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].filtering = filtering;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
      setLocked(layerPath: string, locked: boolean): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].locked = locked;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
      setReversed(layerPath: string, reversed: boolean): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].reversed = reversed;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
      setSelectedLayerPath(layerPath: string): void {
        set({
          timeSliderState: {
            ...get().timeSliderState,
            selectedLayerPath: layerPath,
          },
        });
      },
      setSliderFilters(newSliderFilters: Record<string, string>): void {
        set({
          timeSliderState: {
            ...get().timeSliderState,
            sliderFilters: newSliderFilters,
          },
        });
      },
      setStep(layerPath: string, step: number): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].step = step;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
      setDefaultValue(layerPath: string, defaultValue: string): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].defaultValue = defaultValue;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
      setValues(layerPath: string, values: number[]): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].values = values;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
      setDisplayPattern(layerPath: string, value: [DatePrecision, TimePrecision]): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].displayPattern = value ?? ['day', undefined];
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },
    },

    // #endregion ACTIONS
  } as ITimeSliderState;

  return init;
}

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

export type TypeTimeSliderProps = {
  layerPaths: string[];
  title: string;
  description: string;
  locked: boolean;
  reversed: boolean;
  defaultValue: string;
  timeDimension: TimeDimension;
};

// **********************************************************
// Layer state selectors
// **********************************************************
export const useTimeSliderLayers = (): TimeSliderLayerSet | undefined =>
  useStore(useGeoViewStore(), (state) => state.timeSliderState?.timeSliderLayers);
export const useTimeSliderSelectedLayerPath = (): string => useStore(useGeoViewStore(), (state) => state.timeSliderState.selectedLayerPath);
export const useTimeSliderFilters = (): Record<string, string> =>
  useStore(useGeoViewStore(), (state) => state.timeSliderState?.sliderFilters);

export const useTimeSliderStoreActions = (): TimeSliderActions => useStore(useGeoViewStore(), (state) => state.timeSliderState.actions);
