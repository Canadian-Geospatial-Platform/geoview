import type { UIDomain } from '@/core/domains/ui-domain';
import type { LayerDomain } from '@/core/domains/layer-domain';
import { UIController } from './ui-controller';
import { LayerController } from './layer-controller';
import { DrawerController } from './drawer-controller';
import type { MapViewer } from '@/geo/map/map-viewer';
import { getGeoViewStore, hasDrawerPlugin } from '../stores/stores-managers';
import type { AbstractController } from './base/abstract-controller';

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

  /** The layer controller used to interact with map layers. */
  readonly layerController: LayerController;

  /** The drawer controller used to interact with the drawer. Only present when the drawer plugin is configured. */
  readonly drawerController?: DrawerController;

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
    this.uiController = new UIController(mapViewer, uiDomain);
    this.layerController = new LayerController(mapViewer, layerDomain);

    // If the drawer plugin is preset (we know via the store)
    if (hasDrawerPlugin(getGeoViewStore(mapViewer.mapId))) {
      // Create the drawer controller only if the drawer plugin is present, as it relies on the drawer state which is part of that plugin
      this.drawerController = new DrawerController(mapViewer, uiDomain);
    }

    // Add all controllers to the registry
    this.allControllers.push(this.uiController, this.layerController);
    if (this.drawerController) this.allControllers.push(this.drawerController);
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
