import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
/**
 * Controller responsible for geochart interactions and
 * bridging the geochart state with the UI domain.
 */
export declare class GeoChartController extends AbstractMapViewerController {
    /**
     * Creates an instance of GeoChartController.
     *
     * @param mapViewer - The map viewer instance to associate with this controller
     * @param controllerRegistry - The controller registry for accessing sibling controllers
     */
    constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry);
    /**
     * Sets the selected layer path in the geochart panel.
     *
     * @param layerPath - The layer path to select
     */
    setSelectedLayerPath(layerPath: string): void;
    /**
     * Sets the layer data array batch layer path bypass in the geochart panel.
     *
     * @param layerPath - The layer path to set
     */
    setLayerDataArrayBatchLayerPathBypass(layerPath: string): void;
    /**
     * Initializes the geochart panel with a list of charts.
     *
     * @param charts - An array of chart configurations to initialize the geochart panel with
     */
    initCharts(charts: GeoViewGeoChartConfig[]): void;
    /**
     * Adds a chart to the geochart panel.
     *
     * @param layerPath - The layer path of the chart to add
     * @param chartConfig - The configuration of the chart to add
     */
    addChart(layerPath: string, chartConfig: GeoViewGeoChartConfig): void;
    /**
     * Removes a chart from the geochart panel.
     *
     * @param layerPath - The layer path of the chart to remove
     * @param callbackWhenEmpty - A callback function to execute when the chart panel is empty
     */
    removeChart(layerPath: string, callbackWhenEmpty: () => void): void;
}
//# sourceMappingURL=geochart-controller.d.ts.map