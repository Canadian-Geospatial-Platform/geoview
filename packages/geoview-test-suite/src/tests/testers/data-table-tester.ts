import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import type { TypeFeatureInfoEntry } from 'geoview-core/api/types/map-schema-types';
import type { IDataTableSettings, TypeColumnFiltersState } from 'geoview-core/core/stores/states/data-table-state';
import { getStoreAppDisplayDateFormatDefault, getStoreAppDisplayLanguage } from 'geoview-core/core/stores/states/app-state';
import { getStoreLayerDisplayDateFormat } from 'geoview-core/core/stores/states/layer-state';
import { getStoreUIActiveFooterBarTab } from 'geoview-core/core/stores/states/ui-state';
import {
  getStoreDataTableFeaturesByPath,
  getStoreDataTableLayerSettings,
  getStoreDataTableMapFilteredRecord,
  getStoreDataTableRowsFilteredCount,
} from 'geoview-core/core/stores/states/data-table-state';
import { getStoreMapHighlightedFeatures } from 'geoview-core/core/stores/states/map-state';
import { TIMEOUT } from 'geoview-core/core/utils/constant';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { DateMgt } from 'geoview-core/core/utils/date-mgt';
import { delay, generateId, whenThisThen } from 'geoview-core/core/utils/utilities';
import { WMS } from 'geoview-core/geo/layer/geoview-layers/raster/wms';

/**
 * Main Data Table testing class.
 */
export class DataTableTester extends GVAbstractTester {
  /** The GeoJSON layer path used for data table tests. */
  static readonly GEOJSON_LAYER_PATH = 'geojsonLYR5/polygons.json';

  /** The GeoPackage layer path whose table contains an empty/blank field name (a column named ''). */
  static readonly GEOPACKAGE_EMPTY_FIELD_LAYER_PATH = 'railwaysEmptyField/carto_fer_debarcadere';

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
   * @param layerPath - The layer path to check
   * @param expectedCount - The expected number of feature entries
   * @returns A promise that resolves with the feature entries when the test completes
   */
  testAllFeaturesDataArrayPopulated(layerPath: string, expectedCount: number): Promise<Test<TypeFeatureInfoEntry[] | undefined>> {
    return this.test(
      `Test allFeaturesDataArray is populated for layer ${layerPath}...`,
      (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        return this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);
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
   * @param layerPath - The layer path whose column visibility settings are checked
   * @returns A promise that resolves with the layer data-table settings when the test completes
   */
  testGeoviewIdColumnHiddenByDefault(layerPath: string): Promise<Test<IDataTableSettings>> {
    return this.test(
      'Test geoviewID column hidden by default...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

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
   * Tests that a layer with an empty/blank field name renders the data table without crashing.
   *
   * A column with an empty id and an accessorFn crashes Material React Table ("Columns require an id when using an
   * accessorFn"). GeoPackage preserves a blank-named column verbatim, so opening its data table exercises the crash
   * path. The test passes when the data table is created (its table element renders) for the layer.
   *
   * @param layerPath - The layer path whose table contains an empty-named field
   * @returns A promise that resolves with whether the table rendered when the test completes
   */
  testEmptyFieldNameDoesNotCrashDataTable(layerPath: string): Promise<Test<boolean>> {
    return this.test(
      'Test empty field name renders the data table without crashing...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

        // Wait for the table element to render; MRT throws during render if a column has an empty id + accessorFn
        test.addStep('Waiting for the data table to be created...');
        const table = await DomHelper.DataTable.waitForDataTable(this.getMapId());

        // The table was created (rendered) for the layer
        return !!table;
      },
      (test, result) => {
        test.addStep('Verifying the data table was created without crashing...');
        Test.assertIsEqual(result, true);
      }
    );
  }

  /**
   * Tests that mapFilteredRecord is true by default for a layer.
   *
   * @returns A promise that resolves with the map-filter state when the test completes
   */
  testLayerDataIsFiltered(): Promise<Test<{ mapFiltered: boolean | undefined }>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test mapFilteredRecord is true by default...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

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
   * Tests province text filtering and minimum/maximum date filtering on the polygon layer.
   *
   * @returns A promise that resolves with the row counts after each filter
   */
  testPolygonsAdditionalFilters(): Promise<Test<{ provinceFilterCount: number; minDateFilterCount: number; maxDateFilterCount: number }>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;

    return this.test(
      'Test polygons additional filters...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

        // Find the data table column filter input for the 'name' column and set its value
        await this.setDataTableColumnFilterInput(test, layerPath, 'province', 'on');

        // Get the data table rows count after applying the name filter
        const provinceFilterCount = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);

        // Find the data table column filter input for the 'creationDate' column and set its minimum value
        await this.setDataTableColumnFilterInputMin(test, layerPath, 'creationDate', '2020-01-01');

        // Get the data table rows count after applying the minimum date filter
        const minDateFilterCount = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);

        // Find the data table column filter input for the 'creationDate' column and set its maximum value
        await this.setDataTableColumnFilterInputMax(test, layerPath, 'creationDate', '2020-03-01');

        // Get the data table rows count after applying the maximum date filter
        const maxDateFilterCount = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);

        // Return the row counts for each filter state
        return { provinceFilterCount, minDateFilterCount, maxDateFilterCount };
      },
      (test, result) => {
        test.addStep('Verifying polygons additional filters...');
        Test.assertIsEqual(result.provinceFilterCount, 2);
        Test.assertIsEqual(result.minDateFilterCount, 2);
        Test.assertIsEqual(result.maxDateFilterCount, 1);
      },
      async (test) => {
        // Reset the filters to none
        await this.clearDataTableFilters(test);
      }
    );
  }

  /**
   * Tests that setting mapFilteredRecord to false updates the store.
   *
   * @param layerPath - The layer path whose map-filter state is changed
   * @returns A promise that resolves with the map-filter state when the test completes
   */
  testSetMapFilteredRecordFalse(layerPath: string): Promise<Test<boolean | undefined>> {
    return this.test(
      'Test setting mapFilteredRecord to false...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

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
   * @param layerPath - The layer path whose global filter is changed
   * @param globalFilterValue - The global filter value to apply
   * @returns A promise that resolves with the filter value and switch state when the test completes
   */
  testGlobalFilterRecord(
    layerPath: string,
    globalFilterValue: string
  ): Promise<Test<{ globalFilter: string; isFilterMapDisabled: boolean }>> {
    return this.test(
      'Test global filter record updates store and disables map filter toggle...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

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
        const switchInputs = DomHelper.queryGVSelectorAll(mapId, '.MuiSwitch-input');
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
        this.finalizeStepRemoveLayerAndAssert(test, layerPath);
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
   * @param layerPath - The layer path whose column filters are changed
   * @param columnFilters - The column filters to set before clearing
   * @returns A promise that resolves with the filters before and after clearing
   */
  testClearFiltersResetsState(
    layerPath: string,
    columnFilters: TypeColumnFiltersState
  ): Promise<Test<{ filtersBefore: unknown[]; filtersAfter: unknown[] }>> {
    return this.test(
      'Test clear filters resets columnFiltersRecord...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

        // Set column filters in store
        test.addStep(`Setting ${columnFilters.length} active column filters and an empty range filter in the store...`);
        this.getControllersRegistry().dataTableController.setColumnFiltersRecord(layerPath, [
          ...columnFilters,
          { id: 'emptyRange', value: [undefined, undefined] },
        ]);

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
        test.addStep(`Verifying only the ${columnFilters.length} active filters are stored...`);
        Test.assertIsArrayLengthEqual(filtersBefore, columnFilters.length);

        test.addStep('Verifying filters are empty after clear...');
        Test.assertIsArrayLengthEqual(filtersAfter, 0);
      }
    );
  }

  /**
   * Tests that column visibility can be toggled in the store.
   *
   * @param layerPath - The layer path whose column visibility is changed
   * @param col1 - The first column ID expected to be hidden
   * @param col2 - The second column ID expected to remain hidden
   * @returns A promise that resolves with the column visibility record after hiding the columns
   */
  testColumnVisibilityToggle(layerPath: string, col1: string, col2: string): Promise<Test<Record<string, boolean>>> {
    return this.test(
      'Test column visibility toggle updates store...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

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
   * @param layerPath - The layer path whose filtered row count is changed
   * @param rows - The row count to set and verify
   * @returns A promise that resolves with the recorded row count
   */
  testRowsFilteredRecordCount(layerPath: string, rows: number): Promise<Test<number>> {
    return this.test(
      'Test rowsFilteredRecord updates in store...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

        // Set rows filtered count
        test.addStep(`Setting rowsFilteredRecord to ${rows}...`);
        this.getControllersRegistry().dataTableController.setRowsFilteredRecord(layerPath, rows);

        // Read back
        const rowsFiltered = getStoreDataTableRowsFilteredCount(this.getMapId(), layerPath);

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
   * @param layerPath - The Esri Dynamic layer path to check
   * @returns A promise that resolves with whether the filter-by-extent toggle is present
   */
  testFilterByExtentUnavailableForEsriDynamic(layerPath: string): Promise<Test<boolean>> {
    return this.test(
      'Test filter-by-extent toggle absent for Esri Dynamic layer...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

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
      }
    );
  }

  /**
   * Tests that filter-by-extent filters features to the current map extent on GeoJSON layer.
   *
   * @returns A promise that resolves with the summary text for both extent-filter states
   */
  testFilterByExtentOnGeoJSONOntario(): Promise<Test<unknown>> {
    const layerPath = DataTableTester.GEOJSON_LAYER_PATH;
    const MAP_WIDTH_WHEN_3_FEATURES_SHOW = 1747;

    return this.test(
      'Test filter-by-extent on GeoJSON layer (zoom to Ontario)...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

        // Force OL to recalculate viewport dimensions (needed when the map tab is hidden)
        this.getMapViewer().map.updateSize();

        // Zoom to Ontario using lonlat extent via MapViewer directly (same as console: cgpv.api.getMapViewer().zoomToLonLatExtentOrCoordinate)
        test.addStep('Zooming to Ontario extent...');
        await this.getMapViewer().zoomToLonLatExtentOrCoordinate(GVAbstractTester.ONTARIO_EXTENT, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for render after zoom
        await this.getMapViewer().waitForRender();

        // Get the dom element we want to track for changes
        test.addStep('Waiting for filter-results-summary to render...');
        const summaryEl = await DomHelper.DataTable.waitForFilterResultsSummary(this.getMapId());

        // Trigger the store change
        this.getControllersRegistry().dataTableController.setFilterDataToExtent(layerPath, true);

        // Wait for react to update the content
        await DomHelper.waitForReactIdle();

        // Read DOM summary text with filter enabled
        test.addStep('Reading filter-results-summary with extent filter ON...');
        const summaryTextEnabled = summaryEl.textContent;

        // Disable filter by extent
        this.getControllersRegistry().dataTableController.setFilterDataToExtent(layerPath, false);

        // Wait for react to update the content
        await DomHelper.waitForReactIdle();

        // Read DOM summary text with filter disabled
        test.addStep('Reading filter-results-summary with extent filter OFF...');
        const summaryTextDisabled = summaryEl.textContent;

        return { summaryTextEnabled, summaryTextDisabled };
      },
      (test, result) => {
        const { summaryTextEnabled, summaryTextDisabled } = result as { summaryTextEnabled: string; summaryTextDisabled: string };

        // If the map width is greater than map width when 3 features show
        let includeCount = '2';
        if (this.getMapViewer().map.getSize()![0] >= MAP_WIDTH_WHEN_3_FEATURES_SHOW) {
          includeCount = '3';
        }

        test.addStep(`Verifying extent filter shows "${includeCount} of 4 row(s) filtered" (got "${summaryTextEnabled}")...`);
        Test.assertIsEqual(summaryTextEnabled.includes(`${includeCount} of 4 row(s) filtered`), true);

        test.addStep(`Verifying without extent filter shows "3 of 4 row(s) filtered" (got "${summaryTextDisabled}")...`);
        Test.assertIsEqual(summaryTextDisabled.includes('3'), true);
        Test.assertIsEqual(summaryTextDisabled.includes('4'), true);
      }
    );
  }

  /**
   * Tests that a temporary zoom highlight (as used by the data table row zoom) is removed automatically.
   *
   * @returns A promise resolving when the test completes
   */
  testTemporaryZoomHighlightExpires(layerPath: string): Promise<Test<{ shown: boolean; remaining: boolean }>> {
    return this.test(
      'Test temporary zoom highlight is removed automatically...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);

        const { mapController } = this.getControllersRegistry();
        mapController.removeHighlightedFeature('all');

        const zoomButton = DomHelper.DataTable.getFirstRowZoomButton(this.getMapId());
        if (!zoomButton) throw new Error(`No enabled row zoom button is available for ${layerPath}.`);

        test.addStep('Clicking the first row zoom button...');
        zoomButton.click();

        test.addStep('Waiting for the row zoom highlight to appear...');
        const highlightEvent = await mapController.onceFeatureHighlighted(
          (event) => event.operation === 'added' && event.feature !== 'all' && Boolean(event.feature.uid)
        );
        if (highlightEvent.feature === 'all' || !highlightEvent.feature.uid) {
          throw new Error(`No feature UID was included in the row zoom highlight event for ${layerPath}.`);
        }

        // Get the feature uid from the highlight event
        const featureUid = highlightEvent.feature.uid;
        const shown = getStoreMapHighlightedFeatures(this.getMapId()).some((highlightedFeature) => highlightedFeature.uid === featureUid);

        test.addStep('Waiting for the row zoom highlight to expire...');
        await delay(TIMEOUT.featureHighlight * 2);
        const remaining = getStoreMapHighlightedFeatures(this.getMapId()).some(
          (highlightedFeature) => highlightedFeature.uid === featureUid
        );

        return { shown, remaining };
      },
      (test, result) => {
        test.addStep('Verifying the row zoom highlight appeared and then expired...');
        Test.assertIsEqual(result.shown, true);
        Test.assertIsEqual(result.remaining, false);
      },
      () => {
        this.getControllersRegistry().mapController.removeHighlightedFeature('all');
      }
    );
  }

  /**
   * Tests that showUnsymbolizedFeatures: false pre-filters the data table to exclude unsymbolized features.
   *
   * @param layerPath - The layer path whose unsymbolized features are excluded
   * @param countFilter - The expected number of features shown
   * @param countTotal - The expected total number of features
   * @returns A promise that resolves with the feature count and summary text
   */
  testShowUnsymbolizedFeaturesFalsePrefiltersTable(
    layerPath: string,
    countFilter: number,
    countTotal: number
  ): Promise<Test<{ featureCount: number; summaryText: string }>> {
    return this.test(
      'Test showUnsymbolizedFeatures false pre-filters data table (68 of 213)...',
      async (test) => {
        // Wait for layer registration and data-table to be loaded with the layer in question
        const features = await this.waitForLayerRegistrationAndOpenDataTableOnTheLayer(test, layerPath);
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

  // #endregion PUBLIC METHDOS

  // #region PRIVATE METHODS

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
