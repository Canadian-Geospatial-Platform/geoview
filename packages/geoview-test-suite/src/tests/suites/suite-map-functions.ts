import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { MapTester } from '../testers/map-tester';
import { GVAbstractTester } from '../testers/abstract-gv-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteMapFunctions extends GVAbstractTestSuite {
  /** The Map Tester used in this Test Suite */
  #mapTester: MapTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry for the map viewer
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
    return 'Map Functions Test Suite';
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
      <b>Geometry</b> — Geometry group z-index updates<br/>
      <b>Fullscreen</b> — Restore the original view without interaction; preserve the current view after interaction<br/>
      <b>UI</b> — Details panel top anchor; footer-height getter for non-React consumers<br/>
      <b>Interaction</b> — Keyboard crosshair coordinates with padding, rotation and stale mouse positions<br/>
      <b>Page scrolling</b> — Partially visible, transitioning, already visible, and oversized map sections, run with exclusive page access`;
  }

  /**
   * Gets the number of active tests launched by the full suite.
   *
   * @returns The number of active full-suite tester calls, excluding debug-only calls
   */
  override getTestsTotalFinal(): number {
    return 24;
  }

  /**
   * Overrides the debug hook for running a subset of tests during development.
   *
   * GV DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME, search for DEBUG_RUN_ONLY_DEBUG_FUNCTION for the flag.
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
    // Test the map state
    await this.#mapTester.testInitialMapState();

    // Crosshair checks mutate padding, rotation, and pointer state; keep them sequential.
    await this.#mapTester.testCrosshairCoordinates();

    // Test the zoom
    await this.#mapTester.testMapZoom(7);

    // Test projection switch and zoom to initial extent
    await this.#mapTester.testSwitchProjectionAndExtent(3978, 3857, 1);

    // Test zoom to extent. The expected extent reflects the corrected fixed-height map shell after collapsed footer sizing is applied.
    await this.#mapTester.testZoomToExtent([-87, 51, -84, 53], [-88, 50, -82, 53]);

    // Test zoom to coordinate
    await this.#mapTester.testZoomToCoordinate([-80, 50]);

    // Test create and set basemap
    await this.#mapTester.testCreateAndSetBasemap();

    // Test north arrow rotation in LCC projection for BC
    await this.#mapTester.testNorthArrowRotationLCC();

    // Test vector tile projection warning
    await this.#mapTester.testVectorTileProjectionWarning();

    // Make sure the map is reset in its initial extent after the zooms
    await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

    // Test geometry z-index, not awaiting on it, it can happen at the same time as the rest
    const pZIndex = this.#mapTester.testGeometryGroupZIndex();

    // Test set language
    const pSetLanguage = this.#mapTester.testSetLanguage();

    // Finish remaining map tests before the UI tests change the active app-bar tab
    await Promise.all([pZIndex, pSetLanguage]);

    // Test footer bar select tab
    await this.#mapTester.testFooterBarSelectTab();

    // Test app bar select tab
    await this.#mapTester.testAppBarSelectTab();

    // Test footer bar create tab
    await this.#mapTester.testFooterBarCreateTab();

    // Make sure the map is in its initial extent
    await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

    // Test fullscreen view restoration and interaction preservation
    await this.#mapTester.testFullscreenViewRestoration();

    // Test details panel guide and Top anchor
    await this.#mapTester.testGuideDetailsPanelTopAnchor();

    // Test UIController.getFooterHeight from a non-React consumer
    await this.#mapTester.testControllerGetFooterHeight();

    // Page-scrolling fixtures must not run alongside other UI/map mutations, including other maps under "Run all".
    // TODO: ALEX - Fix the promise returns here in next PR
    // TODO: It'd be great it we could know in the UI that the suite is waiting on something here (there's not test to write a step here.. we need a 'suite-step' logic too)
    await this.waitForPageExclusivity();
    await this.#mapTester.testMapSectionScroll('partial');
    await this.#mapTester.testMapSectionScroll('transitions');
    await this.#mapTester.testMapSectionScroll('visible');
    await this.#mapTester.testMapSectionScroll('oversized');

    return;
  }
}
