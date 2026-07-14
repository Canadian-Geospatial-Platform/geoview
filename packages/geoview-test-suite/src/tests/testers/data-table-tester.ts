import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { delay, whenThisThen } from 'geoview-core/core/utils/utilities';
import {
  getStoreDataTableAllFeaturesDataArray,
  getStoreDataTableLayerSettings,
  getStoreDataTableMapFilteredRecord,
  getStoreDataTableFilter,
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

  /**
   * Opens the data-table footer tab and waits for layer settings to initialize.
   *
   * @param test - The test instance for step logging
   * @param layerPath - The layer path to wait for
   */
  async #helperOpenDataTableAndWait<T>(test: Test<T>, layerPath: string): Promise<void> {
    // Open the data-table tab to trigger component mount
    test.addStep('Opening data-table footer tab...');
    this.getControllersRegistry().uiController.setActiveFooterBarTab('data-table');

    // Wait for the layer settings to be initialized by the component
    test.addStep('Waiting for data table layer settings to initialize...');
    await whenThisThen(() => {
      const settings = getStoreDataTableLayerSettings(this.getMapId());
      return settings[layerPath] !== undefined;
    }, 15000);

    // Select the layer in the data table
    test.addStep('Selecting layer in data table...');
    this.getControllersRegistry().dataTableController.setSelectedLayerPath(layerPath);
    await delay(500);
  }

  /**
   * Tests that allFeaturesDataArray is populated after layer loads.
   *
   * @returns A promise resolving when the test completes
   */
  testAllFeaturesDataArrayPopulated(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test allFeaturesDataArray is populated for GeoJSON layer...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Wait for the allFeaturesDataArray to have data for our layer
        test.addStep('Waiting for allFeaturesDataArray to populate...');
        await whenThisThen(() => {
          const array = getStoreDataTableAllFeaturesDataArray(this.getMapId());
          return array.some((entry) => entry.layerPath === layerPath && entry.features && entry.features.length > 0);
        }, 15000);

        // Get the features
        const allFeaturesData = getStoreDataTableAllFeaturesDataArray(this.getMapId());
        const layerData = allFeaturesData.find((entry) => entry.layerPath === layerPath);

        return layerData;
      },
      (test, result) => {
        test.addStep('Verifying allFeaturesDataArray has entries for the layer...');
        Test.assertIsDefined('layerData', result);
        const layerData = result as { features: unknown[] };
        Test.assertIsDefined('layerData.features', layerData.features);
        Test.assertIsArrayLengthMinimal(layerData.features, 1);
      }
    );
  }

  /**
   * Tests that row count in store matches the expected feature count for the Commemorative Map layer.
   *
   * @returns A promise resolving when the test completes
   */
  testRowCountMatchesStore(): Promise<Test<unknown>> {
    return this.test(
      'Test row count matches allFeaturesDataArray length for Commemorative Map...',
      async (test) => {
        // First find the layer path from whatever is already available
        test.addStep('Finding Commemorative Map layer path...');
        await whenThisThen(() => {
          const array = getStoreDataTableAllFeaturesDataArray(this.getMapId());
          return array.some((entry) => entry.layerPath.includes('ccc75c12'));
        }, 30000);

        const allFeaturesData = getStoreDataTableAllFeaturesDataArray(this.getMapId());
        const layerData = allFeaturesData.find((entry) => entry.layerPath.includes('ccc75c12'));
        const { layerPath } = layerData!;

        // Select the commemorative map layer in the data table (triggers feature query)
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Now wait for features to populate after selection
        test.addStep('Waiting for Commemorative Map features to populate...');
        await whenThisThen(() => {
          const array = getStoreDataTableAllFeaturesDataArray(this.getMapId());
          const entry = array.find((e) => e.layerPath === layerPath);
          return entry?.features !== undefined && entry.features.length > 0;
        }, 30000);

        // Read features
        const updatedData = getStoreDataTableAllFeaturesDataArray(this.getMapId());
        const updatedLayerData = updatedData.find((entry) => entry.layerPath === layerPath);

        return { featureCount: updatedLayerData?.features?.length ?? 0, layerPath };
      },
      (test, result) => {
        const { featureCount, layerPath } = result as { featureCount: number; layerPath: string | undefined };
        test.addStep(`Verifying Commemorative Map layer found (path: ${layerPath})...`);
        Test.assertIsDefined('layerPath', layerPath);

        test.addStep(`Verifying feature count is 598 (got ${featureCount})...`);
        Test.assertIsEqual(featureCount, 598);
      }
    );
  }

  /**
   * Tests that geoviewID column is hidden by default in layersDataTableSetting.
   *
   * @returns A promise resolving when the test completes
   */
  testGeoviewIdColumnHiddenByDefault(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

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
        const settings = result as { columnVisibilityRecord: Record<string, boolean> };
        Test.assertIsDefined('columnVisibilityRecord', settings.columnVisibilityRecord);
        Test.assertIsEqual(settings.columnVisibilityRecord.geoviewID, false);
      }
    );
  }

  /**
   * Tests that mapFilteredRecord is true by default for a layer.
   *
   * @returns A promise resolving when the test completes
   */
  testMapFilteredRecordDefault(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

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
        const { mapFiltered } = result as { mapFiltered: boolean | undefined };
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
  testSetMapFilteredRecordFalse(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test setting mapFilteredRecord to false...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Set to false
        test.addStep('Setting mapFilteredRecord to false...');
        this.getControllersRegistry().dataTableController.setMapFilteredRecord(layerPath, false);
        await delay(200);

        // Read back
        const mapFiltered = getStoreDataTableMapFilteredRecord(this.getMapId(), layerPath);

        // Restore to true
        test.addStep('Restoring mapFilteredRecord to true...');
        this.getControllersRegistry().dataTableController.setMapFilteredRecord(layerPath, true);

        return { mapFiltered };
      },
      (test, result) => {
        const { mapFiltered } = result as { mapFiltered: boolean | undefined };
        test.addStep('Verifying mapFilteredRecord was set to false...');
        Test.assertIsEqual(mapFiltered, false);
      }
    );
  }

  /**
   * Tests that setting a global filter updates the store.
   *
   * @returns A promise resolving when the test completes
   */
  testGlobalFilterRecord(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test global filter record updates store and disables map filter toggle...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Ensure mapFilteredRecord is true before setting global filter
        this.getControllersRegistry().dataTableController.setMapFilteredRecord(layerPath, true);
        await delay(200);

        // Set a global filter
        test.addStep('Setting global filter to "Ontario"...');
        this.getControllersRegistry().dataTableController.setGlobalFilterRecord(layerPath, 'Ontario');
        await delay(500);

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
        const { globalFilter, isFilterMapDisabled } = result as { globalFilter: string; isFilterMapDisabled: boolean };
        test.addStep('Verifying global filter was set to "Ontario"...');
        Test.assertIsEqual(globalFilter, 'Ontario');

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
  testClearFiltersResetsState(): Promise<Test<unknown>> {
    return this.test(
      'Test clear filters resets columnFiltersRecord on Commemorative Map...',
      async (test) => {
        // Find the Commemorative Map layer path
        test.addStep('Finding Commemorative Map layer path...');
        const allFeaturesData = getStoreDataTableAllFeaturesDataArray(this.getMapId());
        const layerData = allFeaturesData.find((entry) => entry.layerPath.includes('ccc75c12'));
        const { layerPath } = layerData!;

        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Set column filters in store (2 entries)
        test.addStep('Setting column filters (JUR_EN + CONFLICT_EN) in store...');
        this.getControllersRegistry().dataTableController.setColumnFiltersRecord(layerPath, [
          { id: 'JUR_EN', value: 'Ontario' },
          { id: 'CONFLICT_EN', value: 'First' },
        ]);
        await delay(200);

        // Verify they were set
        const settingsBefore = getStoreDataTableLayerSettings(this.getMapId());
        const filtersBefore = settingsBefore[layerPath]?.columnFiltersRecord;

        // Clear the filters
        test.addStep('Clearing column filters...');
        this.getControllersRegistry().dataTableController.setColumnFiltersRecord(layerPath, []);
        await delay(200);

        // Read back
        const settingsAfter = getStoreDataTableLayerSettings(this.getMapId());
        const filtersAfter = settingsAfter[layerPath]?.columnFiltersRecord;

        return { filtersBefore, filtersAfter };
      },
      (test, result) => {
        const { filtersBefore, filtersAfter } = result as { filtersBefore: unknown[]; filtersAfter: unknown[] };
        test.addStep('Verifying filters were set (2 entries)...');
        Test.assertIsArrayLengthEqual(filtersBefore, 2);

        test.addStep('Verifying filters are empty after clear...');
        Test.assertIsArrayLengthEqual(filtersAfter, 0);
      }
    );
  }

  /**
   * Tests that tableFilters store updates when applyMapFilters is called.
   *
   * @returns A promise resolving when the test completes
   */
  testTableFiltersStoreOnApply(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test tableFilters store updates after applyMapFilters...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Ensure mapFilteredRecord is true so filters will be applied
        this.getControllersRegistry().dataTableController.setMapFilteredRecord(layerPath, true);
        await delay(200);

        // Apply map filters with a filter string
        test.addStep('Applying map filters...');
        const filterString = '"Province" = \'Ontario\'';
        this.getControllersRegistry().dataTableController.applyMapFilters(filterString);
        await delay(500);

        // Read back the tableFilters store and feature count
        const tableFilter = getStoreDataTableFilter(this.getMapId(), layerPath);
        const allFeaturesData = getStoreDataTableAllFeaturesDataArray(this.getMapId());
        const layerData = allFeaturesData.find((entry) => entry.layerPath === layerPath);
        const featureCount = layerData?.features?.length ?? 0;

        // Clear the filter
        test.addStep('Clearing map filters...');
        this.getControllersRegistry().dataTableController.applyMapFilters('');

        return { tableFilter, featureCount };
      },
      (test, result) => {
        const { tableFilter, featureCount } = result as { tableFilter: string | undefined; featureCount: number };
        test.addStep('Verifying tableFilters store contains filter string...');
        Test.assertIsDefined('tableFilter', tableFilter);

        test.addStep(`Verifying filtered feature count is 4 (got ${featureCount})...`);
        Test.assertIsEqual(featureCount, 4);
      }
    );
  }

  /**
   * Tests that column visibility can be toggled in the store.
   *
   * @returns A promise resolving when the test completes
   */
  testColumnVisibilityToggle(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test column visibility toggle updates store...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Hide Province column
        test.addStep('Hiding Province column...');
        this.getControllersRegistry().dataTableController.setColumnVisibilityRecord(layerPath, { geoviewID: false, Province: false });
        await delay(200);

        // Read back
        const settings = getStoreDataTableLayerSettings(this.getMapId());
        const visibilityAfterHide = settings[layerPath]?.columnVisibilityRecord;

        // Restore
        test.addStep('Restoring column visibility...');
        this.getControllersRegistry().dataTableController.setColumnVisibilityRecord(layerPath, { geoviewID: false });

        return { visibilityAfterHide };
      },
      (test, result) => {
        const { visibilityAfterHide } = result as { visibilityAfterHide: Record<string, boolean> };
        test.addStep('Verifying Province column is hidden...');
        Test.assertIsEqual(visibilityAfterHide.Province, false);

        test.addStep('Verifying geoviewID column is still hidden...');
        Test.assertIsEqual(visibilityAfterHide.geoviewID, false);
      }
    );
  }

  /**
   * Tests that rowsFilteredRecord updates after setting a row count.
   *
   * @returns A promise resolving when the test completes
   */
  testRowsFilteredRecordCount(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test rowsFilteredRecord updates in store...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Set rows filtered count
        test.addStep('Setting rowsFilteredRecord to 3...');
        this.getControllersRegistry().dataTableController.setRowsFilteredRecord(layerPath, 3);
        await delay(200);

        // Read back
        const settings = getStoreDataTableLayerSettings(this.getMapId());
        const rowsFiltered = settings[layerPath]?.rowsFilteredRecord;

        // Reset
        test.addStep('Resetting rowsFilteredRecord to 0...');
        this.getControllersRegistry().dataTableController.setRowsFilteredRecord(layerPath, 0);

        return { rowsFiltered };
      },
      (test, result) => {
        const { rowsFiltered } = result as { rowsFiltered: number };
        test.addStep('Verifying rowsFilteredRecord is 3...');
        Test.assertIsEqual(rowsFiltered, 3);
      }
    );
  }

  /**
   * Tests that filter-by-extent toggle is absent for Esri Dynamic layers.
   *
   * @returns A promise resolving when the test completes
   */
  testFilterByExtentUnavailableForEsriDynamic(): Promise<Test<unknown>> {
    return this.test(
      'Test filter-by-extent toggle absent for Esri Dynamic layer...',
      async (test) => {
        // Find the Esri Dynamic (Forest Industry) layer path
        test.addStep('Finding Esri Dynamic layer path...');
        const allFeaturesData = getStoreDataTableAllFeaturesDataArray(this.getMapId());
        const layerData = allFeaturesData.find((entry) => entry.layerPath.includes('forest_industry'));

        // If not found by URL fragment, find by checking geoviewLayerType
        const esriDynamicLayerPath = layerData?.layerPath;
        Test.assertIsDefined('esriDynamicLayerPath', esriDynamicLayerPath);

        // Open the data table tab and select the Esri Dynamic layer
        await this.#helperOpenDataTableAndWait(test, esriDynamicLayerPath);

        // Wait for UI to render
        await delay(500);

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

        return { filterByExtentFound };
      },
      (test, result) => {
        const { filterByExtentFound } = result as { filterByExtentFound: boolean };
        test.addStep('Verifying filter-by-extent toggle is NOT present for Esri Dynamic...');
        Test.assertIsEqual(filterByExtentFound, false);
      }
    );
  }

  /**
   * Tests that filter-by-extent filters features to the current map extent on GeoJSON layer.
   *
   * @returns A promise resolving when the test completes
   */
  testFilterByExtentOnGeoJSON(): Promise<Test<unknown>> {
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
        this.getMapViewer().zoomToLonLatExtentOrCoordinate(GVAbstractTester.ONTARIO_EXTENT, false);

        // Wait for render after zoom
        await this.getMapViewer().waitForRender();
        await delay(1000);

        // Enable filter by extent and nudge map to trigger re-filtering
        test.addStep('Enabling filter by extent...');
        this.getControllersRegistry().dataTableController.setFilterDataToExtent(layerPath, true);
        this.getControllersRegistry().mapController.nudgeMapCenter(0.00001, 0);
        await delay(2000);

        // Read DOM summary text with filter enabled
        test.addStep('Reading filter-results-summary with extent filter ON...');
        const mapId = this.getMapId();
        const summaryElEnabled = document.querySelector(`#${mapId} .filter-results-summary`);
        const summaryTextEnabled = summaryElEnabled?.textContent ?? '';

        // Disable filter by extent and nudge to trigger reset
        test.addStep('Disabling filter by extent...');
        this.getControllersRegistry().dataTableController.setFilterDataToExtent(layerPath, false);
        this.getControllersRegistry().mapController.nudgeMapCenter(-0.00001, 0);
        await delay(2000);

        // Read DOM summary text with filter disabled
        test.addStep('Reading filter-results-summary with extent filter OFF...');
        const summaryElDisabled = document.querySelector(`#${mapId} .filter-results-summary`);
        const summaryTextDisabled = summaryElDisabled?.textContent ?? '';

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
  testShowUnsymbolizedFeaturesFalsePrefiltersTable(): Promise<Test<unknown>> {
    return this.test(
      'Test showUnsymbolizedFeatures false pre-filters data table (68 of 213)...',
      async (test) => {
        // Find the geocore layer (4baa66ad) path in allFeaturesDataArray
        test.addStep('Waiting for geocore layer (4baa66ad) to appear...');
        await whenThisThen(() => {
          const array = getStoreDataTableAllFeaturesDataArray(this.getMapId());
          return array.some((entry) => entry.layerPath.includes('4baa66ad'));
        }, 30000);

        const allFeaturesData = getStoreDataTableAllFeaturesDataArray(this.getMapId());
        const layerData = allFeaturesData.find((entry) => entry.layerPath.includes('4baa66ad'));
        const { layerPath } = layerData!;

        // Select the permafrost layer in the data table
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Wait for features to populate after selection
        test.addStep('Waiting for features to populate...');
        await whenThisThen(() => {
          const array = getStoreDataTableAllFeaturesDataArray(this.getMapId());
          const entry = array.find((e) => e.layerPath === layerPath);
          return entry?.features !== undefined && entry.features.length > 0;
        }, 30000);

        const updatedData = getStoreDataTableAllFeaturesDataArray(this.getMapId());
        const updatedLayerData = updatedData.find((entry) => entry.layerPath === layerPath);
        const featureCount = updatedLayerData?.features?.length ?? 0;

        // Check the DOM for the filter results summary text
        test.addStep('Checking DOM for filter-results-summary...');
        await delay(500);
        const mapId = this.getMapId();
        const summaryEl = document.querySelector(`#${mapId} .filter-results-summary`);
        const summaryText = summaryEl?.textContent ?? '';

        return { featureCount, layerPath, summaryText };
      },
      (test, result) => {
        const { layerPath, summaryText } = result as { featureCount: number; layerPath: string | undefined; summaryText: string };
        test.addStep(`Verifying geocore layer found (path: ${layerPath})...`);
        Test.assertIsDefined('layerPath', layerPath);

        test.addStep(`Verifying DOM summary shows "68 feature(s) showing (213 total)" (got "${summaryText}")...`);
        Test.assertIsEqual(summaryText.includes('68'), true);
        Test.assertIsEqual(summaryText.includes('213'), true);
      }
    );
  }
}
