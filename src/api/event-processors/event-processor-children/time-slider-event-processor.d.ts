import { GeoviewStoreType } from '@/core/stores/geoview-store';
import { ITimeSliderState, TimeSliderLayerSet } from '@/app';
import { AbstractEventProcessor } from '../abstract-event-processor';
export declare class TimeSliderEventProcessor extends AbstractEventProcessor {
    /**
     * Override the initialization process to wire subscriptions and return them so they can be destroyed later.
     */
    protected onInitialize(store: GeoviewStoreType): Array<() => void> | void;
    /**
     * Shortcut to get the TimeSlider state for a given map id
     * @param {string} mapId The mapId
     * @returns {ITimeSliderState | undefined} The Time Slider state. Forcing the return to also be 'undefined', because
     *                                         there will be no timeSliderState if the TimeSlider plugin isn't active.
     *                                         This helps the developers making sure the existence is checked.
     */
    protected static getTimesliderState(mapId: string): ITimeSliderState | undefined;
    /**
     * Filter array of legend layers to get usable time slider layer paths
     *
     * @param {string} mapId The id of the map
     * @param {TypeLegendLayer[]} legendLayers Array of legend layers to filter
     * @returns {string[]} A list of usable layer paths
     */
    private static filterTimeSliderLayers;
    /**
     * Get initial values for a layer's time slider states
     *
     * @param {string} mapId The id of the map
     * @param {string} layerPath The path of the layer to add to time slider
     * @returns {TimeSliderLayer}
     */
    static getInitialTimeSliderValues(mapId: string, layerPath: string): TimeSliderLayerSet;
    /**
     * Filter the layer provided in the layerPath variable according to current states (filtering and values)
     *
     * @param {string} mapId The map to filter
     * @param {string} layerPath The path of the layer to filter
     * @param {string} defaultValue The default value to use if filters are off
     * @param {string} field The field to filter the layer by
     * @param {boolean} filtering Whether the layer should be filtered or returned to default
     * @param {number[]} minAndMax Minimum and maximum values of slider
     * @param {number[]} values Filter values to apply
     * @returns {void}
     */
    static applyFilters(mapId: string, layerPath: string, defaultValue: string, field: string, filtering: boolean, minAndMax: number[], values: number[]): void;
}
