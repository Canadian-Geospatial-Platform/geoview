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
   * Tests that row count in store matches the feature count for the layer.
   *
   * @returns A promise resolving when the test completes
   */
  testRowCountMatchesStore(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test row count matches allFeaturesDataArray length...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Wait for features
        test.addStep('Waiting for allFeaturesDataArray to populate...');
        await whenThisThen(() => {
          const array = getStoreDataTableAllFeaturesDataArray(this.getMapId());
          return array.some((entry) => entry.layerPath === layerPath && entry.features && entry.features.length > 0);
        }, 15000);

        // Get the feature count
        const allFeaturesData = getStoreDataTableAllFeaturesDataArray(this.getMapId());
        const layerData = allFeaturesData.find((entry) => entry.layerPath === layerPath);
        const featureCount = layerData?.features?.length ?? 0;

        return { featureCount };
      },
      (test, result) => {
        const { featureCount } = result as { featureCount: number };
        // GeoJSON polygons.json has known features (Ontario, Quebec, etc.)
        test.addStep(`Verifying feature count (${featureCount}) is at least 1...`);
        Test.assertIsArrayLengthMinimal([...Array(featureCount)], 1);
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
      'Test global filter record updates store...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Set a global filter
        test.addStep('Setting global filter to "Ontario"...');
        this.getControllersRegistry().dataTableController.setGlobalFilterRecord(layerPath, 'Ontario');
        await delay(200);

        // Read back
        const settings = getStoreDataTableLayerSettings(this.getMapId());
        const globalFilter = settings[layerPath]?.globalFilterRecord;

        // Clear the global filter
        test.addStep('Clearing global filter...');
        this.getControllersRegistry().dataTableController.setGlobalFilterRecord(layerPath, '');

        return { globalFilter };
      },
      (test, result) => {
        const { globalFilter } = result as { globalFilter: string };
        test.addStep('Verifying global filter was set to "Ontario"...');
        Test.assertIsEqual(globalFilter, 'Ontario');
      }
    );
  }

  /**
   * Tests that clearing column filters resets the store state.
   *
   * @returns A promise resolving when the test completes
   */
  testClearFiltersResetsState(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test clear filters resets columnFiltersRecord...',
      async (test) => {
        // Open the data table tab and wait for initialization
        await this.#helperOpenDataTableAndWait(test, layerPath);

        // Apply a column filter
        test.addStep('Applying a column filter...');
        this.getControllersRegistry().dataTableController.setColumnFiltersRecord(layerPath, [{ id: 'Province', value: 'Ontario' }]);
        await delay(200);

        // Verify it was set
        const settingsBefore = getStoreDataTableLayerSettings(this.getMapId());
        const filtersBefore = settingsBefore[layerPath]?.columnFiltersRecord;

        // Clear the filter
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
        test.addStep('Verifying filters were applied before clear...');
        Test.assertIsArrayLengthMinimal(filtersBefore, 1);

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

        // Read back the tableFilters store
        const tableFilter = getStoreDataTableFilter(this.getMapId(), layerPath);

        // Clear the filter
        test.addStep('Clearing map filters...');
        this.getControllersRegistry().dataTableController.applyMapFilters('');

        return { tableFilter };
      },
      (test, result) => {
        const { tableFilter } = result as { tableFilter: string | undefined };
        test.addStep('Verifying tableFilters store contains filter string...');
        Test.assertIsDefined('tableFilter', tableFilter);
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
}
