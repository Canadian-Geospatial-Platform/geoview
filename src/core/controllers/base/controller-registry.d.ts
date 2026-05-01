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
import type { MapViewer } from '@/geo/map/map-viewer';
/**
 * Central registry that owns and provides access to all framework-level controllers.
 *
 * Created once by MapViewer and exposed to React via ControllerContext.
 * Individual controllers can be accessed through typed getters or the
 * `useUIController()` / `useLayerController()` hooks.
 */
export declare class ControllerRegistry {
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
    readonly allControllers: AbstractController[];
    /**
     * Creates a new ControllerRegistry and instantiates all framework-level controllers.
     *
     * The drawer controller is only created when the drawer plugin is present in the store.
     *
     * @param mapViewer - The map viewer instance
     * @param uiDomain - The UI domain instance
     * @param layerDomain - The layer domain instance
     */
    constructor(mapViewer: MapViewer, uiDomain: UIDomain, layerDomain: LayerDomain);
    /**
     * Hooks all registered controllers to attach their subscriptions and event handlers.
     */
    hookControllers(): void;
    /**
     * Unhooks all registered controllers to clean up their subscriptions and event handlers.
     */
    unhookControllers(): void;
}
//# sourceMappingURL=controller-registry.d.ts.map