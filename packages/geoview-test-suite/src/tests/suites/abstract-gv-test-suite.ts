import { AbstractTestSuite } from '../core/abstract-test-suite';
import { TestSuiteRunningError } from '../core/exceptions';
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

  /** GeoView testers sharing the suite's current viewer and controllers. */
  #gvTesters: GVAbstractTester[] = [];

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
   * Registers GeoView testers for explicit synchronization when one of them replaces the shared map.
   *
   * @param tester - The tester to initialize
   */
  override addTester(tester: GVAbstractTester): void {
    super.addTester(tester);
    this.#gvTesters.push(tester);
    tester.onMapReplaced((_sender, event) => this.#assignMapViewerAndControllers(event.mapViewer));
  }

  /**
   * Binds the API's current map before eligibility checks, preparation, or test execution.
   *
   * @returns The suite's launch result
   * @throws {TestSuiteRunningError} When tests are already running
   */
  override launchTestSuite(): Promise<unknown> {
    if (this.getSuiteStatus() === 'running' || this.getTestsRunning() > 0)
      throw new TestSuiteRunningError('The Test Suite is already running, please wait to prevent errors.');
    this.#assignMapViewerAndControllers(this.#api.getMapViewer(this.#mapViewer.mapId));
    return super.launchTestSuite();
  }

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
   * Assigns the current viewer and controllers to the suite and every registered GeoView tester.
   *
   * @param mapViewer - The viewer resolved at launch or created by a tester
   */
  #assignMapViewerAndControllers(mapViewer: MapViewer): void {
    this.#mapViewer = mapViewer;
    this.#controllerRegistry = mapViewer.controllers;
    this.#gvTesters.forEach((tester) => tester.assignMapViewerAndControllers(mapViewer));
  }

  // #endregion METHODS
}
