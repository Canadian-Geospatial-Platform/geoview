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
export declare class ControllerRegistry {
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
    readonly allControllers: AbstractController[];
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
    constructor(mapViewer: MapViewer, uiDomain: UIDomain, layerDomain: LayerDomain, geometryApi: GeometryApi, featureHighlight: FeatureHighlight);
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