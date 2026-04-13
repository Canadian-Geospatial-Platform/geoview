import type { AbstractController } from '@/core/controllers/base/abstract-controller';
import { UIController } from '@/core/controllers/ui-controller';
import { MapController } from '@/core/controllers/map-controller';
import { LayerController } from '@/core/controllers/layer-controller';
import { LayerCreatorController } from '@/core/controllers/layer-creator-controller';
import { LayerSetController } from '@/core/controllers/layer-set-controller';
import { DrawerController } from '@/core/controllers/drawer-controller';
import { DetailsController } from '@/core/controllers/details-controller';
import { DataTableController } from '@/core/controllers/data-table-controller';
import { PluginController } from '@/core/controllers/plugin-controller';
import { TimeSliderController } from '@/core/controllers/time-slider-controller';
import { SwiperController } from '@/core/controllers/swiper-controller';
import { GeoChartController } from '@/core/controllers/geochart-controller';
import type { UIDomain } from '@/core/domains/ui-domain';
import type { LayerDomain } from '@/core/domains/layer-domain';
import { getGeoViewStore, hasDrawerPlugin, hasGeoChartPlugin, hasSwiperPlugin, hasTimeSliderPlugin } from '@/core/stores/stores-managers';
import type { MapViewer } from '@/geo/map/map-viewer';

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

  /** The plugin controller used to interact with plugins. */
  readonly pluginController: PluginController;

  /** The details controller used to interact with the details panel. */
  readonly detailsController: DetailsController;

  /** The data table controller used to interact with the data table. */
  readonly dataTableController: DataTableController;

  /** The swiper controller used to interact with the swiper functionality. Only present when the swiper plugin is configured. */
  readonly swiperController?: SwiperController;

  /** The drawer controller used to interact with the drawer. Only present when the drawer plugin is configured. */
  readonly drawerController?: DrawerController;

  /** The time slider controller used to interact with the time slider. Only present when the time slider plugin is configured. */
  readonly timeSliderController?: TimeSliderController;

  /** The geo chart controller used to interact with the geo chart panel. Only present when the geo chart plugin is configured. */
  readonly geoChartController?: GeoChartController;

  /** The layer set controller used to manage the layer sets. */
  readonly layerSetController: LayerSetController;

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
   */
  constructor(mapViewer: MapViewer, uiDomain: UIDomain, layerDomain: LayerDomain) {
    this.uiController = new UIController(mapViewer, this, uiDomain);
    this.mapController = new MapController(mapViewer, this);
    this.layerController = new LayerController(mapViewer, this, layerDomain);
    this.layerCreatorController = new LayerCreatorController(mapViewer, this, layerDomain);
    this.pluginController = new PluginController(mapViewer, this);
    this.detailsController = new DetailsController(mapViewer, this);
    this.dataTableController = new DataTableController(mapViewer, this);
    this.layerSetController = new LayerSetController(mapViewer, this, layerDomain);

    // If the swiper plugin is present (we know via the store)
    if (hasSwiperPlugin(getGeoViewStore(mapViewer.mapId))) {
      // Create the swiper controller only if the swiper plugin is present, as it relies on the swiper state which is part of that plugin
      this.swiperController = new SwiperController(mapViewer, this);
    }

    // If the drawer plugin is preset (we know via the store)
    if (hasDrawerPlugin(getGeoViewStore(mapViewer.mapId))) {
      // Create the drawer controller only if the drawer plugin is present, as it relies on the drawer state which is part of that plugin
      this.drawerController = new DrawerController(mapViewer, this, uiDomain);
    }

    // If the time slider plugin is present (we know via the store)
    if (hasTimeSliderPlugin(getGeoViewStore(mapViewer.mapId))) {
      // Create the time slider controller only if the time slider plugin is present, as it relies on the time slider state which is part of that plugin
      this.timeSliderController = new TimeSliderController(mapViewer, this);
    }

    // If the geo chart plugin is present (we know via the store)
    if (hasGeoChartPlugin(getGeoViewStore(mapViewer.mapId))) {
      // Create the geo chart controller only if the geo chart plugin is present, as it relies on the geo chart state which is part of that plugin
      this.geoChartController = new GeoChartController(mapViewer, this);
    }

    // Add all controllers to the registry
    this.allControllers.push(
      this.uiController,
      this.mapController,
      this.detailsController,
      this.layerController,
      this.layerCreatorController,
      this.layerSetController,
      this.pluginController
    );
    if (this.swiperController) this.allControllers.push(this.swiperController);
    if (this.drawerController) this.allControllers.push(this.drawerController);
    if (this.timeSliderController) this.allControllers.push(this.timeSliderController);
    if (this.geoChartController) this.allControllers.push(this.geoChartController);
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
