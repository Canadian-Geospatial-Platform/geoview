import type { TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { UIEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/ui-event-processor';
import { DataTableEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/data-table-event-processor';
import { LegendEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/legend-event-processor';
import { delay } from 'geoview-core/core/utils/utilities';

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
        // Delete current map
        test.addStep('Deleting current map...');
        await this.getApi().deleteMapViewer(mapId, false);

        // Create new config with data-table selected and a layer pre-loaded
        test.addStep('Creating map with layer pre-loaded and data-table selected...');
        const newConfig = JSON.stringify({
          map: {
            interaction: 'dynamic',
            viewSettings: { projection: 3978 },
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
          corePackagesConfig: [
            {
              'test-suite': { suites: ['suite-map-config'] },
            },
          ],
          theme: 'geo.ca',
          footerBar: {
            tabs: {
              core: ['legend', 'layers', 'details', 'data-table'],
            },
            selectedTab: 'data-table',
            selectedDataTableLayerPath: 'geojsonLYR5/polygons.json',
          },
        });

        // Wait for layer to load and data table to initialize
        test.addStep('Waiting for layer to load and data table to initialize...');
        const newMapViewer = await this.getApi()
          .createMapFromConfig(mapId, newConfig, 500)
          .then(
            (mapViewer) =>
              new Promise<MapViewer>((resolve) => {
                mapViewer.onMapLayersLoaded(() => {
                  test.addStep('Layers loaded');
                  resolve(mapViewer);
                });
              })
          );

        return newMapViewer;
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
        // Delete current map
        test.addStep('Deleting current map...');
        await this.getApi().deleteMapViewer(mapId, false);

        // Create new config with data-table in app bar and a layer pre-loaded
        test.addStep('Creating map with data-table in app bar...');
        const newConfig = JSON.stringify({
          map: {
            interaction: 'dynamic',
            viewSettings: { projection: 3978 },
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
          corePackagesConfig: [
            {
              'test-suite': { suites: ['suite-map-config'] },
            },
          ],
          theme: 'geo.ca',
          appBar: {
            tabs: {
              core: ['data-table'],
            },
            selectedTab: 'data-table',
            selectedDataTableLayerPath: 'geojsonLYR5/polygons.json',
          },
          footerBar: {
            tabs: {
              core: [],
            },
          },
        });

        // Wait for layer to load and data table to initialize
        test.addStep('Waiting for layer to load and app bar to initialize...');
        const newMapViewer = await this.getApi()
          .createMapFromConfig(mapId, newConfig, 500)
          .then(
            (mapViewer) =>
              new Promise<MapViewer>((resolve) => {
                mapViewer.onMapLayersLoaded(() => {
                  test.addStep('Layers loaded');
                  resolve(mapViewer);
                });
              })
          );

        return newMapViewer;
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
        // Delete current map
        test.addStep('Deleting current map...');
        await this.getApi().deleteMapViewer(mapId, false);

        // Create new config WITHOUT footerBar object
        test.addStep('Creating map without footerBar or appBar configuration...');
        const newConfig = JSON.stringify({
          map: {
            interaction: 'dynamic',
            viewSettings: { projection: 3978 },
            basemapOptions: { basemapId: 'transport', shaded: true, labeled: true },
          },
          components: [],
          corePackages: ['test-suite'],
          corePackagesConfig: [
            {
              'test-suite': { suites: ['suite-map-config'] },
            },
          ],
          theme: 'geo.ca',
          // No footerBar or appBar specified - should get defaults
        });

        // Wait for map to initialize
        test.addStep('Waiting for map to initialize...');
        const newMapViewer = await this.getApi()
          .createMapFromConfig(mapId, newConfig, 500)
          .then(
            (mapViewer) =>
              new Promise<MapViewer>((resolve) => {
                mapViewer.onMapLayersLoaded(() => {
                  test.addStep('Layers loaded');
                  resolve(mapViewer);
                });
              })
          );

        return newMapViewer;
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
        // Delete current map
        test.addStep('Deleting current map...');
        await this.getApi().deleteMapViewer(mapId, false);

        // Create new config with empty footerBar tabs
        test.addStep('Creating map with empty footerBar and appBar tabs...');
        const newConfig = JSON.stringify({
          map: {
            interaction: 'dynamic',
            viewSettings: { projection: 3978 },
            basemapOptions: { basemapId: 'transport', shaded: true, labeled: true },
          },
          components: [],
          corePackages: ['test-suite'],
          corePackagesConfig: [
            {
              'test-suite': { suites: ['suite-map-config'] },
            },
          ],
          theme: 'geo.ca',
          footerBar: {
            tabs: {
              core: [],
            },
          },
          appBar: {
            tabs: {
              core: [],
            },
          },
        });

        // Wait for map to initialize
        test.addStep('Waiting for map to initialize...');
        const newMapViewer = await this.getApi()
          .createMapFromConfig(mapId, newConfig, 500)
          .then(
            (mapViewer) =>
              new Promise<MapViewer>((resolve) => {
                mapViewer.onMapLayersLoaded(() => {
                  test.addStep('Layers loaded');
                  resolve(mapViewer);
                });
              })
          );

        return newMapViewer;
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
   * Test that initial view with layerIds sets map extent to layer extent
   * @returns {Promise<Test>} A Promise that resolves when the test completes successfully.
   */
  testInitialViewLayerIdsSetExtent(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test<MapViewer>(
      'Test initial view with layerIds sets map extent to layer extent',
      async (test) => {
        // Delete current map
        test.addStep('Deleting current map...');
        await this.getApi().deleteMapViewer(mapId, false);

        // Create new config with initial view layerIds
        test.addStep('Creating map with initial view layerIds...');
        const newConfig = JSON.stringify({
          map: {
            interaction: 'dynamic',
            viewSettings: {
              projection: 3978,
              initialView: {
                zoomAndCenter: [4, [0, 0]],
                layerIds: ['geojsonLYR5/polygons.json'],
              },
            },
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
          corePackagesConfig: [
            {
              'test-suite': { suites: ['suite-map-config'] },
            },
          ],
          theme: 'geo.ca',
          footerBar: {
            tabs: {
              core: ['legend', 'layers', 'details'],
            },
          },
        });

        // Recreate map with new config
        test.addStep('Waiting for map to initialize...');
        const newMapViewer = await this.getApi()
          .createMapFromConfig(mapId, newConfig, 500)
          .then(
            (mapViewer) =>
              new Promise<MapViewer>((resolve) => {
                mapViewer.onMapLayersLoaded(() => {
                  test.addStep('Layers loaded');
                  resolve(mapViewer);
                });
              })
          );

        return newMapViewer;
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
}
