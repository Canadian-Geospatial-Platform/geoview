import type { MapViewer } from '@/geo/map/map-viewer';
import { AbstractController } from './abstract-controller';
import type { ControllerRegistry } from '@/core/controllers/controller-registry';

export class AbstractMapViewerController extends AbstractController {
  /** Holds the map viewer used by this controller */
  #mapViewer: MapViewer;

  constructor(mapViewer: MapViewer) {
    super();
    this.#mapViewer = mapViewer;
  }

  protected getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  protected getMapId(): string {
    return this.#mapViewer.mapId;
  }

  protected getControllersRegistry(): ControllerRegistry {
    return this.getMapViewer().controllers;
  }
}
