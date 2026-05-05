import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { MapConfigTester } from '../testers/map-config-tester';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

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
   * @param controllerRegistry - The controller registry
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
    return 'Test Suite to perform various map configuration related tests';
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // // GV START DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME
    // // Test DEBUG
    // const pDevTest0 = this.#mapConfigTester.testInitialViewLayerIdsSetExtent();

    // // Resolve when all
    // return Promise.all([pDevTest0]);
    // // GV END DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME

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

    // Test navBar with null has defaults
    const pNoNavBarDefaults = this.#mapConfigTester.testNoNavBarHasDefaults();
    await pNoNavBarDefaults;

    // Test navBar with empty components has zoom and rotate
    const pEmptyNavBarZoomRotate = this.#mapConfigTester.testEmptyNavBarHasZoomRotate();
    await pEmptyNavBarZoomRotate;

    // Test initial view with layerIds sets extent
    const pInitialViewLayerIds = this.#mapConfigTester.testInitialViewLayerIdsSetExtent();
    await pInitialViewLayerIds;

    // Test overlay objects with point markers
    const pOverlayObjectsPointMarkers = this.#mapConfigTester.testOverlayObjectsPointMarkers();
    await pOverlayObjectsPointMarkers;

    // Test view settings zoom constraints
    const pViewSettingsZoomConstraints = this.#mapConfigTester.testViewSettingsZoomConstraints();
    await pViewSettingsZoomConstraints;

    // Test overview map is present when configured
    const pOverviewMapPresent = this.#mapConfigTester.testOverviewMapPresent();
    await pOverviewMapPresent;

    // Test overview map is absent when not configured
    const pOverviewMapAbsent = this.#mapConfigTester.testOverviewMapAbsent();
    await pOverviewMapAbsent;

    // Test overview map hideOnZoom behavior
    const pOverviewMapHideOnZoom = this.#mapConfigTester.testOverviewMapHideOnZoom();
    await pOverviewMapHideOnZoom;

    // Test overview map hideOnZoom with reprojection
    const pOverviewMapHideOnZoomReproject = this.#mapConfigTester.testOverviewMapHideOnZoomWithReprojection();
    await pOverviewMapHideOnZoomReproject;

    // Test initialSettings all controls set to false
    const pControlsAllFalse = this.#mapConfigTester.testInitialSettingsControlsAllFalse();
    await pControlsAllFalse;

    // Test initialSettings states
    const pStateVisible = this.#mapConfigTester.testInitialSettingsStateVisibleFalse();
    await pStateVisible;

    const pStateOpacity = this.#mapConfigTester.testInitialSettingsStateOpacity();
    await pStateOpacity;

    const pStateQueryable = this.#mapConfigTester.testInitialSettingsStateQueryableFalse();
    await pStateQueryable;

    const pStateHoverable = this.#mapConfigTester.testInitialSettingsStateHoverableFalse();
    await pStateHoverable;

    // Test initialSettings controls + states combo
    const pComboQueryControlTrueStateQueryableFalse = this.#mapConfigTester.testInitialSettingsComboQueryControlTrueStateQueryableFalse();
    await pComboQueryControlTrueStateQueryableFalse;

    const pComboHoverControlTrueStateHoverableFalse = this.#mapConfigTester.testInitialSettingsComboHoverControlTrueStateHoverableFalse();
    await pComboHoverControlTrueStateHoverableFalse;

    // Test controls.remove cascading through group hierarchy
    const pRemoveCascading = this.#mapConfigTester.testInitialSettingsControlRemoveCascadingToDescendants();
    await pRemoveCascading;

    // Test states.visible cascading through group hierarchy
    const pVisibleCascading = this.#mapConfigTester.testInitialSettingsStateVisibleCascadingToDescendants();
    await pVisibleCascading;

    // Test opacity cascading with parent/child layers
    const pOpacityCappedByParent = this.#mapConfigTester.testInitialSettingsOpacityCascadingChildCappedByParent();
    await pOpacityCappedByParent;

    const pOpacityBelowParent = this.#mapConfigTester.testInitialSettingsOpacityCascadingChildBelowParent();
    await pOpacityBelowParent;

    const pOpacityRuntimeCascade = this.#mapConfigTester.testInitialSettingsOpacityCascadingRuntimeParentChange();
    await pOpacityRuntimeCascade;

    // Resolve when all
    return Promise.all([
      pDataTableInFooterBar,
      pDataTableInAppBar,
      pNoFooterBarAppBarDefaults,
      pEmptyFooterBarAppBar,
      pNoNavBarDefaults,
      pEmptyNavBarZoomRotate,
      pInitialViewLayerIds,
      pOverlayObjectsPointMarkers,
      pViewSettingsZoomConstraints,
      pOverviewMapPresent,
      pOverviewMapAbsent,
      pOverviewMapHideOnZoom,
      pOverviewMapHideOnZoomReproject,
      pControlsAllFalse,
      pStateVisible,
      pStateOpacity,
      pStateQueryable,
      pStateHoverable,
      pComboQueryControlTrueStateQueryableFalse,
      pComboHoverControlTrueStateHoverableFalse,
      pRemoveCascading,
      pVisibleCascading,
      pOpacityCappedByParent,
      pOpacityBelowParent,
      pOpacityRuntimeCascade,
    ]);
  }
}
