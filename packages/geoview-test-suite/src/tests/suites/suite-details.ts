import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { TestSuiteCannotExecuteError } from '../core/exceptions';
import { DetailsTester } from '../testers/details-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteDetails extends GVAbstractTestSuite {
  /** The Geochart Tester used in this Test Suite */
  #detailsTester: DetailsTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry for the map viewer
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the Geochart tester
    this.#detailsTester = new DetailsTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#detailsTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Details Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests Details panel highlighting, selection, zoom, and feature navigation using test-owned layer fixtures:<br/>
      <b>Coordinate information</b> — Toggle coordinate content, update decimal and DMS values after map clicks, and re-enable for the latest location<br/>
      <b>Feature information</b> — Render polygon fields, images and dates using the map's date format, then Airborne (VPN only) and Cities WMS/WFS fields<br/>
      <b>Highlights</b> — Clear highlights and check their state when closing and reopening the panel<br/>
      <b>Group zoom</b> — Fit distinct points, coincident points, tiny extents, polygons and lines; handle missing/invalid extents, geometry lookup, stale requests and interrupted animations<br/>
      <b>Feature navigation</b> — Bound point-feature zoom; pan to small features, zoom out for larger features and avoid zooming back in<br/>
      <b>Button state</b> — Disable group zoom after fitting, re-enable it after view changes and stop feature-follow after switching layers<br/>
      <b>Selection</b> — Preserve the manually selected layer across map clicks<br/>
      <b>Panel-aware zoom</b> — Keep the feature center clear of the open Details panel and map controls<br/>`;
  }

  /**
   * Gets the number of active tests launched by the full suite.
   *
   * @returns The number of active full-suite tester calls, excluding debug-only calls
   */
  override getTestsTotalFinal(): number {
    return 10;
  }

  /**
   * Overrides the check if the Test Suite can be executed.
   *
   * @returns A promise that resolves to true when the Test Suite can be launched for the given map
   */
  protected override onCanExecuteTestSuite(): Promise<boolean> {
    // Check if the geochart plugin is part of the corePackage on the testing map
    if (!this.getMapViewer().hasAppbarTab('details'))
      throw new TestSuiteCannotExecuteError('To run this Test Suite, the details tab has to be loaded in the appBar tabs core array.');

    // All good
    return Promise.resolve(true);
  }

  /**
   * Overrides the debug hook for running a subset of tests during development.
   *
   * GV DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME, search for DEBUG_RUN_ONLY_DEBUG_FUNCTION for the flag.
   *
   * @returns A promise that resolves when the debug tests are completed
   */
  protected override async onLaunchTestSuiteDEBUG(): Promise<unknown> {
    await this.#detailsTester.testPolygonFeatureDetailsTable();

    // Resolve
    return;
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test the coordinate information toggle and map-click updates
    await this.#detailsTester.testShowCoordinateInfoToggle();

    // Test the rendered polygon feature information and date format
    await this.#detailsTester.testPolygonFeatureDetailsTable();

    // Test the Airborne WMS/WFS feature information
    await this.#detailsTester.testAirborneFeatureDetailsTable(this.getIsRunningOnVPN());

    // Test the Cities WMS/WFS feature information
    await this.#detailsTester.testCitiesFeatureDetailsTable();

    // Test clear all highlights
    await this.#detailsTester.testClearAllHighlights();

    // Test zoom to all results of a layer (changes zoom, sequential)
    await this.#detailsTester.testZoomToResultsGroupExtent();

    // Test zoom to point feature bound and pan to next feature (changes zoom, sequential)
    await this.#detailsTester.testZoomToFeatureBoundAndPan();

    // Test the zoom to all results button availability through the UI (changes zoom, sequential)
    await this.#detailsTester.testZoomToResultsButtonUnavailableUntilViewChanges();

    // Test the selection persistence across map clicks
    await this.#detailsTester.testLayerSelectionPersistence();

    // Test zoom to feature with an open app-bar panel
    await this.#detailsTester.testZoomToFeatureWithPanelOffset();

    // Resolve when all done
    return;
  }
}
