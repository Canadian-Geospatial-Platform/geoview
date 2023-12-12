import { GeoViewStoreType } from '@/core/stores/geoview-store';
import { AbstractEventProcessor } from '../abstract-event-processor';
import { TypeTimeSliderValues } from '@/app';
export declare class TimeSliderEventProcessor extends AbstractEventProcessor {
    onInitialize(store: GeoViewStoreType): void;
    /**
     * Filter array of legend layers to get usable time slider layer paths
     *
     * @param {string} mapId The id of the map
     * @param {TypeLegendLayer[]} legendLayers Array of legend layers to filter
     * @returns {string[]} A list of usable layer paths
     */
    private static filterTimeSliderLayers;
    /**
     * Filter array of legend layers to get visible time slider layer paths
     *
     * @param {string} mapId The id of the map
     * @param {TypeLegendLayer[]} legendLayers Array of legend layers to filter
     * @returns {string[]} A list of usable layer paths
     */
    private static filterVisibleTimeSliderLayers;
    /**
     * Get initial values for a layer's time slider states
     *
     * @param {string} mapId The id of the map
     * @param {string} layerPath The path of the layer to add to time slider
     * @returns {{ [index: string]: TypeTimeSliderValues }}
     */
    static getInitialTimeSliderValues(mapId: string, layerPath: string): {
        [index: string]: TypeTimeSliderValues;
    };
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
