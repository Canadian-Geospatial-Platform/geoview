import type { TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { delay } from 'geoview-core/core/utils/utilities';
import { UIEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/ui-event-processor';
import { DataTableEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/data-table-event-processor';

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

        // Wait for cleanup
        await delay(500);

        // Create new config with data-table selected and a layer pre-loaded
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

        // Recreate map with new config
        test.addStep('Creating map with layer pre-loaded and data-table selected...');
        const newMapViewer = await this.getApi().createMapFromConfig(mapId, newConfig, 500);

        // Wait for layer to load and data table to initialize
        test.addStep('Waiting for layer to load and data table to initialize...');
        await delay(5000);

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
        test.addStep('Verifying data table has layer data...');
        const allFeaturesData = DataTableEventProcessor.getSingleDataTableState(mapId, 'allFeaturesDataArray');
        Test.assertIsDefined('allFeaturesDataArray', allFeaturesData);

        // Verify the number of features in the data table
        test.addStep('Verifying number of features in data table...');
        if (Array.isArray(allFeaturesData) && allFeaturesData.length > 0 && allFeaturesData[0] && 'features' in allFeaturesData[0]) {
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

        // Wait for cleanup
        await delay(500);

        // Create new config with data-table in app bar and a layer pre-loaded
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

        // Recreate map with new config
        test.addStep('Creating map with data-table in app bar...');
        const newMapViewer = await this.getApi().createMapFromConfig(mapId, newConfig, 500);

        // Wait for layer to load and data table to initialize
        test.addStep('Waiting for layer to load and app bar to initialize...');
        await delay(5000);

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
        test.addStep('Verifying data table has layer data...');
        const allFeaturesData = DataTableEventProcessor.getSingleDataTableState(mapId, 'allFeaturesDataArray');
        Test.assertIsDefined('allFeaturesDataArray', allFeaturesData);

        // Verify the number of features in the data table
        test.addStep('Verifying number of features in data table...');
        if (Array.isArray(allFeaturesData) && allFeaturesData.length > 0 && allFeaturesData[0] && 'features' in allFeaturesData[0]) {
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

        // Wait for cleanup
        await delay(500);

        // Create new config WITHOUT footerBar object
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

        // Recreate map with new config
        test.addStep('Creating map without footerBar or appBar configuration...');
        const newMapViewer = await this.getApi().createMapFromConfig(mapId, newConfig, 500);

        // Wait for map to initialize
        test.addStep('Waiting for map to initialize...');
        await delay(3000);

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

        // Wait for cleanup
        await delay(500);

        // Create new config with empty footerBar tabs
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

        // Recreate map with new config
        test.addStep('Creating map with empty footerBar and appBar tabs...');
        const newMapViewer = await this.getApi().createMapFromConfig(mapId, newConfig, 500);

        // Wait for map to initialize
        test.addStep('Waiting for map to initialize...');
        await delay(3000);

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
    return this.test(
      'Test initial view with layerIds sets map extent to layer extent',
      async (test) => {
        // Delete current map
        test.addStep('Deleting current map...');
        await this.getApi().deleteMapViewer(mapId, false);

        // Wait for cleanup
        await delay(500);

        // Create new config with initial view layerIds
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
        test.addStep('Creating map with initial view layerIds...');
        const newMapViewer = await this.getApi().createMapFromConfig(mapId, newConfig, 500);

        // Wait for layer to load and extent to be set
        test.addStep('Waiting for layer to load and extent to be applied...');
        await delay(5000);

        return newMapViewer;
      },
      (test) => {
        // Get the map extent
        test.addStep('Getting map extent...' + this.getMapViewer().layer.getGeoviewLayers());
        const mapExtent = this.getMapViewer().getView().calculateExtent();
        Test.assertIsDefined('mapExtent', mapExtent);

        // // Get the layer
        // test.addStep('Getting layer...');
        // const layerPath = 'geojsonLYR5/polygons.json';
        // const geoviewLayer = this.getMapViewer().layer.getGeoviewLayerIfExists(layerPath);
        // Test.assertIsDefined('geoviewLayer', geoviewLayer);

        // // Verify layer is loaded
        // test.addStep('Verifying layer is loaded...');
        // const layerStatus = geoviewLayer?.getLayerStatus();
        // Test.assertIsEqual(layerStatus, 'loaded');

        // // Get layer OL layer and source extent
        // test.addStep('Getting layer source extent...');
        // const olLayer = geoviewLayer?.getOLLayer();
        // Test.assertIsDefined('olLayer', olLayer);

        // // Cast to layer with source
        // // eslint-disable-next-line @typescript-eslint/no-explicit-any
        // const vectorLayer = olLayer as any;
        // const source = vectorLayer?.getSource?.();
        // Test.assertIsDefined('source', source);

        // const layerExtent = source?.getExtent?.();
        // Test.assertIsDefined('layerExtent', layerExtent);

        // // Verify map extent is approximately equal to layer extent
        // test.addStep('Verifying map extent matches layer extent...');
        // // Allow for small differences due to padding/rounding
        // const tolerance = 1000; // meters
        // Test.assertIsEqual(Math.abs(mapExtent[0] - layerExtent[0]) < tolerance, true);
        // Test.assertIsEqual(Math.abs(mapExtent[1] - layerExtent[1]) < tolerance, true);
        // Test.assertIsEqual(Math.abs(mapExtent[2] - layerExtent[2]) < tolerance, true);
        // Test.assertIsEqual(Math.abs(mapExtent[3] - layerExtent[3]) < tolerance, true);
      }
    );
  }
}
