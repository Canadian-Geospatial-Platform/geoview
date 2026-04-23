import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { CoreTester } from '../testers/core-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteCore extends GVAbstractTestSuite {
  /** The Tester used in this Test Suite */
  #coreTester: CoreTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the Geochart tester
    this.#coreTester = new CoreTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#coreTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Core Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return 'Test Suite to perform various Core Framework related tests.';
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override onLaunchTestSuite(): Promise<unknown> {
    // Test Dates
    const pDatesEpoch = this.#coreTester.testDatesEpochTimestamps();
    const pDatesUSStandard = this.#coreTester.testDatesUSStandard();
    const pDatesCustomFormat = this.#coreTester.testDatesSpecialFormats();

    // Test validateAndPingUrl
    const pPingValidReachable = this.#coreTester.testValidateAndPingUrlValidReachable();
    const pPingInvalidFormat = this.#coreTester.testValidateAndPingUrlInvalidFormat();
    const pPingUnreachable = this.#coreTester.testValidateAndPingUrlUnreachable();
    const pPingWmsService = this.#coreTester.testValidateAndPingUrlWmsService();
    const pGeometryCollectionLegendStyles = this.#coreTester.testGeometryCollectionLegendStyles();

    // Resolve when all
    return Promise.all([
      pDatesEpoch,
      pDatesUSStandard,
      pDatesCustomFormat,
      pPingValidReachable,
      pPingInvalidFormat,
      pPingUnreachable,
      pPingWmsService,
      pGeometryCollectionLegendStyles,
    ]);
  }
}
