import type { Coordinate } from 'ol/coordinate';

import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import type { TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import { GeoPackageReader } from 'geoview-core/api/config/reader/geopackage-reader';
import type { IDataTableSettings, TypeColumnFiltersState } from 'geoview-core/core/stores/states/data-table-state';
import {
  getStoreAppDisplayDateFormatDefault,
  getStoreAppDisplayLanguage,
  getStoreAppShowUnsymbolizedFeatures,
  setStoreAppShowUnsymbolizedFeatures,
} from 'geoview-core/core/stores/states/app-state';
import { getStoreLayerDisplayDateFormat } from 'geoview-core/core/stores/states/layer-state';
import { getStoreUIActiveFooterBarTab } from 'geoview-core/core/stores/states/ui-state';
import {
  getStoreDataTableFeaturesByPath,
  getStoreDataTableLayerSettings,
  getStoreDataTableMapFilteredRecord,
  getStoreDataTableRowsFilteredCount,
} from 'geoview-core/core/stores/states/data-table-state';
import { getStoreMapExtent, getStoreMapHighlightedFeatures } from 'geoview-core/core/stores/states/map-state';
import { TIMEOUT } from 'geoview-core/core/utils/constant';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { DateMgt } from 'geoview-core/core/utils/date-mgt';
import { logger } from 'geoview-core/core/utils/logger';
import { delay, generateId, whenThisThen } from 'geoview-core/core/utils/utilities';
import { WMS } from 'geoview-core/geo/layer/geoview-layers/raster/wms';
import type { AbstractBaseGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-base-layer';

/**
 * Main Data Table testing class.
 */
export class DataTableTester extends GVAbstractTester {
  // #region OVERRIDES

  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'DataTableTester';
  }

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Tests GeoJSON data-table population, visibility, filtering, map-filter state, and temporary row-zoom highlight expiry.
   * Restores the initial map extent during cleanup so view changes do not affect subsequent tests.
   *
   * @returns A promise that resolves with the initial table state and row counts after each filter
   */
  testAddGeoJsonCheckDataTablePopulated(): Promise<Test<GeoJsonDataTableResult>> {
    // Both the Ontario fit and the row-zoom action change the view used by subsequent tests.
    const initialExtent = this.getMapViewer().getView().calculateExtent();
    const globalFilterValue = 'Ontario';

    // Deliberately use a count different from the four-feature fixture to detect a setter that does nothing.
    const expectedRowsFiltered = 3;

    let gvLayer: AbstractBaseGVLayer | undefined;
    let fixtureLayerPath: string | undefined;
    return this.test(
      `Test allFeaturesDataArray is populated for layer GeoJson...`,
      async (test) => {
        // Wait for fixture loading and legend readiness before opening its data table.
        const fixture = this.addLayerGeoJSONWithMetadataPolygons(test);
        fixtureLayerPath = fixture.layerPath;
        gvLayer = await fixture.promiseLayer;

        // The fixture generates its own ID, so every operation must use the returned layer's path.
        const layerPath = gvLayer.getLayerPath();

        // Wait for the selected layer's all-features query before reading initial settings or applying filters.
        const geojsonData = await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

        // Exercise store-only setters and restore their baseline before the UI-driven scenarios.
        const settingsResult = this.#hideColumnsAndUpdateRowCountThenRestore(test, layerPath, expectedRowsFiltered);

        // Finish the cumulative column/global searches and clear them before testing the map extent.
        const filtersResult = await this.#applyColumnAndGlobalFilters(test, layerPath, globalFilterValue);

        // Wait for the Ontario fit and both extent-filter states before the row zoom changes the view again.
        const extentResult = await this.#zoomToOntarioAndToggleExtentFilter(test, layerPath);

        // Observe highlight creation and automatic expiry before returning the combined result.
        const highlightResult = await this.#zoomToRowAndWaitForHighlightExpiry(test, layerPath);

        // Preserve the combined subject and assertion-only callback while keeping each scenario focused.
        return { geojsonData, ...settingsResult, ...filtersResult, ...extentResult, ...highlightResult };
      },
      (test, result) => DataTableTester.#assertGeoJsonDataTableResult(test, result, expectedRowsFiltered, globalFilterValue),
      async (test) => {
        try {
          if (gvLayer) {
            // Remove the global search before clearing the table's column-filter inputs.
            test.addStep('Clearing global filter...');
            this.getControllersRegistry().dataTableController.setGlobalFilterRecord(gvLayer.getLayerPath(), '');
            // Let React process the store update before interacting with the clear-filters toolbar.
            await DomHelper.waitForReactIdle();
          }
          // Wait for the toolbar's filter reset to settle before removing the fixture.
          await this.clearDataTableFilters(test);
        } finally {
          // Leave no highlights behind if execution fails before automatic expiry.
          this.getControllersRegistry().mapController.removeHighlightedFeature('all');

          // If a layer
          if (fixtureLayerPath) {
            // Remove the layer
            this.removeLayerConfigAndAssert(test, fixtureLayerPath);
          }

          // Await view restoration so the next test cannot start while this test is still changing the map.
          test.addStep('Restoring the initial map extent...');
          await this.getControllersRegistry().mapController.zoomToExtent(initialExtent, false);
        }
      }
    );
  }

  /**
   * Tests Commemorative data-table population and setting/clearing column filters in the store.
   *
   * NOTE: This test only verifies store-level set/clear. The MRT table does not react to programmatic
   * `setColumnFiltersRecord` changes — it manages its own internal filter state. Therefore, `rowsFilteredRecord`
   * cannot be verified here (it only updates when the user interacts with the filter UI directly).
   *
   * @returns A promise that resolves with the table state and filters before and after clearing
   */
  testAddCommemorativeCheckDataTablePopulated(): Promise<Test<CommemorativeDataTableResult>> {
    const columnFilters: TypeColumnFiltersState = [
      { id: 'JUR_EN', value: 'Ontario' },
      { id: 'CONFLICT_EN', value: 'First' },
    ];

    let gvLayer: AbstractBaseGVLayer | undefined;
    let fixtureLayerPath: string | undefined;
    return this.test(
      `Test allFeaturesDataArray is populated for layer Commemorative...`,
      async (test) => {
        // Add the Commemorative layer to the map and wait for it to be registered
        const fixture = this.addLayerCommemorativeViaGeocore(test);
        fixtureLayerPath = fixture.layerPath;
        gvLayer = await fixture.promiseLayer;
        const layerPath = gvLayer.getLayerPath();

        // Wait for layer registration and data-table to be loaded with the layer in question
        const commemorativeData = await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

        // Get the settings
        const settings = getStoreDataTableLayerSettings(this.getMapId())[layerPath];

        test.addStep(`Setting ${columnFilters.length} active column filters and an empty range filter in the store...`);
        this.getControllersRegistry().dataTableController.setColumnFiltersRecord(layerPath, [
          ...columnFilters,
          { id: 'emptyRange', value: [undefined, undefined] },
        ]);
        const filtersBefore = getStoreDataTableLayerSettings(this.getMapId())[layerPath]?.columnFiltersRecord;

        test.addStep('Clearing column filters...');
        this.getControllersRegistry().dataTableController.setColumnFiltersRecord(layerPath, []);
        const filtersAfter = getStoreDataTableLayerSettings(this.getMapId())[layerPath]?.columnFiltersRecord;

        // Return the data
        return { commemorativeData, settings, filtersBefore, filtersAfter };
      },
      (test, result) => {
        test.addStep('Verifying allFeaturesDataArray has entries for the layer...');
        Test.assertIsArrayLengthEqual(result.commemorativeData, 600);

        test.addStep(`Verifying only the ${columnFilters.length} active filters are stored...`);
        Test.assertIsArrayLengthEqual(result.filtersBefore, columnFilters.length);

        test.addStep('Verifying filters are empty after clear...');
        Test.assertIsArrayLengthEqual(result.filtersAfter, 0);
      },
      (test) => {
        // If a layer
        if (fixtureLayerPath) {
          // Remove the layer
          this.removeLayerConfigAndAssert(test, fixtureLayerPath);
        }
      }
    );
  }

  /**
   * Tests that a layer with an empty/blank field name renders the data table without crashing.
   *
   * A column with an empty id and an accessorFn crashes Material React Table ("Columns require an id when using an
   * accessorFn"). GeoPackage preserves a blank-named column verbatim, so opening its data table exercises the crash
   * path. The test passes when the data table is created (its table element renders) for the layer.
   *
   * @returns A promise that resolves with whether the table rendered when the test completes
   */
  testEmptyFieldNameDoesNotCrashDataTable(): Promise<Test<boolean>> {
    let setupLayer: AbstractBaseGVLayer | undefined;
    let fixtureLayerPath: string | undefined;
    return this.test(
      'Test empty field name renders the data table without crashing...',
      async (test) => {
        const failingFixture = (() => {
          const originalReader = GeoPackageReader.createLayerConfigFromGeoPackage;
          GeoPackageReader.createLayerConfigFromGeoPackage = () => Promise.reject(new Error('Expected fixture reader failure'));
          try {
            return this.addGeopackageRailwaysCartoFerDebarcadere(test);
          } finally {
            GeoPackageReader.createLayerConfigFromGeoPackage = originalReader;
          }
        })();
        Test.assertIsEqual(typeof failingFixture.layerPath, 'string');
        Test.assertIsNotEqual(failingFixture.layerPath, '');
        Test.assertIsEqual(failingFixture.promiseLayer instanceof Promise, true);

        let fixtureFailure: unknown;
        try {
          await failingFixture.promiseLayer;
        } catch (error) {
          fixtureFailure = error;
        }
        Test.assertIsDefined('fixtureFailure', fixtureFailure);
        Test.assertIsEqual(fixtureFailure instanceof Error, true);
        if (fixtureFailure instanceof Error) Test.assertIsEqual(fixtureFailure.message, 'Expected fixture reader failure');

        // Add railways empty field layer
        const fixture = this.addGeopackageRailwaysCartoFerDebarcadere(test);
        fixtureLayerPath = fixture.layerPath;
        setupLayer = await fixture.promiseLayer;

        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, setupLayer.getLayerPath());

        // Wait for the table element to render; MRT throws during render if a column has an empty id + accessorFn
        test.addStep('Waiting for the data table to be created...');
        const table = await DomHelper.DataTable.waitForDataTable(this.getMapId());

        // The table was created (rendered) for the layer
        return !!table;
      },
      (test, result) => {
        test.addStep('Verifying the data table was created without crashing...');
        Test.assertIsEqual(result, true);
      },
      (test) => {
        if (fixtureLayerPath) this.removeLayerConfigAndAssert(test, fixtureLayerPath);
      }
    );
  }

  /**
   * Tests that filtering Cities by name and population range updates the data table row count.
   *
   * @returns A promise that resolves with the row counts after each filter
   */
  testCitiesNameFilterCount(): Promise<
    Test<{ nameFilterCount: number; populationMinFilterCount: number; populationMaxFilterCount: number }>
  > {
    const gvLayerId = generateId();
    const layerPath = `${gvLayerId}/${GVAbstractTester.CITIES_WMS_LAYER_ID}`;
    const minimumPopulation = '1000000';
    const maximumPopulation = '1750000';

    return this.test(
      'Test Cities DataTable name and population range filters return 30, 6, and 3 rows...',
      async (test) => {
        test.addStep('Creating the Cities WMS layer with its associated WFS...');
        const gvConfig = WMS.createGeoviewLayerConfig(gvLayerId, 'Cities', GVAbstractTester.CITIES_WMS_URL, undefined, false, [
          { id: GVAbstractTester.CITIES_WMS_LAYER_ID, layerName: 'Cities' },
        ]);
        gvConfig.listOfLayerEntryConfig[0].setWfsLayerId(GVAbstractTester.CITIES_WFS_LAYER_ID);

        test.addStep('Adding the Cities layer to the map...');
        const addedLayer = this.getControllersRegistry().layerCreatorController.addGeoviewLayer(gvConfig);
        await addedLayer.promiseLayer;

        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

        // Find the data table column filter input for the 'name' column and set its value
        await this.setDataTableColumnFilterInput(test, layerPath, 'name', 'mo');

        // Get the data table rows count after applying the name filter
        const nameFilterCount = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);

        // Set the data table column filter input for the 'population' column and set its value min value
        await this.setDataTableColumnFilterInputMin(test, layerPath, 'population', minimumPopulation);

        // Get the data table rows count after applying the minimum population filter
        const populationMinFilterCount = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);

        // Set the data table column filter input for the 'population' column and set its value max value
        await this.setDataTableColumnFilterInputMax(test, layerPath, 'population', maximumPopulation);

        // Get the data table rows count after applying the maximum population filter
        const populationMaxFilterCount = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);
        return { nameFilterCount, populationMinFilterCount, populationMaxFilterCount };
      },
      (test, result) => {
        test.addStep('Verifying 30 Cities rows match the name filter...');
        Test.assertIsEqual(result.nameFilterCount, 30);

        test.addStep('Verifying 6 Cities rows remain after the population minimum...');
        Test.assertIsEqual(result.populationMinFilterCount, 6);

        test.addStep('Verifying 3 Cities rows remain after the population maximum...');
        Test.assertIsEqual(result.populationMaxFilterCount, 3);
      },
      (test) => {
        // Clear the layer from the map and assert it was removed
        this.removeLayerConfigAndAssert(test, layerPath);
      }
    );
  }

  /**
   * Tests that filter-by-extent toggle is present for vector layers.
   *
   * @param layerPath - The vector layer path to check
   * @returns A promise that resolves with whether the filter-by-extent toggle is present
   */
  testFilterByExtentAvailableForVector(layerPath: string): Promise<Test<boolean>> {
    return this.test(
      'Test filter-by-extent toggle present for vector layer...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

        // Check DOM — FilterDataToExtent IS rendered for vector layers
        test.addStep('Checking DOM for presence of filter-by-extent switch...');
        const mapContainer = DomHelper.getMapContainer(this.getMapId());
        const allSwitchLabels = mapContainer.querySelectorAll('.MuiFormControlLabel-root') ?? [];
        let filterByExtentFound = false;
        allSwitchLabels.forEach((label) => {
          if (label.textContent?.includes('filter') && label.textContent?.includes('extent')) {
            filterByExtentFound = true;
          }
        });

        return filterByExtentFound;
      },
      (test, result) => {
        test.addStep('Verifying filter-by-extent toggle IS present for vector layer...');
        Test.assertIsEqual(result, true);
      }
    );
  }

  /**
   * Tests that filter-by-extent toggle is absent for Esri Dynamic layers.
   *
   * @returns A promise that resolves with whether the filter-by-extent toggle is present
   */
  testFilterByExtentUnavailableForEsriDynamic(): Promise<Test<boolean>> {
    let gvLayer: AbstractBaseGVLayer | undefined;
    let fixtureLayerPath: string | undefined;

    return this.test(
      'Test filter-by-extent toggle absent for Esri Dynamic layer...',
      async (test) => {
        // Add the Esri Dynamic Forest layer
        const fixture = this.addLayerEsriFeatureForestIndustry(test);
        fixtureLayerPath = fixture.layerPath;
        gvLayer = await fixture.promiseLayer;

        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, gvLayer.getLayerPath());

        // Check DOM — FilterDataToExtent is NOT rendered for Esri Dynamic (conditional: {!isEsriDynamic && ...})
        // The component uses the label t('dataTable.filterDataToExtent') — look for its absence
        test.addStep('Checking DOM for absence of filter-by-extent switch...');
        const mapContainer = DomHelper.getMapContainer(this.getMapId());
        const allSwitchLabels = mapContainer.querySelectorAll('.MuiFormControlLabel-root') ?? [];
        let filterByExtentFound = false;
        allSwitchLabels.forEach((label) => {
          if (label.textContent?.includes('filter') && label.textContent?.includes('extent')) {
            filterByExtentFound = true;
          }
        });

        return filterByExtentFound;
      },
      (test, result) => {
        test.addStep('Verifying filter-by-extent toggle is NOT present for Esri Dynamic...');
        Test.assertIsEqual(result, false);
      },
      (test) => {
        // Cleanup
        if (fixtureLayerPath) this.removeLayerConfigAndAssert(test, fixtureLayerPath);
      }
    );
  }

  /**
   * Tests that showUnsymbolizedFeatures: false pre-filters the data table to exclude unsymbolized features.
   *
   * @returns A promise that resolves with the feature count and summary text
   */
  testShowUnsymbolizedFeaturesTrue(): Promise<Test<{ featureCount: number; summaryText: string }>> {
    let gvLayer: AbstractBaseGVLayer | undefined;
    let fixtureLayerPath: string | undefined;
    const countTotal = 213;

    // Get the global settings before the test
    const showUnsymbolizedFeaturesBefore = getStoreAppShowUnsymbolizedFeatures(this.getMapId());

    return this.test(
      `Test showUnsymbolizedFeatures true not pre-filtering data table...`,
      async (test) => {
        // Update the global setting for this test
        setStoreAppShowUnsymbolizedFeatures(this.getMapId(), true);

        // Add Permafrost layer
        const fixture = this.addLayerEsriFeaturePermafrostEcoprovinceViaGeocore(test);
        fixtureLayerPath = fixture.layerPath;
        gvLayer = await fixture.promiseLayer;

        // Wait for layer registration and data-table to be loaded with the layer in question
        const features = await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, gvLayer.getLayerPath());
        const featureCount = features?.length ?? 0;

        // Wait for the dom element we want to check for content
        test.addStep('Waiting for filter-results-summary to render with the content...');
        const summaryEl = await DomHelper.DataTable.waitForFilterResultsSummary(this.getMapId());

        // Check the DOM for the filter results summary text
        test.addStep('Checking DOM for filter-results-summary...');
        const summaryText = summaryEl.textContent;

        await test.waitForFun();

        return { featureCount, summaryText };
      },
      (test, result) => {
        const { summaryText } = result;
        test.addStep(`Verifying DOM summary shows "${countTotal} feature(s)" (got "${summaryText}")...`);
        Test.assertIsEqual(summaryText.includes(`${countTotal} feature(s)`), true);
      },
      (test) => {
        // Cleanup: remove the added layer if it exists
        if (fixtureLayerPath) {
          this.removeLayerConfigAndAssert(test, fixtureLayerPath);
        }

        // Reset the global setting
        setStoreAppShowUnsymbolizedFeatures(this.getMapId(), showUnsymbolizedFeaturesBefore);
      }
    );
  }

  /**
   * Tests that showUnsymbolizedFeatures: false pre-filters the data table to exclude unsymbolized features.
   *
   * @returns A promise that resolves with the feature count and summary text
   */
  testShowUnsymbolizedFeaturesFalse(): Promise<Test<{ featureCount: number; summaryText: string }>> {
    let gvLayer: AbstractBaseGVLayer | undefined;
    let fixtureLayerPath: string | undefined;
    const countFilter = 68;
    const countTotal = 213;

    // Get the global settings before the test
    const showUnsymbolizedFeaturesBefore = getStoreAppShowUnsymbolizedFeatures(this.getMapId());

    return this.test(
      `Test showUnsymbolizedFeatures false pre-filters data table (${countFilter} of ${countTotal})...`,
      async (test) => {
        // Update the global setting for this test
        setStoreAppShowUnsymbolizedFeatures(this.getMapId(), false);

        // Add Permafrost layer
        const fixture = this.addLayerEsriFeaturePermafrostEcoprovinceViaGeocore(test);
        fixtureLayerPath = fixture.layerPath;
        gvLayer = await fixture.promiseLayer;

        // Wait for layer registration and data-table to be loaded with the layer in question
        const features = await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, gvLayer.getLayerPath());
        const featureCount = features?.length ?? 0;

        // Wait for the dom element we want to check for content
        test.addStep('Waiting for filter-results-summary to render with the content...');
        const summaryEl = await DomHelper.DataTable.waitForFilterResultsSummary(this.getMapId());

        // Check the DOM for the filter results summary text
        test.addStep('Checking DOM for filter-results-summary...');
        const summaryText = summaryEl.textContent;

        return { featureCount, summaryText };
      },
      (test, result) => {
        const { summaryText } = result;
        test.addStep(`Verifying DOM summary shows "${countFilter} feature(s) showing (${countTotal} total)" (got "${summaryText}")...`);
        Test.assertIsEqual(summaryText.includes(countFilter.toString()), true);
        Test.assertIsEqual(summaryText.includes(countTotal.toString()), true);
      },
      (test) => {
        // Cleanup: remove the added layer if it exists
        if (fixtureLayerPath) {
          this.removeLayerConfigAndAssert(test, fixtureLayerPath);
        }

        // Reset the global setting
        setStoreAppShowUnsymbolizedFeatures(this.getMapId(), showUnsymbolizedFeaturesBefore);
      }
    );
  }

  /**
   * Waits for a layer to register, opens it in the data table, and waits for its query to finish.
   *
   * @param test - The test instance for step logging
   * @param layerPath - The layer path to open in the data table
   * @returns A promise that resolves with the layer feature entries after the query completes, or undefined when unavailable
   */
  async waitForLayerRegistrationAndOpenDataTableOnTheLayer<T>(
    test: Test<T>,
    layerPath: string
  ): Promise<TypeFeatureInfoEntry[] | undefined> {
    // Wait for the layer to be registered
    test.addStep('Wait for the layer path to be registered...');
    await this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet.waitForLayerToGetRegistered(layerPath);

    // Open the DataTable on the footer tab and wait for the layer to get queried and data-table filled
    return this.openDataTableAndWait(test, layerPath);
  }

  /**
   * Opens the data-table footer tab and waits for layer settings to initialize.
   *
   * @param test - The test instance for step logging
   * @param layerPath - The layer path to wait for
   * @returns A promise that resolves with the layer feature entries after the query completes, or undefined when unavailable
   */
  async openDataTableAndWait<T>(test: Test<T>, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined> {
    // Get the active footer tab
    const activeFooterTab = getStoreUIActiveFooterBarTab(this.getMapId());

    // If the active footer tab isn't 'data-table'
    if (activeFooterTab.tabId !== 'data-table') {
      // Open the data-table tab to trigger component mount
      test.addStep('Opening data-table footer tab...');
      this.getControllersRegistry().uiController.setActiveFooterBarTab('data-table');
    }

    // Select the layer in the data table
    test.addStep(`Selecting layer '${layerPath}' in data-table...`);
    this.getControllersRegistry().dataTableController.setSelectedLayerPath(layerPath);

    // Wait for the layer to be queried and data-table filled
    test.addStep(`Wait for the layer data to be processed in the data-table...`);
    await this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet.waitForLayerQueryToFinish(layerPath);

    // Read features in the store
    return getStoreDataTableFeaturesByPath(this.getMapId(), layerPath);
  }

  /**
   * Sets a column filter input to a value and waits for the filter state and React rendering to settle.
   *
   * @param test - The test currently being executed
   * @param layerPath - The layer path whose data table should be filtered
   * @param columnName - The column name whose filter input should be updated
   * @param value - The filter value to enter
   */
  async setDataTableColumnFilterInput<T>(test: Test<T>, layerPath: string, columnName: string, value: string): Promise<void> {
    // Add a test step indicating that we are setting the data table column filter input for the specified column
    test.addStep(`Inputing column filter ${columnName} with value '${value}'...`);
    await DomHelper.DataTable.setDataTableColumnFilterInput(this.getMapId(), columnName, value);
    await this.#waitForDataTableColumnFilterInput(layerPath, columnName, value);
  }

  /**
   * Sets the minimum value for a column's range filter in the data table.
   *
   * @param test - The test currently being executed
   * @param layerPath - The layer path whose data table filter should be updated
   * @param columnName - The column name to filter
   * @param value - The minimum value to enter
   */
  async setDataTableColumnFilterInputMin<T>(test: Test<T>, layerPath: string, columnName: string, value: string): Promise<void> {
    // Get the language and format
    const language = getStoreAppDisplayLanguage(this.getMapId());
    const format =
      getStoreLayerDisplayDateFormat(this.getMapId(), layerPath)?.[language] ??
      getStoreAppDisplayDateFormatDefault(this.getMapId()).datetimeFormat[language];

    // Add a test step indicating that we are setting the minimum filter for the specified column
    test.addStep(`Setting the minimum filter for column ${columnName} to '${value}'...`);
    await DomHelper.DataTable.setDataTableColumnFilterInputRange(this.getMapId(), columnName, value, format, language, 'Min');
    await this.#waitForDataTableColumnFilterInput(layerPath, columnName, value, 'Min');
  }

  /**
   * Sets the maximum value for a column's range filter in the data table.
   *
   * @param test - The test currently being executed
   * @param layerPath - The layer path whose data table filter should be updated
   * @param columnName - The column name to filter
   * @param value - The maximum value to enter
   */
  async setDataTableColumnFilterInputMax<T>(test: Test<T>, layerPath: string, columnName: string, value: string): Promise<void> {
    // Get the language and format
    const language = getStoreAppDisplayLanguage(this.getMapId());
    const format =
      getStoreLayerDisplayDateFormat(this.getMapId(), layerPath)?.[language] ??
      getStoreAppDisplayDateFormatDefault(this.getMapId()).datetimeFormat[language];

    // Add a test step indicating that we are setting the maximum filter for the specified column
    test.addStep(`Setting the maximum filter for column ${columnName} to '${value}'...`);
    await DomHelper.DataTable.setDataTableColumnFilterInputRange(this.getMapId(), columnName, value, format, language, 'Max');
    await this.#waitForDataTableColumnFilterInput(layerPath, columnName, value, 'Max');
  }

  /**
   * Clears all column filters in the data table.
   *
   * @param test - The test currently being executed
   * @param layerPath - The layer path whose filters should be cleared
   * @throws {TestError} When the clear-filters toolbar or button is not found
   */
  async clearDataTableFilters<T>(test: Test<T>): Promise<void> {
    test.addStep('Clearing the data table filters...');
    DomHelper.DataTable.clearDataTableFilters(this.getMapId());
    await DomHelper.waitForReactIdle();
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Captures default settings and exercises visibility and row-count setters without changing the later filter baseline.
   *
   * @param test - The test instance used to log scenario steps
   * @param layerPath - The generated GeoJSON layer path
   * @param expectedRowsFiltered - The synthetic row count used to exercise the setter
   * @returns The initial settings and setter observations
   */
  #hideColumnsAndUpdateRowCountThenRestore(
    test: Test<GeoJsonDataTableResult>,
    layerPath: string,
    expectedRowsFiltered: number
  ): GeoJsonSettingsResult {
    // Capture the initial settings before controller updates replace them in the store.
    const settings = getStoreDataTableLayerSettings(this.getMapId())[layerPath];

    // Keep the default map-filter state separate from the explicit false/true changes below.
    const mapFiltered = getStoreDataTableMapFilteredRecord(this.getMapId(), layerPath);

    // Exercise the visibility setter without exposing the internal geoviewID column.
    test.addStep('Hiding Province column...');
    this.getControllersRegistry().dataTableController.setColumnVisibilityRecord(layerPath, { geoviewID: false, Province: false });
    const visibilityAfterHide = getStoreDataTableLayerSettings(this.getMapId())[layerPath].columnVisibilityRecord;

    // Restore the original visibility before later checks interact with the filter inputs.
    test.addStep('Restoring column visibility...');
    this.getControllersRegistry().dataTableController.setColumnVisibilityRecord(layerPath, settings.columnVisibilityRecord);

    // This checks the store setter independently of row counts calculated by the rendered table.
    const initialRowsFiltered = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);
    test.addStep(`Setting rowsFilteredRecord to ${expectedRowsFiltered}...`);
    this.getControllersRegistry().dataTableController.setRowsFilteredRecord(layerPath, expectedRowsFiltered);
    const rowsFilteredAfterSet = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);

    // Do not let the synthetic count become the baseline for the UI-driven filtering checks.
    test.addStep('Restoring rowsFilteredRecord before applying filters...');
    this.getControllersRegistry().dataTableController.setRowsFilteredRecord(layerPath, initialRowsFiltered);

    return { settings, mapFiltered, visibilityAfterHide, rowsFilteredAfterSet };
  }

  /**
   * Captures cumulative column filters and global-filter behavior, then clears the global search before extent checks.
   *
   * @param test - The test instance used to log scenario steps
   * @param layerPath - The generated GeoJSON layer path
   * @param globalFilterValue - The global search value to store
   * @returns Column-filter counts, explicit map-filter state, and global-filter observations
   */
  async #applyColumnAndGlobalFilters(
    test: Test<GeoJsonDataTableResult>,
    layerPath: string,
    globalFilterValue: string
  ): Promise<GeoJsonFiltersResult> {
    // Use the filter inputs so the table recalculates its rows; store-only changes do not exercise that path.
    await this.setDataTableColumnFilterInput(test, layerPath, 'province', 'on');
    const provinceFilterCount = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);

    // Keep the province filter active while progressively narrowing the creation-date range.
    await this.setDataTableColumnFilterInputMin(test, layerPath, 'creationDate', '2020-01-01');
    const minDateFilterCount = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);

    // Adding the upper bound distinguishes a working range filter from a minimum-only filter.
    await this.setDataTableColumnFilterInputMax(test, layerPath, 'creationDate', '2020-03-01');
    const maxDateFilterCount = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);

    // Capture the explicit opt-out before re-enabling map filtering for the global-filter scenario.
    test.addStep('Setting mapFilteredRecord to false...');
    this.getControllersRegistry().dataTableController.setMapFilteredRecord(layerPath, false);
    const mapFilteredAfterSet = getStoreDataTableMapFilteredRecord(this.getMapId(), layerPath);

    // Isolate global filtering from the province/date filters and start with map filtering enabled.
    await this.clearDataTableFilters(test);
    this.getControllersRegistry().dataTableController.setMapFilteredRecord(layerPath, true);

    test.addStep(`Setting global filter to '${globalFilterValue}'...`);

    // TODO: REVIEW CLAUDE - Review this paragraph automatically added by Claude
    // The table owns the search state; its hook writes to the store but does not read later store changes.
    const searchInput = DomHelper.queryGVSelector<HTMLInputElement>(
      this.getMapId(),
      '.data-table-panel .data-table-top-toolbar form[role="search"] input'
    );
    if (!searchInput) throw new Error(`No data-table global search input is available for ${layerPath}.`);
    DomHelper.setInputValue(searchInput, globalFilterValue);
    await whenThisThen(() => getStoreDataTableLayerSettings(this.getMapId())[layerPath].globalFilterRecord === globalFilterValue);

    await DomHelper.waitForReactIdle();
    const globalFilter = getStoreDataTableLayerSettings(this.getMapId())[layerPath].globalFilterRecord;

    // A stored global-filter value alone does not prove that the rendered switch has become disabled.
    test.addStep('Checking DOM for disabled filter-map switch...');
    const filterMapInput = DomHelper.queryGVSelector<HTMLInputElement>(this.getMapId(), '.data-table-panel .data-table-filter-map input');
    if (!filterMapInput) throw new Error(`No data-table filter-map switch is available for ${layerPath}.`);
    const isFilterMapDisabled = filterMapInput.disabled;

    // Extent filtering must run without the global search or the earlier column filters restricting its baseline.
    test.addStep('Clearing global filter before testing the Ontario extent...');

    // TODO: REVIEW CLAUDE - Review this paragraph automatically added by Claude
    DomHelper.setInputValue(searchInput, '');
    await whenThisThen(() => getStoreDataTableLayerSettings(this.getMapId())[layerPath].globalFilterRecord === '');
    await DomHelper.waitForReactIdle();

    return { provinceFilterCount, minDateFilterCount, maxDateFilterCount, mapFilteredAfterSet, globalFilter, isFilterMapDisabled };
  }

  /**
   * Captures the Ontario extent-filter summary and verifies restoration through a pre-toggle baseline snapshot.
   *
   * @param test - The test instance used to log scenario steps
   * @param layerPath - The generated GeoJSON layer path
   * @returns The viewport-dependent expected count and summaries before, during, and after extent filtering
   */
  async #zoomToOntarioAndToggleExtentFilter(test: Test<GeoJsonDataTableResult>, layerPath: string): Promise<GeoJsonExtentResult> {
    // The existing Ontario-fit expectation depends on the rendered viewport width, not just the requested extent.
    const mapWidthWhenThreeFeaturesShow = 1747;
    // Recalculate the viewport before fitting, since the containing map tab may have changed size.
    this.getMapViewer().map.updateSize();
    test.addStep('Zooming to Ontario extent...');
    await this.getControllersRegistry().mapController.zoomToLonLatExtentOrCoordinate(
      GVAbstractTester.ONTARIO_EXTENT,
      GVAbstractTester.USE_ZOOM_ANIMATION
    );

    // Wait for the fitted map to finish rendering before observing the extent-dependent table.
    await this.getMapViewer().waitForRender();

    // An unusable viewport would make the width-dependent polygon expectation meaningless.
    const mapSize = this.getMapViewer().map.getSize();
    if (!mapSize || mapSize[0] <= 0 || mapSize[1] <= 0) throw new Error('A usable map viewport is required to test extent filtering.');

    // A wider viewport includes a third polygon after the Ontario fit.
    const extentFilteredCount = mapSize[0] >= mapWidthWhenThreeFeaturesShow ? 3 : 2;

    test.addStep('Waiting for filter-results-summary to render...');
    const summaryEl = await DomHelper.DataTable.waitForFilterResultsSummary(this.getMapId());

    // Other table/visibility filters may remain active; extent filtering must restore this baseline, not assume four visible rows.
    const summaryTextBeforeExtent = summaryEl.textContent;

    // Keep the summary element across both toggles so the observations come from the same mounted table.
    this.getControllersRegistry().dataTableController.setFilterDataToExtent(layerPath, true);
    await DomHelper.waitForReactIdle();
    test.addStep('Reading filter-results-summary with extent filter ON...');
    const summaryTextEnabled = summaryEl.textContent;

    // Disabling extent filtering must restore the same summary observed before enabling it.
    this.getControllersRegistry().dataTableController.setFilterDataToExtent(layerPath, false);
    await DomHelper.waitForReactIdle();
    test.addStep('Reading filter-results-summary with extent filter OFF...');
    const summaryTextDisabled = summaryEl.textContent;

    return { extentFilteredCount, summaryTextBeforeExtent, summaryTextEnabled, summaryTextDisabled };
  }

  /**
   * Exercises the row-zoom UI and captures whether its feature highlight appears and expires.
   *
   * @param test - The test instance used to log scenario steps
   * @param layerPath - The generated GeoJSON layer path, included in setup errors
   * @returns Highlight presence before and after the expiry delay
   */
  async #zoomToRowAndWaitForHighlightExpiry(test: Test<GeoJsonDataTableResult>, layerPath: string): Promise<GeoJsonHighlightResult> {
    // Isolate the row-zoom highlight from highlights created by earlier interactions.
    const { mapController } = this.getControllersRegistry();
    mapController.removeHighlightedFeature('all');
    // Use the row's real UI action rather than adding a highlight directly through the controller.
    const zoomButton = DomHelper.DataTable.getFirstRowZoomButton(this.getMapId());
    if (!zoomButton) throw new Error(`No enabled row zoom button is available for ${layerPath}.`);

    // Subscribe before clicking so even a synchronously emitted highlight event is captured.
    test.addStep('Waiting for the row zoom highlight to appear...');
    const highlightPromise = mapController.onceFeatureHighlighted(
      // Ignore removal notifications and bulk-feature events that cannot identify the highlighted row.
      (event) => event.operation === 'added' && event.feature !== 'all' && Boolean(event.feature.uid)
    );
    test.addStep('Clicking the first row zoom button...');
    zoomButton.click();
    const highlightEvent = await highlightPromise;
    if (highlightEvent.feature === 'all' || !highlightEvent.feature.uid) {
      throw new Error(`No feature UID was included in the row zoom highlight event for ${layerPath}.`);
    }

    // Track the same feature through expiry instead of checking whether any highlight remains.
    const featureUid = highlightEvent.feature.uid;
    const highlightShown = getStoreMapHighlightedFeatures(this.getMapId()).some(
      (highlightedFeature) => highlightedFeature.uid === featureUid
    );
    // Allow a timing margin beyond automatic expiry without weakening the same-feature removal check.
    test.addStep('Waiting for the row zoom highlight to expire...');
    await delay(TIMEOUT.featureHighlight * 2);
    const highlightRemaining = getStoreMapHighlightedFeatures(this.getMapId()).some(
      (highlightedFeature) => highlightedFeature.uid === featureUid
    );

    return { highlightShown, highlightRemaining };
  }

  /**
   * Verifies the captured GeoJSON scenarios without reading the subsequently changed store.
   *
   * @param test - The test instance used to log assertions
   * @param result - The observations returned by the execution callback
   * @param expectedRowsFiltered - The expected synthetic row count
   * @param globalFilterValue - The expected global search value
   */
  static #assertGeoJsonDataTableResult(
    test: Test<GeoJsonDataTableResult>,
    result: GeoJsonDataTableResult,
    expectedRowsFiltered: number,
    globalFilterValue: string
  ): void {
    // Verify captured observations only; execution has already cleared or changed several of these states.
    test.addStep('Verifying allFeaturesDataArray has entries for the layer...');
    Test.assertIsArrayLengthEqual(result.geojsonData, 4);
    Test.assertIsDefined('columnVisibilityRecord', result.settings.columnVisibilityRecord);
    Test.assertIsEqual(result.settings.columnVisibilityRecord.geoviewID, false);

    test.addStep('Verifying mapFilteredRecord is true by default...');
    Test.assertIsEqual(result.mapFiltered, true);

    test.addStep('Verifying Province and geoviewID columns are hidden after toggling visibility...');
    Test.assertIsEqual(result.visibilityAfterHide.Province, false);
    Test.assertIsEqual(result.visibilityAfterHide.geoviewID, false);

    test.addStep(`Verifying rowsFilteredRecord was set to ${expectedRowsFiltered}...`);
    Test.assertIsEqual(result.rowsFilteredAfterSet, expectedRowsFiltered);

    // These counts reflect cumulative province, minimum-date, and maximum-date restrictions.
    test.addStep('Verifying polygons additional filters...');
    Test.assertIsEqual(result.provinceFilterCount, 2);
    Test.assertIsEqual(result.minDateFilterCount, 2);
    Test.assertIsEqual(result.maxDateFilterCount, 1);

    test.addStep('Verifying mapFilteredRecord was set to false...');
    Test.assertIsEqual(result.mapFilteredAfterSet, false);

    test.addStep(`Verifying global filter was set to '${globalFilterValue}'...`);
    Test.assertIsEqual(result.globalFilter, globalFilterValue);

    test.addStep('Verifying filter-map switch is disabled in DOM when global filter is active...');
    Test.assertIsEqual(result.isFilterMapDisabled, true);

    test.addStep(`Verifying extent filter shows "${result.extentFilteredCount} of 4 row(s) filtered"...`);
    Test.assertIsEqual(result.summaryTextEnabled?.includes(`${result.extentFilteredCount} of 4 row(s) filtered`), true);

    // Compare against the actual baseline so unrelated visibility/filter rules remain respected.
    test.addStep('Verifying disabling extent filtering restores the pre-extent summary...');
    Test.assertIsEqual(result.summaryTextDisabled, result.summaryTextBeforeExtent);

    // Both observations are required: an absent highlight from the start must not count as successful expiry.
    test.addStep('Verifying the row zoom highlight appeared and then expired...');
    Test.assertIsEqual(result.highlightShown, true);
    Test.assertIsEqual(result.highlightRemaining, false);
  }

  /**
   * Waits for a data table column filter value to be stored and for React to finish rendering.
   *
   * @param layerPath - The layer path whose filter should be checked
   * @param columnName - The column name whose filter should be checked
   * @param value - The filter value to wait for
   * @param bound - The range-filter bound to check, or undefined for a text filter
   */
  async #waitForDataTableColumnFilterInput(layerPath: string, columnName: string, value: string, bound?: 'Min' | 'Max'): Promise<void> {
    await whenThisThen(() => {
      const columnFilter = getStoreDataTableLayerSettings(this.getMapId())[layerPath]?.columnFiltersRecord.find(
        (filter) => filter.id.toLowerCase() === columnName.toLowerCase()
      );
      if (!columnFilter) return false;
      if (bound === undefined) return columnFilter.value === value;

      const rangeFilterIndex = bound === 'Min' ? 0 : 1;
      if (!Array.isArray(columnFilter.value)) return false;

      const filterValue: unknown = columnFilter.value[rangeFilterIndex];
      if (DateMgt.isDayjs(filterValue) && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return filterValue.format('YYYY-MM-DD') === value;
      }
      return String(filterValue) === value;
    });
    await DomHelper.waitForReactIdle();
  }

  // #endregion PRIVATE METHODS
}

// #region TYPES AND INTERFACES

/** Commemorative table state and column-filter snapshots before and after clearing. */
type CommemorativeDataTableResult = {
  commemorativeData: TypeFeatureInfoEntry[] | undefined;
  settings: IDataTableSettings;
  filtersBefore: TypeColumnFiltersState | undefined;
  filtersAfter: TypeColumnFiltersState | undefined;
};

/** Default GeoJSON settings and store setter observations. */
type GeoJsonSettingsResult = Pick<GeoJsonDataTableResult, 'settings' | 'mapFiltered' | 'visibilityAfterHide' | 'rowsFilteredAfterSet'>;

/** Column/global filter observations captured before the extent scenario. */
type GeoJsonFiltersResult = Pick<
  GeoJsonDataTableResult,
  'provinceFilterCount' | 'minDateFilterCount' | 'maxDateFilterCount' | 'mapFilteredAfterSet' | 'globalFilter' | 'isFilterMapDisabled'
>;

/** Extent-filter summary snapshots and the viewport-dependent expected count. */
type GeoJsonExtentResult = Pick<
  GeoJsonDataTableResult,
  'extentFilteredCount' | 'summaryTextBeforeExtent' | 'summaryTextEnabled' | 'summaryTextDisabled'
>;

/** Presence of the row-zoom highlight before and after expiry. */
type GeoJsonHighlightResult = Pick<GeoJsonDataTableResult, 'highlightShown' | 'highlightRemaining'>;

/** Initial GeoJSON table state, visibility/row-count updates, and filter observations. */
type GeoJsonDataTableResult = {
  geojsonData: TypeFeatureInfoEntry[] | undefined;
  settings: IDataTableSettings;
  mapFiltered: boolean | undefined;
  visibilityAfterHide: Record<string, boolean>;
  rowsFilteredAfterSet: number;
  mapFilteredAfterSet: boolean | undefined;
  globalFilter: string;
  isFilterMapDisabled: boolean;
  provinceFilterCount: number;
  minDateFilterCount: number;
  maxDateFilterCount: number;
  extentFilteredCount: number;
  summaryTextBeforeExtent: string | null;
  summaryTextEnabled: string | null;
  summaryTextDisabled: string | null;
  highlightShown: boolean;
  highlightRemaining: boolean;
};

// #endregion TYPES AND INTERFACES
