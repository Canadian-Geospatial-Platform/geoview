import { useStore } from 'zustand';

import { getGeoViewStore, useGeoViewStore } from '@/core/stores/stores-managers';
import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TemporalMode, TimeDimension, TimeIANA, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
import { PluginStateUninitializedError } from '@/core/exceptions/geoview-exceptions';

// #region INTERFACE DEFINITION

/**
 * Represents the TimeSlider Zustand store slice.
 *
 * Manages state for the time slider including layer paths, selected layer, and filter expressions.
 */
export interface ITimeSliderState {
  /** The set of time-slider layers keyed by layer path. */
  timeSliderLayers: TimeSliderLayerSet;

  /** The currently selected layer path in the time slider. */
  selectedLayerPath: string;

  /** Filter expressions keyed by layer path applied by the slider. */
  sliderFilters: Record<string, string>;

  /** Sets default configuration values from the map features config. */
  setDefaultConfigValues: (geoviewConfig: TypeMapFeaturesConfig) => void;

  /** Actions to mutate the TimeSlider state. */
  actions: {
    /** Adds a new time-slider layer to the set. */
    addTimeSliderLayer: (newLayer: TimeSliderLayerSet) => void;

    /** Removes a time-slider layer by its path. */
    removeTimeSliderLayer: (layerPath: string) => void;

    /** Sets the title of a time-slider layer. */
    setTitle: (layerPath: string, title: string) => void;

    /** Sets the description of a time-slider layer. */
    setDescription: (layerPath: string, description: string) => void;

    /** Sets the animation delay for a time-slider layer. */
    setDelay: (layerPath: string, delay: number) => void;

    /** Sets the display date format for a time-slider layer. */
    setDisplayDateFormat: (layerPath: string, displayDateFormat: TypeDisplayDateFormat) => void;

    /** Sets the short display date format for a time-slider layer. */
    setDisplayDateFormatShort: (layerPath: string, displayDateFormatShort: TypeDisplayDateFormat) => void;

    /** Sets the display date timezone for a time-slider layer. */
    setDisplayDateTimezone: (layerPath: string, displayDateTimezone: TimeIANA) => void;

    /** Sets the filtering flag for a time-slider layer. */
    setFiltering: (layerPath: string, filter: boolean) => void;

    /** Sets the locked flag for a time-slider layer. */
    setLocked: (layerPath: string, locked: boolean) => void;

    /** Sets the reversed flag for a time-slider layer. */
    setReversed: (layerPath: string, locked: boolean) => void;

    /** Sets the currently selected layer path. */
    setSelectedLayerPath: (layerPath: string) => void;

    /** Sets the full slider filters record. */
    setSliderFilters: (newSliderFilters: Record<string, string>) => void;

    /** Sets the step value for a time-slider layer. */
    setStep: (layerPath: string, step: number) => void;

    /** Sets the current slider values (timestamps) for a time-slider layer. */
    setValues: (layerPath: string, values: number[]) => void;
  };
}

// #endregion INTERFACE DEFINITION

// #region STATE INITIALIZATION

/**
 * Initializes an TimeSlider State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized TimeSlider State
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

    // TODO: REFACTOR - These setters reassign the whole 'timeSliderLayers' object (for all layerPaths) instead of just
    // TO.DOCONT: changing the one for the layerPath in question. This should be changed and a hook selector should be put in
    // TO.DOCONT: place - instead of the too-high-level: useStoreTimeSliderLayers
    actions: {
      /**
       * Adds a time slider layer.
       *
       * @param newLayer - The time slider layer set to add
       */
      addTimeSliderLayer(newLayer: TimeSliderLayerSet): void {
        set({
          timeSliderState: {
            ...get().timeSliderState,
            timeSliderLayers: { ...get().timeSliderState.timeSliderLayers, ...newLayer },
          },
        });
      },

      /**
       * Removes a time slider layer.
       *
       * @param layerPath - The layer path to remove
       */
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

      /**
       * Sets the title for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param title - The title to set
       */
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

      /**
       * Sets the description for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param description - The description to set
       */
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

      /**
       * Sets the delay for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param delay - The delay value in milliseconds
       */
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

      /**
       * Sets the display date format for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param displayDateFormat - The date format to use
       */
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

      /**
       * Sets the short display date format for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param displayDateFormatShort - The short date format to use
       */
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

      /**
       * Sets the display date timezone for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param displayDateTimezone - The IANA timezone identifier
       */
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

      /**
       * Sets the filtering state for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param filtering - Whether filtering is enabled
       */
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

      /**
       * Sets the locked state for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param locked - Whether the slider is locked
       */
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

      /**
       * Sets the reversed state for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param reversed - Whether the slider is reversed
       */
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

      /**
       * Sets the selected layer path for the time slider.
       *
       * @param layerPath - The layer path to select
       */
      setSelectedLayerPath(layerPath: string): void {
        set({
          timeSliderState: {
            ...get().timeSliderState,
            selectedLayerPath: layerPath,
          },
        });
      },

      /**
       * Sets the slider filters.
       *
       * @param newSliderFilters - The new slider filter values
       */
      setSliderFilters(newSliderFilters: Record<string, string>): void {
        set({
          timeSliderState: {
            ...get().timeSliderState,
            sliderFilters: newSliderFilters,
          },
        });
      },

      /**
       * Sets the step value for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param step - The step value
       */
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

      /**
       * Sets the values for a time slider layer.
       *
       * @param layerPath - The layer path
       * @param values - The slider values
       */
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
  };

  return init;
}

// #endregion STATE INITIALIZATION

// #region STATE GETTERS & HOOKS
// GV Getters should be used to get the values at a moment in time.
// GV Hooks should be used to attach to values and trigger UI components when they change.
// GV Typically they are listed in couples (getter + hook) for the same value.

/**
 * Returns the full time slider state slice for the given map.
 *
 * Internal-only selector - not exported to avoid direct store access from outside this module.
 *
 * @param mapId - The map identifier.
 * @returns The ITimeSliderState for the given map.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
// GV No export for the main state!
const getStoreTimeSliderState = (mapId: string): ITimeSliderState => {
  const state = getGeoViewStore(mapId).getState().timeSliderState;
  if (!state) throw new PluginStateUninitializedError('TimeSlider', mapId);
  return state;
};

/**
 * Checks whether the TimeSlider plugin state has been initialized for the given map.
 *
 * @param mapId - The map id to check.
 * @returns True if the TimeSlider state is initialized, false otherwise.
 */
export const isStoreTimeSliderInitialized = (mapId: string): boolean => {
  try {
    // Get its state, this will throw PluginStateUninitializedError if uninitialized
    getStoreTimeSliderState(mapId);
    return true;
  } catch {
    // Uninitialized
    return false;
  }
};

/**
 * Gets all time-slider layers from the store.
 *
 * @param mapId - The map id.
 * @returns The time-slider layer set.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const getStoreTimeSliderLayers = (mapId: string): TimeSliderLayerSet => {
  return getStoreTimeSliderState(mapId).timeSliderLayers;
};

/** Hooks the full set of time-slider layers. Safe to call outside the TimeSlider plugin (optional chaining). */
// GV This hook is called from other components than the TimeSlider so the '?' on the timeSliderState is mandatory
export const useStoreTimeSliderLayers = (): TimeSliderLayerSet | undefined =>
  useStore(useGeoViewStore(), (state) => state.timeSliderState?.timeSliderLayers);

/**
 * Gets the time-slider values for a specific layer path.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to look up.
 * @returns The time-slider values, or undefined if not found.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const getStoreTimeSliderLayer = (mapId: string, layerPath: string): TypeTimeSliderValues | undefined => {
  return getStoreTimeSliderState(mapId).timeSliderLayers[layerPath];
};

/** Hooks the time-slider values for a specific layer path. Safe to call outside the TimeSlider plugin. */
// GV This hook is called from other components than the TimeSlider so the '?' on the timeSliderState is mandatory
export const useStoreTimeSliderLayer = (layerPath: string): TypeTimeSliderValues | undefined =>
  useStore(useGeoViewStore(), (state) => state.timeSliderState?.timeSliderLayers[layerPath]);

/**
 * Gets the currently selected layer path from the time slider.
 *
 * @param mapId - The map id.
 * @returns The selected layer path.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const getStoreTimeSliderSelectedLayerPath = (mapId: string): string => {
  return getStoreTimeSliderState(mapId).selectedLayerPath;
};

/** Hooks the currently selected layer path in the time slider. */
export const useStoreTimeSliderSelectedLayerPath = (): string =>
  useStore(useGeoViewStore(), (state) => state.timeSliderState.selectedLayerPath);

/**
 * Gets all slider filter expressions keyed by layer path.
 *
 * @param mapId - The map id.
 * @returns A record of filter strings keyed by layer path.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const getStoreTimeSliderFilters = (mapId: string): Record<string, string | undefined> => {
  return getStoreTimeSliderState(mapId).sliderFilters;
};

/**
 * Gets the slider filter expression for a specific layer path.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to look up.
 * @returns The filter string, or undefined if not set.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const getStoreTimeSliderFilter = (mapId: string, layerPath: string): string | undefined => {
  return getStoreTimeSliderFilters(mapId)[layerPath];
};

/** Hooks the slider filter string for a specific layer path. Safe to call outside the TimeSlider plugin. */
// GV This hook is called from other components than the TimeSlider so the '?' on the timeSliderState is mandatory
export const useStoreTimeSliderFilter = (layerPath: string): string | undefined =>
  useStore(useGeoViewStore(), (state) => state.timeSliderState?.sliderFilters[layerPath]);

// #endregion STATE GETTERS & HOOKS

// #region STATE ADAPTORS
// GV These methods should be called from a State Adaptor class listening on domain events triggered by controllers.

/**
 * Sets the selected layer path in the time slider store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to select.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderSelectedLayerPath = (mapId: string, layerPath: string): void => {
  // Get the timeslider state which is only initialized if the TimeSlider Plugin exists.
  const timeSliderState = getStoreTimeSliderState(mapId);

  // Redirect
  timeSliderState.actions.setSelectedLayerPath(layerPath);
};

/**
 * Adds a time-slider layer to the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to add.
 * @param timeSliderValues - The time-slider configuration values for the layer.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const addStoreTimeSliderLayer = (mapId: string, layerPath: string, timeSliderValues: TypeTimeSliderValues): void => {
  // Get the timeslider state which is only initialized if the TimeSlider Plugin exists.
  const timeSliderState = getStoreTimeSliderState(mapId);

  // Create set part (because that's how it works for now)
  const timeSliderLayer = { [layerPath]: timeSliderValues };

  // Add it
  timeSliderState.actions.addTimeSliderLayer(timeSliderLayer);
};

/**
 * Removes a time-slider layer from the store and calls the callback when no layers remain.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to remove.
 * @param callbackWhenEmpty - Callback invoked when the layer set becomes empty after removal.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const removeStoreTimeSliderLayer = (mapId: string, layerPath: string, callbackWhenEmpty: () => void): void => {
  // Get the timeslider state which is only initialized if the TimeSlider Plugin exists.
  const timeSliderState = getStoreTimeSliderState(mapId);

  // Redirect
  timeSliderState.actions.removeTimeSliderLayer(layerPath);

  // If there are no more layers with time dimension
  if (!Object.keys(timeSliderState.timeSliderLayers).length) {
    // Call the callback function
    callbackWhenEmpty();
  }
};

/**
 * Sets the title of a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param title - The new title.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderTitle = (mapId: string, layerPath: string, title: string): void => {
  // Get the timeslider state which is only initialized if the TimeSlider Plugin exists.
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setTitle(layerPath, title);
};

/**
 * Sets the description of a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param description - The new description.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderDescription = (mapId: string, layerPath: string, description: string): void => {
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setDescription(layerPath, description);
};

/**
 * Sets the display date format for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param displayDateFormat - The date format to apply.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderDisplayDateFormat = (mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void => {
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setDisplayDateFormat(layerPath, displayDateFormat);
};

/**
 * Sets the short display date format for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param displayDateFormatShort - The short date format to apply.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderDisplayDateFormatShort = (
  mapId: string,
  layerPath: string,
  displayDateFormatShort: TypeDisplayDateFormat
): void => {
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setDisplayDateFormatShort(layerPath, displayDateFormatShort);
};

/**
 * Sets the display date timezone for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param displayDateTimezone - The IANA timezone identifier.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderDisplayDateTimezone = (mapId: string, layerPath: string, displayDateTimezone: TimeIANA): void => {
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setDisplayDateTimezone(layerPath, displayDateTimezone);
};

/**
 * Sets the animation delay for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param delay - The delay in milliseconds.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderDelay = (mapId: string, layerPath: string, delay: number): void => {
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setDelay(layerPath, delay);
};

/**
 * Sets the locked state for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param locked - Whether the slider is locked.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderLocked = (mapId: string, layerPath: string, locked: boolean): void => {
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setLocked(layerPath, locked);
};

/**
 * Sets the reversed state for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param reversed - Whether the slider is reversed.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderReversed = (mapId: string, layerPath: string, reversed: boolean): void => {
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setReversed(layerPath, reversed);
};

/**
 * Sets the step value for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param step - The step value.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderStep = (mapId: string, layerPath: string, step: number): void => {
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setStep(layerPath, step);
};

/**
 * Sets the filtering state for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param filtering - Whether filtering is active.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderFiltering = (mapId: string, layerPath: string, filtering: boolean): void => {
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setFiltering(layerPath, filtering);
};

/**
 * Sets the current slider timestamp values for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param values - The array of timestamp values.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const setStoreTimeSliderValues = (mapId: string, layerPath: string, values: number[]): void => {
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setValues(layerPath, values);
};

/**
 * Adds or updates a filter expression for a specific layer path in the time slider store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to set the filter for.
 * @param filter - The filter expression string.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export const addOrUpdateStoreTimeSliderFilter = (mapId: string, layerPath: string, filter: string): void => {
  // Get the timeslider state which is only initialized if the TimeSlider Plugin exists.
  const timeSliderState = getStoreTimeSliderState(mapId);
  timeSliderState.actions.setSliderFilters({ ...timeSliderState.sliderFilters, [layerPath]: filter });
};

// #endregion STATE ADAPTORS

/** A lookup of time-slider values keyed by layer path. */
export type TimeSliderLayerSet = {
  [layerPath: string]: TypeTimeSliderValues;
};

/** Configuration and runtime values for a single time-slider layer. */
export interface TypeTimeSliderValues {
  /** Optional layer paths of additional layers associated with this time slider. */
  additionalLayerpaths?: string[];

  /** Animation delay in milliseconds between steps. */
  delay: number;

  /** Optional description displayed in the time slider panel. */
  description?: string;

  /** Whether the time dimension uses discrete values rather than a continuous range. */
  discreteValues: boolean;

  /** Optional step increment for the slider. */
  step?: number;

  /** The temporal field name on the layer. */
  field: string;

  /** The human-readable alias for the temporal field. */
  fieldAlias: string;

  /** Whether temporal filtering is currently active. */
  filtering: boolean;

  /** Whether this is the main layer path (false means it is associated with another time slider). */
  isMainLayerPath: boolean;

  /** Optional flag indicating the slider handles are locked together. */
  locked?: boolean;

  /** The minimum and maximum timestamp values for the slider range. */
  minAndMax: number[];

  /** The array of date-range strings available for the slider. */
  range: string[];

  /** Optional flag indicating the slider plays in reverse. */
  reversed?: boolean;

  /** Whether the slider uses a single handle instead of a range. */
  singleHandle: boolean;

  /** Optional title displayed in the time slider panel. */
  title?: string;

  /** The current slider handle values (timestamps). */
  values: number[];

  /** Optional display date format. */
  displayDateFormat?: TypeDisplayDateFormat;

  /** Optional short display date format. */
  displayDateFormatShort?: TypeDisplayDateFormat;

  /** Optional temporal mode from the service date dimension. */
  serviceDateTemporalMode?: TemporalMode;

  /** Optional IANA timezone for display dates. */
  displayDateTimezone?: TimeIANA;
}

/** Props for the TimeSlider component. */
export type TypeTimeSliderProps = {
  /** The layer paths targeted by the time slider. */
  layerPaths: string[];

  /** Optional temporal field names. */
  fields?: string[];

  /** Optional title for the time slider. */
  title?: string;

  /** Optional animation delay in milliseconds. */
  delay?: number;

  /** Optional flag to enable filtering. */
  filtering?: boolean;

  /** Optional description text. */
  description?: string;

  /** Optional flag to lock slider handles together. */
  locked?: boolean;

  /** Optional flag to reverse playback direction. */
  reversed?: boolean;

  /** Optional time dimension configuration. */
  timeDimension?: TimeDimension;
};
