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
    // // GV START DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME
    // // Test DEBUG
    // const pDevTest0 = this.#mapTester.testNonQueryableLayerNotInDetails('geojsonLYR5/polygons.json', [-88, 52]);
    // const pDevTest1 = this.#mapTester.testLayerHoverableState('geojsonLYR5/polygons.json', [-88, 52]);

    // // Resolve when all
    // return Promise.all([pDevTest0, pDevTest1]);
    // // GV END DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME

    // Test the map state
    const pmapState = this.#mapTester.testInitialMapState();

    // Wait until this test finishes before starting manipulating the map
    await pmapState;

    // #region PROMISES SYNCH ZOOMING

    // Test the zoom
    const pZoom = this.#mapTester.testMapZoom(7, 1000);

    // Wait until the zoom finishes before continuing manipulating the map
    await pZoom;

    // Test projection switch and zoom to initial extent
    const pProjection = this.#mapTester.testSwitchProjectionAndExtent(3978, 3857, 1);

    // Wait until the projection switch finishes before continuing manipulating the map
    await pProjection;

    // Test geometry z-index, not awaiting on it, it can happen at the same time as the rest, even testDetailsLayerSelectionPersistence for example
    // TODO: CHECK - Confirm this assessment - No need to await on pZIndex test, keep testing the rest in parallel
    const pZIndex = this.#mapTester.testGeometryGroupZIndex();

    // Test zoom to extent
    const pZoomToExtent = this.#mapTester.testZoomToExtent();

    // Wait until the zoom finishes before continuing manipulating the map
    await pZoomToExtent;

    // Test zoom to coordinate
    const pZoomToCoordinate = this.#mapTester.testZoomToCoordinate();

    // Wait until the zoom finishes before continuing manipulating the map
    await pZoomToCoordinate;

    // #endregion PROMISES SYNCH ZOOMING

    // #region PROMISES SYNCH SELECTED TABS

    // Test footer bar select tab
    const pFooterBarSelectTab = this.#mapTester.testFooterBarSelectTab();

    // Wait until the selected tab test finishes before continuing manipulating the map
    await pFooterBarSelectTab;

    // Test app bar select tab
    const pAppBarSelectTab = this.#mapTester.testAppBarSelectTab();

    // Wait until the selected tab test finishes before continuing manipulating the map
    await pAppBarSelectTab;

    // Test footer bar create tab
    const pFooterBarCreateTab = this.#mapTester.testFooterBarCreateTab();

    // Wait until the selected tab test finishes before continuing manipulating the map
    await pFooterBarCreateTab;

    // #endregion PROMISES SYNCH SELECTED TABS

    // Test set language
    const pSetLanguage = this.#mapTester.testSetLanguage();

    // Wait until the selected language test finishes before continuing manipulating the map
    // TODO: CHECK - Confirm this assessment - Do we really need to wait for this test to finish before doing other tests?
    await pSetLanguage;

    // Test create and set basemap
    const pCreateAndSetBasemap = this.#mapTester.testCreateAndSetBasemap();

    // Wait until the basemap change finishes before continuing manipulating the map
    // TODO: CHECK - Confirm this assessment - Do we really need to wait for this test to finish before doing other tests?
    await pCreateAndSetBasemap;

    // Test north arrow rotation in LCC projection for BC
    const pNorthArrowRotationLCC = this.#mapTester.testNorthArrowRotationLCC();

    // Wait until the north arrow rotation finishes, because there are zooms and projection changes happening in that test
    await pNorthArrowRotationLCC;

    // #region PROMISES SYNCH HOVERABLE/QUERYABLE

    // Test non-queryable layer not in details
    const pNonQueryableLayerNotInDetails = this.#mapTester.testNonQueryableLayerNotInDetails('geojsonLYR5/polygons.json', [-88, 52]);

    // Test layer hoverable state
    const pLayerHoverableState = this.#mapTester.testLayerHoverableState('geojsonLYR5/polygons.json', [-88, 52]);

    // Wait on all the tests of queryable/hoverable before continuing manipulating the map, those all happen in parallel
    await Promise.all([pNonQueryableLayerNotInDetails, pLayerHoverableState]);

    // #endregion PROMISES SYNCH HOVERABLE/QUERYABLE

    // Test details layer selection persistence, this test manipulates the map state too much as should run independently
    const pDetailsLayerSelectionPersistence = this.#mapTester.testDetailsLayerSelectionPersistence();

    // Wait on details layer selection persistence which manipulates the map state a lot and should run independently
    await pDetailsLayerSelectionPersistence;

    // Resolve when all
    return Promise.all([
      pmapState,
      pZoom,
      pProjection,
      pZIndex,
      pZoomToExtent,
      pZoomToCoordinate,
      pFooterBarSelectTab,
      pAppBarSelectTab,
      pFooterBarCreateTab,
      pSetLanguage,
      pCreateAndSetBasemap,
      pNorthArrowRotationLCC,
      pNonQueryableLayerNotInDetails,
      pLayerHoverableState,
      pDetailsLayerSelectionPersistence,
    ]);
  }
}
