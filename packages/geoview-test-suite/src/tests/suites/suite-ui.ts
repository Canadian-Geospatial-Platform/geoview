import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { UITester } from '../testers/ui-tester';

/**
 * The GeoView Test Suite for UI.
 */
export class GVTestSuiteUI extends GVAbstractTestSuite {
  /** The UI Tester used in this Test Suite */
  #uiTester: UITester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry for the map viewer
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the UI tester
    this.#uiTester = new UITester(api, mapViewer, controllerRegistry);
    this.addTester(this.#uiTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'UI Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests UI component rendering and DOM structure:<br/>
      <b>Guide/Details</b> — Panel top anchor positioning<br/>
      <b>Keyboard navigation</b> — Skip focus remains within the current map; AppBar focus restoration yields to newer focus<br/>
      <b>Viewport scrolling</b> — Complete map visibility, footer transitions and stable oversized alignment`;
  }

  /**
   * Gets the number of active tests launched by the full suite.
   *
   * @returns The number of active full-suite tester calls, excluding debug-only calls
   */
  override getTestsTotalFinal(): number {
    return 14;
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test details panel guide and Top anchor
    const pDetailsPanel = this.#uiTester.testGuideDetailsPanelTopAnchor();

    // Test the UIController.getFooterHeight getter from a non-React consumer (controller registry)
    const pFooterHeight = this.#uiTester.testControllerGetFooterHeight();

    await Promise.all([pDetailsPanel, pFooterHeight]);

    // Focus and page-scrolling tests mutate shared browser state and must not run alongside other maps under "Run all".
    await this.waitForPageExclusivity();
    await this.#uiTester.testResizePopoverFocusRestoration();
    await this.#uiTester.testPopperKeyboardBoundary();
    await this.#uiTester.testPopoverFocusOwnership('version');
    await this.#uiTester.testPopoverFocusOwnership('notifications');
    await this.#uiTester.testPopoverFocusOwnership('navbar');
    await this.#uiTester.testPopoverFocusOwnership('settings');
    await this.#uiTester.testSkipFocusReturnsToMapLinks();
    await this.#uiTester.testAppBarFocusRestoreYieldsToNewerFocus();
    await this.#uiTester.testMapSectionScroll('partial');
    await this.#uiTester.testMapSectionScroll('transitions');
    await this.#uiTester.testMapSectionScroll('visible');
    return this.#uiTester.testMapSectionScroll('oversized');
  }
}
