import type { TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { UIEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/ui-event-processor';
import { DataTableEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/data-table-event-processor';
import { LegendEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/legend-event-processor';
import { delay } from 'geoview-core/core/utils/utilities';
import { MapEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/map-event-processor';

/**
 * Main Map Config testing class.
 * @extends {GVAbstractTester}
 */
export class MapConfigTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   * @returns {string} The name of the Tester.
   */
  override getName(): string {
    return 'MapConfigTester';
  }

  /**
   * Test data table with selectedDataTableLayerPath - Layer pre-loaded in config
   * This tests that the data table is created when a layer is specified in the config and data-table tab is selected
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testDataTableSelectedTabFooterBar(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test DataTable in footer bar with selectedDataTableLayerPath',
      async (test) => {
        // Create the mapViewer with footer bar config overrides
        const footerBarConfig = {
          tabs: { core: ['data-table'] },
          selectedTab: 'data-table',
          selectedDataTableLayerPath: 'geojsonLYR5/polygons.json',
        };

        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['footerBar', footerBarConfig]]);
        return mapViewer;
      },
      (test) => {
        // Verify the footer bar tab is selected
        test.addStep('Verifying data-table tab is selected in footer bar...');
        const activeTab = UIEventProcessor.getActiveFooterBarTab(mapId);
        Test.assertIsEqual(activeTab, 'data-table');

        // Verify the selected layer path in data table store
        test.addStep('Verifying selectedLayerPath in data table store...');
        const selectedLayerPath = DataTableEventProcessor.getSingleDataTableState(mapId, 'selectedLayerPath');
        Test.assertIsEqual(selectedLayerPath, 'geojsonLYR5/polygons.json');

        // Verify that layer data exists (table was created)
        test.addStep('Verifying data table is defined...');
        const allFeaturesData = DataTableEventProcessor.getSingleDataTableState(mapId, 'allFeaturesDataArray');
        Test.assertIsDefined('allFeaturesDataArray', allFeaturesData);

        // Verify if there is an array of data tables with content
        test.addStep('Verifying if there is a data-table array with a table inside...');
        Test.assertIsArray(allFeaturesData);
        Test.assertIsArrayLengthMinimal(allFeaturesData, 1);

        // Verify the number of features in the data table
        test.addStep('Verifying number of features in data table...');
        if ('features' in allFeaturesData[0]) {
          Test.assertIsArrayLengthMinimal(allFeaturesData[0].features as unknown[], 4);
        } else {
          Test.assertFail('No data table OR features data found in data table.');
        }
      }
    );
  }

  /**
   * Test data table with selectedDataTableLayerPath - Layer pre-loaded in config
   * This tests that the data table is created when a layer is specified in the config and data-table tab is selected in the app bar
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testDataTableSelectedTabAppBar(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test DataTable in app bar with selectedDataTableLayerPath',
      async (test) => {
        // Create the mapViewer with app bar config overrides
        const appBarConfig = {
          tabs: { core: ['data-table'] },
          selectedTab: 'data-table',
          selectedDataTableLayerPath: 'geojsonLYR5/polygons.json',
        };

        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['appBar', appBarConfig]]);
        return mapViewer;
      },
      (test) => {
        // Verify that data-table is not in footer tabs
        test.addStep('Verifying data-table is selected in app bar...');
        const activeTab = UIEventProcessor.getActiveAppBarTab(mapId);
        Test.assertIsEqual(activeTab.tabId, 'data-table');

        // Verify the selected layer path in data table store
        test.addStep('Verifying selectedLayerPath in data table store...');
        const selectedLayerPath = DataTableEventProcessor.getSingleDataTableState(mapId, 'selectedLayerPath');
        Test.assertIsEqual(selectedLayerPath, 'geojsonLYR5/polygons.json');

        // Verify that layer data exists (table was created)
        test.addStep('Verifying data table is defined...');
        const allFeaturesData = DataTableEventProcessor.getSingleDataTableState(mapId, 'allFeaturesDataArray');
        Test.assertIsDefined('allFeaturesDataArray', allFeaturesData);

        // Verify if there is an array of data tables with content
        test.addStep('Verifying if there si a data-table array with a table inside...');
        Test.assertIsArray(allFeaturesData);
        Test.assertIsArrayLengthMinimal(allFeaturesData, 1);

        // Verify the number of features in the data table
        test.addStep('Verifying number of features in data table...');
        if ('features' in allFeaturesData[0]) {
          Test.assertIsArrayLengthMinimal(allFeaturesData[0].features as unknown[], 4);
        } else {
          Test.assertFail('No data table OR features data found in data table.');
        }
      }
    );
  }

  /**
   * Test that no footerBar or app bar objects in config results in default footer bar tabs (layers, data-table)
   * and default app bar tabs (geolocator, legend, details, export)
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testNoFooterBarAppBarConfigHasDefaults(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test no footerBar or app bar config creates default tabs (layers, data-table) and (geolocator, legend, details, export)',
      async (test) => {
        // Create the mapViewer with footerBar and appBar removed
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [
          ['footerBar', null],
          ['appBar', null],
        ]);

        return mapViewer;
      },
      (test) => {
        // Verify that footer bar exists with default tabs
        test.addStep('Verifying footer bar has default tabs...');
        const footerBarTabs = UIEventProcessor.getFooterBarComponents(mapId);
        Test.assertIsDefined('footerBarTabs', footerBarTabs);

        // Verify default tabs are present (layers, data-table)
        test.addStep('Verifying default tabs include layers, data-table');
        Test.assertIsArrayEqual(footerBarTabs, ['layers', 'data-table']);

        // Verify that app bar exists with default tabs
        test.addStep('Verifying app bar has default tabs...');
        const appBarTabs = UIEventProcessor.getAppBarComponents(mapId);
        Test.assertIsDefined('appBarTabs', appBarTabs);

        // Verify default tabs are present (geolocator, legend, details, export)
        test.addStep('Verifying default tabs include geolocator, legend, details, export');
        Test.assertIsArrayEqual(appBarTabs, ['geolocator', 'legend', 'details', 'export']);
      }
    );
  }

  /**
   * Test that footerBar/appBar with empty tabs array results in no footer bar an empty app bar
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testEmptyFooterBarAppBarTabsHasNoFooter(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test footerBar with empty tabs array has no footer bar',
      async (test) => {
        // Create the mapViewer with empty tabs arrays
        const emptyTabsConfig = { tabs: { core: [] } };
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [
          ['footerBar', emptyTabsConfig],
          ['appBar', emptyTabsConfig],
        ]);

        return mapViewer;
      },
      (test) => {
        // Verify that footer bar has no tabs
        test.addStep('Verifying footer bar has no tabs...');
        const footerBarTabs = UIEventProcessor.getFooterBarComponents(mapId);
        Test.assertIsArrayLengthEqual(footerBarTabs, 0);

        // Verify that app bar has no tabs
        test.addStep('Verifying app bar has no tabs...');
        const appBarTabs = UIEventProcessor.getAppBarComponents(mapId);
        Test.assertIsArrayLengthEqual(appBarTabs, 0);
      }
    );
  }

  /**
   * Test that no navBar config value results in default navigation controls
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testNoNavBarHasDefaults(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test no navBar config value creates default navigation controls',
      async (test) => {
        // Create the mapViewer with navBar removed (null)
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['navBar', null]]);

        return mapViewer;
      },
      (test) => {
        // Verify that navBar exists with default controls
        test.addStep('Verifying navBar has default controls...');
        const navBarComponents = UIEventProcessor.getNavBarComponents(mapId);
        Test.assertIsDefined('navBarComponents', navBarComponents);

        // Verify default controls are present
        test.addStep('Verifying default controls exist in navBar...');
        Test.assertIsArrayEqual(navBarComponents, ['zoom', 'rotation', 'fullscreen', 'home', 'basemap-select']);
      }
    );
  }

  /**
   * Test that navBar with empty array results in only zoom and rotate controls
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testEmptyNavBarHasZoomRotate(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test navBar with empty array has only zoom and rotate',
      async (test) => {
        // Create the mapViewer with empty navBar array
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['navBar', []]]);

        return mapViewer;
      },
      (test) => {
        // Verify that navBar exists
        test.addStep('Verifying navBar exists...');
        const navBarComponents = UIEventProcessor.getNavBarComponents(mapId);
        Test.assertIsDefined('navBarComponents', navBarComponents);

        // Verify no buttons are present
        test.addStep('Verifying navBar has empty controls array...');
        Test.assertIsArrayEqual(navBarComponents, []);
      }
    );
  }

  /**
   * Test that initial view with layerIds sets map extent to layer extent
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testInitialViewLayerIdsSetExtent(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test<MapViewer>(
      'Test initial view with layerIds sets map extent to layer extent',
      async (test) => {
        // Replace initialView with layerIds only
        const initialViewConfig = { layerIds: ['geojsonLYR5/polygons.json'] };

        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['map.viewSettings.initialView', initialViewConfig]]);
        return mapViewer;
      },
      async (test, newMapViewer) => {
        // Get the map extent
        test.addStep('Getting map extent...');
        const mapExtent = newMapViewer.getView().calculateExtent();
        Test.assertIsDefined('mapExtent', mapExtent);

        // Get the layer bounds
        test.addStep('Getting layer bound extent...');
        const geoviewLayer = newMapViewer.layer.getGeoviewLayer('geojsonLYR5/polygons.json');
        Test.assertIsDefined('geoviewLayer', geoviewLayer);
        const layerExtent = LegendEventProcessor.getLayerBounds(this.getMapId(), 'geojsonLYR5/polygons.json');
        Test.assertIsArray(layerExtent);

        await delay(2000);

        test.addStep('Getting map extent after zoom...');
        const mapExtentLayer = newMapViewer.getView().calculateExtent();
        Test.assertIsDefined('mapExtent', mapExtentLayer);

        // Verify map extent is approximately equal to layer extent
        test.addStep('Verifying map extent matches layer extent east-west and north-south delta are equal...');
        Test.assertIsEqual<Number>(
          Math.round(Math.abs(mapExtentLayer[0] - layerExtent[0])),
          Math.round(Math.abs(mapExtentLayer[2] - layerExtent[2]))
        );
        Test.assertIsEqual<Number>(
          Math.round(Math.abs(mapExtentLayer[1] - layerExtent[1])),
          Math.round(Math.abs(mapExtentLayer[3] - layerExtent[3]))
        );
      }
    );
  }

  /**
   * Test that overlayObjects with pointMarkers are created on the map
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testOverlayObjectsPointMarkers(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test<MapViewer>(
      'Test overlayObjects with pointMarkers are created',
      async (test) => {
        // Create overlay objects configuration
        const overlayObjectsConfig = {
          pointMarkers: {
            cities: [
              {
                id: 'ottawa',
                coordinate: [-75.6972, 45.4215],
                color: '#FF0000',
                opacity: 0.8,
              },
              {
                id: 'toronto',
                coordinate: [-79.3832, 43.6532],
                color: '#0000FF',
                opacity: 0.8,
              },
            ],
          },
        };

        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['map.overlayObjects', overlayObjectsConfig]]);
        return mapViewer;
      },
      (test) => {
        // Verify that overlay pointsMMarkers objects exist
        test.addStep('Verifying pointMarkers objects are defined...');
        const pointsMMarkers = MapEventProcessor.getPointMarkers(mapId);
        Test.assertIsDefined('pointMarkers', pointsMMarkers);

        // Verify cities group exists
        test.addStep('Verifying cities pointMarkers group exists...');
        const cities = pointsMMarkers?.cities;
        Test.assertIsDefined('cities', pointsMMarkers.cities);

        // Verify Ottawa marker
        test.addStep('Verifying Ottawa marker exists...');
        const ottawaMarker = cities?.find((marker: { id: string }) => marker.id === 'ottawa');
        Test.assertIsDefined('ottawaMarker', ottawaMarker);

        // Verify Toronto marker
        test.addStep('Verifying Toronto marker exists...');
        const torontoMarker = cities?.find((marker: { id: string }) => marker.id === 'toronto');
        Test.assertIsDefined('torontoMarker', torontoMarker);

        // Verify number of markers
        test.addStep('Verifying there are 2 city markers...');
        Test.assertIsArrayLengthEqual(cities, 2);
      }
    );
  }

  /**
   * Test that viewSettings minZoom and maxZoom constraints are enforced
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testViewSettingsZoomConstraints(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test<MapViewer>(
      'Test viewSettings minZoom and maxZoom constraints',
      async (test) => {
        // Create view settings configuration with zoom constraints
        const viewSettingsConfig = {
          minZoom: 6,
          maxZoom: 8,
          projection: 3978,
        };

        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['map.viewSettings', viewSettingsConfig]]);
        return mapViewer;
      },
      async (test, mapViewer) => {
        // Get the map view
        const view = mapViewer.getView();

        // Test zooming to minimum allowed zoom (6)
        test.addStep('Testing zoom to minimum allowed level (6)...');
        mapViewer.setZoomLevel(6);
        await delay(500);
        const zoomAt6 = view.getZoom();
        Test.assertIsEqual(zoomAt6, 6);

        // Test zooming below minimum (4) - should be constrained to minZoom
        test.addStep('Testing zoom below minimum level (4) - should be constrained...');
        mapViewer.setZoomLevel(4);
        await delay(500);
        const zoomAt4 = view.getZoom();
        Test.assertIsEqual(zoomAt4, 6); // Should be constrained to minZoom

        // Test zooming to maximum allowed zoom (8)
        test.addStep('Testing zoom to maximum allowed level (8)...');
        mapViewer.setZoomLevel(8);
        await delay(500);
        const zoomAt8 = view.getZoom();
        Test.assertIsEqual(zoomAt8, 8);

        // Test zooming above maximum (10) - should be constrained to maxZoom
        test.addStep('Testing zoom above maximum level (10) - should be constrained...');
        mapViewer.setZoomLevel(10);
        await delay(500);
        const zoomAt10 = view.getZoom();
        Test.assertIsEqual(zoomAt10, 8); // Should be constrained to maxZoom
      }
    );
  }

  /**
   * Helper function to create a basic map configuration with optional overrides.
   * @param {[string, unknown][] | [string, unknown]} overrides - Can be:
   *   - Array of [path, value] pairs:
   *     [['footerBar', { tabs: { core: ['data-table'] }, selectedTab: 'data-table' }]]
   *   - Single [path, value] pair:
   *     ['map.viewSettings.initialView', { layerIds: ['geojsonLYR5/polygons.json'] }]
   * @returns {Promise<MapViewer>} The created map viewer
   * @private
   */
  async #helperCreateMapConfig(test: Test, mapId: string, overrides: [string, unknown][] | [string, unknown] = []): Promise<MapViewer> {
    const baseConfig = {
      map: {
        interaction: 'dynamic',
        viewSettings: { projection: 3978, initialView: { zoomAndCenter: [4.5, [-90, 60]] } },
        basemapOptions: { basemapId: 'transport', shaded: true, labeled: true },
        listOfGeoviewLayerConfig: [
          {
            geoviewLayerId: 'geojsonLYR5',
            geoviewLayerName: 'GeoJSON Sample',
            metadataAccessPath: GVAbstractTester.GEOJSON_METADATA_META,
            geoviewLayerType: 'GeoJSON' as TypeGeoviewLayerType,
            listOfLayerEntryConfig: [
              {
                layerId: 'polygons.json',
                layerName: 'Polygons',
              },
            ],
          },
        ],
      },
      components: [],
      corePackages: ['test-suite'],
      navBar: ['zoom', 'rotation', 'fullscreen', 'home', 'basemap-select'],
      corePackagesConfig: [
        {
          'test-suite': { suites: ['suite-map-config'] },
        },
      ],
      theme: 'geo.ca',
      footerBar: {
        tabs: {
          core: ['layers', 'data-table'],
        },
      },
      appBar: {
        tabs: {
          core: ['geolocator', 'legend', 'details', 'export'],
        },
      },
    };

    // Apply overrides - normalize to array format then apply each path-value pair
    const overridesArray = Array.isArray(overrides[0]) ? (overrides as [string, unknown][]) : [overrides as [string, unknown]];
    overridesArray.forEach(([path, value]) => {
      MapConfigTester.#setValueByPath(baseConfig, path, value);
    });

    // Delete current map
    test.addStep('Deleting current map...');
    await this.getApi().deleteMapViewer(mapId, false);

    // Wait for layer to load and data table to initialize
    test.addStep('Waiting for layer to load and data table to initialize...');
    const mapViewer = await this.getApi().createMapFromConfig(mapId, JSON.stringify(baseConfig), 500);
    await mapViewer.waitForLayersLoaded();

    test.addStep('Layers loaded');
    return mapViewer;
  }

  /**
   * Sets a value in an object using a dot-notation path. If value is null or undefined, removes the key.
   * @param {Record<string, unknown>} obj - The object to modify
   * @param {string} path - Dot-notation path like 'map.viewSettings.initialView'
   * @param {unknown} value - The value to set, or null/undefined to remove
   * @private
   */
  static #setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    let current = obj;

    // Navigate to the parent of the final key
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!(key in current) || typeof current[key] !== 'object' || current[key] === null) {
        current[key] = {};
      }
      current = current[key] as Record<string, unknown>;
    }

    const finalKey = keys[keys.length - 1];

    // If value is null or undefined, remove the key
    if (value === null || value === undefined) {
      delete current[finalKey];
    } else {
      current[finalKey] = value;
    }
  }
}
