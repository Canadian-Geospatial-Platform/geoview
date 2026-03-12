import type { MapViewer } from '@/geo/map/map-viewer';
import { AbstractController } from './abstract-controller';

export class AbstractMapViewerController extends AbstractController {
  /** Holds the map viewer used by this controller */
  #mapViewer: MapViewer;

  constructor(mapViewer: MapViewer) {
    super();
    this.#mapViewer = mapViewer;
  }

  getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  getMapId(): string {
    return this.#mapViewer.mapId;
  }
}
