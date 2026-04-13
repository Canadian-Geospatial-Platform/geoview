import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { TestSuiteCannotExecuteError } from '../core/exceptions';
import { GVAbstractTester } from '../testers/abstract-gv-tester';
import { GeochartTester } from '../testers/geochart-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteGeochart extends GVAbstractTestSuite {
  /** The Geochart Tester used in this Test Suite */
  #geochartTester: GeochartTester;

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
    this.#geochartTester = new GeochartTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#geochartTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Geochart Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return 'Test Suite to perform various Geochart related tests.';
  }

  /**
   * Overrides the check if the Test Suite can be executed.
   *
   * @returns A promise that resolves to true when the Test Suite can be launched for the given map
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
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test Geochart
    const pGeochartPolygons = this.#geochartTester.testGeochartOpenForLayerMapClick(
      'geojsonLYR5/polygons.json',
      GVAbstractTester.ONTARIO_CENTER_LONLAT
    );

    // Wait for the test with polygons to complete
    await pGeochartPolygons;

    // Test Geochart
    const pGeochartAirborne = this.#geochartTester.testAddGeocoreLayerUUIDForGeochartAirborne();

    // Resolve when all
    return Promise.all([pGeochartPolygons, pGeochartAirborne]);
  }
}
