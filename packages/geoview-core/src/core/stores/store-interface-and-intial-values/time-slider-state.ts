import { useStore } from 'zustand';

import { useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import { TimeSliderEventProcessor } from '@/api/event-processors/event-processor-children/time-slider-event-processor';
import type { TemporalMode, TimeDimension, TimeIANA, TypeDisplayDateFormat } from '@/core/utils/date-mgt';

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

    // TODO: REFACTOR - Many of these actions are actually setters. They should be changed to call the TimeSliderEventProcessor.
    // TO.DOCONT: It's the TimeSliderEventProcessor that's supposed to call the setterActions according to the GV pattern.
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

      /**
       * Sets the display date format.
       * @param {TypeDisplayDateFormat} displayDateFormat - The display date format.
       * @returns {void}
       */
      setDisplayDateFormat: (layerPath: string, displayDateFormat: TypeDisplayDateFormat): void => {
        // Redirect to processor
        return TimeSliderEventProcessor.setDisplayDateFormat(get().mapId, layerPath, displayDateFormat);
      },

      /**
       * Sets the display date format short.
       * @param {TypeDisplayDateFormat} displayDateFormatShort - The display date format short.
       * @returns {void}
       */
      setDisplayDateFormatShort: (layerPath: string, displayDateFormatShort: TypeDisplayDateFormat): void => {
        // Redirect to processor
        return TimeSliderEventProcessor.setDisplayDateFormatShort(get().mapId, layerPath, displayDateFormatShort);
      },

      /**
       * Sets the display date timezone.
       * @param {TimeIANA} displayDateTimezone - The display date timezone.
       * @returns {void}
       */
      setDisplayDateTimezone: (layerPath: string, displayDateTimezone: TimeIANA): void => {
        // Redirect to processor
        return TimeSliderEventProcessor.setDisplayDateTimezone(get().mapId, layerPath, displayDateTimezone);
      },

      setFiltering(layerPath: string, filtering: boolean): void {
        // Redirect to TimeSliderEventProcessor
        const { field, minAndMax, values, additionalLayerpaths } = get().timeSliderState.timeSliderLayers[layerPath];

        // Update the filters
        TimeSliderEventProcessor.updateFilters(get().mapId, layerPath, field, filtering, minAndMax, values);

        // Update filtering for additional layers
        if (additionalLayerpaths)
          additionalLayerpaths.forEach((additionalLayerPath) => get().timeSliderState.actions.setFiltering(additionalLayerPath, filtering));
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
      setValues(layerPath: string, values: number[]): void {
        // Redirect to TimeSliderEventProcessor
        const { field, minAndMax, filtering, additionalLayerpaths } = get().timeSliderState.timeSliderLayers[layerPath];

        // Update the filters
        TimeSliderEventProcessor.updateFilters(get().mapId, layerPath, field, filtering, minAndMax, values);

        // Update values for additional layers
        if (additionalLayerpaths)
          additionalLayerpaths.forEach((additionalLayerPath) => get().timeSliderState.actions.setValues(additionalLayerPath, values));
      },
    },

    // TODO: REFACTOR - These setters reassign the whole 'timeSliderLayers' object (for all layerPaths) instead of just
    // TO.DOCONT: changing the one for the layerPath in question. This should be changed and a hook selector should be put in
    // TO.DOCONT: place - instead of the too-high-level: useTimeSliderLayers
    setterActions: {
      addTimeSliderLayer(newLayer: TimeSliderLayerSet): void {
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

      setDisplayDateFormat: (layerPath: string, displayDateFormat: TypeDisplayDateFormat): void => {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].displayDateFormat = displayDateFormat;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },

      setDisplayDateFormatShort: (layerPath: string, displayDateFormatShort: TypeDisplayDateFormat): void => {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].displayDateFormatShort = displayDateFormatShort;
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...sliderLayers },
          },
        });
      },

      setDisplayDateTimezone: (layerPath: string, displayDateTimezone: TimeIANA): void => {
        const sliderLayers = get().timeSliderState.timeSliderLayers;
        sliderLayers[layerPath].displayDateTimezone = displayDateTimezone;
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
    },

    // #endregion ACTIONS
  } as ITimeSliderState;

  return init;
}

export type TimeSliderLayerSet = {
  [layerPath: string]: TypeTimeSliderValues;
};

export interface TypeTimeSliderValues {
  // Layer paths of additional layers associated with this time slider
  additionalLayerpaths?: string[];
  delay: number;
  description?: string;
  discreteValues: boolean;
  step?: number;
  field: string;
  fieldAlias: string;
  filtering: boolean;
  // If false, these values are for a layer that is associated with another time slider
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

// **********************************************************
// Time-slider state selectors
// **********************************************************
export const useTimeSliderLayers = (): TimeSliderLayerSet | undefined =>
  useStore(useGeoViewStore(), (state) => state.timeSliderState?.timeSliderLayers);

export const useTimeSliderLayersSelector = (layerPath: string): TypeTimeSliderValues | undefined =>
  useStore(useGeoViewStore(), (state) => state.timeSliderState?.timeSliderLayers[layerPath]);

export const useTimeSliderSelectedLayerPath = (): string => useStore(useGeoViewStore(), (state) => state.timeSliderState.selectedLayerPath);

export const useTimeSliderFilters = (): Record<string, string> =>
  useStore(useGeoViewStore(), (state) => state.timeSliderState?.sliderFilters);

export const useTimeSliderFiltersSelector = (layerPath: string): string | undefined => {
  return useStore(useGeoViewStore(), (state) => state.timeSliderState?.sliderFilters[layerPath]);
};

// Store Actions
export const useTimeSliderStoreActions = (): TimeSliderActions | undefined =>
  useStore(useGeoViewStore(), (state) => state.timeSliderState?.actions);
