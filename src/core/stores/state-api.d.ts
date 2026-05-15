import { type GeoChartStoreByLayerPath, type TypeGeochartResultSetEntry } from './states/geochart-state';
import type { TimeSliderLayerSet } from './states/time-slider-state';
import type { EventDelegateBase } from '@/api/events/event-helper';
import type { LayerController } from '@/core/controllers/layer-controller';
/**
 * API to manage states.
 */
export declare class StateApi {
    #private;
    /**
     * Instantiates an StateApi class.
     *
     * @param layerController - The layer controller instance to interact with layer-related states.
     */
    constructor(layerController: LayerController);
    /**
     * Get the collapsed state of layer's legend.
     * @param layerPath - Path of the layer to get state for.
     * @returns If the legend is collapsed.
     */
    getLegendCollapsedState(layerPath: string): boolean;
    /**
     * Get a specific state from a plugin.
     * @param pluginId - The plugin to get state for.
     * @param state - The state to get.
     * @returns The requested state.
     */
    getPluginState(pluginId: 'geochart' | 'swiper' | 'time-slider', state: string): string | TypeGeochartResultSetEntry[] | GeoChartStoreByLayerPath | TimeSliderLayerSet | string[] | undefined;
    /**
     * Set the collapsed state of layer's legend.
     * @param layerPath - Path of the layer to get state for.
     * @param collapsed - The new state
     * @returns If the legend is collapsed.
     */
    setLegendCollapsedState(layerPath: string, collapsed: boolean): void;
    /**
     * Set selected layer in layers tab.
     * @param layerPath - The path of the layer to set
     */
    setSelectedLayersTabLayer(layerPath: string): void;
    /**
     * Reorders a layer and its children within the ordered layers list by a given number of positions.
     *
     * The layer (along with any child paths) is extracted from its current position and re-inserted
     * at the target index, skipping only siblings at the same depth. Updates the store, reorders the
     * legend layers, and emits a layers reordered event.
     *
     * @param layerPath - The path of the layer to move
     * @param move - The number of sibling positions to move (negative = toward index 0, positive = toward end)
     */
    reorderLayers(layerPath: string, move: number): void;
    /**
     * Registers a layers reordered event handler.
     * @param callback - The callback to be executed whenever the event is emitted
     */
    onLayersReordered(callback: LayersReorderedDelegate): void;
    /**
     * Unregisters a layers reordered event handler.
     * @param callback - The callback to stop being called whenever the event is emitted
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
    orderedLayers: string[];
};
export {};
//# sourceMappingURL=state-api.d.ts.map