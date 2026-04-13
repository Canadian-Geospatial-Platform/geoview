import { AbstractTestSuite } from '../core/abstract-test-suite';
import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

/**
 * Main GeoView Abstract Suite class.
 */
export abstract class GVAbstractTestSuite extends AbstractTestSuite {
  /** The api */
  #api: API;

  /** The MapViewer */
  #mapViewer: MapViewer;

  /** The ControllerRegistry */
  #controllerRegistry: ControllerRegistry;

  /**
   * Constructs an {@link GVAbstractTestSuite} instance.
   *
   * @param api - The api, mainly used to retrieve the MapViewer
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry, used to pass to testers that need it
   */
  protected constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super();

    // Keep attributes
    this.#api = api;
    this.#mapViewer = mapViewer;
    this.#controllerRegistry = controllerRegistry;
  }

  /**
   * Gets the shared api.
   *
   * @returns The api
   */
  getApi(): API {
    return this.#api;
  }

  /**
   * Gets the MapViewer.
   *
   * @returns The map viewer
   */
  getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  /**
   * Gets the controllers registry.
   *
   * @returns The controllers registry
   */
  getControllersRegistry(): ControllerRegistry {
    return this.#controllerRegistry;
  }

  /**
   * Gets the Map Id.
   *
   * @returns The map id
   */
  getMapId(): string {
    return this.#mapViewer.mapId;
  }
}
