import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { TestSuiteCannotExecuteError } from '../core/exceptions';
import { GVAbstractTester } from '../testers/abstract-gv-tester';
import { GeochartTester } from '../testers/geochart-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteGeochart extends GVAbstractTestSuite {
  /** The Geochart Tester used in this Test Suite */
  #geochartTester: GeochartTester;

  /**
   * Constructs the Test Suite
   * @param {API} api - The shared api
   * @param {MapViewer} mapViewer - The map viewer
   */
  constructor(api: API, mapViewer: MapViewer) {
    super('TestSuiteGeochart', api, mapViewer);

    // Create the Geochart tester
    this.#geochartTester = new GeochartTester(api, mapViewer);
    this.addTester(this.#geochartTester);
  }
  /**
   * Overrides the check if the Test Suite can be executed.
   * @returns {Promise<boolean>} A Promise resolving to true when the Test Suite can be launched for the given map.
   */
  protected override onCanExecuteTestSuite(): Promise<boolean> {
    // Check if the geochart plugin is part of the corePackage on the testing map
    const plugins = this.getMapViewer().mapFeaturesConfig.footerBar?.tabs?.core || [];
    if (!plugins.includes('geochart'))
      throw new TestSuiteCannotExecuteError(
        'To run this Test Suite, the geochart plugin has to be loaded in the footerBar tabs core array.'
      );

    // All good
    return Promise.resolve(true);
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   * @returns {Promise<unknown>} A Promise which resolves when tests are completed.
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test Geochart
    const pGeochartPolygons = this.#geochartTester.testGeochartOpenForLayerMapClick(
      'geojsonLYR5/polygons.json',
      GVAbstractTester.MANITOBA_CENTER_LONLAT
    );

    // Wait for the test with polygons to complete
    await pGeochartPolygons;

    // Test Geochart
    const pGeochartAirborne = this.#geochartTester.testAddGeocoreLayerUUIDForGeochartAirborne();

    // Resolve when all
    return Promise.all([pGeochartPolygons, pGeochartAirborne]);
  }
}
