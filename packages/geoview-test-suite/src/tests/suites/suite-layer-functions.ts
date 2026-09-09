import type { API } from 'geoview-core/api/api';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { GVAbstractTester } from '../testers/abstract-gv-tester';
import { LayerTester } from '../testers/layer-tester';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

/**
 * The GeoView Test Suite.
 */
export class GVTestSuiteLayerFunctions extends GVAbstractTestSuite {
  /** The Layer Tester used in this Test Suite */
  #layerTester: LayerTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the Geocore tester
    this.#layerTester = new LayerTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#layerTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Layer Functions Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests layer controller functions and feature-query behavior:<br/>
      <b>Layer path resolution</b> — Nested WMS groups with duplicate names are loaded without ambiguous paths or recursion loops<br/>
      <b>Zoom to extent</b> — Single-feature layers, empty layers, and configured fallback extents<br/>
      <b>Feature geometry</b> — Details queries still retrieve geometry when configured outfields omit geometry fields<br/>
      <b>WMS feature queries</b> — WMS layers retrieve feature results through their associated WFS services<br/>`;
  }

  /**
   * Gets the number of active tests launched by the full suite.
   *
   * @returns The number of active full-suite tester calls, excluding debug-only calls
   */
  override getTestsTotalFinal(): number {
    return 7;
  }

  /**
   * Overrides the debug hook for running a subset of tests during development.
   *
   * GV DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME, search for DEBUG_RUN_ONLY_DEBUG_FUNCTION for the flag.
   *
   * @returns A promise that resolves when the debug tests are completed
   */
  protected override onLaunchTestSuiteDEBUG(): Promise<unknown> {
    // Test DEBUG
    const pDevTest0 = this.#layerTester.testQueryWMSLayerForWFSFeaturesAirborne(this.getIsRunningOnVPN());

    // Resolve when all
    return Promise.all([pDevTest0]);
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Keep if running sequentially
    const isRunningSequentially = this.getIsRunningSequentially();

    // Test WMS duplicate nested group names (issue #3521)
    const pLayerWMSDuplicateGroupNames = this.#layerTester.testAddWMSDuplicateGroupNames();
    if (isRunningSequentially) await pLayerWMSDuplicateGroupNames;

    // Test zoom to extent of a layer with only 1 point feature
    await this.#layerTester.testZoomExtentWithOneFeature();

    // Test zoom to extent of a layer without features
    await this.#layerTester.testZoomExtentWithoutFeatures();

    // Test zoom to extent of a layer without features
    await this.#layerTester.testZoomExtentWithoutFeaturesWithConfiguredExtent();

    // Make sure the map is reset in its initial extent after the zooms
    await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

    // Test feature query behavior when no geometry field in outfields
    await this.#layerTester.testFeatureHasGeometryWhenOutfieldsHasNoGeometryField();

    // Test WMS query via associated WFS layer (Cities)
    await this.#layerTester.testQueryWMSLayerForWFSFeaturesCities();

    // Test WMS query via associated WFS layer (Airborne)
    await this.#layerTester.testQueryWMSLayerForWFSFeaturesAirborne(this.getIsRunningOnVPN());

    // Resolve when all parallel tests are done
    return Promise.all([pLayerWMSDuplicateGroupNames]);
  }
}
