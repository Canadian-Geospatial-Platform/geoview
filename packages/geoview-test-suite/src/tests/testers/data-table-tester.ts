import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import type { TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import type { IDataTableSettings, TypeColumnFiltersState } from 'geoview-core/core/stores/states/data-table-state';
import {
  getStoreDataTableFeaturesByPath,
  getStoreDataTableLayerSettings,
  getStoreDataTableMapFilteredRecord,
} from 'geoview-core/core/stores/states/data-table-state';

/**
 * Main Data Table testing class.
 */
export class DataTableTester extends GVAbstractTester {
  /** The GeoJSON layer path used for data table tests. */
  static readonly GEOJSON_LAYER_PATH = 'geojsonLYR5/polygons.json';

  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'DataTableTester';
  }

  // #region PUBLIC METHDOS

  /**
   * Tests that allFeaturesDataArray is populated after layer loads.
   *
   * @returns A promise resolving when the test completes
   */
  testAllFeaturesDataArrayPopulated(layerPath: string, expectedCount: number): Promise<Test<TypeFeatureInfoEntry[] | undefined>> {
    return this.test(
      `Test allFeaturesDataArray is populated for layer ${layerPath}...`,
      (test) => {
        // Open the data table tab and wait for initialization
        return this.#helperOpenDataTableAndWait(test, layerPath);
      },
      (test, result) => {
        test.addStep('Verifying allFeaturesDataArray has entries for the layer...');
        Test.assertIsArrayLengthEqual(result, expectedCount);
      }
    );
  }

  /**
   * Tests that geoviewID column is hidden by default in layersDataTableSetting.
   *
   * @returns A promise resolving when the test completes
   */
  testGeoviewIdColumnHiddenByDefault(layerPath: string): Promise<Test<IDataTableSettings>> {
    return this.test(
      'Test geoviewID column hidden by default...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Get the settings
        const settings = getStoreDataTableLayerSettings(this.getMapId());
        return settings[layerPath];
      },
      (test, result) => {
        test.addStep('Verifying geoviewID column visibility is false...');
        Test.assertIsDefined('layerSettings', result);
        Test.assertIsDefined('columnVisibilityRecord', result.columnVisibilityRecord);
        Test.assertIsEqual(result.columnVisibilityRecord.geoviewID, false);
      }
    );
  }

  /**
   * Tests that mapFilteredRecord is true by default for a layer.
   *
   * @returns A promise resolving when the test completes
   */
  testMapFilteredRecordDefault(layerPath: string): Promise<Test<{ mapFiltered: boolean | undefined }>> {
    return this.test(
      'Test mapFilteredRecord is true by default...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Get the value
        const mapFiltered = getStoreDataTableMapFilteredRecord(this.getMapId(), layerPath);
        return { mapFiltered };
      },
      (test, result) => {
        const { mapFiltered } = result;
        test.addStep('Verifying mapFilteredRecord is true by default...');
        Test.assertIsEqual(mapFiltered, true);
      }
    );
  }

  /**
   * Tests that setting mapFilteredRecord to false updates the store.
   *
   * @returns A promise resolving when the test completes
   */
  testSetMapFilteredRecordFalse(layerPath: string): Promise<Test<boolean | undefined>> {
    return this.test(
      'Test setting mapFilteredRecord to false...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Set to false
        test.addStep('Setting mapFilteredRecord to false...');
        this.getControllersRegistry().dataTableController.setMapFilteredRecord(layerPath, false);

        // Read back
        return getStoreDataTableMapFilteredRecord(this.getMapId(), layerPath);
      },
      (test, result) => {
        test.addStep('Verifying mapFilteredRecord was set to false...');
        Test.assertIsEqual(result, false);
      },
      (test) => {
        // Restore to true
        test.addStep('Restoring mapFilteredRecord to true...');
        this.getControllersRegistry().dataTableController.setMapFilteredRecord(layerPath, true);
      }
    );
  }

  /**
   * Tests that setting a global filter updates the store.
   *
   * @returns A promise resolving when the test completes
   */
  testGlobalFilterRecord(
    layerPath: string,
    globalFilterValue: string
  ): Promise<Test<{ globalFilter: string; isFilterMapDisabled: boolean }>> {
    return this.test(
      'Test global filter record updates store and disables map filter toggle...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Ensure mapFilteredRecord is true before setting global filter
        this.getControllersRegistry().dataTableController.setMapFilteredRecord(layerPath, true);

        // Set a global filter
        test.addStep(`Setting global filter to '${globalFilterValue}'...`);
        this.getControllersRegistry().dataTableController.setGlobalFilterRecord(layerPath, globalFilterValue);

        // Read back global filter value from store
        const settings = getStoreDataTableLayerSettings(this.getMapId());
        const globalFilter = settings[layerPath]?.globalFilterRecord;

        // Check the DOM for the disabled state of the filter-map switch
        // The Switch component renders with label text from t('dataTable.filterMap')
        // When disabled, the MUI Switch input element has the 'disabled' attribute
        test.addStep('Checking DOM for disabled filter-map switch...');
        const mapId = this.getMapId();
        const switchInputs = document.querySelectorAll(`#${mapId} .MuiSwitch-input`);
        let isFilterMapDisabled = false;
        switchInputs.forEach((input) => {
          if ((input as HTMLInputElement).disabled) {
            isFilterMapDisabled = true;
          }
        });

        // Clear the global filter
        test.addStep('Clearing global filter...');
        this.getControllersRegistry().dataTableController.setGlobalFilterRecord(layerPath, '');

        return { globalFilter, isFilterMapDisabled };
      },
      (test, result) => {
        const { globalFilter, isFilterMapDisabled } = result;
        test.addStep(`Verifying global filter was set to ${globalFilterValue}'...`);
        Test.assertIsEqual(globalFilter, globalFilterValue);

        test.addStep('Verifying filter-map switch is disabled in DOM when global filter is active...');
        Test.assertIsEqual(isFilterMapDisabled, true);
      }
    );
  }

  /**
   * Tests that column filters can be set and cleared in the store.
   *
   * NOTE: This test only verifies store-level set/clear. The MRT table does not react to programmatic
   * `setColumnFiltersRecord` changes — it manages its own internal filter state. Therefore, `rowsFilteredRecord`
   * cannot be verified here (it only updates when the user interacts with the filter UI directly).
   *
   * @returns A promise resolving when the test completes
   */
  testClearFiltersResetsState(
    layerPath: string,
    columnFilters: TypeColumnFiltersState
  ): Promise<Test<{ filtersBefore: unknown[]; filtersAfter: unknown[] }>> {
    return this.test(
      'Test clear filters resets columnFiltersRecord...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Set column filters in store
        test.addStep(`Setting column filters on ${columnFilters.length} columns in store...`);
        this.getControllersRegistry().dataTableController.setColumnFiltersRecord(layerPath, columnFilters);

        // Verify they were set
        const settingsBefore = getStoreDataTableLayerSettings(this.getMapId());
        const filtersBefore = settingsBefore[layerPath]?.columnFiltersRecord;

        // Clear the filters
        test.addStep('Clearing column filters...');
        this.getControllersRegistry().dataTableController.setColumnFiltersRecord(layerPath, []);

        // Read back
        const settingsAfter = getStoreDataTableLayerSettings(this.getMapId());
        const filtersAfter = settingsAfter[layerPath]?.columnFiltersRecord;

        return { filtersBefore, filtersAfter };
      },
      (test, result) => {
        const { filtersBefore, filtersAfter } = result;
        test.addStep(`Verifying filters were set (${columnFilters.length} entries)...`);
        Test.assertIsArrayLengthEqual(filtersBefore, columnFilters.length);

        test.addStep('Verifying filters are empty after clear...');
        Test.assertIsArrayLengthEqual(filtersAfter, 0);
      }
    );
  }

  /**
   * Tests that column visibility can be toggled in the store.
   *
   * @returns A promise resolving when the test completes
   */
  testColumnVisibilityToggle(layerPath: string, col1: string, col2: string): Promise<Test<Record<string, boolean>>> {
    return this.test(
      'Test column visibility toggle updates store...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Hide Province column
        test.addStep('Hiding Province column...');
        this.getControllersRegistry().dataTableController.setColumnVisibilityRecord(layerPath, { geoviewID: false, Province: false });

        // Read back
        const settings = getStoreDataTableLayerSettings(this.getMapId());
        const visibilityAfterHide = settings[layerPath]?.columnVisibilityRecord;

        // Restore
        test.addStep('Restoring column visibility...');
        this.getControllersRegistry().dataTableController.setColumnVisibilityRecord(layerPath, { geoviewID: false });

        return visibilityAfterHide;
      },
      (test, result) => {
        test.addStep(`Verifying ${col1} column is hidden...`);
        Test.assertIsEqual(result[col1], false);

        test.addStep(`Verifying ${col2} column is still hidden...`);
        Test.assertIsEqual(result[col2], false);
      }
    );
  }

  /**
   * Tests that rowsFilteredRecord updates after setting a row count.
   *
   * @returns A promise resolving when the test completes
   */
  testRowsFilteredRecordCount(layerPath: string, rows: number): Promise<Test<number>> {
    return this.test(
      'Test rowsFilteredRecord updates in store...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Set rows filtered count
        test.addStep(`Setting rowsFilteredRecord to ${rows}...`);
        this.getControllersRegistry().dataTableController.setRowsFilteredRecord(layerPath, rows);

        // Read back
        const settings = getStoreDataTableLayerSettings(this.getMapId());
        const rowsFiltered = settings[layerPath]?.rowsFilteredRecord;

        // Reset
        test.addStep('Resetting rowsFilteredRecord to 0...');
        this.getControllersRegistry().dataTableController.setRowsFilteredRecord(layerPath, 0);

        return rowsFiltered;
      },
      (test, result) => {
        test.addStep(`Verifying rowsFilteredRecord is ${rows}...`);
        Test.assertIsEqual(result, rows);
      }
    );
  }

  /**
   * Tests that filter-by-extent toggle is present for vector layers.
   *
   * @returns A promise resolving when the test completes
   */
  testFilterByExtentAvailableForVector(layerPath: string): Promise<Test<boolean>> {
    return this.test(
      'Test filter-by-extent toggle present for vector layer...',
      async (test) => {
        // Open the data table tab and select the vector layer
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Check DOM — FilterDataToExtent IS rendered for vector layers
        test.addStep('Checking DOM for presence of filter-by-extent switch...');
        const mapId = this.getMapId();
        const mapContainer = document.getElementById(mapId);
        const allSwitchLabels = mapContainer?.querySelectorAll('.MuiFormControlLabel-root') ?? [];
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
   * @returns A promise resolving when the test completes
   */
  testFilterByExtentUnavailableForEsriDynamic(layerPath: string): Promise<Test<boolean>> {
    return this.test(
      'Test filter-by-extent toggle absent for Esri Dynamic layer...',
      async (test) => {
        // Open the data table tab and select the Esri Dynamic layer
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Check DOM — FilterDataToExtent is NOT rendered for Esri Dynamic (conditional: {!isEsriDynamic && ...})
        // The component uses the label t('dataTable.filterDataToExtent') — look for its absence
        test.addStep('Checking DOM for absence of filter-by-extent switch...');
        const mapId = this.getMapId();
        const mapContainer = document.getElementById(mapId);
        const allSwitchLabels = mapContainer?.querySelectorAll('.MuiFormControlLabel-root') ?? [];
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
      }
    );
  }

  /**
   * Tests that filter-by-extent filters features to the current map extent on GeoJSON layer.
   *
   * @returns A promise resolving when the test completes
   */
  testFilterByExtentOnGeoJSONOntario(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test filter-by-extent on GeoJSON layer (zoom to Ontario)...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Force OL to recalculate viewport dimensions (needed when the map tab is hidden)
        this.getMapViewer().map.updateSize();

        // Zoom to Ontario using lonlat extent via MapViewer directly (same as console: cgpv.api.getMapViewer().zoomToLonLatExtentOrCoordinate)
        test.addStep('Zooming to Ontario extent...');
        await this.getMapViewer().zoomToLonLatExtentOrCoordinate(GVAbstractTester.ONTARIO_EXTENT, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for render after zoom
        await this.getMapViewer().waitForRender();

        // Get the dom element we want to track for changes
        test.addStep('Waiting for filter-results-summary to render...');
        const summaryEl = await GVAbstractTester.waitForDomElement(`#${this.getMapId()} .filter-results-summary`);

        // Start observing for DOM change, then trigger the store change
        test.addStep('Enabling filter by extent...');
        let domChanged = GVAbstractTester.waitForDomChange(summaryEl);
        this.getControllersRegistry().dataTableController.setFilterDataToExtent(layerPath, true);

        // Wait for the UI to react to the store change
        await domChanged;

        // Read DOM summary text with filter enabled
        test.addStep('Reading filter-results-summary with extent filter ON...');
        const summaryTextEnabled = summaryEl.textContent;

        // Start observing for DOM change, then disable filter by extent
        test.addStep('Disabling filter by extent...');
        domChanged = GVAbstractTester.waitForDomChange(summaryEl);
        this.getControllersRegistry().dataTableController.setFilterDataToExtent(layerPath, false);

        // Wait for the UI to react to the store change
        await domChanged;

        // Read DOM summary text with filter disabled
        test.addStep('Reading filter-results-summary with extent filter OFF...');
        const summaryTextDisabled = summaryEl.textContent;

        return { summaryTextEnabled, summaryTextDisabled };
      },
      (test, result) => {
        const { summaryTextEnabled, summaryTextDisabled } = result as { summaryTextEnabled: string; summaryTextDisabled: string };
        test.addStep(`Verifying extent filter shows "2 feature(s)" (got "${summaryTextEnabled}")...`);
        Test.assertIsEqual(summaryTextEnabled.includes('2'), true);

        test.addStep(`Verifying without extent filter shows "3 of 4 row(s) filtered" (got "${summaryTextDisabled}")...`);
        Test.assertIsEqual(summaryTextDisabled.includes('3'), true);
        Test.assertIsEqual(summaryTextDisabled.includes('4'), true);
      }
    );
  }

  /**
   * Tests that showUnsymbolizedFeatures: false pre-filters the data table to exclude unsymbolized features.
   *
   * @returns A promise resolving when the test completes
   */
  testShowUnsymbolizedFeaturesFalsePrefiltersTable(
    layerPath: string,
    countFilter: number,
    countTotal: number
  ): Promise<Test<{ featureCount: number; summaryText: string }>> {
    return this.test(
      'Test showUnsymbolizedFeatures false pre-filters data table (68 of 213)...',
      async (test) => {
        // Select the permafrost layer in the data table
        const features = await this.#helperOpenDataTableAndWait(test, layerPath);
        const featureCount = features?.length ?? 0;

        // Wait for the dom element we want to check for content
        test.addStep('Waiting for filter-results-summary to render with the content...');
        const summaryEl = await GVAbstractTester.waitForDomElement(`#${this.getMapId()} .filter-results-summary`);

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
      }
    );
  }

  // #endregion PUBLIC METHDOS

  // #region PRIVATE METHDOS

  /**
   * Opens the data-table footer tab and waits for layer settings to initialize.
   *
   * @param test - The test instance for step logging
   * @param layerPath - The layer path to wait for
   */
  async #helperOpenDataTableAndWait<T>(test: Test<T>, layerPath: string): Promise<TypeFeatureInfoEntry[] | undefined> {
    // Open the data-table tab to trigger component mount
    test.addStep('Opening data-table footer tab...');
    this.getControllersRegistry().uiController.setActiveFooterBarTab('data-table');

    // Wait for the layer to be queried and data-table filled
    test.addStep('Wait for the layer path to be registered...');
    await this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet.waitForLayerToGetRegistered(layerPath);

    // Select the layer in the data table
    test.addStep('Selecting layer in data-table...');
    this.getControllersRegistry().dataTableController.setSelectedLayerPath(layerPath);

    // Wait for the layer to be queried and data-table filled
    test.addStep('Wait for the layer data to be processed in the data-table...');
    await this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet.waitForLayerQueryToFinish(layerPath);

    // Read features in the store
    return getStoreDataTableFeaturesByPath(this.getMapId(), layerPath);
  }

  // #endregion PRIVATE METHDOS
}
