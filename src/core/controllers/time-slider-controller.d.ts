import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { type TypeTimeSliderProps } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
/**
 * Controller responsible for time slider interactions, keyboard shortcuts, and
 * bridging the time slider state with the UI domain and map projection changes.
 */
export declare class TimeSliderController extends AbstractMapViewerController {
    #private;
    /**
     * Creates an instance of TimeSliderController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     */
    constructor(mapViewer: MapViewer);
    /**
     * Checks if the layer has time slider values. If there are, adds the time slider layer and applies filters.
     *
     * @param layer - The layer to add to the state
     * @param timesliderConfig - Optional time slider configuration
     */
    checkInitTimeSliderLayerAndApplyFilters(layer: AbstractGVLayer, timesliderConfig?: TypeTimeSliderProps): void;
    /**
     * Updates the time slider values for a layer path and re-applies the temporal filters.
     *
     * @param layerPath - The layer path
     * @param values - The new slider values (timestamps in milliseconds)
     */
    updateTimeSliderValues(layerPath: string, values: number[]): void;
    /**
     * Updates the filtering state for a layer path and re-applies the temporal filters.
     *
     * @param layerPath - The layer path
     * @param filtering - Whether temporal filtering is active
     */
    updateTimeSliderFiltering(layerPath: string, filtering: boolean): void;
}
//# sourceMappingURL=time-slider-controller.d.ts.map