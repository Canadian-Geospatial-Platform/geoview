import type { AbstractController } from '@/core/controllers/base/abstract-controller';
import { UIController } from '@/core/controllers/ui-controller';
import { MapController } from '@/core/controllers/map-controller';
import { LayerController } from '@/core/controllers/layer-controller';
import { LayerCreatorController } from '@/core/controllers/layer-creator-controller';
import { LayerSetController } from '@/core/controllers/layer-set-controller';
import { DrawerController } from '@/core/controllers/drawer-controller';
import { DataTableController } from '@/core/controllers/data-table-controller';
import { PluginController } from '@/core/controllers/plugin-controller';
import { TimeSliderController } from '@/core/controllers/time-slider-controller';
import type { UIDomain } from '@/core/domains/ui-domain';
import type { LayerDomain } from '@/core/domains/layer-domain';
import { getGeoViewStore, hasDrawerPlugin, hasTimeSliderPlugin } from '@/core/stores/stores-managers';
import type { MapViewer } from '@/geo/map/map-viewer';
import type { GeometryApi } from '@/geo/layer/geometry/geometry';
import type { FeatureHighlight } from '@/geo/map/feature-highlight';

/**
 * Central registry that owns and provides access to all framework-level controllers.
 *
 * Created once by MapViewer and exposed to React via ControllerContext.
 * Individual controllers can be accessed through typed getters or the
 * `useUIController()` / `useLayerController()` hooks.
 */
export class ControllerRegistry {
  /** The UI controller used to interact with the UI state. */
  readonly uiController: UIController;

  /** The map controller used to interact with the map. */
  readonly mapController: MapController;

  /** The layer controller used to interact with map layers. */
  readonly layerController: LayerController;

  /** The layer creator controller used to create layers */
  readonly layerCreatorController: LayerCreatorController;

  /** The layer set controller used to manage the layer sets. */
  readonly layerSetController: LayerSetController;

  /** The plugin controller used to interact with plugins. */
  readonly pluginController: PluginController;

  /** The data table controller used to interact with the data table. */
  readonly dataTableController: DataTableController;

  /** The drawer controller used to interact with the drawer. Only present when the drawer plugin is configured. */
  readonly drawerController?: DrawerController;

  /** The time slider controller used to interact with the time slider. Only present when the time slider plugin is configured. */
  readonly timeSliderController?: TimeSliderController;

  /** All controllers registered in this registry. */
  readonly allControllers: AbstractController[] = [];

  /**
   * Creates a new ControllerRegistry and instantiates all framework-level controllers.
   *
   * The drawer controller is only created when the drawer plugin is present in the store.
   *
   * @param mapViewer - The map viewer instance
   * @param uiDomain - The UI domain instance
   * @param layerDomain - The layer domain instance
   * @param geometryApi - The geometry API instance
   */
  constructor(
    mapViewer: MapViewer,
    uiDomain: UIDomain,
    layerDomain: LayerDomain,
    geometryApi: GeometryApi,
    featureHighlight: FeatureHighlight
  ) {
    this.uiController = new UIController(mapViewer, uiDomain);
    this.mapController = new MapController(mapViewer, featureHighlight);
    this.layerController = new LayerController(mapViewer, layerDomain);
    this.layerCreatorController = new LayerCreatorController(mapViewer, layerDomain);
    this.layerSetController = new LayerSetController(mapViewer, layerDomain);
    this.pluginController = new PluginController(mapViewer);
    this.dataTableController = new DataTableController(mapViewer);

    // If the drawer plugin is preset (we know via the store)
    if (hasDrawerPlugin(getGeoViewStore(mapViewer.mapId))) {
      // Create the drawer controller only if the drawer plugin is present, as it relies on the drawer state which is part of that plugin
      this.drawerController = new DrawerController(mapViewer, uiDomain, geometryApi);
    }

    // If the time slider plugin is present (we know via the store)
    if (hasTimeSliderPlugin(getGeoViewStore(mapViewer.mapId))) {
      // Create the time slider controller only if the time slider plugin is present, as it relies on the time slider state which is part of that plugin
      this.timeSliderController = new TimeSliderController(mapViewer);
    }

    // Add all controllers to the registry
    this.allControllers.push(
      this.uiController,
      this.mapController,
      this.layerController,
      this.layerCreatorController,
      this.layerSetController,
      this.pluginController
    );
    if (this.drawerController) this.allControllers.push(this.drawerController);
    if (this.timeSliderController) this.allControllers.push(this.timeSliderController);
  }

  /**
   * Hooks all registered controllers to attach their subscriptions and event handlers.
   */
  hookControllers(): void {
    // For each controller
    this.allControllers.forEach((controller) => {
      // Hook the controller to attach its subscriptions and event handlers
      controller.hook();
    });
  }

  /**
   * Unhooks all registered controllers to clean up their subscriptions and event handlers.
   */
  unhookControllers(): void {
    // For each controller
    this.allControllers.forEach((controller) => {
      // Unhook the controller to clean up its subscriptions and event handlers
      controller.unhook();
    });
  }
}
