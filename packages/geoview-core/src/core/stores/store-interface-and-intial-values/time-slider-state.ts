import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

// #region TYPES & INTERFACES
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
  name: string;
  range: string[];
  reversed?: boolean;
  singleHandle: boolean;
  title?: string;
  values: number[];
}

export interface ITimeSliderState {
  timeSliderLayers: TimeSliderLayerSet;

  actions: {
    addTimeSliderLayer: (newLayer: TimeSliderLayerSet) => void;
    applyFilters: (geoviewLayer: AbstractGeoViewLayer, layerPath: string, values: number[]) => void;
    removeTimeSliderLayer: (layerPath: string) => void;
    setTitle: (layerPath: string, title: string) => void;
    setDescription: (layerPath: string, description: string) => void;
    setDelay: (layerPath: string, delay: number) => void;
    setFiltering: (geoviewLayer: AbstractGeoViewLayer, layerPath: string, filter: boolean) => void;
    setLocked: (layerPath: string, locked: boolean) => void;
    setReversed: (layerPath: string, locked: boolean) => void;
    setDefaultValue: (layerPath: string, defaultValue: string) => void;
    setValues: (layerPath: string, values: number[]) => void;
  };
}
// #endregion INTERFACES

export function initializeTimeSliderState(set: TypeSetStore, get: TypeGetStore): ITimeSliderState {
  const init = {
    timeSliderLayers: {},

    // #region ACTIONS
    actions: {
      addTimeSliderLayer(newLayer: TimeSliderLayerSet): void {
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...get().timeSliderState.timeSliderLayers, ...newLayer },
          },
        });
      },
      applyFilters(geoviewLayer: AbstractGeoViewLayer, layerPath: string, values: number[]): void {
        const { defaultValue, field, filtering, minAndMax } = get().timeSliderState.timeSliderLayers[layerPath];
        TimeSliderEventProcessor.applyFilters(geoviewLayer, layerPath, defaultValue, field, filtering, minAndMax, values);
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
      setFiltering(geoviewLayer: AbstractGeoViewLayer, layerPath: string, filtering: boolean): void {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        const { values } = get().timeSliderState.timeSliderLayers[layerPath];
        sliderLayers[layerPath].filtering = filtering;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
        get().timeSliderState.actions.applyFilters(geoviewLayer, layerPath, values);
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

        // Get the layer using the map event processor (setValues() was called a too many places to provide geoviewLayer by params for now..)
        const geoviewLayer = MapEventProcessor.getMapViewerLayerAPI(get().mapId).getGeoviewLayer(layerPath)!;

        // Apply the filters
        get().timeSliderState.actions.applyFilters(geoviewLayer, layerPath, values);
      },
      // #endregion ACTIONS
    },
  } as ITimeSliderState;

  return init;
}

// **********************************************************
// Layer state selectors
// **********************************************************
export const useTimeSliderLayers = (): TimeSliderLayerSet => useStore(useGeoViewStore(), (state) => state.timeSliderState.timeSliderLayers);

// TODO: Refactor - We should explicit a type for the timeSliderState.actions
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const useTimeSliderStoreActions = (): any => useStore(useGeoViewStore(), (state) => state.timeSliderState.actions);
