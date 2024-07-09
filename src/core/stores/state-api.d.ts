import { GeoChartStoreByLayerPath, TypeGeochartResultSetEntry } from './store-interface-and-intial-values/geochart-state';
import { TypeOrderedLayerInfo } from './store-interface-and-intial-values/map-state';
import { TimeSliderLayerSet } from './store-interface-and-intial-values/time-slider-state';
import { TypeLegendLayer } from '../components/layers/types';
import { EventDelegateBase } from '@/api/events/event-helper';
/**
 * API to manage states.
 */
export declare class StateApi {
    #private;
    mapId: string;
    /**
     * Instantiates an StateApi class.
     *
     * @param {string} mapId - The map id this AppBarApi belongs to
     */
    constructor(mapId: string);
    /**
     * Get a specific layer panel state.
     * @param {'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'} state - The state to get
     * @returns {string | boolean | null | undefined} The requested state
     */
    getLayerPanelState(state: 'highlightedLayer' | 'selectedLayerPath' | 'displayState' | 'layerDeleteInProgress'): string | boolean | null | undefined;
    /**
     * Get a legend layer.
     * @param {string} layerPath - The path of the layer to get
     * @returns {TypeLegendLayer | undefined} The requested legend layer
     */
    getLegendLayerInfo(layerPath: string): TypeLegendLayer | undefined;
    /**
     * Get the collapsed state of layer's legend.
     * @param {string} layerPath - Path of the layer to get state for.
     * @returns {boolean} If the legend is collapsed.
     */
    getLegendCollapsedState(layerPath: string): boolean;
    /**
     * Get a specific state from a plugin.
     * @param {'time-slider' | 'geochart' | 'swiper'} pluginId - The plugin to get state for.
     * @param {string} state - The state to get.
     * @returns {string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath | TypeTimeSliderValues | undefined} The requested state.
     */
    getPluginState(pluginId: 'geochart' | 'swiper' | 'time-slider', state: string): string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath | TimeSliderLayerSet | string[] | undefined;
    /**
     * Get the collapsed state of layer's legend.
     * @param {string} layerPath - Path of the layer to get state for.
     * @param {boolean} collapsed - The new state
     * @returns {boolean} If the legend is collapsed.
     */
    setLegendCollapsedState(layerPath: string, collapsed?: boolean): void;
    /**
     * Set selected layer in layers tab.
     * @param {string} layerPath - The path of the layer to set
     */
    setSelectedLayersTabLayer(layerPath: string): void;
    reorderLayers(mapId: string, layerPath: string, move: number): void;
    /**
     * Registers a layers reordered event handler.
     * @param {LayersReorderedDelegate} callback - The callback to be executed whenever the event is emitted
     */
    onLayersReordered(callback: LayersReorderedDelegate): void;
    /**
     * Unregisters a layers reordered event handler.
     * @param {LayersReorderedDelegate} callback - The callback to stop being called whenever the event is emitted
     */
    offLayersReordered(callback: LayersReorderedDelegate): void;
}
/**
 * Define a delegate for the event handler function signature
 */
type LayersReorderedDelegate = EventDelegateBase<StateApi, LayersReorderedEvent, void>;
/**
 * Define an event for the delegate
 */
export type LayersReorderedEvent = {
    orderedLayers: TypeOrderedLayerInfo[];
};
export {};
