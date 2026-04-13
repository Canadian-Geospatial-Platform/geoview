import type { GeoViewGeoChartConfig } from '@/api/config/reader/uuid-config-reader';
import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';
import type { MapViewer } from '@/geo/map/map-viewer';
import {
  addStoreGeochartChart,
  initStoreGeochartCharts,
  removeStoreGeochartChart,
  setStoreGeochartLayerDataArrayBatchLayerPathBypass,
  setStoreGeochartSelectedLayerPath,
} from '@/core/stores/store-interface-and-intial-values/geochart-state';

/**
 * Controller responsible for geochart interactions and
 * bridging the geochart state with the UI domain.
 */
export class GeoChartController extends AbstractMapViewerController {
  /**
   * Creates an instance of GeoChartController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param controllerRegistry - The controller registry for accessing sibling controllers
   */
  // GV Leave the constructor here, because we'll likely need it soon to inject dependencies.
  // eslint-disable-next-line @typescript-eslint/no-useless-constructor
  constructor(mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(mapViewer, controllerRegistry);
  }

  /**
   * Sets the selected layer path in the geochart panel.
   *
   * @param layerPath - The layer path to select
   */
  setSelectedLayerPath(layerPath: string): void {
    // Save in the store
    setStoreGeochartSelectedLayerPath(this.getMapId(), layerPath);
  }

  /**
   * Sets the layer data array batch layer path bypass in the geochart panel.
   *
   * @param layerPath - The layer path to set
   */
  setLayerDataArrayBatchLayerPathBypass(layerPath: string): void {
    // Save in the store
    setStoreGeochartLayerDataArrayBatchLayerPathBypass(this.getMapId(), layerPath);
  }

  /**
   * Initializes the geochart panel with a list of charts.
   *
   * @param charts - An array of chart configurations to initialize the geochart panel with
   */
  initCharts(charts: GeoViewGeoChartConfig[]): void {
    // Save in the store
    initStoreGeochartCharts(this.getMapId(), charts);
  }

  /**
   * Adds a chart to the geochart panel.
   *
   * @param layerPath - The layer path of the chart to add
   * @param chartConfig - The configuration of the chart to add
   */
  addChart(layerPath: string, chartConfig: GeoViewGeoChartConfig): void {
    // Save in the store
    addStoreGeochartChart(this.getMapId(), layerPath, chartConfig);
  }

  /**
   * Removes a chart from the geochart panel.
   *
   * @param layerPath - The layer path of the chart to remove
   * @param callbackWhenEmpty - A callback function to execute when the chart panel is empty
   */
  removeChart(layerPath: string, callbackWhenEmpty: () => void): void {
    // Save in the store
    removeStoreGeochartChart(this.getMapId(), layerPath, callbackWhenEmpty);
  }
}
