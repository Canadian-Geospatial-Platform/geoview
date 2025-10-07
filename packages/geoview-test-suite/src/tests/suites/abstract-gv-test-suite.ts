import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { AbstractTestSuite } from '../core/abstract-test-suite';

/**
 * Main GeoView Abstract Suite class.
 */
export abstract class GVAbstractTestSuite extends AbstractTestSuite {
  /** The api */
  #api: API;

  /** The MapViewer */
  #mapViewer: MapViewer;

  /**
   * Constructs an {@link GVAbstractTestSuite} instance.
   * @param {API} api - The api, mainly used to retrieve the MapViewer.
   * @param {string} mapViewer - The map viewer.
   */
  protected constructor(name: string, api: API, mapViewer: MapViewer) {
    super(name);

    // Keep attributes
    this.#api = api;
    this.#mapViewer = mapViewer;
  }

  /**
   * Gets the shared api.
   */
  getApi(): API {
    return this.#api;
  }

  /**
   * Gets the MapViewer.
   */
  getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  /**
   * Gets the Map Id.
   */
  getMapId(): string {
    return this.#mapViewer.mapId;
  }
}
