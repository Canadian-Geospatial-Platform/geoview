import { TestConstants } from '../testers/constants';
import { AbstractTestSuite } from '../core/abstract-test-suite';
import type { GVAbstractTester } from '../testers/abstract-gv-tester';
import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

/**
 * Main GeoView Abstract Suite class.
 */
export abstract class GVAbstractTestSuite extends AbstractTestSuite<GVAbstractTester> {
  /** The api */
  #api: API;

  /** The MapViewer */
  #mapViewer: MapViewer;

  /** The controller registry for the map viewer */
  #controllerRegistry: ControllerRegistry;

  /**
   * Constructs an {@link GVAbstractTestSuite} instance.
   *
   * @param api - The api, mainly used to retrieve the MapViewer
   * @param mapViewer - The map viewer
   */
  protected constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super();

    // Keep attributes
    this.#api = api;
    this.#mapViewer = mapViewer;
    this.#controllerRegistry = controllerRegistry;
  }

  // #region OVERRIDES

  /**
   * Overrides preparation to force a synchronous OL render before tests execute.
   *
   * This ensures `frameState_` is populated so that `getPixelFromCoordinate` works
   * correctly even when the map is in a hidden tab.
   *
   * @returns A promise that resolves when the render is complete
   */
  protected override async onPrepareLaunchTestSuite(): Promise<void> {
    // Call parent
    await super.onPrepareLaunchTestSuite();

    // Force a synchronous render so OL populates frameState_ (required for getPixelFromCoordinate to work in hidden tabs)
    return this.getMapViewer().waitForRender();
  }

  // #endregion OVERRIDES

  // #region METHODS

  /**
   * Gets the shared api.
   *
   * @returns The api
   */
  getApi(): API {
    return this.#api;
  }

  /**
   * Gets the MapViewer assigned for the current suite execution.
   *
   * @returns The map viewer
   */
  getMapViewer(): MapViewer {
    return this.#mapViewer;
  }

  /**
   * Gets the Map Id.
   *
   * @returns The map id
   */
  getMapId(): string {
    return this.getMapViewer().mapId;
  }

  /**
   * Gets the controller registry for the map viewer.
   *
   * @returns The controller registry
   */
  getControllersRegistry(): ControllerRegistry {
    return this.#controllerRegistry;
  }

  /**
   * Restores the current map's initial extent using the shared test zoom-animation setting.
   *
   * @returns A promise that resolves when the zoom completes
   */
  zoomToInitialExtent(): Promise<void> {
    this.addStep('Zooming back to initial extent before continuing the tests...');
    return this.getControllersRegistry().mapController.zoomToInitialExtent(TestConstants.USE_ZOOM_ANIMATION);
  }

  // #endregion METHODS
}
