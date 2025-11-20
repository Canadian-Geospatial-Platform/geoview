import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { MapTester } from '../testers/map-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteMapVaria extends GVAbstractTestSuite {
  /** The Map Tester used in this Test Suite */
  #mapTester: MapTester;

  /**
   * Constructs the Test Suite
   * @param {API} api - The shared api
   * @param {MapViewer} mapViewer - The map viewer
   */
  constructor(api: API, mapViewer: MapViewer) {
    super(api, mapViewer);

    // Create the Map tester
    this.#mapTester = new MapTester(api, mapViewer);
    this.addTester(this.#mapTester);
  }

  /**
   * Returns the name of the Test Suite.
   * @returns {string} The name of the Test Suite.
   */
  override getName(): string {
    return 'Map Varia Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   * @returns {string} The description of the Test Suite.
   */
  override getDescriptionAsHtml(): string {
    return 'Test Suite to perform various map related tests.';
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   * @returns {Promise<unknown>} A Promise which resolves when tests are completed.
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test the map state
    const pmapState = this.#mapTester.testMapState();

    // Test the zoom
    const pZoom = this.#mapTester.testMapZoom(7, 1000);
    await pZoom;

    // Test projection switch and zoom to initial extent
    const pProjection = this.#mapTester.testSwitchProjectionAndExtent(3978, 3857, 1);

    // Resolve when all
    return Promise.all([pmapState, pZoom, pProjection]);
  }
}
