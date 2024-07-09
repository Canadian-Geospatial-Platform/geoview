import { AbstractEventProcessor } from '@/api/event-processors/abstract-event-processor';
import { ITimeSliderState, TimeSliderLayerSet, TypeTimeSliderValues } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import { TypeLayerEntryConfig } from '@/geo/map/map-schema-types';
export declare class TimeSliderEventProcessor extends AbstractEventProcessor {
    #private;
    /**
     * Shortcut to get the TimeSlider state for a given map id
     * @param {string} mapId - The mapId
     * @returns {ITimeSliderState | undefined} The Time Slider state. Forcing the return to also be 'undefined', because
     *                                         there will be no timeSliderState if the TimeSlider plugin isn't active.
     *                                         This helps the developers making sure the existence is checked.
     */
    protected static getTimesliderState(mapId: string): ITimeSliderState | undefined;
    /**
     * Gets time slider layers.
     * @param {string} mapId - The map id of the state to act on
     * @returns {TimeSliderLayerSet | undefined} The time slider layer set or undefined
     */
    static getTimeSliderLayers(mapId: string): TimeSliderLayerSet | undefined;
    /**
     * Checks if the layer has time slider values. If there are, adds the time slider layer and applies filters.
     * @param {string} mapId - The map id of the state to act on
     * @param {TypeLayerEntryConfig} layerConfig - The layer path of the layer to add to the state
     */
    static checkInitTimeSliderLayerAndApplyFilters(mapId: string, layerConfig: TypeLayerEntryConfig): void;
    /**
     * Removes a time slider layer from the state
     * @param {string} mapId - The map id of the state to act on
     * @param {string} layerPath - The layer path of the layer to remove from the state
     */
    static removeTimeSliderLayer(mapId: string, layerPath: string): void;
    /**
     * Get initial values for a layer's time slider states
     *
     * @param {string} mapId - The id of the map
     * @param {TypeLayerEntryConfig} layerConfig - The layer path of the layer to add to the state
     * @returns {TimeSliderLayer | undefined}
     */
    static getInitialTimeSliderValues(mapId: string, layerConfig: TypeLayerEntryConfig): TypeTimeSliderValues | undefined;
    /**
     * Filter the layer provided in the layerPath variable according to current states (filtering and values)
     *
     * @param {string} mapId - The id of the map
     * @param {string} layerPath - The path of the layer to filter
     * @param {string} defaultValue - The default value to use if filters are off
     * @param {string} field - The field to filter the layer by
     * @param {boolean} filtering - Whether the layer should be filtered or returned to default
     * @param {number[]} minAndMax - Minimum and maximum values of slider
     * @param {number[]} values - Filter values to apply
     * @returns {void}
     */
    static applyFilters(mapId: string, layerPath: string, defaultValue: string, field: string, filtering: boolean, minAndMax: number[], values: number[]): void;
}
