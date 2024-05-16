import { useStore } from 'zustand';
import { useGeoViewStore } from '@/core/stores/stores-managers';
import { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import { AbstractGeoViewLayer } from '@/geo/layer/geoview-layers/abstract-geoview-layers';
import { MapEventProcessor } from '@/api/event-processors/event-processor-children/map-event-processor';

// GV Important: See notes in header of MapEventProcessor file for information on the paradigm to apply when working with TimeSliderEventProcessor vs TimeSliderState

// #region TYPES & INTERFACES

type TimeSliderActions = ITimeSliderState['actions'];

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
    setTitle: (layerPath: string, title: string) => void;
    setDescription: (layerPath: string, description: string) => void;
    setDelay: (layerPath: string, delay: number) => void;
    setFiltering: (geoviewLayer: AbstractGeoViewLayer, layerPath: string, filter: boolean) => void;
    setLocked: (layerPath: string, locked: boolean) => void;
    setReversed: (layerPath: string, locked: boolean) => void;
    setDefaultValue: (layerPath: string, defaultValue: string) => void;
    setValues: (layerPath: string, values: number[]) => void;
  };

  setterActions: {
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

/**
 * Initializes an TimeSlider State and provide functions which use the get/set Zustand mechanisms.
 * @param {TypeSetStore} set - The setter callback to be used by this state
 * @param {TypeGetStore} get - The getter callback to be used by this state
 * @returns {ITimeSliderState} - The initialized TimeSlider State
 */
export function initializeTimeSliderState(set: TypeSetStore, get: TypeGetStore): ITimeSliderState {
  const init = {
    timeSliderLayers: {},

    // #region ACTIONS

    actions: {
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
      setFiltering(geoviewLayer: AbstractGeoViewLayer, layerPath: string, filtering: boolean): void {
        // Redirect to setter
        TimeSliderEventProcessor.applyFilters((geoviewLayer, layerPath, filtering);
        get().timeSliderState.setterActions.setFiltering(geoviewLayer, layerPath, filtering);
      },
      setLocked(layerPath: string, locked: boolean): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setLocked(layerPath, locked);
      },
      setReversed(layerPath: string, reversed: boolean): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setReversed(layerPath, reversed);
      },
      setDefaultValue(layerPath: string, defaultValue: string): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setDefaultValue(layerPath, defaultValue);
      },
      setValues(layerPath: string, values: number[]): void {
        // Redirect to setter
        get().timeSliderState.setterActions.setValues(layerPath, values);
      },
    },

    setterActions: {
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
        get().timeSliderState.setterActions.applyFilters(geoviewLayer, layerPath, values);
      },
    },

    // #endregion ACTIONS
  } as ITimeSliderState;

  return init;
}

// **********************************************************
// Layer state selectors
// **********************************************************
export const useTimeSliderLayers = (): TimeSliderLayerSet => useStore(useGeoViewStore(), (state) => state.timeSliderState.timeSliderLayers);

export const useTimeSliderStoreActions = (): TimeSliderActions => useStore(useGeoViewStore(), (state) => state.timeSliderState.actions);
