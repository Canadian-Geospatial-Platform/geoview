import { AbstractMapViewerController } from '@/core/controllers/base/abstract-map-viewer-controller';
import { useControllers } from '@/core/controllers/controller-manager';
import { DEFAULT_TEXT_VALUES } from '@/core/stores/store-interface-and-intial-values/drawer-state';
import type { LanguageChangedDelegate, UIDomain } from '@/core/domains/ui-domain';
import { DrawerEventProcessor } from '@/api/event-processors/event-processor-children/drawer-event-processor';
import type { MapViewer } from '@/geo/map/map-viewer';
import { getGeoViewStore } from '../stores';

/**
 * Controller responsible for drawer interactions, keyboard shortcuts, and
 * bridging the drawer state with the UI domain and map projection changes.
 */
export class DrawerController extends AbstractMapViewerController {
  /** Keyboard event handlers for each map keyed by map id. */
  static #keyboardHandlers: Map<string, (event: KeyboardEvent) => void> = new Map();

  /** The UI Domain instance associated with this controller. */
  #uiDomain: UIDomain;

  /** The language changed event hook. */
  #hookLanguageChanged?: LanguageChangedDelegate;

  /** The store subscription callback to unsubscribe from projection changes. */
  #hookProjectionSubscription?: () => void;

  /** The Drawer State Adaptor used to interact with the drawer state store */
  // TODO: STATE-ADAPTOR - TO BE IMPLEMENTED
  // #drawerStateAdaptor: DrawerStateAdaptor;

  /**
   * Creates an instance of DrawerController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   * @param uiDomain - The UI domain instance to associate with this controller
   */
  constructor(mapViewer: MapViewer, uiDomain: UIDomain) {
    super(mapViewer);

    // Keep a reference on the UI domain
    this.#uiDomain = uiDomain;

    // Keep the state adaptor internally
    // TODO: STATE-ADAPTOR - TO BE IMPLEMENTED
    // this.#drawerStateAdaptor = new DrawerStateAdaptor(mapViewer.mapId);
    // logger.logDebug(this.#drawerStateAdaptor);
  }

  /**
   * Hooks keyboard handlers, language change listeners, and projection subscriptions.
   */
  protected override onHook(): void {
    // Setup the keyboard handlers for undo/redo
    DrawerController.#hookKeyboardHandlers(this.getMapId());

    // Listens when the language is changed in the UI domain and process actions accordingly
    this.#hookLanguageChanged = this.#uiDomain.onLanguageChanged((sender, event) => {
      // Update all measurement tooltips when language changes
      DrawerEventProcessor.updateMeasurementTooltips(this.getMapId(), event.language);

      // Update Default Text when language changes
      DrawerEventProcessor.setTextValue(this.getMapId(), DEFAULT_TEXT_VALUES[event.language]);
    });

    // Subscribe to projection changes
    // TODO: REFACTOR - Change this to listen on the domain event instead of the store state, because we are doing application-domain work with this subscribe.
    this.#hookProjectionSubscription = getGeoViewStore(this.getMapId()).subscribe(
      (state) => state.mapState.currentProjection,
      (currentProjection, previousProjection) => {
        DrawerEventProcessor.handleMapReprojection(
          this.getMapId(),
          currentProjection,
          previousProjection,
          this.getMapViewer().getDisplayLanguage()
        );
      }
    );
  }

  /**
   * Unhooks all event listeners and subscriptions registered in `onHook`.
   */
  protected override onUnhook(): void {
    // Unsubscribe from language changes
    if (this.#hookLanguageChanged) {
      this.#uiDomain.offLanguageChanged(this.#hookLanguageChanged);
      this.#hookLanguageChanged = undefined;
    }

    // Unsubscribe from projection changes
    if (this.#hookProjectionSubscription) {
      this.#hookProjectionSubscription();
      this.#hookProjectionSubscription = undefined;
    }

    // Remove keyboard handler
    const handler = DrawerController.#keyboardHandlers.get(this.getMapId());
    if (handler) {
      document.removeEventListener('keydown', handler);
      DrawerController.#keyboardHandlers.delete(this.getMapId());
    }
  }

  /**
   * Sets up keyboard event handling for undo (Ctrl+Z) and redo (Ctrl+Shift+Z / Ctrl+Y).
   *
   * @param mapId - The map identifier
   */
  static #hookKeyboardHandlers(mapId: string): void {
    if (this.#keyboardHandlers.has(mapId)) return;

    const handler = (event: KeyboardEvent): void => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key.toLowerCase()) {
          case 'z':
            if (event.shiftKey) {
              if (DrawerEventProcessor.redo(mapId)) event.preventDefault();
            } else if (DrawerEventProcessor.undo(mapId)) {
              event.preventDefault();
            }
            break;
          case 'y':
            if (DrawerEventProcessor.redo(mapId)) event.preventDefault();
            break;
          default:
            break;
        }
      }
    };

    this.#keyboardHandlers.set(mapId, handler);
    document.addEventListener('keydown', handler);
  }
}

/**
 * Hook to access the DrawerController from the controller context.
 *
 * @returns The drawer controller instance
 * @throws {Error} When used outside of a ControllerContext.Provider.
 * @throws {Error} When the Drawer plugin is not configured.
 */
export function useDrawerController(): DrawerController {
  const controller = useControllers().drawerController;
  if (!controller) throw new Error('useDrawerController must be used with an initialized drawer plugin state');
  return controller;
}
