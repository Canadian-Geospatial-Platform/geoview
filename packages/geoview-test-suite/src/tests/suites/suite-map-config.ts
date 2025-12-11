import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { MapConfigTester } from '../testers/map-config-tester';

/**
 * The GeoView Test Suite for Map Configuration.
 */
export class GVTestSuiteMapConfig extends GVAbstractTestSuite {
  /** The Map Config Tester used in this Test Suite */
  #mapConfigTester: MapConfigTester;

  /**
   * Constructs the Test Suite
   * @param {API} api - The shared api
   * @param {MapViewer} mapViewer - The map viewer
   */
  constructor(api: API, mapViewer: MapViewer) {
    super(api, mapViewer);

    // Create the Map Config tester
    this.#mapConfigTester = new MapConfigTester(api, mapViewer);
    this.addTester(this.#mapConfigTester);
  }

  /**
   * Returns the name of the Test Suite.
   * @returns {string} The name of the Test Suite.
   */
  override getName(): string {
    return 'Map Config Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   * @returns {string} The description of the Test Suite.
   */
  override getDescriptionAsHtml(): string {
    return 'Test Suite to perform various map configuration related tests';
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   * @returns {Promise<unknown>} A Promise which resolves when tests are completed.
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test data table pre-loaded in footer bar
    const pDataTableInFooterBar = this.#mapConfigTester.testDataTableSelectedTabFooterBar();
    await pDataTableInFooterBar;

    // Test data table pre-loaded in app bar
    const pDataTableInAppBar = this.#mapConfigTester.testDataTableSelectedTabAppBar();
    await pDataTableInAppBar;

    // Test no footerBar/appBar config has defaults
    const pNoFooterBarAppBarDefaults = this.#mapConfigTester.testNoFooterBarAppBarConfigHasDefaults();
    await pNoFooterBarAppBarDefaults;

    // Test empty footerBar/appBar tabs has no footer or app bar
    const pEmptyFooterBarAppBar = this.#mapConfigTester.testEmptyFooterBarAppBarTabsHasNoFooter();
    await pEmptyFooterBarAppBar;

    // Test initial view with layerIds sets extent
    const pInitialViewLayerIds = this.#mapConfigTester.testInitialViewLayerIdsSetExtent();
    await pInitialViewLayerIds;

    // Resolve when all
    return Promise.all([
      pDataTableInFooterBar,
      pDataTableInAppBar,
      pNoFooterBarAppBarDefaults,
      pEmptyFooterBarAppBar,
      pInitialViewLayerIds,
    ]);
  }
}
