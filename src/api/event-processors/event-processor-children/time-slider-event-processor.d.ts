import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import type { ITimeSliderState, TimeSliderLayerSet, TypeTimeSliderValues, TypeTimeSliderProps } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { type TimeIANA, type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
export declare class TimeSliderEventProcessor extends AbstractEventProcessor {
    #private;
    /**
     * Checks if the Time Slider plugin is iniitialized for the given map.
     * @param {string} mapId - The map id
     * @returns {boolean} True when the Time lider plugin is initialized.
     * @static
     */
    static isTimeSliderInitialized(mapId: string): boolean;
    /**
     * Shortcut to get the TimeSlider state for a given map id
     * @param {string} mapId - The mapId
     * @returns {ITimeSliderState} The Time Slider state.
     * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
     * @static
     */
    protected static getTimeSliderState(mapId: string): ITimeSliderState;
    /**
     * Gets time slider layers.
     * @param {string} mapId - The map id of the state to act on
     * @returns {TimeSliderLayerSet} The time slider layer set or undefined
     * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
     * @static
     */
    static getTimeSliderLayers(mapId: string): TimeSliderLayerSet;
    /**
     * Gets time slider selected layer path.
     * @param {string} mapId - The map id of the state to act on
     * @returns {string} The selected time slider layer path
     * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
     * @static
     */
    static getTimeSliderSelectedLayer(mapId: string): string;
    /**
     * Gets filter(s) for all layers.
     * @param {string} mapId - The map id of the state to act on
     * @returns {string} The time slider filter(s) for the layer
     * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
     * @static
     */
    static getTimeSliderFilters(mapId: string): Record<string, string>;
    /**
     * Gets filter(s) for a specific layer path.
     * @param {string} mapId - The map id of the state to act on
     * @param {string} layerPath - The path of the layer
     * @returns {string} The time slider filter(s) for the layer
     * @throws {PluginStateUninitializedError} When the Time Slider plugin is uninitialized.
     * @static
     */
    static getTimeSliderFilter(mapId: string, layerPath: string): string;
    /**
     * Checks if the layer has time slider values. If there are, adds the time slider layer and applies filters.
     * @param {string} mapId - The map id of the state to act on
     * @param {AbstractGVLayer} layer - The layer to add to the state
     * @param {TypeTimeSliderProps?} timesliderConfig - Optional time slider configuration
     * @static
     */
    static checkInitTimeSliderLayerAndApplyFilters(mapId: string, layer: AbstractGVLayer, timesliderConfig?: TypeTimeSliderProps): void;
    /**
     * Removes a time slider layer from the state
     * @param {string} mapId - The map id of the state to act on
     * @param {string} layerPath - The layer path of the layer to remove from the state
     * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
     * @static
     */
    static removeTimeSliderLayer(mapId: string, layerPath: string): void;
    /**
     * Get initial values for a layer's time slider states
     *
     * @param {string} mapId - The id of the map
     * @param {AbstractBaseLayerEntryConfig} layerConfig - The layer path of the layer to add to the state
     * @returns {TimeSliderLayer | undefined}
     * @throws {LayerNotFoundError} When the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} When the specified layer is of wrong type.
     * @static
     */
    static getInitialTimeSliderValues(mapId: string, layerConfig: AbstractBaseLayerEntryConfig, timesliderConfig?: TypeTimeSliderProps): TypeTimeSliderValues | undefined;
    /**
     * Sets the selected layer path
     * @param {string} mapId - The map id of the state to act on
     * @param {string} layerPath - The layer path to use
     * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
     * @static
     */
    static setSelectedLayerPath(mapId: string, layerPath: string): void;
    /**
     * Sets the filter for the layer path
     * @param {string} mapId - The map id of the state to act on
     * @param {string} layerPath - The layer path to use
     * @param {string} filter - The filter
     * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
     * @static
     */
    static addOrUpdateSliderFilter(mapId: string, layerPath: string, filter: string): void;
    /**
     * Updates the display date format for a specific layer in the time slider state.
     * @param mapId - Identifier of the map viewer instance
     * @param layerPath - Path identifying the target layer
     * @param displayDateFormat - Date format configuration to store
     */
    static setDisplayDateFormat(mapId: string, layerPath: string, displayDateFormat: TypeDisplayDateFormat): void;
    /**
     * Updates the display date format for a specific layer in the time slider state.
     * @param mapId - Identifier of the map viewer instance
     * @param layerPath - Path identifying the target layer
     * @param displayDateFormatShort - Date format configuration to store
     */
    static setDisplayDateFormatShort(mapId: string, layerPath: string, displayDateFormatShort: TypeDisplayDateFormat): void;
    /**
     * Updates the display time zone for date rendering of a specific layer
     * in the time slider state.
     * @param mapId - Identifier of the map viewer instance
     * @param layerPath - Path identifying the target layer
     * @param displayDateTimezone - IANA time zone identifier to store
     */
    static setDisplayDateTimezone(mapId: string, layerPath: string, displayDateTimezone: TimeIANA): void;
    /**
     * Applies or resets a time-based filter on the specified layer based on the
     * current Time Slider state.
     * The generated filter expression varies depending on the layer type
     * (WMS, ESRI Image, or vector layers) and whether filtering is enabled.
     * Date values are normalized and formatted before being injected into
     * the filter expression.
     * @param {string} mapId - The unique identifier of the map.
     * @param {string} layerPath - The path of the layer to which the filter is applied.
     * @param {string} field - The name of the date/time attribute used for filtering.
     * @param {boolean} filtering - Whether filtering is enabled (`true`) or the layer
     * should be reset to its default (unfiltered) state (`false`).
     * @param {number[]} minAndMax - The minimum and maximum values representing the
     * full temporal extent of the layer (typically epoch milliseconds).
     * @param {number[]} values - The active filter values (typically epoch milliseconds)
     * selected by the time slider.
     * @throws {PluginStateUninitializedError} Thrown when the Time Slider plugin state
     * has not been initialized for the specified map.
     * @static
     */
    static updateFilters(mapId: string, layerPath: string, field: string, filtering: boolean, minAndMax: number[], values: number[]): void;
}
//# sourceMappingURL=time-slider-event-processor.d.ts.map