import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { UITester } from '../testers/ui-tester';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

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
   * @param controllerRegistry - The controller registry
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
    return 'Test Suite to perform UI related tests';
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override onLaunchTestSuite(): Promise<unknown> {
    // Test details panel guide and Top anchor
    const pDetailsPanel = this.#uiTester.testGuideDetailsPanelTopAnchor();

    // Resolve when all tests are done
    return Promise.all([pDetailsPanel]);
  }
}
