import type { TypeGetStore, TypeSetStore } from '@/core/stores/geoview-store';
import type { TypeMapFeaturesConfig } from '@/core/types/global-types';
import type { TemporalMode, TimeDimension, TimeIANA, TypeDisplayDateFormat } from '@/core/utils/date-mgt';
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
/**
 * Initializes an TimeSlider State and provide functions which use the get/set Zustand mechanisms.
 *
 * @param set - The setter callback to be used by this state
 * @param get - The getter callback to be used by this state
 * @returns The initialized TimeSlider State
 */
export declare function initializeTimeSliderState(set: TypeSetStore, get: TypeGetStore): ITimeSliderState;
/**
 * Checks whether the TimeSlider plugin state has been initialized for the given map.
 *
 * @param mapId - The map id to check.
 * @returns True if the TimeSlider state is initialized, false otherwise.
 */
export declare const isStoreTimeSliderInitialized: (mapId: string) => boolean;
/**
 * Gets all time-slider layers from the store.
 *
 * @param mapId - The map id.
 * @returns The time-slider layer set.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const getStoreTimeSliderLayers: (mapId: string) => TimeSliderLayerSet;
/** Hooks the full set of time-slider layers. Safe to call outside the TimeSlider plugin (optional chaining). */
export declare const useStoreTimeSliderLayers: () => TimeSliderLayerSet | undefined;
/**
 * Gets the time-slider values for a specific layer path.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to look up.
 * @returns The time-slider values, or undefined if not found.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const getStoreTimeSliderLayer: (mapId: string, layerPath: string) => TypeTimeSliderValues | undefined;
/** Hooks the time-slider values for a specific layer path. Safe to call outside the TimeSlider plugin. */
export declare const useStoreTimeSliderLayer: (layerPath: string) => TypeTimeSliderValues | undefined;
/**
 * Gets the currently selected layer path from the time slider.
 *
 * @param mapId - The map id.
 * @returns The selected layer path.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const getStoreTimeSliderSelectedLayerPath: (mapId: string) => string;
/** Hooks the currently selected layer path in the time slider. */
export declare const useStoreTimeSliderSelectedLayerPath: () => string;
/**
 * Gets all slider filter expressions keyed by layer path.
 *
 * @param mapId - The map id.
 * @returns A record of filter strings keyed by layer path.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const getStoreTimeSliderFilters: (mapId: string) => Record<string, string | undefined>;
/**
 * Gets the slider filter expression for a specific layer path.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to look up.
 * @returns The filter string, or undefined if not set.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const getStoreTimeSliderFilter: (mapId: string, layerPath: string) => string | undefined;
/** Hooks the slider filter string for a specific layer path. Safe to call outside the TimeSlider plugin. */
export declare const useStoreTimeSliderFilter: (layerPath: string) => string | undefined;
/**
 * Sets the selected layer path in the time slider store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to select.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderSelectedLayerPath: (mapId: string, layerPath: string) => void;
/**
 * Adds a time-slider layer to the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to add.
 * @param timeSliderValues - The time-slider configuration values for the layer.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const addStoreTimeSliderLayer: (mapId: string, layerPath: string, timeSliderValues: TypeTimeSliderValues) => void;
/**
 * Removes a time-slider layer from the store and calls the callback when no layers remain.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to remove.
 * @param callbackWhenEmpty - Callback invoked when the layer set becomes empty after removal.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const removeStoreTimeSliderLayer: (mapId: string, layerPath: string, callbackWhenEmpty: () => void) => void;
/**
 * Sets the title of a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param title - The new title.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderTitle: (mapId: string, layerPath: string, title: string) => void;
/**
 * Sets the description of a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param description - The new description.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderDescription: (mapId: string, layerPath: string, description: string) => void;
/**
 * Sets the display date format for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param displayDateFormat - The date format to apply.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderDisplayDateFormat: (mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat) => void;
/**
 * Sets the short display date format for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param displayDateFormatShort - The short date format to apply.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderDisplayDateFormatShort: (mapId: string, layerPath: string, displayDateFormatShort: TypeDisplayDateFormat) => void;
/**
 * Sets the display date timezone for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param displayDateTimezone - The IANA timezone identifier.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderDisplayDateTimezone: (mapId: string, layerPath: string, displayDateTimezone: TimeIANA) => void;
/**
 * Sets the animation delay for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param delay - The delay in milliseconds.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderDelay: (mapId: string, layerPath: string, delay: number) => void;
/**
 * Sets the locked state for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param locked - Whether the slider is locked.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderLocked: (mapId: string, layerPath: string, locked: boolean) => void;
/**
 * Sets the reversed state for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param reversed - Whether the slider is reversed.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderReversed: (mapId: string, layerPath: string, reversed: boolean) => void;
/**
 * Sets the step value for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param step - The step value.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderStep: (mapId: string, layerPath: string, step: number) => void;
/**
 * Sets the filtering state for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param filtering - Whether filtering is active.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderFiltering: (mapId: string, layerPath: string, filtering: boolean) => void;
/**
 * Sets the current slider timestamp values for a time-slider layer in the store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path.
 * @param values - The array of timestamp values.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const setStoreTimeSliderValues: (mapId: string, layerPath: string, values: number[]) => void;
/**
 * Adds or updates a filter expression for a specific layer path in the time slider store.
 *
 * @param mapId - The map id.
 * @param layerPath - The layer path to set the filter for.
 * @param filter - The filter expression string.
 * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
 */
export declare const addOrUpdateStoreTimeSliderFilter: (mapId: string, layerPath: string, filter: string) => void;
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
//# sourceMappingURL=time-slider-state.d.ts.map