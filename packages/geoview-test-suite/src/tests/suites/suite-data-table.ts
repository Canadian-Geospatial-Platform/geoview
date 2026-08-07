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
    return `Tests the Data Table footer panel store and DOM behavior:<br/>
      <b>Features</b> — allFeaturesDataArray population (GeoJSON + ESRI)<br/>
      <b>Settings</b> — geoviewID column hidden, column visibility toggle, rows filtered count<br/>
      <b>Filters</b> — mapFilteredRecord default/set, global filter disables toggle, column filter set/clear<br/>
      <b>Extent filter</b> — Available for vector, unavailable for ESRI Dynamic, zoom-to-Ontario filtering<br/>
      <b>Style filter</b> — showUnsymbolizedFeatures:false pre-filters table rows`;
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
   * GV DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME
   *
   * @returns A promise that resolves when the debug tests are completed
   */
  protected override onLaunchTestSuiteDEBUG(): Promise<unknown> {
    return Promise.resolve();
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Sequential — tests interact with shared data table state
    await this.#dataTableTester.testAllFeaturesDataArrayPopulated(DataTableTester.GEOJSON_LAYER_PATH, 4);
    await this.#dataTableTester.testAllFeaturesDataArrayPopulated('ccc75c12-5acc-4a6a-959f-ef6f621147b9/0', 598);
    await this.#dataTableTester.testGeoviewIdColumnHiddenByDefault(DataTableTester.GEOJSON_LAYER_PATH);
    await this.#dataTableTester.testMapFilteredRecordDefault(DataTableTester.GEOJSON_LAYER_PATH);
    await this.#dataTableTester.testSetMapFilteredRecordFalse(DataTableTester.GEOJSON_LAYER_PATH);
    await this.#dataTableTester.testGlobalFilterRecord(DataTableTester.GEOJSON_LAYER_PATH, 'Ontario');
    await this.#dataTableTester.testClearFiltersResetsState('ccc75c12-5acc-4a6a-959f-ef6f621147b9/0', [
      { id: 'JUR_EN', value: 'Ontario' },
      { id: 'CONFLICT_EN', value: 'First' },
    ]);
    await this.#dataTableTester.testColumnVisibilityToggle(DataTableTester.GEOJSON_LAYER_PATH, 'Province', 'geoviewID');
    await this.#dataTableTester.testRowsFilteredRecordCount(DataTableTester.GEOJSON_LAYER_PATH, 3);
    await this.#dataTableTester.testFilterByExtentUnavailableForEsriDynamic('forest_industry/0');
    await this.#dataTableTester.testFilterByExtentOnGeoJSONOntario();
    await this.#dataTableTester.testShowUnsymbolizedFeaturesFalsePrefiltersTable('4baa66ad-aa29-4233-a6a8-7f5cbefb5ea8/6', 68, 213);

    // Done
    return;
  }
}
