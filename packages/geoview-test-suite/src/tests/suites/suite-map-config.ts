import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { MapConfigTester } from '../testers/map-config-tester';
import { GVAbstractTester } from '../testers/abstract-gv-tester';

/**
 * The GeoView Test Suite for Map Configuration.
 */
export class GVTestSuiteMapConfig extends GVAbstractTestSuite {
  /** The Map Config Tester used in this Test Suite */
  #mapConfigTester: MapConfigTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry for the map viewer
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the Map Config tester
    this.#mapConfigTester = new MapConfigTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#mapConfigTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Map Config Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests isolated map configuration overrides, viewport calculations, and feature-info presentation:<br/>
      <b>Footer/App bar</b> — Tab selection, default/empty configs, duplicate panels, fixed-height layout, GeoCore selected-layer resolution<br/>
      <b>Nav bar</b> — Default controls, empty array fallback<br/>
      <b>View settings</b> — Zoom constraints, initial layer extent, initialView vs homeView, home button navigation<br/>
      <b>Viewport</b> — Boundary samples, midpoint fitting, rotation, padding, resize, projection changes, antimeridian and error cases<br/>
      <b>Details and feature info</b> — Ontario/Alberta queries, visibility and feature zoom; nameField labels, summary:false field hiding, and aliases<br/>
      <b>Components</b> — Overview map (present/absent/hideOnZoom/reprojection), North arrow<br/>
      <b>Overlays</b> — Point markers from config<br/>
      <b>initialSettings</b> — Controls (all false, cascade and group overrides), states (visible, opacity, queryable, hoverable),<br/>
      &nbsp;&nbsp;legend collapsed, filters (GeoJSON, OGC Feature, WFS, ESRI Dynamic, ESRI Feature),<br/>
      &nbsp;&nbsp;opacity parent-child capping, runtime parent opacity change`;
  }

  /**
   * Gets the number of active tests launched by the full suite.
   *
   * @returns The number of active full-suite tester calls, excluding debug-only calls
   */
  override getTestsTotalFinal(): number {
    return 61;
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
    await this.#mapConfigTester.testNoFooterBarAppBarConfigHasDefaults();
    await this.#mapConfigTester.testViewSettingsInitialViewVsHomeView();

    // Resolve when all
    return;
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test fixed-height map layout without footer bar
    await this.#mapConfigTester.testFixedHeightWithoutFooterBar();

    // Test fixed-height map layout with collapsed footer bar
    await this.#mapConfigTester.testFixedHeightWithCollapsedFooterBar();

    // Test Details queries and feature-info overrides with the default config fixture.
    await this.#mapConfigTester.testDetailsForGeoJSONOntarioAlberta();

    // Test data table pre-loaded in footer bar
    await this.#mapConfigTester.testDataTableSelectedTabFooterBar();

    // Test data table pre-loaded in app bar
    await this.#mapConfigTester.testDataTableSelectedTabAppBar();

    // Test selectedLayersLayerPath referencing a GeoCore layer by UUID resolves to its first layer path (#3633)
    await this.#mapConfigTester.testSelectedLayersLayerPathGeoCoreResolution();

    // Test no footerBar/appBar config has defaults
    await this.#mapConfigTester.testNoFooterBarAppBarConfigHasDefaults();

    // Test empty footerBar/appBar tabs has no footer or app bar
    await this.#mapConfigTester.testEmptyFooterBarAppBarTabsHasNoFooter();

    // Test panels declared in both appBar and footerBar are removed from the footer bar
    await this.#mapConfigTester.testDuplicatedPanelsRemovedFromFooter();

    // Test navBar with null has defaults
    await this.#mapConfigTester.testNoNavBarHasDefaults();

    // Test navBar with empty components has zoom and rotate
    await this.#mapConfigTester.testEmptyNavBarHasZoomRotate();

    // Test initial view with layerIds sets extent
    await this.#mapConfigTester.testInitialViewLayerIdsSetExtent();

    // Test overlay objects with point markers
    await this.#mapConfigTester.testOverlayObjectsPointMarkers();

    // Test view settings zoom constraints
    await this.#mapConfigTester.testViewSettingsZoomConstraints();

    // Test initial view vs home view (zoom difference)
    await this.#mapConfigTester.testViewSettingsInitialViewVsHomeView();

    // Test home button navigates to homeView center coordinates
    await this.#mapConfigTester.testViewSettingsHomeButtonNavigatesToHomeView();

    // Test overview map is present when configured
    await this.#mapConfigTester.testOverviewMapPresent();

    // Test overview map is absent when not configured
    await this.#mapConfigTester.testOverviewMapAbsent();

    // Test overview map hideOnZoom behavior
    await this.#mapConfigTester.testOverviewMapHideOnZoom();

    // Test overview map hideOnZoom with reprojection
    await this.#mapConfigTester.testOverviewMapHideOnZoomWithReprojection();

    // Test north arrow is present when configured
    await this.#mapConfigTester.testNorthArrowPresent();

    // Test north arrow is absent when not configured
    await this.#mapConfigTester.testNorthArrowAbsent();

    // Test initialSettings all controls set to false
    await this.#mapConfigTester.testInitialSettingsControlsAllFalse();

    // Test initialSettings states
    await this.#mapConfigTester.testInitialSettingsStateVisibleFalse();

    await this.#mapConfigTester.testInitialSettingsStateOpacity();

    await this.#mapConfigTester.testInitialSettingsStateQueryableFalse();

    await this.#mapConfigTester.testInitialSettingsStateHoverableFalse();

    // Test initialSettings controls + states combo
    await this.#mapConfigTester.testInitialSettingsComboQueryControlTrueStateQueryableFalse();

    await this.#mapConfigTester.testInitialSettingsComboHoverControlTrueStateHoverableFalse();

    // Test controls.remove cascading through group hierarchy
    await this.#mapConfigTester.testInitialSettingsControlRemoveCascadingToDescendants();

    // Test states.visible cascading through group hierarchy
    await this.#mapConfigTester.testInitialSettingsStateVisibleCascadingToDescendants();

    // Test opacity cascading with parent/child layers
    await this.#mapConfigTester.testInitialSettingsOpacityCascadingChildCappedByParent();

    await this.#mapConfigTester.testInitialSettingsOpacityCascadingChildBelowParent();

    await this.#mapConfigTester.testInitialSettingsOpacityCascadingRuntimeParentChange();

    // Test legend collapsed initial state
    await this.#mapConfigTester.testInitialSettingsLegendCollapsed();

    // Test parent controls cascade to children (all controls)
    await this.#mapConfigTester.testInitialSettingsControlsCascadeToChildren();

    // Test group-level control override
    await this.#mapConfigTester.testInitialSettingsControlsGroupOverride();

    // Test initial filter on GeoJSON layer
    await this.#mapConfigTester.testInitialSettingsFilters();

    // Test initial filter on OGC Feature layer
    await this.#mapConfigTester.testInitialSettingsFiltersOgcFeature();

    // Test initial filter on WFS layer
    await this.#mapConfigTester.testInitialSettingsFiltersWfs();

    // Test initial filter on Esri Dynamic layer
    await this.#mapConfigTester.testInitialSettingsFiltersEsriDynamic();

    // Test initial filter on Esri Feature layer
    await this.#mapConfigTester.testInitialSettingsFiltersEsriFeature();

    // Tests that recreate the map with custom featureInfo config (sequential)
    await this.#mapConfigTester.testNameFieldAsLabel();
    await this.#mapConfigTester.testSummaryFalseHidesField();
    await this.#mapConfigTester.testFieldAliasRenamesField();

    // Viewport tests replace this suite's map, never the map-functions suite's configured layers.
    await this.#mapConfigTester.testFitViewportToMidpointsLonLat(3978, Math.PI / 4, 'dynamic', 'none', false, undefined, false);
    await this.#mapConfigTester.testFitViewportToMidpointsLonLat(3857, 0, 'dynamic', 'none', true, undefined, false);
    await this.#mapConfigTester.testFitViewportToMidpointsLonLat(3978, Math.PI / 4);
    await this.#mapConfigTester.testFitViewportToMidpointsLonLat(3978, Math.PI / 4, 'dynamic', 'resize');
    await this.#mapConfigTester.testFitViewportToMidpointsLonLat(3978, Math.PI / 4, 'dynamic', 'projection');
    await this.#mapConfigTester.testFitViewportToMidpointsLonLat(
      3857,
      0,
      'dynamic',
      'none',
      true,
      GVAbstractTester.VIEWPORT_ANTIMERIDIAN_LONLAT
    );
    await this.#mapConfigTester.testInvalidViewportMidpoints();
    await this.#mapConfigTester.testErrorFitViewportMidpointsCancelled();
    await this.#mapConfigTester.testErrorFitViewportUnavailable();
    await this.#mapConfigTester.testViewportBoundaryLonLat(3978);
    await this.#mapConfigTester.testViewportBoundaryLonLat(3978, Math.PI / 4);
    await this.#mapConfigTester.testViewportBoundaryLonLat(3857);
    await this.#mapConfigTester.testViewportBoundaryLonLat(3978, 0, 'static');
    await this.#mapConfigTester.testViewportBoundaryLonLat(3857, 0, 'dynamic', GVAbstractTester.VIEWPORT_ANTIMERIDIAN_LONLAT);
    await this.#mapConfigTester.testViewportBoundaryPaddingAndResize();
    await this.#mapConfigTester.testViewportBoundaryUnavailable();

    return;
  }
}
