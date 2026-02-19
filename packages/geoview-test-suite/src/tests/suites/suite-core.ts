import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { CoreTester } from '../testers/core-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteCore extends GVAbstractTestSuite {
  /** The Tester used in this Test Suite */
  #coreTester: CoreTester;

  /**
   * Constructs the Test Suite
   * @param {API} api - The shared api
   * @param {MapViewer} mapViewer - The map viewer
   */
  constructor(api: API, mapViewer: MapViewer) {
    super(api, mapViewer);

    // Create the Geochart tester
    this.#coreTester = new CoreTester(api, mapViewer);
    this.addTester(this.#coreTester);
  }

  /**
   * Returns the name of the Test Suite.
   * @returns {string} The name of the Test Suite.
   */
  override getName(): string {
    return 'Core Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   * @returns {string} The description of the Test Suite.
   */
  override getDescriptionAsHtml(): string {
    return 'Test Suite to perform various Core Framework related tests.';
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   * @returns {Promise<unknown>} A Promise which resolves when tests are completed.
   * @override
   * @protected
   */
  protected override onLaunchTestSuite(): Promise<unknown> {
    // Test Dates
    const pDatesEpoch = this.#coreTester.testDatesEpochTimestamps();
    const pDatesUSStandard = this.#coreTester.testDatesUSStandard();
    const pDatesCustomFormat = this.#coreTester.testDatesSpecialFormats();

    // Resolve when all
    return Promise.all([pDatesEpoch, pDatesUSStandard, pDatesCustomFormat]);
  }
}
