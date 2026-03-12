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

  /**
   * Constructs an {@link GVAbstractTestSuite} instance.
   *
   * @param api - The api, mainly used to retrieve the MapViewer
   * @param mapViewer - The map viewer
   */
  protected constructor(api: API, mapViewer: MapViewer) {
    super();

    // Keep attributes
    this.#api = api;
    this.#mapViewer = mapViewer;
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
    return this.getMapViewer().controllers;
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
