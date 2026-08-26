import type { API } from 'geoview-core/api/api';
import { MapTester } from '../testers/map-tester';
import { GVAbstractTester } from '../testers/abstract-gv-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteMapVaria extends GVAbstractTestSuite {
  /** The Map Tester used in this Test Suite */
  #mapTester: MapTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the Map tester
    this.#mapTester = new MapTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#mapTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Map Varia Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests map interactions, projection, basemap, and UI tabs:<br/>
      <b>Map state</b> — Initial state verification, zoom operations, extent/coordinate navigation<br/>
      <b>Projection</b> — Switch between EPSG:3978 and EPSG:3857, vector tile warning<br/>
      <b>Basemap</b> — Runtime basemap creation and activation<br/>
      <b>North arrow</b> — Rotation computation under LCC projection<br/>
      <b>UI tabs</b> — Footer bar select/create tab, app bar select tab<br/>
      <b>Language</b> — Runtime language switch<br/>
      <b>Layers</b> — Non-queryable exclusion from details, hoverable state, geometry group z-index<br/>
      <b>Details</b> — Layer selection persistence across tab switches`;
  }

  /**
   * Overrides the debug hook for running a subset of tests during development.
   *
   * GV DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME
   *
   * @returns A promise that resolves when the debug tests are completed
   */
  protected override onLaunchTestSuiteDEBUG(): Promise<unknown> {
    return Promise.resolve();
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // #region STATE CHECK

    // Test the map state
    const pmapState = this.#mapTester.testInitialMapState();

    // Wait until this test finishes before starting manipulating the map
    await pmapState;

    // #endregion STATE CHECK

    // #region PROMISES SYNCH ZOOMING

    // Test the zoom
    const pZoom = this.#mapTester.testMapZoom(7);

    // Wait until the zoom finishes before continuing manipulating the map
    await pZoom;

    // Test projection switch and zoom to initial extent
    const pProjection = this.#mapTester.testSwitchProjectionAndExtent(3978, 3857, 1);

    // Wait until the projection switch finishes before continuing manipulating the map
    await pProjection;

    // Test zoom to extent. The expected extent reflects the corrected fixed-height map shell after collapsed footer sizing is applied.
    const pZoomToExtent = this.#mapTester.testZoomToExtent([-87, 51, -84, 53], [-88, 50, -82, 53]);

    // Wait until the zoom finishes before continuing manipulating the map
    await pZoomToExtent;

    // Test zoom to coordinate
    const pZoomToCoordinate = this.#mapTester.testZoomToCoordinate([-80, 50]);

    // Wait until the zoom finishes before continuing manipulating the map
    await pZoomToCoordinate;

    // Test create and set basemap
    const pCreateAndSetBasemap = this.#mapTester.testCreateAndSetBasemap();

    // Wait until the basemap change finishes before continuing manipulating the map
    await pCreateAndSetBasemap;

    // Test north arrow rotation in LCC projection for BC
    const pNorthArrowRotationLCC = this.#mapTester.testNorthArrowRotationLCC();

    // Wait until the north arrow rotation finishes, because there are zooms and projection changes happening in that test
    await pNorthArrowRotationLCC;

    // Test vector tile projection warning
    const pVectorTileProjectionWarning = this.#mapTester.testVectorTileProjectionWarning();

    // Wait until the VT projection warning test finishes before continuing manipulating the map
    await pVectorTileProjectionWarning;

    // Make sure the map is reset in its initial extent after the zooms
    await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

    // #endregion PROMISES SYNCH ZOOMING

    // #region PROMISES SYNCH SELECTED TABS

    // Test geometry z-index, not awaiting on it, it can happen at the same time as the rest, even testDetailsLayerSelectionPersistence for example
    const pZIndex = this.#mapTester.testGeometryGroupZIndex();

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

    // #region PROMISES SYNCH HOVERABLE/QUERYABLE

    // Test set language
    const pSetLanguage = this.#mapTester.testSetLanguage();

    // Make sure the map is in its initial extent
    await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

    // Test non-queryable layer not in details
    const pNonQueryableLayerNotInDetails = this.#mapTester.testNonQueryableLayerNotInDetails('geojsonLYR5/polygons.json', [-88, 52]);

    // Test layer hoverable state
    const pLayerHoverableState = this.#mapTester.testLayerHoverableState('geojsonLYR5/polygons.json', [-88, 52]);

    // Wait on all the tests of queryable/hoverable before continuing manipulating the map, those all happen in parallel
    await Promise.all([pNonQueryableLayerNotInDetails, pLayerHoverableState]);

    // #endregion PROMISES SYNCH HOVERABLE/QUERYABLE

    // #region PROMISES DETAILS PANEL

    // Test details layer selection persistence, this test manipulates the map state too much as should run independently
    const pDetailsLayerSelectionPersistence = this.#mapTester.testDetailsLayerSelectionPersistence(
      'geojsonLYR5/polygons.json',
      'esriFeatureLYR5/0',
      [-87.4, 52.9],
      [-73.9, 46.5]
    );

    // Wait on details layer selection persistence which manipulates the map state a lot and should run independently
    await pDetailsLayerSelectionPersistence;

    // #endregion PROMISES DETAILS PANEL

    // Resolve when all
    return Promise.all([
      pmapState,
      pZoom,
      pProjection,
      pZoomToExtent,
      pZoomToCoordinate,
      pCreateAndSetBasemap,
      pNorthArrowRotationLCC,
      pZIndex,
      pFooterBarSelectTab,
      pAppBarSelectTab,
      pFooterBarCreateTab,
      pSetLanguage,
      pNonQueryableLayerNotInDetails,
      pLayerHoverableState,
      pDetailsLayerSelectionPersistence,
    ]);
  }
}
