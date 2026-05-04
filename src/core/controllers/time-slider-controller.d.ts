import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import { type TypeTimeSliderProps } from '@/core/stores/store-interface-and-intial-values/time-slider-state';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { AbstractGVLayer } from '@/geo/layer/gv-layers/abstract-gv-layer';
import { type TypeDisplayDateFormat } from '@/core/utils/date-mgt';
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
     * @param controllerRegistry - The controller registry for accessing sibling controllers
     */
    constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry);
    /**
     * Sets the selected layer path in the time-slider panel.
     *
     * @param layerPath - The layer path to select
     */
    setSelectedLayerPathTimeSlider(layerPath: string): void;
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
    /**
     * Sets the step value for a layer path in the time-slider panel.
     *
     * @param layerPath - The layer path
     * @param step - The step value
     */
    setStep(layerPath: string, step: number): void;
    /**
     * Sets the delay value for a layer path in the time-slider panel.
     *
     * @param layerPath - The layer path
     * @param delay - The delay value
     */
    setDelay(layerPath: string, delay: number): void;
    /**
     * Sets the locked state for a layer path in the time-slider panel.
     *
     * @param layerPath - The layer path
     * @param locked - The locked state
     */
    setLocked(layerPath: string, locked: boolean): void;
    /**
     * Sets the reversed state for a layer path in the time-slider panel.
     *
     * @param layerPath - The layer path
     * @param reversed - The reversed state
     */
    setReversed(layerPath: string, reversed: boolean): void;
    /**
     * Sets the display date format for a layer path in the time-slider panel.
     *
     * @param layerPath - The layer path
     * @param displayDateFormat - The display date format
     */
    setDisplayDateFormat(layerPath: string, displayDateFormat: TypeDisplayDateFormat): void;
    /**
     * Sets the short display date format for a layer path in the time-slider panel.
     *
     * @param layerPath - The layer path
     * @param displayDateFormat - The short display date format
     */
    setDisplayDateFormatShort(layerPath: string, displayDateFormat: TypeDisplayDateFormat): void;
    /**
     * Sets the display date timezone for a layer path in the time-slider panel.
     *
     * @param layerPath - The layer path
     * @param displayDateTimezone - The display date timezone
     */
    setDisplayDateTimezone(layerPath: string, displayDateTimezone: string): void;
    /**
     * Attempts to register a layer with the time slider if it has a temporal dimension and time slider values.
     *
     * @param layer - The layer to attempt registration for
     */
    tryRegisterLayer(layer: AbstractGVLayer): void;
}
//# sourceMappingURL=time-slider-controller.d.ts.map