import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { LayerTester } from '../testers/layer-tester';

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
   * @param controllerRegistry - The controller registry for the map viewer
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
    return `Tests runtime LayerApi/controller operations, legend-store synchronization, and feature queries:<br/>
      <b>WMS group paths</b> — Nested groups with duplicate names are loaded without ambiguous paths or recursion loops<br/>
      <b>Zoom to extent</b> — Single-feature layers, empty layers, and configured fallback extents<br/>
      <b>Feature geometry</b> — Details queries still retrieve geometry when configured outfields omit geometry fields<br/>
      <b>WMS feature queries</b> — Cities and Airborne layers retrieve features through associated WFS services, with VPN-aware Airborne execution<br/>
      <b>Root layer resolution</b> — Resolve the first layer under a root id (e.g. a GeoCore UUID) with <code>getGeoviewLayerByRootId</code><br/>
      <b>Layer reload</b> — Reloading a layer rebuilds it from scratch and keeps it at the same position in the layer order<br/>
      <b>GeoJSON source</b> — Object/string replacement, feature-info refresh, and reprojection after injection<br/>
      <b>ESRI domain queries</b> — Dynamic and Feature domain value translation<br/>
      <b>GeometryCollection</b> — GeoJSON GeometryCollection layer loading<br/>
      <b>GeoCore visibility</b> — Group defaultVisibility=false (only when heavy tests are enabled)<br/>
      <b>Layer naming</b> — Repeated renaming through the public LayerApi updates runtime, legend store, and the rendered Layers panel label<br/>
      <b>Layer visibility</b> — Explicit updates and toggles through the public LayerApi; making a child and its parents visible<br/>
      <b>Layer opacity</b> — Parent-to-child propagation, independent child updates, runtime parent caps versus requested store opacity, and restoration from transparency<br/>
      <b>Details queryability</b> — Public LayerApi updates synchronize the legend store; disabling excludes features and re-enabling restores them<br/>
      <b>Hoverability</b> — Public LayerApi updates synchronize the legend store; disabling excludes hover results and re-enabling restores them<br/>
      <b>Text visibility</b> — Layer controller updates synchronize the vector layer's independent text flag and legend store<br/>
      <b>WMS styles</b> — Named and repeated selections synchronize runtime, source STYLES, and legend store; empty selections preserve the active style<br/>
      <b>ESRI geometry pairing</b> — Dynamic feature geometry and OBJECTID pairing`;
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
  protected override async onLaunchTestSuiteDEBUG(): Promise<unknown> {
    // Test DEBUG
    // Test the layer renaming
    await this.#layerTester.testSetLayerName();

    // Test the public LayerApi explicit visibility and toggle behavior
    await this.#layerTester.testSetOrToggleLayerVisibility();

    // Test hidden-by-parent child + setLayerVisibleIncludingParents parent crawl (drives the panels' hidden/available lists)
    await this.#layerTester.testSetLayerVisibleIncludingParents();

    // Test public LayerApi opacity updates after the visibility tests.
    await this.#layerTester.testSetLayerOpacity();

    // Test non-queryable layer not in details
    await this.#layerTester.testNonQueryableLayerNotInDetails();

    // Test layer hoverable state
    await this.#layerTester.testLayerHoverableState();

    // Test the controller's independent text-visibility flag and store synchronization.
    await this.#layerTester.testSetLayerTextVisibility();

    // Resolve
    return;
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test WMS duplicate nested group names (issue #3521)
    await this.#layerTester.testAddWMSDuplicateGroupNames();

    // Test zoom to extent of a layer with only 1 point feature
    await this.#layerTester.testZoomExtentWithOneFeature();

    // Test zoom to extent of a layer without features
    await this.#layerTester.testZoomExtentWithoutFeatures();

    // Test zoom to extent of a layer without features
    await this.#layerTester.testZoomExtentWithoutFeaturesWithConfiguredExtent();

    // Make sure the map is reset in its initial extent after the zooms
    await this.zoomToInitialExtent();

    // Test feature query behavior when no geometry field in outfields
    await this.#layerTester.testFeatureHasGeometryWhenOutfieldsHasNoGeometryField();

    // Test WMS query via associated WFS layer (Cities)
    await this.#layerTester.testQueryWMSLayerForWFSFeaturesCities();

    // Test WMS query via associated WFS layer (Airborne)
    await this.#layerTester.testQueryWMSLayerForWFSFeaturesAirborne(this.getIsRunningOnVPN());

    // Test resolving the first layer under a root id (e.g. a GeoCore UUID) — issue #3633
    await this.#layerTester.testGetGeoviewLayerByRootId();

    // Test that reloading a layer preserves its position in the layer order — issue #3666
    await this.#layerTester.testReloadLayerPreservesPosition();

    // Projection mutations must not overlap the outstanding parallel layer test.
    await this.#layerTester.testSetGeojsonSourceReplacesFeatures();
    await this.#layerTester.testSetGeojsonSourceReprojectsFeatures();

    // Test domain field query value translation — run sequentially at the end
    // because they change the zoom level to 17.4 which would affect other tests
    await this.#layerTester.testEsriDynamicDomainFieldQueryValue();
    await this.#layerTester.testEsriFeatureDomainFieldQueryValue();

    // Make sure the map is reset in its initial extent after the zooms
    await this.zoomToInitialExtent();

    // Run the GeometryCollection layer test last to avoid perturbing icon color ordering used by earlier strict icon assertions.
    await this.#layerTester.testAddGeoJSONWithGeometryCollection();

    // Test geocore group with defaultVisibility=false
    await this.#layerTester.testAddGeocoreWithGroupDefaultVisibilityFalse(this.getIsRunningHeavyTests());

    // Test the layer renaming
    await this.#layerTester.testSetLayerName();

    // Test the public LayerApi explicit visibility and toggle behavior
    await this.#layerTester.testSetOrToggleLayerVisibility();

    // Test hidden-by-parent child + setLayerVisibleIncludingParents parent crawl (drives the panels' hidden/available lists)
    await this.#layerTester.testSetLayerVisibleIncludingParents();

    // Test public LayerApi opacity updates after the visibility tests.
    await this.#layerTester.testSetLayerOpacity();

    // Test non-queryable layer not in details
    await this.#layerTester.testNonQueryableLayerNotInDetails();

    // Test layer hoverable state
    await this.#layerTester.testLayerHoverableState();

    // Test the controller's independent text-visibility flag and store synchronization.
    await this.#layerTester.testSetLayerTextVisibility();

    // Test WMS style synchronization independently of the query fixtures.
    await this.#layerTester.testSetLayerWmsStyle();

    // Test ESRI Dynamic junction geometry pairs to its own OBJECTID (#3636) — changes zoom, resets to initial extent in finalize
    await this.#layerTester.testEsriDynamicJunctionGeometryPairing();

    return;
  }
}
