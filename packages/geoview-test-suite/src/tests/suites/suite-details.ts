import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { TestSuiteCannotExecuteError } from '../core/exceptions';
import { DetailsTester } from '../testers/details-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import { GVAbstractTester } from '../testers/abstract-gv-tester';

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
    return `Tests Details panel highlights, panel-aware feature navigation, and layer selection:<br/>
      <b>Highlights and click marker</b> — Explicitly clear highlights and hide the marker; closing the panel clears highlights and reopening restores the selected feature's highlight<br/>
      <b>Navigation</b> — Feature zoom uses padding to keep the feature visible beside the open Details panel<br/>
      <b>Selection</b> — Manually selected layer persists across map clicks`;
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
    await this.#detailsTester.testClearAllHighlights();

    // Resolve
    return;
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Test clear all highlights
    await this.#detailsTester.testClearAllHighlights();

    // Test zoom to feature with an open app-bar panel (changes zoom, sequential)
    await this.#detailsTester.testZoomToFeatureWithPanelOffset(GVAbstractTester.ONTARIO_CENTER_LONLAT);

    // Test the selection persistence across map clicks
    await this.#detailsTester.testLayerSelectionPersistence();

    // Resolve when all done
    return;
  }
}
