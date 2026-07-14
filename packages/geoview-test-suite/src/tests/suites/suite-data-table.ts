import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { TestSuiteCannotExecuteError } from '../core/exceptions';
import { DataTableTester } from '../testers/data-table-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';

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
   * @param controllerRegistry - The controller registry
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
    return 'Test Suite to perform various Data Table related tests.';
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
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Wait for all layers to be loaded before running data table tests
    await this.getControllersRegistry().layerController.waitForLayersLoaded();

    // Sequential — tests interact with shared data table state
    await this.#dataTableTester.testAllFeaturesDataArrayPopulated();
    await this.#dataTableTester.testRowCountMatchesStore();
    await this.#dataTableTester.testGeoviewIdColumnHiddenByDefault();
    await this.#dataTableTester.testMapFilteredRecordDefault();
    await this.#dataTableTester.testSetMapFilteredRecordFalse();
    await this.#dataTableTester.testGlobalFilterRecord();
    await this.#dataTableTester.testClearFiltersResetsState();
    await this.#dataTableTester.testTableFiltersStoreOnApply();
    await this.#dataTableTester.testColumnVisibilityToggle();
    await this.#dataTableTester.testRowsFilteredRecordCount();
    await this.#dataTableTester.testFilterByExtentUnavailableForEsriDynamic();
    await this.#dataTableTester.testFilterByExtentOnGeoJSON();
    await this.#dataTableTester.testShowUnsymbolizedFeaturesFalsePrefiltersTable();

    return Promise.resolve();
  }
}
