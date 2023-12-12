import { useStore } from 'zustand';
import { useGeoViewStore } from '../stores-managers';
import { TypeGetStore, TypeSetStore } from '../geoview-store';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';

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
  locked: boolean;
  reversed: boolean;
}

export interface ITimeSliderState {
  timeSliderLayers: { [index: string]: TypeTimeSliderValues };
  visibleTimeSliderLayers: string[];
  actions: {
    addTimeSliderLayer: (newLayer: { [index: string]: TypeTimeSliderValues }) => void;
    applyFilters: (layerPath: string, values: number[]) => void;
    removeTimeSliderLayer: (layerPath: string) => void;
    setDelay: (layerPath: string, delay: number) => void;
    setFiltering: (layerPath: string, filter: boolean) => void;
    setLocked: (layerPath: string, locked: boolean) => void;
    setReversed: (layerPath: string, locked: boolean) => void;
    setDefaultValue: (layerPath: string, defaultValue: string) => void;
    setValues: (layerPath: string, values: number[]) => void;
    setVisibleTimeSliderLayers: (visibleLayerPaths: string[]) => void;
  };
}

export function initializeTimeSliderState(set: TypeSetStore, get: TypeGetStore): ITimeSliderState {
  const init = {
    timeSliderLayers: {},
    visibleTimeSliderLayers: [],
    actions: {
      addTimeSliderLayer(newLayer: { [index: string]: TypeTimeSliderValues }): void {
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...get().timeSliderState.timeSliderLayers, ...newLayer },
          },
        });
      },
      applyFilters(layerPath: string, values: number[]): void {
        const { defaultValue, field, filtering, minAndMax } = get().timeSliderState.timeSliderLayers[layerPath];
        TimeSliderEventProcessor.applyFilters(get().mapId, layerPath, defaultValue, field, filtering, minAndMax, values);
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
        const { values } = get().timeSliderState.timeSliderLayers[layerPath];
        sliderLayers[layerPath].filtering = filtering;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
        get().timeSliderState.actions.applyFilters(layerPath, values);
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
        get().timeSliderState.actions.applyFilters(layerPath, values);
      },
      setVisibleTimeSliderLayers(visibleLayerPaths: string[]): void {
        set({
          timeSliderState: {
            ...get().timeSliderState,
            visibleTimeSliderLayers: [...visibleLayerPaths],
          },
        });
      },
    },
  } as ITimeSliderState;

  return init;
}

// **********************************************************
// Layer state selectors
// **********************************************************
export const useTimeSliderLayers = () => useStore(useGeoViewStore(), (state) => state.timeSliderState.timeSliderLayers);
export const useVisibleTimeSliderLayers = () => useStore(useGeoViewStore(), (state) => state.timeSliderState.visibleTimeSliderLayers);
export const useTimeSliderStoreActions = () => useStore(useGeoViewStore(), (state) => state.timeSliderState.actions);
