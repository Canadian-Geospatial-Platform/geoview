import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import type { ITimeSliderState, TimeSliderLayerSet, TypeTimeSliderValues, TypeTimeSliderProps } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { AbstractBaseLayerEntryConfig } from '@/api/config/validation-classes/abstract-base-layer-entry-config';
import { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
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
     * @throws {LayerNotFoundError} Error thrown when the layer couldn't be found at the given layer path.
     * @throws {LayerWrongTypeError} Error thrown when the specified layer is of wrong type.
     * @static
     */
    static getInitialTimeSliderValues(mapId: string, layerConfig: AbstractBaseLayerEntryConfig, timesliderConfig?: TypeTimeSliderProps): TypeTimeSliderValues | undefined;
    /**
     * Guesses the estimated steps that should be used by the slider, depending on the value range
     * @param {number} minValue - The minimum value
     * @param {number} maxValue - The maximum value
     * @returns The estimated stepping value based on the min and max values
     * @static
     */
    static guessEstimatedStep(minValue: number, maxValue: number): number | undefined;
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
     * Filter the layer provided in the layerPath variable according to current states (filtering and values)
     *
     * @param {string} mapId - The id of the map
     * @param {string} layerPath - The path of the layer to filter
     * @param {string} field - The field to filter the layer by
     * @param {boolean} filtering - Whether the layer should be filtered or returned to default
     * @param {number[]} minAndMax - Minimum and maximum values of slider
     * @param {number[]} values - Filter values to apply
     * @returns {void}
     * @throws {PluginStateUninitializedError} When the TimeSlider plugin is uninitialized.
     * @static
     */
    static updateFilters(mapId: string, layerPath: string, field: string, filtering: boolean, minAndMax: number[], values: number[]): void;
}
//# sourceMappingURL=time-slider-event-processor.d.ts.map