import type { MapViewer } from '@/geo/map/map-viewer';
import { AbstractController } from './abstract-controller';
import type { ControllerRegistry } from '@/core/controllers/base/controller-registry';

/**
 * Base class for controllers that operate on a specific map instance.
 *
 * Extends `AbstractController` with convenient access to the `MapViewer`,
 * the map identifier, and the `ControllerRegistry` for cross-controller
 * communication.
 */
export class AbstractMapViewerController extends AbstractController {
  /** The map viewer instance associated with this controller */
  #mapViewer: MapViewer;

  /**
   * Creates an instance of AbstractMapViewerController.
   *
   * @param mapViewer - The map viewer instance to associate with this controller
   */
  constructor(mapViewer: MapViewer) {
    super();
    this.#mapViewer = mapViewer;
  }

  /**
   * Gets the map viewer instance.
   *
   * @returns The map viewer associated with this controller
   */
  getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  /**
   * Gets the map identifier.
   *
   * @returns The unique identifier of the map
   */
  getMapId(): string {
    return this.#mapViewer.mapId;
  }

  /**
   * Gets the controller registry for accessing sibling controllers.
   *
   * @returns The controller registry owned by the map viewer
   */
  getControllersRegistry(): ControllerRegistry {
    return this.getMapViewer().controllers;
  }
}
