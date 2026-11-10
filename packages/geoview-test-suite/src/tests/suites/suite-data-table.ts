import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { TestSuiteCannotExecuteError } from '../core/exceptions';
import { DataTableTester } from '../testers/data-table-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';

/**
 * Test Suite for Data Table component tests.
 */
export class GVTestSuiteDataTable extends GVAbstractTestSuite {
  /** The Data Table Tester used in this Test Suite. */
  #dataTableTester: DataTableTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry for the map viewer
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the Data Table tester
    this.#dataTableTester = new DataTableTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#dataTableTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Data Table Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests the Data Table footer panel store and DOM behavior:<br/>
      <b>Features</b> — GeoJSON and Commemorative data population; empty GeoPackage field name renders without crashing<br/>
      <b>Settings and filters</b> — GeoJSON column visibility, row counts, map-filter state, column/global filters and Ontario extent filtering;<br/>
      &nbsp;&nbsp;Commemorative column filter store set/clear; Cities name and population range filters<br/>
      <b>Extent filter</b> — Toggle absence check on the ESRI Feature Forest Industry fixture<br/>
      <b>Row zoom</b> — Temporary highlight creation and expiry<br/>
      <b>Style filter</b> — showUnsymbolizedFeatures true and false table summaries`;
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
    // Check if data-table is part of the footerBar tabs core
    const plugins = this.getMapViewer().mapFeaturesConfig.footerBar?.tabs?.core || [];
    if (!plugins.includes('data-table'))
      throw new TestSuiteCannotExecuteError(
        'To run this Test Suite, the data-table tab has to be loaded in the footerBar tabs core array.'
      );

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
    // await this.#dataTableTester.testLayerDataIsFiltered();
    await this.#dataTableTester.testCitiesNameFilterCount();
    await this.#dataTableTester.testAddGeoJsonCheckDataTablePopulated();

    // Resolve
    return;
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Sequential — tests interact with shared data table state
    await this.#dataTableTester.testAddGeoJsonCheckDataTablePopulated();
    await this.#dataTableTester.testAddCommemorativeCheckDataTablePopulated();
    await this.#dataTableTester.testEmptyFieldNameDoesNotCrashDataTable();
    await this.#dataTableTester.testCitiesNameFilterCount();
    await this.#dataTableTester.testFilterByExtentUnavailableForEsriDynamic();
    await this.#dataTableTester.testShowUnsymbolizedFeaturesTrue();
    await this.#dataTableTester.testShowUnsymbolizedFeaturesFalse();

    // Done
    return;
  }
}
