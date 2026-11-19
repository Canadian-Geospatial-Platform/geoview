import type { Coordinate } from 'ol/coordinate';

import { Test } from '../core/test';
import { TestError } from '../core/exceptions';
import { GVAbstractTester } from './abstract-gv-tester';
import type { TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
import type { TypeViewportBoundaryLonLat } from 'geoview-core/api/types/map-schema-types';
import {
  MAP_CENTER,
  MAP_ZOOM_LEVEL,
  type TypeFeatureInfoEntry,
  type TypeInteraction,
  type TypeValidMapProjectionCodes,
} from 'geoview-core/api/types/map-schema-types';
import { InvalidViewportMidpointsError, MapViewportUnavailableError } from 'geoview-core/core/exceptions/geoview-exceptions';
import { CancelledError } from 'geoview-core/core/exceptions/core-exceptions';
import {
  getStoreUIActiveAppBarTab,
  getStoreUIActiveFooterBarTab,
  getStoreUIAppBarComponents,
  getStoreUIFooterBarComponents,
  getStoreUINavBarComponents,
} from 'geoview-core/core/stores/states/ui-state';
import {
  getStoreDataTableAllFeaturesDataArray,
  getStoreDataTableSelectedLayerPath,
} from 'geoview-core/core/stores/states/data-table-state';
import {
  getStoreLayerBounds,
  getStoreLayerControls,
  getStoreLayerLegendLayerByPath,
  getStoreLayerSelectedLayerPath,
  getStoreLayerItemVisibility,
} from 'geoview-core/core/stores/states/layer-state';
import { DomHelper } from 'geoview-core/core/utils/dom-helper';
import { deepMerge } from 'geoview-core/core/utils/utilities';
import {
  getStoreMapPointMarkers,
  getStoreMapConfigOverviewMap,
  getStoreMapConfigComponents,
  getStoreMapStateJson,
  getStoreMapNorthArrow,
} from 'geoview-core/core/stores/states/map-state';
import type { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { Projection } from 'geoview-core/geo/utils/projection';

/** Fixed map height used by map config layout tests. */
const MAP_CONFIG_TEST_HEIGHT = 500;

/**
 * Main Map Config testing class.
 */
export class MapConfigTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'MapConfigTester';
  }

  /**
   * Tests Ontario/Alberta Details queries, visibility, feature zoom, nameField configuration, summary:false fields, and aliases.
   *
   * @returns A promise resolving with query results and zoom levels before and after zooming to a feature
   */
  testDetailsForGeoJSONOntarioAlberta(): Promise<Test<DetailsOntarioAlbertaResult>> {
    const layerPathFromMapConfig = 'geojsonLYR5/polygons.json';
    const nameField = 'creationDate';
    const aliasValue = 'Custom Province Name';

    // Both the Ontario fit and the row-zoom action change the view used by subsequent tests.
    const initialExtent = this.getMapViewer().getView().calculateExtent();

    // Test
    let gvLayer: AbstractGVLayer | undefined;
    let fixtureLayerPath: string | undefined;
    return this.test(
      `Test Details on Polygons layer...`,
      async (test) => {
        // Add the Polygons layer
        const fixture = this.addLayerGeoJSONWithMetadataPolygons(test);
        fixtureLayerPath = fixture.layerPath;
        gvLayer = await fixture.promiseLayer;

        const visibilityAndZoomResults = await this.#executeVisibilityAndZoomScenarios(test, gvLayer);
        const featureInfoResults = await this.#executeFeatureInfoConfigurationScenarios(
          test,
          layerPathFromMapConfig,
          nameField,
          aliasValue
        );

        return { ...visibilityAndZoomResults, ...featureInfoResults };
      },
      (test, results) => {
        MapConfigTester.#assertVisibilityAndZoomResults(test, results);
        MapConfigTester.#assertFeatureInfoConfigurationResults(test, results, nameField, aliasValue);
      },
      async (test) => {
        // Map recreation replaces the original fixture with this configured layer.
        // This removes the layer when test is cleaning up.
        if (fixtureLayerPath && this.getControllersRegistry().layerController.getLayerEntryConfigIfExists(fixtureLayerPath)) {
          this.removeLayerConfigAndAssert(test, fixtureLayerPath);
        }
        if (this.getControllersRegistry().layerController.getLayerEntryConfigIfExists(layerPathFromMapConfig)) {
          this.removeLayerConfigAndAssert(test, layerPathFromMapConfig);
        }

        // Restore the initial extent
        test.addStep('Restoring the initial map extent...');
        await this.getControllersRegistry().mapController.zoomToExtent(initialExtent, false);
      }
    );
  }

  /**
   * Runs the layer visibility and feature zoom scenarios for the Ontario/Alberta Details test.
   *
   * @param test - The test being executed
   * @param gvLayer - The GeoJSON layer used by the scenarios
   * @returns The query results and zoom levels captured by the scenarios
   */
  async #executeVisibilityAndZoomScenarios(
    test: Test<DetailsOntarioAlbertaResult>,
    gvLayer: AbstractGVLayer
  ): Promise<DetailsVisibilityAndZoomResult> {
    const layerPath = gvLayer.getLayerPath();
    const resultsOntarioResults = await this.queryAtCoordinateRetrieveResultsForLayer(
      test,
      gvLayer,
      GVAbstractTester.ONTARIO_CENTER_LONLAT
    );

    test.addStep(`Selecting the details for the added layer...`);
    this.getControllersRegistry().detailsController.setSelectedLayerPath(layerPath);

    test.addStep(`Make the layer invisible...`);
    gvLayer.setVisible(false);
    const resultsOntarioNoResults = await this.queryAtCoordinateRetrieveResultsForLayer(
      test,
      gvLayer,
      GVAbstractTester.ONTARIO_CENTER_LONLAT
    );

    test.addStep(`Make the layer visible...`);
    gvLayer.setVisible(true);
    const resultsAlbertaNoResults1 = await this.queryAtCoordinateRetrieveResultsForLayer(
      test,
      gvLayer,
      GVAbstractTester.ALBERTA_CENTER_LONLAT
    );

    let item = getStoreLayerItemVisibility(this.getMapId(), layerPath, 'Alberta')!;
    await this.getControllersRegistry().layerController.toggleItemVisibility(layerPath, item, true);
    const resultsAlbertaResults = await this.queryAtCoordinateRetrieveResultsForLayer(
      test,
      gvLayer,
      GVAbstractTester.ALBERTA_CENTER_LONLAT
    );

    item = getStoreLayerItemVisibility(this.getMapId(), layerPath, 'Alberta')!;
    await this.getControllersRegistry().layerController.toggleItemVisibility(layerPath, item, true);
    const resultsAlbertaNoResults2 = await this.queryAtCoordinateRetrieveResultsForLayer(
      test,
      gvLayer,
      GVAbstractTester.ALBERTA_CENTER_LONLAT
    );

    test.addStep('Recording initial zoom level...');
    const initialZoom = this.getMapViewer().getView().getZoom();
    const features = await this.queryAtCoordinateRetrieveResultsForLayer(test, gvLayer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
    test.addStep('Verifying feature has extent for zoom...');
    Test.assertIsDefined('features', features);
    Test.assertIsArrayLengthMinimal(features, 1);
    const feature = features[0];
    Test.assertIsDefined('feature.extent', feature.extent);

    test.addStep('Zooming to feature extent...');
    await this.getControllersRegistry().mapController.zoomToExtent(feature.extent, GVAbstractTester.USE_ZOOM_ANIMATION, {
      maxZoom: 13,
    });
    const finalZoom = this.getMapViewer().getView().getZoom();

    return {
      resultsOntarioResults,
      resultsOntarioNoResults,
      resultsAlbertaNoResults1,
      resultsAlbertaResults,
      resultsAlbertaNoResults2,
      initialZoom,
      finalZoom,
    };
  }

  /**
   * Runs the name-field, summary, and alias configuration scenarios.
   *
   * @param test - The test being executed
   * @param layerPath - The configured layer path to query
   * @param nameField - The date field used by the name-field and summary scenarios
   * @param aliasValue - The expected Province field alias
   * @returns The feature-info results from each map configuration
   */
  async #executeFeatureInfoConfigurationScenarios(
    test: Test<DetailsOntarioAlbertaResult>,
    layerPath: string,
    nameField: string,
    aliasValue: string
  ): Promise<DetailsFeatureInfoConfigurationResult> {
    test.addStep('Creating map with nameField configuration (date field)...');
    await this.#helperCreateMapWithFeatureInfoConfig(test, {
      queryable: true,
      nameField,
    });
    test.addStep('Getting the layer...');
    const configuredLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);
    const nameFieldResults = await this.queryAtCoordinateRetrieveResultsForLayer(
      test,
      configuredLayer,
      GVAbstractTester.ONTARIO_CENTER_LONLAT
    );

    test.addStep('Creating map with outfields summary:false configuration...');
    await this.#helperCreateMapWithFeatureInfoConfig(test, {
      queryable: true,
      nameField: 'Province',
      outfields: [
        { name: 'Province', type: 'string' },
        { name: nameField, type: 'date', summary: false },
      ],
    });
    test.addStep('Getting the layer...');
    const summaryLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);
    const summaryResults = await this.queryAtCoordinateRetrieveResultsForLayer(test, summaryLayer, GVAbstractTester.ONTARIO_CENTER_LONLAT);

    test.addStep('Creating map with outfields alias configuration...');
    await this.#helperCreateMapWithFeatureInfoConfig(test, {
      queryable: true,
      nameField: 'Province',
      outfields: [{ name: 'Province', alias: aliasValue, type: 'string' }],
    });
    test.addStep('Getting the layer...');
    const aliasLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(layerPath);
    const aliasResults = await this.queryAtCoordinateRetrieveResultsForLayer(test, aliasLayer, GVAbstractTester.ONTARIO_CENTER_LONLAT);

    return { nameFieldResults, summaryResults, aliasResults };
  }

  /**
   * Verifies the query results and zoom change for the visibility scenarios.
   *
   * @param test - The test being asserted
   * @param results - The scenario results
   */
  static #assertVisibilityAndZoomResults(test: Test<DetailsOntarioAlbertaResult>, results: DetailsOntarioAlbertaResult): void {
    test.addStep('Verifying there is 2 feature info result for the Ontario query...');
    Test.assertIsArrayLengthEqual(results.resultsOntarioResults, 2);

    test.addStep('Verifying there is 0 feature info result for the Ontario query...');
    Test.assertIsArrayLengthEqual(results.resultsOntarioNoResults, 0);

    test.addStep('Verifying there is 0 feature info result for the Alberta query...');
    Test.assertIsArrayLengthEqual(results.resultsAlbertaNoResults1, 0);

    test.addStep('Verifying there is 1 feature info result for the Alberta query...');
    Test.assertIsArrayLengthEqual(results.resultsAlbertaResults, 1);

    test.addStep('Verifying there is 0 feature info result for the Alberta query...');
    Test.assertIsArrayLengthEqual(results.resultsAlbertaNoResults2, 0);

    test.addStep('Verifying zoom level changed...');
    Test.assertIsNotEqual(results.initialZoom, results.finalZoom);
  }

  /**
   * Verifies the name-field, summary, and alias feature-info results.
   *
   * @param test - The test being asserted
   * @param results - The configuration scenario results
   * @param nameField - The date field used by the name-field and summary scenarios
   * @param aliasValue - The expected Province field alias
   */
  static #assertFeatureInfoConfigurationResults(
    test: Test<DetailsOntarioAlbertaResult>,
    results: DetailsOntarioAlbertaResult,
    nameField: string,
    aliasValue: string
  ): void {
    const { nameFieldResults, summaryResults, aliasResults } = results;
    test.addStep('Verifying query returned features...');
    Test.assertIsDefined('features', nameFieldResults);
    Test.assertIsArrayLengthMinimal(nameFieldResults, 1);

    test.addStep('Verifying nameField is set on result...');
    Test.assertIsEqual(nameFieldResults[0].nameField, nameField);

    test.addStep('Verifying query returned features...');
    Test.assertIsDefined('features', summaryResults);
    Test.assertIsArrayLengthMinimal(summaryResults, 1);

    test.addStep(`Verifying field '${nameField}' is excluded from fieldInfo...`);
    Test.assertIsUndefined(`fieldInfo.${nameField}`, summaryResults[0].fieldInfo[nameField]);

    test.addStep('Verifying Province field IS present in fieldInfo...');
    Test.assertIsDefined('fieldInfo.Province', summaryResults[0].fieldInfo.Province);

    test.addStep('Verifying query returned features...');
    Test.assertIsDefined('features', aliasResults);
    Test.assertIsArrayLengthMinimal(aliasResults, 1);

    test.addStep(`Verifying Province field alias is '${aliasValue}'...`);
    Test.assertIsDefined('fieldInfo.Province', aliasResults[0].fieldInfo.Province);
    Test.assertIsEqual(aliasResults[0].fieldInfo.Province.alias, aliasValue);
  }

  /**
   * Tests that a fixed-height map without a footer bar keeps the requested viewer height.
   *
   * @returns A promise that resolves when the test completes
   */
  testFixedHeightWithoutFooterBar(): Promise<Test<TypeMapHeightMeasurements>> {
    const mapId = this.getMapId();

    return this.test(
      'Test fixed-height map without footer bar keeps requested viewer height...',
      async (test) => {
        test.addStep('Creating fixed-height map with no footer bar...');
        await this.#helperCreateMapConfig(test, mapId, { footerBar: { tabs: { core: [] } } });

        test.addStep('Waiting for layout effects to settle...');
        await DomHelper.waitForReactIdle();

        return MapConfigTester.#measureMapHeights(mapId);
      },
      (test, result) => {
        test.addStep('Verifying root GeoView map height matches requested height...');
        Test.assertIsEqual(result.geoviewMapHeight, MAP_CONFIG_TEST_HEIGHT);

        test.addStep('Verifying there is no collapsed footer chrome height...');
        Test.assertIsEqual(result.footerChromeHeight, 0);
      }
    );
  }

  /**
   * Tests that a fixed-height map with a collapsed footer bar keeps the requested viewer height.
   *
   * @returns A promise that resolves when the test completes
   */
  testFixedHeightWithCollapsedFooterBar(): Promise<Test<TypeMapHeightMeasurements>> {
    const mapId = this.getMapId();

    return this.test(
      'Test fixed-height map with collapsed footer bar keeps requested viewer height...',
      async (test) => {
        test.addStep('Creating fixed-height map with default collapsed footer bar...');
        await this.#helperCreateMapConfig(test, mapId);

        test.addStep('Waiting for collapsed footer measurement to settle...');
        await DomHelper.waitForReactIdle();

        return MapConfigTester.#measureMapHeights(mapId);
      },
      (test, result) => {
        test.addStep('Verifying root GeoView map height matches requested height +/- 1...');
        Test.assertIsEqualWithinTolerance(result.geoviewMapHeight, MAP_CONFIG_TEST_HEIGHT, 1);

        test.addStep('Verifying collapsed footer chrome is rendered...');
        if (result.footerChromeHeight <= 0) Test.assertFail('Collapsed footer chrome height should be greater than 0.');
      }
    );
  }

  /**
   * Test data table with selectedDataTableLayerPath - Layer pre-loaded in config.
   *
   * This tests that the data table is created when a layer is specified in the config and data-table tab is selected.
   *
   * @returns A promise that resolves when the test completes
   */
  testDataTableSelectedTabFooterBar(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';

    // Test
    return this.test(
      'Test DataTable in footer bar with selectedDataTableLayerPath',
      async (test) => {
        // Create the mapViewer with footer bar config overrides
        const footerBarConfig = {
          tabs: { core: ['data-table'] },
          selectedTab: 'data-table',
          selectedDataTableLayerPath: LAYER_PATH,
        };

        // Create the map viewer from config
        await this.#helperCreateMapConfig(test, mapId, { footerBar: footerBarConfig });

        // GV The fact that the selectedLayerPath is already set, means a query needs to happen to populate the data table, but we need to wait for it to happen before checking the content of the data table store
        test.addStep('Waiting for the query in the data-table to get processed...');
        await this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet.waitForLayerQueryToFinish(LAYER_PATH);
      },
      (test) => {
        // Verify the footer bar tab is selected
        test.addStep('Verifying data-table tab is selected in footer bar...');
        const { tabId } = getStoreUIActiveFooterBarTab(mapId);
        Test.assertIsEqual(tabId, 'data-table');

        // Verify the selected layer path in data table store
        test.addStep('Verifying selectedLayerPath in data table store...');
        const selectedLayerPath = getStoreDataTableSelectedLayerPath(mapId);
        Test.assertIsEqual(selectedLayerPath, LAYER_PATH);

        // Verify that layer data exists (table was created)
        test.addStep('Verifying data table is defined...');
        const allFeaturesData = getStoreDataTableAllFeaturesDataArray(mapId);
        Test.assertIsDefined('allFeaturesDataArray', allFeaturesData);

        // Verify if there is an array of data tables with content
        test.addStep('Verifying if there is a data-table array with a table inside...');
        Test.assertIsArray(allFeaturesData);
        Test.assertIsArrayLengthMinimal(allFeaturesData, 1);

        // Verify the number of features in the data table
        test.addStep('Verifying number of features in data table...');
        if ('features' in allFeaturesData[0]) {
          Test.assertIsArrayLengthMinimal(allFeaturesData[0].features, 4);
        } else {
          Test.assertFail('No data table OR features data found in data table.');
        }
      }
    );
  }

  /**
   * Test selectedLayersLayerPath with a GeoCore UUID resolves to the first layer path in the store.
   *
   * A GeoCore layer can only be referenced by its bare UUID in the config, but its real path becomes `uuid/<layerId>`
   * at runtime. During config load the configured `selectedLayersLayerPath` is rewritten from the bare UUID to that
   * first resolved path, so the layers panel pre-selects the GeoCore layer (issue #3633).
   *
   * @returns A promise that resolves when the test completes
   */
  testSelectedLayersLayerPathGeoCoreResolution(): Promise<Test<MapViewer>> {
    const mapId = this.getMapId();
    const geocoreUuid = GVAbstractTester.AIRBORNE_RADIOACTIVITY_UUID;
    const expectedLayerPath = GVAbstractTester.AIRBORNE_RADIOACTIVITY_GROUP;

    // Test
    return this.test(
      'Test selectedLayersLayerPath with a GeoCore UUID resolves to the first layer path in the store',
      (test) => {
        // Pre-select the GeoCore layer in the layers tab using only its bare UUID
        const footerBarConfig = {
          tabs: { core: ['layers'] },
          selectedTab: 'layers',
          selectedLayersLayerPath: geocoreUuid,
        };
        const geocoreLayerConfig = [{ geoviewLayerType: 'geoCore' as TypeGeoviewLayerType, geoviewLayerId: geocoreUuid }];

        // Create the map viewer from config (waits for layers loaded)
        return this.#helperCreateMapConfig(test, mapId, {
          map: { listOfGeoviewLayerConfig: geocoreLayerConfig },
          footerBar: footerBarConfig,
        });
      },
      (test) => {
        // The bare UUID should have been rewritten to the first resolved layer path in the store selection
        test.addStep('Verifying the layers store selectedLayerPath resolved the UUID to its first layer path...');
        const selectedLayerPath = getStoreLayerSelectedLayerPath(mapId);
        Test.assertIsEqual(selectedLayerPath, expectedLayerPath);
      },
      (test) => {
        this.removeLayerConfigAndAssert(test, geocoreUuid);
      }
    );
  }

  /**
   * Test data table with selectedDataTableLayerPath - Layer pre-loaded in config.
   *
   * This tests that the data table is created when a layer is specified in the config and data-table tab is selected in the app bar.
   *
   * @returns A promise that resolves when the test completes
   */
  testDataTableSelectedTabAppBar(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';

    // Test
    return this.test(
      'Test DataTable in app bar with selectedDataTableLayerPath',
      async (test) => {
        // Create the mapViewer with app bar config overrides
        const appBarConfig = {
          tabs: { core: ['data-table'] },
          selectedTab: 'data-table',
          selectedDataTableLayerPath: LAYER_PATH,
        };

        // Create the map viewer from config
        await this.#helperCreateMapConfig(test, mapId, { appBar: appBarConfig });

        // GV The fact that the selectedLayerPath is already set, means a query needs to happen to populate the data table, but we need to wait for it to happen before checking the content of the data table store
        test.addStep('Waiting for the query in the data-table to get processed...');
        await this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet.waitForLayerQueryToFinish(LAYER_PATH);
      },
      (test) => {
        // Verify that data-table is not in footer tabs
        test.addStep('Verifying data-table is selected in app bar...');
        const activeTab = getStoreUIActiveAppBarTab(mapId);
        Test.assertIsEqual(activeTab.tabId, 'data-table');

        // Verify the selected layer path in data table store
        test.addStep('Verifying selectedLayerPath in data table store...');
        const selectedLayerPath = getStoreDataTableSelectedLayerPath(mapId);
        Test.assertIsEqual(selectedLayerPath, LAYER_PATH);

        // Verify that layer data exists (table was created)
        test.addStep('Verifying data table is defined...');
        const allFeaturesData = getStoreDataTableAllFeaturesDataArray(mapId);
        Test.assertIsDefined('allFeaturesDataArray', allFeaturesData);

        // Verify if there is an array of data tables with content
        test.addStep('Verifying if there is a data-table array with a table inside...');
        Test.assertIsArray(allFeaturesData);
        Test.assertIsArrayLengthMinimal(allFeaturesData, 1);

        // Verify the number of features in the data table
        test.addStep('Verifying number of features in data table...');
        if ('features' in allFeaturesData[0]) {
          Test.assertIsArrayLengthMinimal(allFeaturesData[0].features, 4);
        } else {
          Test.assertFail('No data table OR features data found in data table.');
        }
      }
    );
  }

  /**
   * Test that no footerBar or app bar objects in config results in default footer bar tabs (layers, data-table)
   * and default app bar tabs (geolocator, legend, details, export).
   *
   * @returns A promise that resolves when the test completes
   */
  testNoFooterBarAppBarConfigHasDefaults(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test no footerBar or app bar config creates default tabs (layers, data-table) and (geolocator, legend, details, export)',
      async (test) => {
        // Create the mapViewer with footerBar and appBar removed
        await this.#helperCreateMapConfig(test, mapId, { footerBar: null, appBar: null });

        return;
      },
      (test) => {
        // Verify that footer bar exists with default tabs
        test.addStep('Verifying footer bar has default tabs...');
        const footerBarTabs = getStoreUIFooterBarComponents(mapId);
        Test.assertIsDefined('footerBarTabs', footerBarTabs);

        // Verify default tabs are present (layers, data-table)
        test.addStep('Verifying default tabs include layers, data-table');
        Test.assertIsArrayEqual(footerBarTabs, ['layers', 'data-table']);

        // Verify that app bar exists with default tabs
        test.addStep('Verifying app bar has default tabs...');
        const appBarTabs = getStoreUIAppBarComponents(mapId);
        Test.assertIsDefined('appBarTabs', appBarTabs);

        // Verify default tabs are present (geolocator, legend, details, export)
        test.addStep('Verifying default tabs include geolocator, legend, details, export');
        Test.assertIsArrayEqual(appBarTabs, ['geolocator', 'legend', 'details', 'export']);
      }
    );
  }

  /**
   * Test that footerBar/appBar with empty tabs array results in no footer bar an empty app bar.
   *
   * @returns A promise that resolves when the test completes
   */
  testEmptyFooterBarAppBarTabsHasNoFooter(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test footerBar with empty tabs array has no footer bar',
      async (test) => {
        // Create the mapViewer with empty tabs arrays
        const emptyTabsConfig = { tabs: { core: [] } };
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { footerBar: emptyTabsConfig, appBar: emptyTabsConfig });

        return mapViewer;
      },
      (test) => {
        // Verify that footer bar has no tabs
        test.addStep('Verifying footer bar has no tabs...');
        const footerBarTabs = getStoreUIFooterBarComponents(mapId);
        Test.assertIsArrayLengthEqual(footerBarTabs, 0);

        // Verify that app bar has no tabs
        test.addStep('Verifying app bar has no tabs...');
        const appBarTabs = getStoreUIAppBarComponents(mapId);
        Test.assertIsArrayLengthEqual(appBarTabs, 0);
      }
    );
  }

  /**
   * Test that a panel declared in both appBar and footerBar is kept in the app bar and removed from the footer bar.
   *
   * @returns A promise that resolves when the test completes
   */
  testDuplicatedPanelsRemovedFromFooter(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test panels declared in both appBar and footerBar are removed from the footer bar',
      async (test) => {
        // Create the mapViewer with 'legend' and 'details' declared in BOTH bars
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, {
          appBar: { tabs: { core: ['geolocator', 'legend', 'details'] } },
          footerBar: { tabs: { core: ['legend', 'layers', 'details', 'data-table'] } },
        });

        return mapViewer;
      },
      (test) => {
        // Verify the duplicated panels were removed from the footer bar
        test.addStep('Verifying duplicated panels removed from footer bar...');
        const footerBarTabs = getStoreUIFooterBarComponents(mapId);
        Test.assertArrayExcludes(footerBarTabs, 'legend');
        Test.assertArrayExcludes(footerBarTabs, 'details');
        Test.assertArrayIncludes(footerBarTabs, 'layers');
        Test.assertArrayIncludes(footerBarTabs, 'data-table');

        // Verify the duplicated panels were kept in the app bar
        test.addStep('Verifying duplicated panels kept in app bar...');
        const appBarTabs = getStoreUIAppBarComponents(mapId);
        Test.assertArrayIncludes(appBarTabs, 'legend');
        Test.assertArrayIncludes(appBarTabs, 'details');
      }
    );
  }

  /**
   * Test that no navBar config value results in default navigation controls.
   *
   * @returns A promise that resolves when the test completes
   */
  testNoNavBarHasDefaults(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test no navBar config value creates default navigation controls',
      async (test) => {
        // Create the mapViewer with navBar removed (null)
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { navBar: null });

        return mapViewer;
      },
      (test) => {
        // Verify that navBar exists with default controls
        test.addStep('Verifying navBar has default controls...');
        const navBarComponents = getStoreUINavBarComponents(mapId);
        Test.assertIsDefined('navBarComponents', navBarComponents);

        // Verify default controls are present
        test.addStep('Verifying default controls exist in navBar...');
        Test.assertIsArrayEqual(navBarComponents, ['zoom', 'rotation', 'fullscreen', 'home', 'basemap-select']);
      }
    );
  }

  /**
   * Test that navBar with empty array results in only zoom and rotate controls.
   *
   * @returns A promise that resolves when the test completes
   */
  testEmptyNavBarHasZoomRotate(): Promise<Test> {
    const mapId = this.getMapId();

    // Test
    return this.test(
      'Test navBar with empty array has only zoom and rotate',
      async (test) => {
        // Create the mapViewer with empty navBar array
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { navBar: [] });

        return mapViewer;
      },
      (test) => {
        // Verify that navBar exists
        test.addStep('Verifying navBar exists...');
        const navBarComponents = getStoreUINavBarComponents(mapId);
        Test.assertIsDefined('navBarComponents', navBarComponents);

        // Verify no buttons are present
        test.addStep('Verifying navBar has empty controls array...');
        Test.assertIsArrayEqual(navBarComponents, []);
      }
    );
  }

  /**
   * Test that initial view with layerIds sets map extent to layer extent.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialViewLayerIdsSetExtent(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';

    // Test
    return this.test<MapViewer>(
      'Test initial view with layerIds sets map extent to layer extent',
      async (test) => {
        // Replace initialView with layerIds only
        const initialViewConfig = { layerIds: [LAYER_PATH] };

        // Create a new map viewer from a new config
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { map: { viewSettings: { initialView: initialViewConfig } } });

        // Wait for the zoom to happen on the map upon initialization
        await mapViewer.waitForMapReadyZoomed();

        // Return the map viewer
        return mapViewer;
      },
      (test, newMapViewer) => {
        // Get the map extent
        const mapExtent = newMapViewer.getView().calculateExtent();
        test.addStep(`Getting map extent after zoom...${mapExtent}`);
        Test.assertIsDefined('mapExtent', mapExtent);

        // Get the layer bounds
        const layerExtent = getStoreLayerBounds(this.getMapId(), LAYER_PATH);
        test.addStep(`Getting layer bounds extent... ${layerExtent}`);
        Test.assertIsArray(layerExtent);

        // Verify the layer extent is centered within the map extent (equal buffer on each axis)
        // Left buffer = layerExtent[0] - mapExtent[0], Right buffer = mapExtent[2] - layerExtent[2]
        const leftBuffer = layerExtent[0] - mapExtent[0];
        const rightBuffer = mapExtent[2] - layerExtent[2];
        const bottomBuffer = layerExtent[1] - mapExtent[1];
        const topBuffer = mapExtent[3] - layerExtent[3];

        // Map extent must contain layer extent (all buffers >= 0)
        test.addStep('Verifying map extent contains layer extent (buffers >= 0)...');
        if (leftBuffer < -1 || rightBuffer < -1 || bottomBuffer < -1 || topBuffer < -1) {
          Test.assertFail(
            `Map extent does not contain layer extent. Buffers: L=${leftBuffer}, R=${rightBuffer}, B=${bottomBuffer}, T=${topBuffer}`
          );
        }

        // Verify horizontal centering: left buffer ≈ right buffer
        test.addStep(`Verifying horizontal centering... ${Math.round(leftBuffer)} vs ${Math.round(rightBuffer)}`);
        Test.assertIsEqual(Math.round(leftBuffer), Math.round(rightBuffer));

        // Verify vertical centering: bottom buffer ≈ top buffer
        test.addStep(`Verifying vertical centering... ${Math.round(bottomBuffer)} vs ${Math.round(topBuffer)}`);
        Test.assertIsEqual(Math.round(bottomBuffer), Math.round(topBuffer));
      }
    );
  }

  /**
   * Test that overlayObjects with pointMarkers are created on the map.
   *
   * @returns A promise that resolves when the test completes
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

        // Create a new map viewer from a new config
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { map: { overlayObjects: overlayObjectsConfig } });
        return mapViewer;
      },
      (test) => {
        // Verify that overlay pointsMMarkers objects exist
        test.addStep('Verifying pointMarkers objects are defined...');
        const pointsMMarkers = getStoreMapPointMarkers(mapId);
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
   * Test that viewSettings minZoom and maxZoom constraints are enforced.
   *
   * @returns A promise that resolves when the test completes
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

        // Create a new map viewer from a new config
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { map: { viewSettings: viewSettingsConfig } });
        return mapViewer;
      },
      (test, newMapViewer) => {
        // Get the map view
        const view = newMapViewer.getView();

        // Test zooming to minimum allowed zoom (6)
        test.addStep('Testing zoom to minimum allowed level (6)...');
        newMapViewer.setMapZoomLevel(6);
        const zoomAt6 = view.getZoom();
        Test.assertIsEqual(zoomAt6, 6);

        // Test zooming below minimum (4) - should be constrained to minZoom
        test.addStep('Testing zoom below minimum level (4) - should be constrained...');
        newMapViewer.setMapZoomLevel(4);
        const zoomAt4 = view.getZoom();
        Test.assertIsEqual(zoomAt4, 6); // Should be constrained to minZoom

        // Test zooming to maximum allowed zoom (8)
        test.addStep('Testing zoom to maximum allowed level (8)...');
        newMapViewer.setMapZoomLevel(8);
        const zoomAt8 = view.getZoom();
        Test.assertIsEqual(zoomAt8, 8);

        // Test zooming above maximum (10) - should be constrained to maxZoom
        test.addStep('Testing zoom above maximum level (10) - should be constrained...');
        newMapViewer.setMapZoomLevel(10);
        const zoomAt10 = view.getZoom();
        Test.assertIsEqual(zoomAt10, 8); // Should be constrained to maxZoom
      }
    );
  }

  /**
   * Test that overview map is present when 'overview-map' is in components config.
   *
   * @returns A promise that resolves when the test completes
   */
  testOverviewMapPresent(): Promise<Test> {
    const mapId = this.getMapId();

    return this.test(
      'Test overview map is present when configured in components',
      async (test) => {
        // Create the mapViewer with overview-map in components
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { components: ['overview-map', 'north-arrow'] });
        return mapViewer;
      },
      async (test) => {
        // Wait for the overview map to become visible (hideOnZoom=0 means always visible once initialized)
        test.addStep('Waiting for overview map to initialize...');
        await this.getControllersRegistry().mapController.waitForOverviewMapVisibility(true);

        // Verify overview-map is in the components config
        test.addStep('Verifying overview-map is in components config...');
        const components = getStoreMapConfigComponents(mapId);
        Test.assertIsDefined('components', components);
        Test.assertArrayIncludes(components, 'overview-map');

        // Verify overview map config exists with default hideOnZoom of 0
        test.addStep('Verifying overview map config has hideOnZoom 0...');
        const overviewMapConfig = getStoreMapConfigOverviewMap(mapId);
        Test.assertIsDefined('overviewMapConfig', overviewMapConfig);
        Test.assertIsEqual(overviewMapConfig.hideOnZoom, 0);

        // Verify overview map visibility is true (hideOnZoom=0 means always visible)
        test.addStep('Verifying overview map is visible...');
        const isVisible = this.getControllersRegistry().mapController.getOverviewMapVisibility();
        Test.assertIsEqual(isVisible, true);
      }
    );
  }

  /**
   * Test that overview map is absent when 'overview-map' is not in components config.
   *
   * @returns A promise that resolves when the test completes
   */
  testOverviewMapAbsent(): Promise<Test> {
    const mapId = this.getMapId();

    return this.test(
      'Test overview map is absent when not in components',
      async (test) => {
        // Create the mapViewer with only north-arrow (no overview-map)
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { components: ['north-arrow'] });
        return mapViewer;
      },
      (test) => {
        // No need to wait — overview map was never created, visibility defaults to false

        // Verify overview-map is NOT in the components config
        test.addStep('Verifying overview-map is not in components config...');
        const components = getStoreMapConfigComponents(mapId);
        Test.assertIsDefined('components', components);
        Test.assertArrayExcludes(components, 'overview-map');

        // Verify overview map visibility is false
        test.addStep('Verifying overview map is not visible...');
        const isVisible = this.getControllersRegistry().mapController.getOverviewMapVisibility();
        Test.assertIsEqual(isVisible, false);
      }
    );
  }

  /**
   * Test that north arrow is present when 'north-arrow' is in components config.
   *
   * @returns A promise that resolves when the test completes
   */
  testNorthArrowPresent(): Promise<Test> {
    const mapId = this.getMapId();

    return this.test(
      'Test north arrow is present when configured in components',
      async (test) => {
        // Create the mapViewer with north-arrow in components
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { components: ['north-arrow'] });
        return mapViewer;
      },
      (test) => {
        // Verify north-arrow is in the components config
        test.addStep('Verifying north-arrow is in components config...');
        const components = getStoreMapConfigComponents(mapId);
        Test.assertIsDefined('components', components);
        Test.assertArrayIncludes(components, 'north-arrow');

        // Verify northArrow boolean is true in the store
        test.addStep('Verifying northArrow is true in the store...');
        const northArrow = getStoreMapNorthArrow(mapId);
        Test.assertIsEqual(northArrow, true);

        // Verify the north arrow SVG exists inside the map target element (not the map-info rotation section)
        test.addStep('Verifying north arrow SVG exists inside mapTargetElement...');
        const northArrowEl = DomHelper.getNorthArrowSVG(mapId);
        Test.assertIsDefined('northArrowDomElement', northArrowEl);
      }
    );
  }

  /**
   * Test that north arrow is absent when 'north-arrow' is not in components config.
   *
   * @returns A promise that resolves when the test completes
   */
  testNorthArrowAbsent(): Promise<Test> {
    const mapId = this.getMapId();

    return this.test(
      'Test north arrow is absent when not in components',
      async (test) => {
        // Create the mapViewer with empty components (no north-arrow)
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { components: [] });
        return mapViewer;
      },
      (test) => {
        // Verify north-arrow is NOT in the components config
        test.addStep('Verifying north-arrow is not in components config...');
        const components = getStoreMapConfigComponents(mapId);
        Test.assertIsDefined('components', components);
        Test.assertArrayExcludes(components, 'north-arrow');

        // Verify northArrow boolean is false in the store
        test.addStep('Verifying northArrow is false in the store...');
        const northArrow = getStoreMapNorthArrow(mapId);
        Test.assertIsEqual(northArrow, false);

        // Verify the north arrow SVG does NOT exist inside the map target element
        test.addStep('Verifying north arrow SVG does not exist inside mapTargetElement...');
        const northArrowEl = DomHelper.getNorthArrowSVG(mapId);
        Test.assertIsUndefined('northArrowDomElement', northArrowEl ?? undefined);
      }
    );
  }

  /**
   * Test that hideOnZoom config hides the overview map at low zoom and shows it above the threshold.
   *
   * @returns A promise that resolves when the test completes
   */
  testOverviewMapHideOnZoom(): Promise<Test> {
    const mapId = this.getMapId();

    return this.test(
      'Test overview map hideOnZoom hides at low zoom, shows above threshold',
      async (test) => {
        // Create the mapViewer with overview-map and hideOnZoom=7, initial zoom 4.5
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, {
          components: ['overview-map', 'north-arrow'],
          overviewMap: { hideOnZoom: 7 },
        });
        return mapViewer;
      },
      async (test) => {
        // Verify hideOnZoom config is set to 7
        test.addStep('Verifying hideOnZoom config is 7...');
        const overviewMapConfig = getStoreMapConfigOverviewMap(mapId);
        Test.assertIsDefined('overviewMapConfig', overviewMapConfig);
        Test.assertIsEqual(overviewMapConfig.hideOnZoom, 7);

        // At initial zoom 4.5, overview map should be hidden (below threshold of 7)
        // Wait for the overview map useEffect to settle (it sets visibility to false)
        test.addStep('Waiting for overview map to initialize and be hidden at zoom 4.5...');
        await this.getControllersRegistry().mapController.waitForOverviewMapVisibility(false);

        test.addStep('Verifying overview map is hidden at zoom 4.5 (below threshold 7)...');
        const isVisibleAtLowZoom = this.getControllersRegistry().mapController.getOverviewMapVisibility();
        Test.assertIsEqual(isVisibleAtLowZoom, false);

        // Zoom to 8 (above threshold)
        test.addStep('Zooming to level 8 (above threshold)...');
        await this.getControllersRegistry().mapController.zoomMap(8, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for the React useEffect to update visibility
        await this.getControllersRegistry().mapController.waitForOverviewMapVisibility(true);

        // Verify overview map is now visible
        test.addStep('Verifying overview map is visible at zoom 8...');
        const isVisibleAtHighZoom = this.getControllersRegistry().mapController.getOverviewMapVisibility();
        Test.assertIsEqual(isVisibleAtHighZoom, true);

        // Zoom back to 4 (below threshold)
        test.addStep('Zooming back to level 4 (below threshold)...');
        await this.getControllersRegistry().mapController.zoomMap(4, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for visibility to turn false
        await this.getControllersRegistry().mapController.waitForOverviewMapVisibility(false);

        // Verify overview map is hidden again
        test.addStep('Verifying overview map is hidden again at zoom 4...');
        const isVisibleBackToLow = this.getControllersRegistry().mapController.getOverviewMapVisibility();
        Test.assertIsEqual(isVisibleBackToLow, false);
      }
    );
  }

  /**
   * Test that overview map visibility is correctly preserved through a projection change cycle with hideOnZoom.
   *
   * @returns A promise that resolves when the test completes
   */
  testOverviewMapHideOnZoomWithReprojection(): Promise<Test> {
    const mapId = this.getMapId();

    return this.test(
      'Test overview map hideOnZoom with reprojection preserves visibility',
      async (test) => {
        // Create the mapViewer with overview-map, hideOnZoom=7, projection 3978
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, {
          components: ['overview-map', 'north-arrow'],
          overviewMap: { hideOnZoom: 7 },
        });
        return mapViewer;
      },
      async (test) => {
        // Zoom to 8 (above threshold) so overview map is visible
        test.addStep('Zooming to level 8 (above threshold)...');
        await this.getControllersRegistry().mapController.zoomMap(8, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for overview map to become visible
        await this.getControllersRegistry().mapController.waitForOverviewMapVisibility(true);

        // Verify overview map is visible at zoom 8
        test.addStep('Verifying overview map is visible at zoom 8...');
        const isVisibleBefore = this.getControllersRegistry().mapController.getOverviewMapVisibility();
        Test.assertIsEqual(isVisibleBefore, true);

        // Reproject to 3857
        test.addStep('Reprojecting to EPSG:3857...');
        await this.getControllersRegistry().mapController.setProjection(3857);

        // Wait for overview map visibility to be restored after reprojection
        await this.getControllersRegistry().mapController.waitForOverviewMapVisibility(true);

        // Verify overview map visibility is restored after reprojection
        test.addStep('Verifying overview map is visible after reprojection to 3857...');
        const isVisibleAfterReproject = this.getControllersRegistry().mapController.getOverviewMapVisibility();
        Test.assertIsEqual(isVisibleAfterReproject, true);

        // Zoom below threshold in 3857
        test.addStep('Zooming to level 4 in 3857 (below threshold)...');
        await this.getControllersRegistry().mapController.zoomMap(4, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for visibility to turn false
        await this.getControllersRegistry().mapController.waitForOverviewMapVisibility(false);

        // Verify overview map is hidden
        test.addStep('Verifying overview map is hidden at zoom 4 in 3857...');
        const isVisibleLowIn3857 = this.getControllersRegistry().mapController.getOverviewMapVisibility();
        Test.assertIsEqual(isVisibleLowIn3857, false);

        // Reproject back to 3978
        test.addStep('Reprojecting back to EPSG:3978...');
        await this.getControllersRegistry().mapController.setProjection(3978);

        // Wait for reprojection to complete — visibility should stay false (was hidden before)
        await this.getControllersRegistry().mapController.waitForOverviewMapVisibility(false);

        // Verify overview map is still hidden (was hidden before reprojection)
        test.addStep('Verifying overview map is still hidden after reprojecting back to 3978...');
        const isVisibleAfterReturn = this.getControllersRegistry().mapController.getOverviewMapVisibility();
        Test.assertIsEqual(isVisibleAfterReturn, false);

        // Zoom above threshold in 3978
        test.addStep('Zooming to level 8 in 3978 (above threshold)...');
        await this.getControllersRegistry().mapController.zoomMap(8, GVAbstractTester.USE_ZOOM_ANIMATION);

        // Wait for visibility to turn true
        await this.getControllersRegistry().mapController.waitForOverviewMapVisibility(true);

        // Verify overview map is visible again
        test.addStep('Verifying overview map is visible at zoom 8 in 3978...');
        const isVisibleFinal = this.getControllersRegistry().mapController.getOverviewMapVisibility();
        Test.assertIsEqual(isVisibleFinal, true);
      }
    );
  }

  // #region VIEW SETTINGS

  /**
   * Tests that initialView sets the initial zoom and zoomToInitialExtent navigates to homeView zoom.
   *
   * @returns A promise that resolves when the test completes
   */
  testViewSettingsInitialViewVsHomeView(): Promise<Test> {
    const mapId = this.getMapId();

    return this.test<MapViewer>(
      'Test initialView sets zoom = 7 (Ottawa), zoomToInitialExtent() changes zoom to 4 (homeView Canada)',
      async (test) => {
        // Create the mapViewer with distinct initialView and homeView
        const viewSettingsConfig = {
          projection: 3978,
          initialView: { zoomAndCenter: [7, [-75.7, 45.4]] },
          homeView: { zoomAndCenter: [4, [-95, 60]] },
        };

        // Create a new map viewer from a new config
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { map: { viewSettings: viewSettingsConfig } });
        return mapViewer;
      },
      async (test, newMapViewer) => {
        // Verify initial zoom is 7 (from initialView)
        test.addStep('Verifying initial zoom = 7 from initialView...');
        const initialZoom = newMapViewer.getView().getZoom();
        Test.assertIsEqual(initialZoom, 7);

        // Call zoomToInitialExtent which uses homeView
        test.addStep('Calling zoomToInitialExtent() which navigates to homeView...');
        await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

        // Verify zoom changed to 4 (from homeView)
        test.addStep('Verifying zoom changed to 4 from homeView...');
        const homeZoom = newMapViewer.getView().getZoom();
        Test.assertIsEqual(homeZoom, 4);
      }
    );
  }

  /**
   * Tests that after zoomToInitialExtent the map center is approximately at homeView coordinates.
   *
   * @returns A promise that resolves when the test completes
   */
  testViewSettingsHomeButtonNavigatesToHomeView(): Promise<Test> {
    const mapId = this.getMapId();
    const EXPECTED_HOME_LON = -95;
    const EXPECTED_HOME_LAT = 60;
    const TOLERANCE_DEGREES = 5;

    return this.test(
      'Test zoomToInitialExtent() navigates center to homeView coordinates ≈ [-95, 60]',
      async (test) => {
        // Create the mapViewer with distinct initialView and homeView
        const viewSettingsConfig = {
          projection: 3978,
          initialView: { zoomAndCenter: [7, [-75.7, 45.4]] },
          homeView: { zoomAndCenter: [4, [-95, 60]] },
        };

        // Create a new map viewer from a new config
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, { map: { viewSettings: viewSettingsConfig } });

        // Call zoomToInitialExtent which navigates to homeView
        test.addStep('Calling zoomToInitialExtent() to navigate to homeView...');
        await this.getControllersRegistry().mapController.zoomToInitialExtent(GVAbstractTester.USE_ZOOM_ANIMATION);

        return mapViewer;
      },
      (test) => {
        // Get the center from the store (in map projection coordinates)
        test.addStep('Getting center coordinates from store...');
        const { mapCenterCoordinates } = getStoreMapStateJson(mapId);
        Test.assertIsDefined('mapCenterCoordinates', mapCenterCoordinates);

        // Transform center from map projection (EPSG:3978) back to lonlat
        test.addStep('Transforming center coordinates to lonlat...');
        const lonLatCenter = Projection.transformPoints([mapCenterCoordinates], 'EPSG:3978', Projection.PROJECTION_NAMES.LONLAT);
        Test.assertIsDefined('lonLatCenter', lonLatCenter);
        Test.assertIsArrayLengthEqual(lonLatCenter, 1);

        const [lon, lat] = lonLatCenter[0];

        // Verify longitude is within tolerance of expected homeView center
        test.addStep(`Verifying longitude ≈ ${EXPECTED_HOME_LON} (tolerance ±${TOLERANCE_DEGREES})...`);
        const lonDiff = Math.abs(lon - EXPECTED_HOME_LON);
        if (lonDiff > TOLERANCE_DEGREES) {
          Test.assertFail(`Longitude ${lon} is ${lonDiff}° from expected ${EXPECTED_HOME_LON}, exceeds tolerance of ${TOLERANCE_DEGREES}°`);
        }

        // Verify latitude is within tolerance of expected homeView center
        test.addStep(`Verifying latitude ≈ ${EXPECTED_HOME_LAT} (tolerance ±${TOLERANCE_DEGREES})...`);
        const latDiff = Math.abs(lat - EXPECTED_HOME_LAT);
        if (latDiff > TOLERANCE_DEGREES) {
          Test.assertFail(`Latitude ${lat} is ${latDiff}° from expected ${EXPECTED_HOME_LAT}, exceeds tolerance of ${TOLERANCE_DEGREES}°`);
        }
      }
    );
  }

  // #endregion VIEW SETTINGS

  /**
   * Tests that nameField configuration controls the feature display label.
   *
   * @returns A promise resolving when the test completes
   */
  testNameFieldAsLabel(): Promise<Test<TypeFeatureInfoEntry[] | undefined>> {
    const LAYER_PATH = 'geojsonLYR5/polygons.json';
    const NAME_FIELD = 'creationDate';

    return this.test(
      'Test nameField as label in query results...',
      async (test) => {
        // Create map with custom featureInfo nameField config using a date field
        test.addStep('Creating map with nameField configuration (date field)...');
        await this.#helperCreateMapWithFeatureInfoConfig(test, {
          queryable: true,
          nameField: NAME_FIELD,
        });

        // Get the layer
        test.addStep('Getting the layer...');
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);

        // Query at Ontario coordinates
        return this.queryAtCoordinateRetrieveResultsForLayer(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
      },
      (test, result) => {
        // Verify we got results
        test.addStep('Verifying query returned features...');
        Test.assertIsDefined('features', result);
        Test.assertIsArrayLengthMinimal(result, 1);

        // Verify the nameField is set correctly on the result
        test.addStep('Verifying nameField is set on result...');
        Test.assertIsEqual(result[0].nameField, NAME_FIELD);
      }
    );
  }

  /**
   * Tests that fields with summary: false are excluded from query results.
   *
   * @returns A promise resolving when the test completes
   */
  testSummaryFalseHidesField(): Promise<Test<TypeFeatureInfoEntry[] | undefined>> {
    const LAYER_PATH = 'geojsonLYR5/polygons.json';
    const NAME_FIELD = 'Province';
    const HIDDEN_FIELD = 'creationDate';

    return this.test(
      'Test summary false hides field from query results...',
      async (test) => {
        // Create map with outfields config where creationDate has summary: false
        test.addStep('Creating map with outfields summary:false configuration...');
        await this.#helperCreateMapWithFeatureInfoConfig(test, {
          queryable: true,
          nameField: NAME_FIELD,
          outfields: [
            { name: NAME_FIELD, type: 'string' },
            { name: HIDDEN_FIELD, type: 'date', summary: false },
          ],
        });

        // Get the layer
        test.addStep('Getting the layer...');
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);

        // Query at Ontario coordinates
        return this.queryAtCoordinateRetrieveResultsForLayer(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
      },
      (test, result) => {
        // Verify we got results
        test.addStep('Verifying query returned features...');
        Test.assertIsDefined('features', result);
        Test.assertIsArrayLengthMinimal(result, 1);

        // Verify the hidden field is NOT in fieldInfo
        test.addStep(`Verifying field '${HIDDEN_FIELD}' is excluded from fieldInfo...`);
        Test.assertIsUndefined(`fieldInfo.${HIDDEN_FIELD}`, result[0].fieldInfo[HIDDEN_FIELD]);

        // Verify that Province field IS present
        test.addStep('Verifying Province field IS present in fieldInfo...');
        Test.assertIsDefined('fieldInfo.Province', result[0].fieldInfo.Province);
      }
    );
  }

  /**
   * Tests that field alias configuration is applied in query results.
   *
   * @returns A promise resolving when the test completes
   */
  testFieldAliasRenamesField(): Promise<Test<TypeFeatureInfoEntry[] | undefined>> {
    const LAYER_PATH = 'geojsonLYR5/polygons.json';
    const ALIAS_VALUE = 'Custom Province Name';

    return this.test(
      'Test field alias renames field in query results...',
      async (test) => {
        // Create map with outfields config where Province has a custom alias
        test.addStep('Creating map with outfields alias configuration...');
        await this.#helperCreateMapWithFeatureInfoConfig(test, {
          queryable: true,
          nameField: 'Province',
          outfields: [{ name: 'Province', alias: ALIAS_VALUE, type: 'string' }],
        });

        // Get the layer
        test.addStep('Getting the layer...');
        const layer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);

        // Query at Ontario coordinates
        return this.queryAtCoordinateRetrieveResultsForLayer(test, layer, GVAbstractTester.ONTARIO_CENTER_LONLAT);
      },
      (test, result) => {
        // Verify we got results
        test.addStep('Verifying query returned features...');
        Test.assertIsDefined('features', result);
        Test.assertIsArrayLengthMinimal(result, 1);

        // Verify the alias is applied
        test.addStep(`Verifying Province field alias is '${ALIAS_VALUE}'...`);
        Test.assertIsDefined('fieldInfo.Province', result[0].fieldInfo.Province);
        Test.assertIsEqual(result[0].fieldInfo.Province.alias, ALIAS_VALUE);
      }
    );
  }

  // #region INITIAL SETTINGS CONTROLS

  /**
   * Tests that setting all controls to false is reflected in the store.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsControlsAllFalse(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';
    const controlNames = ['highlight', 'hover', 'opacity', 'query', 'remove', 'table', 'visibility', 'zoom'];

    return this.test(
      'Test initialSettings all controls = false...',
      (test) => {
        test.addStep('Creating map with all controls set to false...');
        const controls: Record<string, boolean> = {};
        controlNames.forEach((name) => {
          controls[name] = false;
        });
        // Create a new map viewer from a new config
        return this.#helperCreateMapConfigWithInitialSettings(test, mapId, controls);
      },
      (test) => {
        // Verify each control is false in store
        const controls = getStoreLayerControls(mapId, LAYER_PATH);
        Test.assertIsDefined('controls', controls);

        controlNames.forEach((name) => {
          test.addStep(`Verifying controls.${name} = false in store...`);
          Test.assertIsEqual((controls as Record<string, unknown>)[name], false);
        });

        // Verify the layer is still registered in featureInfoLayerSet (controls.query only hides the UI toggle, not the layer set registration)
        test.addStep('Verifying layer is still registered in featureInfoLayerSet...');
        const featureInfoPaths = this.getControllersRegistry().layerSetController.featureInfoLayerSet.getRegisteredLayerPaths();
        Test.assertArrayIncludes(featureInfoPaths, LAYER_PATH);

        // Verify the layer is still registered in allFeatureInfoLayerSet
        test.addStep('Verifying layer is still registered in allFeatureInfoLayerSet...');
        const allFeatureInfoPaths = this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet.getRegisteredLayerPaths();
        Test.assertArrayIncludes(allFeatureInfoPaths, LAYER_PATH);
      }
    );
  }

  /**
   * Tests that setting states.visible to false makes the layer initially hidden.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsStateVisibleFalse(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';

    return this.test(
      'Test initialSettings states.visible = false...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with states.visible = false...');
        return this.#helperCreateMapConfigWithInitialSettings(test, mapId, undefined, { visible: false });
      },
      (test) => {
        test.addStep('Verifying layer is not visible in store...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, LAYER_PATH);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.visible, false);

        test.addStep('Verifying layer is not visible on OL layer...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayer(LAYER_PATH);
        Test.assertIsEqual(gvLayer.getVisible(), false);
      }
    );
  }

  /**
   * Tests that setting states.opacity to 0.5 makes the layer semi-transparent.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsStateOpacity(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';

    return this.test(
      'Test initialSettings states.opacity = 0.5...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with states.opacity = 0.5...');
        return this.#helperCreateMapConfigWithInitialSettings(test, mapId, undefined, { opacity: 0.5 });
      },
      (test) => {
        test.addStep('Verifying layer opacity on OL layer...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayer(LAYER_PATH);
        Test.assertIsEqual(gvLayer.getOpacity(), 0.5, 1);
      }
    );
  }

  /**
   * Tests that setting states.queryable to false makes the layer not queryable.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsStateQueryableFalse(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';

    return this.test(
      'Test initialSettings states.queryable = false...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with states.queryable = false...');
        return this.#helperCreateMapConfigWithInitialSettings(test, mapId, undefined, { queryable: false });
      },
      (test) => {
        test.addStep('Verifying layer is not queryable in store...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, LAYER_PATH);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.queryable, false);

        test.addStep('Verifying layer is not queryable on GV layer...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);
        Test.assertIsEqual(gvLayer.getQueryable(), false);
      }
    );
  }

  /**
   * Tests that setting states.hoverable to false makes the layer not hoverable.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsStateHoverableFalse(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';

    return this.test(
      'Test initialSettings states.hoverable = false...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with states.hoverable = false...');
        return this.#helperCreateMapConfigWithInitialSettings(test, mapId, undefined, { hoverable: false });
      },
      (test) => {
        test.addStep('Verifying layer is not hoverable in store...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, LAYER_PATH);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.hoverable, false);

        test.addStep('Verifying layer is not hoverable on GV layer...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);
        Test.assertIsEqual(gvLayer.getHoverable(), false);
      }
    );
  }

  // #endregion INITIAL SETTINGS CONTROLS

  // #region INITIAL SETTINGS OPACITY CASCADING

  /**
   * Tests that a child layer's opacity is capped by its parent group's opacity when child opacity exceeds the parent.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsOpacityCascadingChildCappedByParent(): Promise<Test> {
    const mapId = this.getMapId();
    const groupLayerPath = 'geojsonLYR5/pointGroup1';
    const childLayerPath = 'geojsonLYR5/pointGroup1/icon_points.json';

    return this.test(
      'Test opacity cascading: child (1.0) capped by parent (0.5) = effective 0.5...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with parent opacity 0.5 and child opacity 1.0...');
        return this.#helperCreateMapConfigWithGroupInitialSettings(test, mapId, { opacity: 0.5 }, { opacity: 1.0 });
      },
      (test) => {
        // Verify parent group opacity is 0.5
        test.addStep('Verifying parent group opacity is 0.5...');
        const parentLayer = this.getControllersRegistry().layerController.getGeoviewLayer(groupLayerPath);
        Test.assertIsEqual(parentLayer.getOpacity(), 0.5, 1);

        // Verify child effective opacity is capped at parent's 0.5 (not 1.0)
        test.addStep('Verifying child effective opacity is capped at 0.5...');
        const childLayer = this.getControllersRegistry().layerController.getGeoviewLayer(childLayerPath);
        Test.assertIsEqual(childLayer.getOpacity(), 0.5, 1);
      }
    );
  }

  /**
   * Tests that a child layer's opacity is preserved when it is already below the parent group's opacity.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsOpacityCascadingChildBelowParent(): Promise<Test> {
    const mapId = this.getMapId();
    const groupLayerPath = 'geojsonLYR5/pointGroup1';
    const childLayerPath = 'geojsonLYR5/pointGroup1/icon_points.json';

    return this.test(
      'Test opacity cascading: child (0.3) below parent (0.5) = effective 0.3...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with parent opacity 0.5 and child opacity 0.3...');
        return this.#helperCreateMapConfigWithGroupInitialSettings(test, mapId, { opacity: 0.5 }, { opacity: 0.3 });
      },
      (test) => {
        // Verify parent group opacity is 0.5
        test.addStep('Verifying parent group opacity is 0.5...');
        const parentLayer = this.getControllersRegistry().layerController.getGeoviewLayer(groupLayerPath);
        Test.assertIsEqual(parentLayer.getOpacity(), 0.5, 1);

        // Verify child effective opacity stays at 0.3 (within parent cap)
        test.addStep('Verifying child effective opacity is 0.3...');
        const childLayer = this.getControllersRegistry().layerController.getGeoviewLayer(childLayerPath);
        Test.assertIsEqual(childLayer.getOpacity(), 0.3, 1);
      }
    );
  }

  /**
   * Tests that changing parent group opacity at runtime cascades to cap child layer opacity.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsOpacityCascadingRuntimeParentChange(): Promise<Test> {
    const mapId = this.getMapId();
    const groupLayerPath = 'geojsonLYR5/pointGroup1';
    const childLayerPath = 'geojsonLYR5/pointGroup1/icon_points.json';

    return this.test(
      'Test opacity cascading: runtime parent change cascades to children...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with parent opacity 1.0 and child opacity 0.8...');
        return this.#helperCreateMapConfigWithGroupInitialSettings(test, mapId, { opacity: 1.0 }, { opacity: 0.8 });
      },
      (test) => {
        // Verify initial state: child at 0.8, parent at 1.0
        test.addStep('Verifying initial child opacity is 0.8...');
        const childLayer = this.getControllersRegistry().layerController.getGeoviewLayer(childLayerPath);
        Test.assertIsEqual(childLayer.getOpacity(), 0.8, 1);

        // Lower parent opacity to 0.4 at runtime — GVGroupLayer.onSetOpacity cascades to children
        test.addStep('Setting parent opacity to 0.4 at runtime...');
        this.getControllersRegistry().layerController.setLayerOpacity(groupLayerPath, 0.4);

        // Verify parent is now 0.4
        test.addStep('Verifying parent group opacity is now 0.4...');
        const parentLayer = this.getControllersRegistry().layerController.getGeoviewLayer(groupLayerPath);
        Test.assertIsEqual(parentLayer.getOpacity(), 0.4, 1);

        // Verify child opacity was cascaded to 0.4 (group cascade sets child.setOpacity(0.4), capped by parent 0.4)
        test.addStep('Verifying child opacity cascaded to 0.4...');
        Test.assertIsEqual(childLayer.getOpacity(), 0.4, 1);
      }
    );
  }

  /**
   * Tests that controls.remove = false on a parent group cascades to descendants that do not explicitly override it,
   * but a descendant that explicitly sets controls.remove = true keeps its value.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsControlRemoveCascadingToDescendants(): Promise<Test> {
    const mapId = this.getMapId();
    const groupLayerPath = 'geojsonLYR5/pointGroup1';
    const subGroupLayerPath = 'geojsonLYR5/pointGroup1/pointGroup2';
    const childLayerPath = 'geojsonLYR5/pointGroup1/pointGroup2/points_1.json';

    return this.test(
      'Test controls.remove cascading: parent false cascades unless child explicitly overrides with true...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with parent controls.remove = false, subgroup default, child controls.remove = true...');
        return this.#helperCreateMapConfigWithNestedGroupInitialSettings(
          test,
          mapId,
          { controls: { remove: false } },
          {},
          { controls: { remove: true } }
        );
      },
      (test) => {
        // Verify parent group has remove = false
        test.addStep('Verifying controls.remove = false on parent group...');
        const parentControls = getStoreLayerControls(mapId, groupLayerPath);
        Test.assertIsDefined('parentControls', parentControls);
        Test.assertIsEqual((parentControls as Record<string, unknown>).remove, false);

        // Verify subgroup has remove = false (inherited from parent, no explicit override)
        test.addStep('Verifying controls.remove = false on subgroup (inherited, not explicitly set)...');
        const subGroupControls = getStoreLayerControls(mapId, subGroupLayerPath);
        Test.assertIsDefined('subGroupControls', subGroupControls);
        Test.assertIsEqual((subGroupControls as Record<string, unknown>).remove, false);

        // Verify child leaf has remove = true (explicitly overrides parent cascade)
        test.addStep('Verifying controls.remove = true on child leaf (explicit override)...');
        const childControls = getStoreLayerControls(mapId, childLayerPath);
        Test.assertIsDefined('childControls', childControls);
        Test.assertIsEqual((childControls as Record<string, unknown>).remove, true);
      }
    );
  }

  /**
   * Tests that states.visible = false on a parent group makes all descendants not visible on the map,
   * but children keep their own visible state as true in the store (greyed out in the legend UI).
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsStateVisibleCascadingToDescendants(): Promise<Test> {
    const mapId = this.getMapId();
    const groupLayerPath = 'geojsonLYR5/pointGroup1';
    const subGroupLayerPath = 'geojsonLYR5/pointGroup1/pointGroup2';
    const childLayerPath = 'geojsonLYR5/pointGroup1/pointGroup2/points_1.json';

    return this.test(
      'Test states.visible cascading: parent false hides all descendants on map, children keep visible true in store...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with parent states.visible = false, child states.visible = true...');
        return this.#helperCreateMapConfigWithNestedGroupInitialSettings(
          test,
          mapId,
          { states: { visible: false } },
          {},
          { states: { visible: true } }
        );
      },
      (test) => {
        // Verify parent group OL layer is not visible
        test.addStep('Verifying parent group OL layer is not visible...');
        const parentLayer = this.getControllersRegistry().layerController.getGeoviewLayer(groupLayerPath);
        Test.assertIsEqual(parentLayer.getVisible(), false);

        // Verify parent is not visible in store legend
        test.addStep('Verifying parent group is not visible in store legend...');
        const parentLegend = getStoreLayerLegendLayerByPath(mapId, groupLayerPath);
        Test.assertIsDefined('parentLegend', parentLegend);
        Test.assertIsEqual(parentLegend.visible, false);

        // Verify subgroup OL layer is visible (its own state is not set to false)
        test.addStep('Verifying subgroup OL layer is visible (own state defaults to true)...');
        const subGroupLayer = this.getControllersRegistry().layerController.getGeoviewLayer(subGroupLayerPath);
        Test.assertIsEqual(subGroupLayer.getVisible(), true);

        // Verify subgroup is not effectively visible when considering parents
        test.addStep('Verifying subgroup is not effectively visible including parents...');
        Test.assertIsEqual(subGroupLayer.getVisibleIncludingParents(), false);

        // Verify child OL layer is visible (its own state is true)
        test.addStep('Verifying child OL layer is visible (own state is true)...');
        const childLayer = this.getControllersRegistry().layerController.getGeoviewLayer(childLayerPath);
        Test.assertIsEqual(childLayer.getVisible(), true);

        // Verify child is not effectively visible when considering parents
        test.addStep('Verifying child is not effectively visible including parents...');
        Test.assertIsEqual(childLayer.getVisibleIncludingParents(), false);
      }
    );
  }

  // #endregion INITIAL SETTINGS OPACITY CASCADING

  // #region INITIAL SETTINGS CONTROLS + STATES COMBO

  /**
   * Tests that controls.query = true with states.queryable = false shows the query UI toggle but makes the layer not queryable at runtime.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsComboQueryControlTrueStateQueryableFalse(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';

    return this.test(
      'Test initialSettings controls.query = true + states.queryable = false...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with controls.query = true and states.queryable = false...');
        return this.#helperCreateMapConfigWithInitialSettings(test, mapId, { query: true }, { queryable: false });
      },
      (test) => {
        // Verify control is true in store (UI toggle is available)
        test.addStep('Verifying controls.query = true in store...');
        const controls = getStoreLayerControls(mapId, LAYER_PATH);
        Test.assertIsDefined('controls', controls);
        Test.assertIsEqual((controls as Record<string, unknown>).query, true);

        // Verify states.queryable is false in store
        test.addStep('Verifying states.queryable = false in store...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, LAYER_PATH);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.queryable, false);

        // Verify getQueryable() returns false on the GV layer
        test.addStep('Verifying getQueryable() = false on GV layer...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);
        Test.assertIsEqual(gvLayer.getQueryable(), false);

        // Verify the layer is still registered in featureInfoLayerSet (registration uses source.featureInfo.queryable, not states.queryable)
        test.addStep('Verifying layer is still registered in featureInfoLayerSet...');
        const featureInfoPaths = this.getControllersRegistry().layerSetController.featureInfoLayerSet.getRegisteredLayerPaths();
        Test.assertArrayIncludes(featureInfoPaths, LAYER_PATH);

        // Verify the layer is still registered in allFeatureInfoLayerSet
        test.addStep('Verifying layer is still registered in allFeatureInfoLayerSet...');
        const allFeatureInfoPaths = this.getControllersRegistry().layerSetController.allFeatureInfoLayerSet.getRegisteredLayerPaths();
        Test.assertArrayIncludes(allFeatureInfoPaths, LAYER_PATH);

        // Verify the layer is still registered in hoverFeatureInfoLayerSet
        test.addStep('Verifying layer is still registered in hoverFeatureInfoLayerSet...');
        const hoverPaths = this.getControllersRegistry().layerSetController.hoverFeatureInfoLayerSet.getRegisteredLayerPaths();
        Test.assertArrayIncludes(hoverPaths, LAYER_PATH);
      }
    );
  }

  /**
   * Tests that controls.hover = true with states.hoverable = false shows the hover UI toggle but makes the layer not hoverable at runtime.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsComboHoverControlTrueStateHoverableFalse(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';

    return this.test(
      'Test initialSettings controls.hover = true + states.hoverable = false...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with controls.hover = true and states.hoverable = false...');
        return this.#helperCreateMapConfigWithInitialSettings(test, mapId, { hover: true }, { hoverable: false });
      },
      (test) => {
        // Verify control is true in store (UI toggle is available)
        test.addStep('Verifying controls.hover = true in store...');
        const controls = getStoreLayerControls(mapId, LAYER_PATH);
        Test.assertIsDefined('controls', controls);
        Test.assertIsEqual((controls as Record<string, unknown>).hover, true);

        // Verify states.hoverable is false in store
        test.addStep('Verifying states.hoverable = false in store...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, LAYER_PATH);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.hoverable, false);

        // Verify getHoverable() returns false on the GV layer
        test.addStep('Verifying getHoverable() = false on GV layer...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);
        Test.assertIsEqual(gvLayer.getHoverable(), false);

        // Verify the layer is still registered in hoverFeatureInfoLayerSet (registration uses source.featureInfo.queryable, not states.hoverable)
        test.addStep('Verifying layer is still registered in hoverFeatureInfoLayerSet...');
        const hoverPaths = this.getControllersRegistry().layerSetController.hoverFeatureInfoLayerSet.getRegisteredLayerPaths();
        Test.assertArrayIncludes(hoverPaths, LAYER_PATH);

        // Verify the layer is still registered in featureInfoLayerSet
        test.addStep('Verifying layer is still registered in featureInfoLayerSet...');
        const featureInfoPaths = this.getControllersRegistry().layerSetController.featureInfoLayerSet.getRegisteredLayerPaths();
        Test.assertArrayIncludes(featureInfoPaths, LAYER_PATH);
      }
    );
  }

  // #endregion INITIAL SETTINGS CONTROLS + STATES COMBO

  // #region INITIAL SETTINGS LEGEND COLLAPSED

  /**
   * Tests that setting states.legendCollapsed to true on a group layer results in the legend being collapsed in the store.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsLegendCollapsed(): Promise<Test> {
    const mapId = this.getMapId();
    const groupLayerPath = 'geojsonLYR5/pointGroup1';

    return this.test(
      'Test initialSettings states.legendCollapsed = true on group layer...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with group layer having states.legendCollapsed = true...');
        return this.#helperCreateMapConfigWithGroupInitialSettings(test, mapId, { legendCollapsed: true });
      },
      (test) => {
        // Verify the group layer legend is collapsed in the store
        test.addStep('Verifying legendCollapsed = true in store for group layer...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, groupLayerPath);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.legendCollapsed, true);
      }
    );
  }

  // #endregion INITIAL SETTINGS LEGEND COLLAPSED

  // #region INITIAL SETTINGS CONTROLS CASCADING

  /**
   * Tests that controls set on the parent group cascade to all descendants (subgroup and child leaf).
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsControlsCascadeToChildren(): Promise<Test> {
    const mapId = this.getMapId();
    const groupLayerPath = 'geojsonLYR5/pointGroup1';
    const subGroupLayerPath = 'geojsonLYR5/pointGroup1/pointGroup2';
    const childLayerPath = 'geojsonLYR5/pointGroup1/pointGroup2/points_1.json';
    const controlNames = ['highlight', 'zoom', 'hover', 'query'];

    return this.test(
      'Test parent controls { highlight: false, zoom: false, hover: false, query: false } cascade to children...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with parent controls all false, no overrides on children...');
        return this.#helperCreateMapConfigWithNestedGroupInitialSettings(
          test,
          mapId,
          { controls: { highlight: false, zoom: false, hover: false, query: false } },
          {},
          {}
        );
      },
      (test) => {
        // Verify parent group has all controls false
        test.addStep('Verifying parent group has all controls false...');
        const parentControls = getStoreLayerControls(mapId, groupLayerPath);
        Test.assertIsDefined('parentControls', parentControls);
        controlNames.forEach((name) => {
          Test.assertIsEqual((parentControls as Record<string, unknown>)[name], false);
        });

        // Verify subgroup inherits all controls false
        test.addStep('Verifying subgroup inherits all controls false...');
        const subGroupControls = getStoreLayerControls(mapId, subGroupLayerPath);
        Test.assertIsDefined('subGroupControls', subGroupControls);
        controlNames.forEach((name) => {
          Test.assertIsEqual((subGroupControls as Record<string, unknown>)[name], false);
        });

        // Verify child leaf inherits all controls false
        test.addStep('Verifying child leaf inherits all controls false...');
        const childControls = getStoreLayerControls(mapId, childLayerPath);
        Test.assertIsDefined('childControls', childControls);
        controlNames.forEach((name) => {
          Test.assertIsEqual((childControls as Record<string, unknown>)[name], false);
        });
      }
    );
  }

  /**
   * Tests that a child group can override specific controls from the parent while inheriting the rest.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsControlsGroupOverride(): Promise<Test> {
    const mapId = this.getMapId();
    const groupLayerPath = 'geojsonLYR5/pointGroup1';
    const subGroupLayerPath = 'geojsonLYR5/pointGroup1/pointGroup2';
    const childLayerPath = 'geojsonLYR5/pointGroup1/pointGroup2/points_1.json';

    return this.test(
      'Test group-level override: parent { highlight: false, zoom: false }, subgroup overrides { highlight: true, zoom: true }...',
      (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with parent controls and subgroup overrides...');
        return this.#helperCreateMapConfigWithNestedGroupInitialSettings(
          test,
          mapId,
          { controls: { highlight: false, zoom: false } },
          { controls: { highlight: true, zoom: true } },
          {}
        );
      },
      (test) => {
        // Verify parent group has highlight: false, zoom: false
        test.addStep('Verifying parent group has highlight: false, zoom: false...');
        const parentControls = getStoreLayerControls(mapId, groupLayerPath);
        Test.assertIsDefined('parentControls', parentControls);
        Test.assertIsEqual((parentControls as Record<string, unknown>).highlight, false);
        Test.assertIsEqual((parentControls as Record<string, unknown>).zoom, false);

        // Verify subgroup overrides to highlight: true, zoom: true
        test.addStep('Verifying subgroup overrides highlight: true, zoom: true...');
        const subGroupControls = getStoreLayerControls(mapId, subGroupLayerPath);
        Test.assertIsDefined('subGroupControls', subGroupControls);
        Test.assertIsEqual((subGroupControls as Record<string, unknown>).highlight, true);
        Test.assertIsEqual((subGroupControls as Record<string, unknown>).zoom, true);

        // Verify child leaf inherits subgroup's overridden values (highlight: true, zoom: true)
        test.addStep('Verifying child leaf inherits subgroup overrides (highlight: true, zoom: true)...');
        const childControls = getStoreLayerControls(mapId, childLayerPath);
        Test.assertIsDefined('childControls', childControls);
        Test.assertIsEqual((childControls as Record<string, unknown>).highlight, true);
        Test.assertIsEqual((childControls as Record<string, unknown>).zoom, true);
      }
    );
  }

  // #endregion INITIAL SETTINGS CONTROLS CASCADING

  // #region INITIAL FILTERS

  /**
   * Tests that a GeoJSON layer with a layerFilter config property has the filter stored and accessible at runtime.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsFilters(): Promise<Test> {
    const mapId = this.getMapId();
    const LAYER_PATH = 'geojsonLYR5/polygons.json';
    const FILTER_EXPRESSION = "Province = 'Quebec'";

    return this.test(
      'Test GeoJSON layerFilter is stored and accessible after loading...',
      async (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with GeoJSON layer having layerFilter...');
        await this.#helperCreateMapConfig(test, mapId, {
          map: {
            listOfGeoviewLayerConfig: [
              {
                geoviewLayerId: 'geojsonLYR5',
                geoviewLayerName: 'GeoJSON Sample',
                metadataAccessPath: GVAbstractTester.GEOJSON_METADATA_META,
                geoviewLayerType: 'GeoJSON' as TypeGeoviewLayerType,
                serviceDateFormat: 'DD/MM/YYYYTHH:mm:ss',
                listOfLayerEntryConfig: [
                  {
                    layerId: 'polygons.json',
                    layerName: 'Polygons',
                    layerFilter: FILTER_EXPRESSION,
                  },
                ],
              },
            ],
          },
        });
      },
      (test) => {
        // Verify the filter is accessible on the GV layer via getLayerFilters().getInitialFilter()
        test.addStep('Verifying layerFilter is stored on GV layer via getInitialFilter()...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);
        Test.assertIsDefined('gvLayer', gvLayer);
        const initialFilter = gvLayer.getLayerFilters().getInitialFilter();
        Test.assertIsEqual(initialFilter, FILTER_EXPRESSION);

        // Verify the filter is also stored in the legend layer store
        test.addStep('Verifying layerFilter is stored in legend layer store...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, LAYER_PATH);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.layerFilter, FILTER_EXPRESSION);
      }
    );
  }

  /**
   * Tests that an OGC Feature layer with a layerFilter config property has the filter stored and accessible at runtime.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsFiltersOgcFeature(): Promise<Test> {
    const mapId = this.getMapId();
    const GV_LAYER_ID = 'ogcFeatureLYR';
    const LAYER_PATH = `${GV_LAYER_ID}/${GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES}`;
    const FILTER_EXPRESSION = "name = 'Lake Huron'";

    return this.test(
      'Test OGC Feature layerFilter is stored and accessible after loading...',
      async (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with OGC Feature layer having layerFilter...');
        await this.#helperCreateMapConfig(test, mapId, {
          map: {
            listOfGeoviewLayerConfig: [
              {
                geoviewLayerId: GV_LAYER_ID,
                geoviewLayerName: 'OGC Feature Lakes',
                metadataAccessPath: GVAbstractTester.PYGEOAPI_B6RYUVAKK5,
                geoviewLayerType: 'ogcFeature' as TypeGeoviewLayerType,
                listOfLayerEntryConfig: [
                  {
                    layerId: GVAbstractTester.PYGEOAPI_B6RYUVAKK5_LAKES,
                    layerFilter: FILTER_EXPRESSION,
                  },
                ],
              },
            ],
          },
        });
      },
      (test) => {
        test.addStep('Verifying layerFilter is stored on GV layer via getInitialFilter()...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);
        Test.assertIsDefined('gvLayer', gvLayer);
        const initialFilter = gvLayer.getLayerFilters().getInitialFilter();
        Test.assertIsEqual(initialFilter, FILTER_EXPRESSION);

        test.addStep('Verifying layerFilter is stored in legend layer store...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, LAYER_PATH);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.layerFilter, FILTER_EXPRESSION);
      }
    );
  }

  /**
   * Tests that a WFS layer with a layerFilter config property has the filter stored and accessible at runtime.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsFiltersWfs(): Promise<Test> {
    const mapId = this.getMapId();
    const GV_LAYER_ID = 'wfsLYR';
    const LAYER_PATH = `${GV_LAYER_ID}/${GVAbstractTester.GEOMET_URL_CURRENT_COND_LAYER_ID}`;
    const FILTER_EXPRESSION = "element_name_e = 'Temperature'";

    return this.test(
      'Test WFS layerFilter is stored and accessible after loading...',
      async (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with WFS layer having layerFilter...');
        await this.#helperCreateMapConfig(test, mapId, {
          map: {
            listOfGeoviewLayerConfig: [
              {
                geoviewLayerId: GV_LAYER_ID,
                geoviewLayerName: 'WFS Current Conditions',
                metadataAccessPath: GVAbstractTester.GEOMET_URL,
                geoviewLayerType: 'ogcWfs' as TypeGeoviewLayerType,
                listOfLayerEntryConfig: [
                  {
                    layerId: GVAbstractTester.GEOMET_URL_CURRENT_COND_LAYER_ID,
                    layerFilter: FILTER_EXPRESSION,
                  },
                ],
              },
            ],
          },
        });
      },
      (test) => {
        test.addStep('Verifying layerFilter is stored on GV layer via getInitialFilter()...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);
        Test.assertIsDefined('gvLayer', gvLayer);
        const initialFilter = gvLayer.getLayerFilters().getInitialFilter();
        Test.assertIsEqual(initialFilter, FILTER_EXPRESSION);

        test.addStep('Verifying layerFilter is stored in legend layer store...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, LAYER_PATH);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.layerFilter, FILTER_EXPRESSION);
      }
    );
  }

  /**
   * Tests that an Esri Dynamic layer with a layerFilter config property has the filter stored and accessible at runtime.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsFiltersEsriDynamic(): Promise<Test> {
    const mapId = this.getMapId();
    const GV_LAYER_ID = 'esriDynamicLYR';
    const LAYER_PATH = `${GV_LAYER_ID}/${GVAbstractTester.HISTORICAL_FLOOD_LAYER_ID}`;
    const FILTER_EXPRESSION = "event_type = 'freshet'";

    return this.test(
      'Test Esri Dynamic layerFilter is stored and accessible after loading...',
      async (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with Esri Dynamic layer having layerFilter...');
        await this.#helperCreateMapConfig(test, mapId, {
          map: {
            listOfGeoviewLayerConfig: [
              {
                geoviewLayerId: GV_LAYER_ID,
                geoviewLayerName: 'Historical Flood Events',
                metadataAccessPath: GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER,
                geoviewLayerType: 'esriDynamic' as TypeGeoviewLayerType,
                listOfLayerEntryConfig: [
                  {
                    layerId: GVAbstractTester.HISTORICAL_FLOOD_LAYER_ID,
                    layerFilter: FILTER_EXPRESSION,
                  },
                ],
              },
            ],
          },
        });
      },
      (test) => {
        test.addStep('Verifying layerFilter is stored on GV layer via getInitialFilter()...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);
        Test.assertIsDefined('gvLayer', gvLayer);
        const initialFilter = gvLayer.getLayerFilters().getInitialFilter();
        Test.assertIsEqual(initialFilter, FILTER_EXPRESSION);

        test.addStep('Verifying layerFilter is stored in legend layer store...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, LAYER_PATH);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.layerFilter, FILTER_EXPRESSION);
      }
    );
  }

  /**
   * Tests that an Esri Feature layer with a layerFilter config property has the filter stored and accessible at runtime.
   *
   * @returns A promise that resolves when the test completes
   */
  testInitialSettingsFiltersEsriFeature(): Promise<Test> {
    const mapId = this.getMapId();
    const GV_LAYER_ID = 'esriFeatureLYR';
    const LAYER_PATH = `${GV_LAYER_ID}/${GVAbstractTester.FOREST_INDUSTRY_LAYER_ID}`;
    const FILTER_EXPRESSION = "Province = 'Ontario'";

    return this.test(
      'Test Esri Feature layerFilter is stored and accessible after loading...',
      async (test) => {
        // Create a new map viewer from a new config
        test.addStep('Creating map with Esri Feature layer having layerFilter...');
        await this.#helperCreateMapConfig(test, mapId, {
          map: {
            listOfGeoviewLayerConfig: [
              {
                geoviewLayerId: GV_LAYER_ID,
                geoviewLayerName: 'Forest Industry',
                metadataAccessPath: GVAbstractTester.FOREST_INDUSTRY_MAP_SERVER,
                geoviewLayerType: 'esriFeature' as TypeGeoviewLayerType,
                listOfLayerEntryConfig: [
                  {
                    layerId: GVAbstractTester.FOREST_INDUSTRY_LAYER_ID,
                    layerFilter: FILTER_EXPRESSION,
                  },
                ],
              },
            ],
          },
        });
      },
      (test) => {
        test.addStep('Verifying layerFilter is stored on GV layer via getInitialFilter()...');
        const gvLayer = this.getControllersRegistry().layerController.getGeoviewLayerRegular(LAYER_PATH);
        Test.assertIsDefined('gvLayer', gvLayer);
        const initialFilter = gvLayer.getLayerFilters().getInitialFilter();
        Test.assertIsEqual(initialFilter, FILTER_EXPRESSION);

        test.addStep('Verifying layerFilter is stored in legend layer store...');
        const legendLayer = getStoreLayerLegendLayerByPath(mapId, LAYER_PATH);
        Test.assertIsDefined('legendLayer', legendLayer);
        Test.assertIsEqual(legendLayer.layerFilter, FILTER_EXPRESSION);
      }
    );
  }

  // #endregion INITIAL FILTERS

  // #region VIEWPORT BOUNDARY

  /**
   * Tests fitting midpoint coordinates in the map-config suite's existing container.
   *
   * @param projection - Source projection
   * @param rotation - Optional rotation in radians
   * @param interaction - Optional interaction mode
   * @param change - Optional change to viewport aspect ratio or projection before fitting
   * @param useAnimation - Optional animation flag
   * @param center - Optional source center in longitude/latitude
   * @param useRotation - Whether the fit should restore the source rotation or preserve the changed rotation
   * @returns A promise that resolves with the fit outcome
   */
  testFitViewportToMidpointsLonLat(
    projection: TypeValidMapProjectionCodes,
    rotation = 0,
    interaction: TypeInteraction = 'dynamic',
    change: 'none' | 'resize' | 'projection' = 'none',
    useAnimation = false,
    center: Coordinate = MAP_CENTER[projection],
    useRotation = true
  ): Promise<Test<TypeViewportMidpointFitResult>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.test(
      `Test fitting viewport midpoints EPSG:${projection}, rotation ${rotation}, ${interaction}, ${change}, animated ${useAnimation}, align ${useRotation}`,
      async (test): Promise<TypeViewportMidpointFitResult> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, projection, interaction, center, rotation);
        viewer.getView().padding = interaction === 'dynamic' ? [15, 25, 60, 35] : [0, 0, 0, 0];
        viewer.map.renderSync();
        const before = MapConfigTester.#captureViewportBoundary(viewer);
        const input = before.boundary.midpointWSENCoords;
        const original = input.map((coordinate) => [...coordinate]);
        test.addStep('Changing the view before fitting the captured WSEN coordinates...');
        if (change === 'resize') {
          gvRootElement.style.width = '540px';
          viewer.map.updateSize();
        }
        if (change === 'projection') {
          viewer.setView({ projection: 3857, initialView: { zoomAndCenter: [5, MAP_CENTER[3857]] }, rotation });
        }
        const view = viewer.getView();
        view.setRotation(rotation + 0.7);
        view.setZoom(view.getZoom()! + 2);
        const currentCenter = view.getCenter()!;
        view.setCenter([currentCenter[0] + view.getResolution()! * 100, currentCenter[1]]);
        viewer.map.renderSync();
        test.addStep('Fitting the captured coordinates through the public viewer API...');
        await viewer.fitViewportToMidpointsLonLat(input, useRotation, useAnimation);
        return {
          snapshot: MapConfigTester.#captureViewportBoundary(viewer),
          original,
          input,
          pixels: original.map((coordinate) => viewer.map.getPixelFromCoordinate(viewer.convertCoordinateLonLatToMapProj(coordinate))),
          originalPixels: [before.expectedPixels[7], before.expectedPixels[6], before.expectedPixels[5], before.expectedPixels[4]],
          rotation,
        };
      },
      (test, result): void => {
        test.addStep('Verifying containment, rotation, input preservation, and exact compatible-view round trip...');
        Test.assertIsArrayEqualJsons(result.input, result.original);
        if (!useRotation) Test.assertIsEqualWithinTolerance(result.snapshot.rotation, result.rotation + 0.7, 1e-9);
        else if (change !== 'projection') Test.assertIsEqualWithinTolerance(result.snapshot.rotation, result.rotation, 1e-9);
        else {
          const [west, south, east, north] = result.pixels;
          Test.assertIsDefined('west', west);
          Test.assertIsDefined('south', south);
          Test.assertIsDefined('east', east);
          Test.assertIsDefined('north', north);
          const eastAngle = Math.atan2(-(east[1] - west[1]), east[0] - west[0]);
          const northAngle = Math.atan2(-(north[1] - south[1]), north[0] - south[0]) - Math.PI / 2;
          Test.assertIsEqualWithinTolerance(eastAngle + northAngle, 0, 1e-6);
        }
        const [left, top] = result.snapshot.expectedPixels[0];
        const [right, bottom] = result.snapshot.expectedPixels[2];
        result.pixels.forEach((pixel, index): void => {
          Test.assertIsDefined('pixel', pixel);
          Test.assertIsEqual(pixel[0] >= left - 0.5 && pixel[0] <= right + 0.5, true);
          Test.assertIsEqual(pixel[1] >= top - 0.5 && pixel[1] <= bottom + 0.5, true);
          if (change === 'none' && useRotation)
            pixel.forEach((value, axis): void => Test.assertIsEqualWithinTolerance(value, result.originalPixels[index][axis], 0.5));
        });
        const pixels = result.pixels.filter((pixel) => pixel !== null);
        const minX = Math.min(...pixels.map((pixel) => pixel[0]));
        const maxX = Math.max(...pixels.map((pixel) => pixel[0]));
        const minY = Math.min(...pixels.map((pixel) => pixel[1]));
        const maxY = Math.max(...pixels.map((pixel) => pixel[1]));
        Test.assertIsEqual(
          (Math.abs(minX - left) < 0.5 && Math.abs(maxX - right) < 0.5) || (Math.abs(minY - top) < 0.5 && Math.abs(maxY - bottom) < 0.5),
          true
        );
      },
      (): void => {
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests that invalid midpoint input rejects without modifying the view.
   *
   * @returns A promise that resolves with errors and unchanged boundaries for each invalid input
   */
  testInvalidViewportMidpoints(): Promise<
    Test<{ error: InvalidViewportMidpointsError | undefined; boundary: TypeViewportBoundaryLonLat }[]>
  > {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    let original: TypeViewportBoundaryLonLat | undefined;
    return this.test(
      'Test invalid viewport midpoint inputs without recreating the map',
      async (test): Promise<{ error: InvalidViewportMidpointsError | undefined; boundary: TypeViewportBoundaryLonLat }[]> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, 3978, 'dynamic', MAP_CENTER[3978], 0);
        original = viewer.getViewportBoundaryLonLat();
        const results: { error: InvalidViewportMidpointsError | undefined; boundary: TypeViewportBoundaryLonLat }[] = [];
        for (const condition of ['count', 'nonfinite', 'latitude', 'coincident', 'orientation']) {
          const input = original.midpointWSENCoords.map((coordinate) => [...coordinate]);
          test.addStep(`Passing invalid midpoint coordinates (${condition})...`);
          if (condition === 'count') input.pop();
          else if (condition === 'nonfinite') input[0][0] = Number.NaN;
          else if (condition === 'latitude') input[0][1] = 91;
          else if (condition === 'orientation') [input[1], input[3]] = [input[3], input[1]];
          else input.fill(input[0]);
          let error: InvalidViewportMidpointsError | undefined;
          try {
            // eslint-disable-next-line no-await-in-loop -- Verify each rejection and unchanged view before reusing the fixture.
            await viewer.fitViewportToMidpointsLonLat(input, true, false);
          } catch (caught: unknown) {
            if (!(caught instanceof InvalidViewportMidpointsError)) throw caught;
            error = caught;
          }
          results.push({ error, boundary: viewer.getViewportBoundaryLonLat() });
        }
        return results;
      },
      (_test, results): void => {
        Test.assertIsArrayLengthEqual(results, 5);
        results.forEach((result): void => {
          Test.assertIsInstance(result.error, InvalidViewportMidpointsError);
          Test.assertJsonObject(result.boundary, original);
        });
      },
      (): void => {
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests that an interrupted animation rejects instead of reporting a completed fit.
   *
   * @returns A promise that resolves with the expected cancellation error
   */
  testErrorFitViewportMidpointsCancelled(): Promise<Test<CancelledError>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.testError(
      'Test viewport midpoint fit interrupted by another interaction',
      CancelledError,
      async (test): Promise<void> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, 3978, 'dynamic', MAP_CENTER[3978], 0);
        const input = viewer.getViewportBoundaryLonLat().midpointWSENCoords;
        viewer.getView().setZoom(8);
        viewer.getView().setRotation(1);
        viewer.map.renderSync();
        test.addStep('Starting and immediately cancelling the animated fit...');
        const fitting = viewer.fitViewportToMidpointsLonLat(input);
        viewer.getView().cancelAnimations();
        await fitting;
      },
      undefined,
      (): void => {
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests padded viewport samples in a fresh, network-independent map.
   *
   * @param projection - Projection to test
   * @param rotation - Optional view rotation in radians
   * @param interaction - Optional interaction mode
   * @param center - Optional center in longitude/latitude
   * @returns A promise that resolves with the boundary test
   */
  testViewportBoundaryLonLat(
    projection: TypeValidMapProjectionCodes,
    rotation = 0,
    interaction: TypeInteraction = 'dynamic',
    center: Coordinate = MAP_CENTER[projection]
  ): Promise<Test<TypeViewportBoundarySnapshot>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.test(
      `Test viewport boundary EPSG:${projection}, rotation ${rotation}, ${interaction}, center ${center}`,
      async (test): Promise<TypeViewportBoundarySnapshot> => {
        test.addStep('Replacing the suite map and sampling the public viewer API...');
        const viewer = await this.#createViewportFixture(test, gvRootElement, projection, interaction, center, rotation);
        return MapConfigTester.#captureViewportBoundary(viewer);
      },
      (test, result): void => {
        test.addStep('Checking eight samples against independent view geometry and CSS pixels...');
        MapConfigTester.#assertViewportBoundary(result);
        Test.assertIsEqualWithinTolerance(result.bottomPadding, result.infoHeight, 0.5);
        Test.assertIsEqualWithinTolerance(result.rotation, rotation, 1e-9);
        Test.assertIsArrayEqual(result.center, center, 6);
        if (rotation !== 0) Test.assertIsEqual(Math.abs(result.boundary.midpoints.s[1] - result.extentSouth[1]) > 0.1, true);
        if (projection === 3978 && rotation === 0 && center === MAP_CENTER[3978]) {
          Test.assertIsEqual(result.boundary.midpoints.s[1] - result.boundary.corners.sw[1] > 0.1, true);
          Test.assertIsEqual(result.boundary.midpoints.s[1] - result.boundary.corners.se[1] > 0.1, true);
        }
        if (projection === 3857 && rotation === 0) {
          const { corners, midpoints } = result.boundary;
          Test.assertIsEqualWithinTolerance(midpoints.w[0], corners.nw[0], 1e-6);
          Test.assertIsEqualWithinTolerance(midpoints.e[0], corners.se[0], 1e-6);
          Test.assertIsEqualWithinTolerance(midpoints.n[1], corners.ne[1], 1e-6);
          Test.assertIsEqualWithinTolerance(midpoints.s[1], corners.sw[1], 1e-6);
          if (center === GVAbstractTester.VIEWPORT_ANTIMERIDIAN_LONLAT) Test.assertIsEqual(midpoints.e[0] > 180, true);
        }
        if (interaction === 'dynamic') Test.assertIsNotEqual(result.boundary.midpoints.s[1], result.canvasSouth[1]);
        else Test.assertIsArrayEqual(result.boundary.midpoints.s, result.canvasSouth, 6);
      },
      (): void => {
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests map-info height changes, asymmetric padding, and viewport resizing.
   *
   * @returns A promise that resolves with the boundary snapshots before and after each change
   */
  testViewportBoundaryPaddingAndResize(): Promise<Test<TypeViewportBoundarySnapshot[]>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.test(
      'Test viewport boundary after map-info height, padding, and size changes',
      async (test): Promise<TypeViewportBoundarySnapshot[]> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, 3978, 'dynamic', MAP_CENTER[3978], 0);
        const snapshots = [MapConfigTester.#captureViewportBoundary(viewer)];
        test.addStep('Increasing map-info bar height and updating view padding...');
        const info = DomHelper.getMapInfo(viewer.mapId);
        if (!info) throw new TestError('Viewport fixture has no map-info bar');
        info.style.height = `${info.offsetHeight + 30}px`;
        viewer.updateViewPadding();
        viewer.map.renderSync();
        snapshots.push(MapConfigTester.#captureViewportBoundary(viewer));
        test.addStep('Applying padding on all four sides...');
        viewer.getView().padding = [20, 30, 70, 40];
        viewer.map.renderSync();
        snapshots.push(MapConfigTester.#captureViewportBoundary(viewer));
        test.addStep('Resizing the host and resampling...');
        gvRootElement.style.width = '640px';
        viewer.map.updateSize();
        viewer.map.renderSync();
        snapshots.push(MapConfigTester.#captureViewportBoundary(viewer));
        return snapshots;
      },
      (test, result): void => {
        test.addStep('Verifying fresh geometry after each layout change...');
        result.forEach(MapConfigTester.#assertViewportBoundary);
        Test.assertIsEqualWithinTolerance(result[1].bottomPadding, result[1].infoHeight, 0.5);
        Test.assertIsEqual(result[1].bottomPadding > result[0].bottomPadding, true);
        Test.assertIsNotEqual(result[2].expectedPixels[1][0], result[3].expectedPixels[1][0]);
        Test.assertIsNotEqual(result[2].boundary.midpoints.e[0], result[3].boundary.midpoints.e[0]);
      },
      (): void => {
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests unavailable viewport conditions using one fixture, restoring it after every condition.
   *
   * @returns A promise that resolves with the captured typed errors
   */
  testViewportBoundaryUnavailable(): Promise<Test<(MapViewportUnavailableError | undefined)[]>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.test(
      'Test unavailable viewport conditions without recreating the map',
      async (test): Promise<(MapViewportUnavailableError | undefined)[]> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, 3978, 'dynamic', MAP_CENTER[3978], 0);
        const results: (MapViewportUnavailableError | undefined)[] = [];
        for (const condition of ['size', 'padding', 'nonfinite', 'negative-padding', 'unrendered']) {
          viewer.getViewportBoundaryLonLat();
          test.addStep(`Making viewport unavailable (${condition}) and sampling...`);
          let error: MapViewportUnavailableError | undefined;
          try {
            if (condition === 'size') viewer.map.setSize([0, 0]);
            else if (condition === 'padding') viewer.getView().padding = [0, 0, viewer.map.getSize()![1], 0];
            else if (condition === 'nonfinite') viewer.map.setSize([Number.NaN, 600]);
            else if (condition === 'negative-padding') viewer.getView().padding = [0, 0, -10, 0];
            else viewer.map.setTarget(undefined);
            viewer.getViewportBoundaryLonLat();
          } catch (caught: unknown) {
            if (!(caught instanceof MapViewportUnavailableError)) throw caught;
            error = caught;
          } finally {
            this.#resetViewportFixture(gvRootElement, '800px');
          }
          results.push(error);
        }
        return results;
      },
      (_test, results): void => {
        Test.assertIsArrayLengthEqual(results, 5);
        results.forEach((error): void => Test.assertIsInstance(error, MapViewportUnavailableError));
      },
      (): void => {
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  /**
   * Tests that fitting propagates an unavailable viewport error.
   *
   * @returns A promise that resolves with the expected typed error
   */
  testErrorFitViewportUnavailable(): Promise<Test<MapViewportUnavailableError>> {
    const gvRootElement = DomHelper.getGVRootElement(this.getMapId());
    const originalWidth = gvRootElement.style.width;
    return this.testError(
      'Test fitting an unavailable viewport',
      MapViewportUnavailableError,
      async (test): Promise<void> => {
        const viewer = await this.#createViewportFixture(test, gvRootElement, 3978, 'dynamic', MAP_CENTER[3978], 0);
        const input = viewer.getViewportBoundaryLonLat().midpointWSENCoords;
        test.addStep('Removing the usable viewport size and fitting...');
        viewer.map.setSize([0, 0]);
        await viewer.fitViewportToMidpointsLonLat(input, true, false);
      },
      undefined,
      (): void => {
        this.#resetViewportFixture(gvRootElement, originalWidth);
      }
    );
  }

  // #endregion VIEWPORT BOUNDARY

  // #region PROTECTED METHODS

  /**
   * Destroys the current map and creates a new one from the given config.
   *
   * Deletes the existing map viewer, creates a fresh instance via `createMapFromConfigFast`,
   * reassigns the tester's internal references, and waits for all layers to finish loading.
   *
   * @param test - The test instance used to log each step
   * @param mapId - The map identifier to destroy and recreate
   * @param mapConfig - The map configuration object (will be JSON-stringified)
   * @param divHeight - Optional height for the map container div
   * @returns A promise that resolves with the newly created MapViewer
   */
  protected async replaceMap(test: Test, mapId: string, mapConfig: unknown, divHeight?: number): Promise<MapViewer> {
    // Delete current map
    test.addStep('Deleting current map...');
    await this.getApi().deleteMapViewer(mapId, false);

    // Wait for layer to load and data table to initialize
    test.addStep('Creating the map from config...');
    const mapViewer = await this.getApi().createMapFromConfigFast(mapId, JSON.stringify(mapConfig), divHeight);

    // Replace the map viewer and the controller registry in the tester with the new one created from config
    this.assignMapViewerAndControllers(mapViewer);

    // Waiting for layers to get loaded even when map is in a background tab
    test.addStep('Waiting for layers to get loaded even when map is in a background tab...');
    const loadedLayersCount = await this.getControllersRegistry().layerController.waitForLayersLoadedForcingRenders();
    test.addStep(`Layers loaded (${loadedLayersCount})`);

    // Force a final synchronous render so OL populates frameState_ (required for getPixelFromCoordinate to work in hidden tabs)
    test.addStep('Waiting for map render...');
    await mapViewer.waitForRender();

    // Return the map viewer
    return mapViewer;
  }

  // #endregion PROTECTED METHODS

  // #region PRIVATE METHODS

  /**
   * Helper to create a map config with initialSettings on the GeoJSON layer.
   *
   * @param test - The test instance used to log steps
   * @param mapId - The map identifier
   * @param controls - Optional controls overrides for the layer
   * @param states - Optional states overrides for the layer
   * @returns A promise that resolves to the created map viewer
   */
  #helperCreateMapConfigWithInitialSettings(
    test: Test,
    mapId: string,
    controls?: Record<string, unknown>,
    states?: Record<string, unknown>
  ): Promise<MapViewer> {
    const initialSettings: Record<string, unknown> = {};
    if (controls) initialSettings.controls = controls;
    if (states) initialSettings.states = states;

    // Create a new map viewer from a new config
    return this.#helperCreateMapConfig(test, mapId, {
      map: {
        listOfGeoviewLayerConfig: [
          {
            geoviewLayerId: 'geojsonLYR5',
            geoviewLayerName: 'GeoJSON Sample',
            metadataAccessPath: GVAbstractTester.GEOJSON_METADATA_META,
            geoviewLayerType: 'GeoJSON' as TypeGeoviewLayerType,
            serviceDateFormat: 'DD/MM/YYYYTHH:mm:ss',
            listOfLayerEntryConfig: [
              {
                layerId: 'polygons.json',
                layerName: 'Polygons',
                initialSettings,
              },
            ],
          },
        ],
      },
    });
  }

  /**
   * Helper to create a map config with a group layer and initialSettings on parent and child.
   *
   * @param test - The test instance used to log steps
   * @param mapId - The map identifier
   * @param parentStates - Optional states overrides for the parent group layer
   * @param childStates - Optional states overrides for the child layer
   * @returns A promise that resolves to the created map viewer
   */
  #helperCreateMapConfigWithGroupInitialSettings(
    test: Test,
    mapId: string,
    parentStates?: Record<string, unknown>,
    childStates?: Record<string, unknown>
  ): Promise<MapViewer> {
    const parentInitialSettings: Record<string, unknown> = {};
    if (parentStates) parentInitialSettings.states = parentStates;

    const childInitialSettings: Record<string, unknown> = {};
    if (childStates) childInitialSettings.states = childStates;

    // Create a new map viewer from a new config
    return this.#helperCreateMapConfig(test, mapId, {
      map: {
        listOfGeoviewLayerConfig: [
          {
            geoviewLayerId: 'geojsonLYR5',
            geoviewLayerName: 'GeoJSON Sample',
            metadataAccessPath: GVAbstractTester.GEOJSON_METADATA_META,
            geoviewLayerType: 'GeoJSON' as TypeGeoviewLayerType,
            serviceDateFormat: 'DD/MM/YYYYTHH:mm:ss',
            listOfLayerEntryConfig: [
              {
                entryType: 'group',
                layerId: 'pointGroup1',
                initialSettings: parentInitialSettings,
                listOfLayerEntryConfig: [
                  {
                    layerId: 'icon_points.json',
                    initialSettings: childInitialSettings,
                  },
                ],
              },
            ],
          },
        ],
      },
    });
  }

  /**
   * Helper to create a map config with a nested group layer (group → subgroup → child) and initialSettings on each level.
   *
   * @param test - The test instance used to log steps
   * @param mapId - The map identifier
   * @param groupSettings - Optional initialSettings for the parent group layer
   * @param subGroupSettings - Optional initialSettings for the subgroup layer
   * @param childSettings - Optional initialSettings for the child leaf layer
   * @returns A promise that resolves to the created map viewer
   */
  #helperCreateMapConfigWithNestedGroupInitialSettings(
    test: Test,
    mapId: string,
    groupSettings?: Record<string, unknown>,
    subGroupSettings?: Record<string, unknown>,
    childSettings?: Record<string, unknown>
  ): Promise<MapViewer> {
    // Create a new map viewer from a new config
    return this.#helperCreateMapConfig(test, mapId, {
      map: {
        listOfGeoviewLayerConfig: [
          {
            geoviewLayerId: 'geojsonLYR5',
            geoviewLayerName: 'GeoJSON Sample',
            metadataAccessPath: GVAbstractTester.GEOJSON_METADATA_META,
            geoviewLayerType: 'GeoJSON' as TypeGeoviewLayerType,
            serviceDateFormat: 'DD/MM/YYYYTHH:mm:ss',
            listOfLayerEntryConfig: [
              {
                entryType: 'group',
                layerId: 'pointGroup1',
                initialSettings: groupSettings || {},
                listOfLayerEntryConfig: [
                  {
                    entryType: 'group',
                    layerId: 'pointGroup2',
                    initialSettings: subGroupSettings || {},
                    listOfLayerEntryConfig: [
                      {
                        layerId: 'points_1.json',
                        initialSettings: childSettings || {},
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    });
  }

  /**
   * Creates a map with a GeoJSON polygons layer configured with custom featureInfo settings.
   *
   * @param test - The test instance used to log steps
   * @param featureInfoConfig - The featureInfo configuration to apply to the layer
   * @returns A promise that resolves when the map is created and layers are loaded
   */
  #helperCreateMapWithFeatureInfoConfig<T>(test: Test<T>, featureInfoConfig: Record<string, unknown>): Promise<MapViewer> {
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
            serviceDateFormat: 'DD/MM/YYYYTHH:mm:ss',
            listOfLayerEntryConfig: [
              {
                layerId: 'polygons.json',
                layerName: 'Polygons',
                source: {
                  featureInfo: featureInfoConfig,
                },
              },
            ],
          },
        ],
      },
      components: [],
      corePackages: ['test-suite'],
      corePackagesConfig: [{ 'test-suite': { suites: ['suite-map-config'] } }],
      theme: 'geo.ca',
      footerBar: {
        tabs: {
          core: ['legend', 'layers', 'data-table', 'time-slider', 'geochart'],
        },
      },
    };

    // Replace the map!
    return this.replaceMap(test, this.getMapId(), baseConfig);
  }

  /**
   * Creates an isolated base map configuration with nested overrides, without inheriting the previous test's configuration.
   *
   * @param test - The test instance used to log steps
   * @param mapId - The map identifier
   * @param mapConfigOverrides - Optional nested map configuration to merge with the base fixture
   * @returns A promise that resolves to the created map viewer
   */
  #helperCreateMapConfig(test: Test, mapId: string, mapConfigOverrides: unknown = {}): Promise<MapViewer> {
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
            serviceDateFormat: 'DD/MM/YYYYTHH:mm:ss',
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

    // Replace the map!
    return this.replaceMap(test, mapId, deepMerge(baseConfig, mapConfigOverrides), MAP_CONFIG_TEST_HEIGHT);
  }

  /**
   * Replaces the suite map with a fixed-size, layer-free map using the standard config-test lifecycle.
   *
   * @param test - Test instance used to record lifecycle steps
   * @param host - The suite's existing map root
   * @param projection - View projection
   * @param interaction - Interaction mode
   * @param center - Initial longitude/latitude center
   * @param rotation - View rotation in radians
   * @returns A promise that resolves with the rendered fixture
   */
  async #createViewportFixture(
    test: Test,
    host: HTMLElement,
    projection: TypeValidMapProjectionCodes,
    interaction: TypeInteraction,
    center: Coordinate,
    rotation: number
  ): Promise<MapViewer> {
    host.style.setProperty('width', '800px');
    // Keep the near-pole round-trip fixture below the projection singularity.
    const zoom = center === GVAbstractTester.VIEWPORT_POLAR_LONLAT ? 8 : MAP_ZOOM_LEVEL[projection];
    const viewer = await this.replaceMap(test, host.id, {
      map: {
        interaction,
        viewSettings: {
          projection,
          initialView: { zoomAndCenter: [zoom, center] },
        },
        basemapOptions: { basemapId: 'nogeom', shaded: false, labeled: false },
        listOfGeoviewLayerConfig: [],
      },
      components: [],
      navBar: [],
      appBar: { tabs: { core: [] } },
      footerBar: { tabs: { core: [] } },
    });

    // Remove extent constraints so edge/polar fixtures test the requested center rather than a clamped Canada view.
    viewer.setView({
      projection,
      initialView: { zoomAndCenter: [zoom, [center[0], center[1]]] },
      rotation,
    });

    viewer.map.updateSize();
    viewer.updateViewPadding();
    await viewer.waitForRender();
    return viewer;
  }

  /**
   * Restores layout and a usable viewport after a test, including detached and invalid-size cases.
   *
   * @param host - The suite's existing map root
   * @param originalWidth - Inline width before the test
   */
  #resetViewportFixture(host: HTMLElement, originalWidth: string): void {
    host.style.setProperty('width', originalWidth);
    const viewer = this.getMapViewer();
    viewer.map.setTarget(DomHelper.getMapTargetElement(this.getMapId()));
    DomHelper.getMapInfo(this.getMapId())?.style.removeProperty('height');
    viewer.setView({ projection: 3978, initialView: { zoomAndCenter: [MAP_ZOOM_LEVEL[3978], MAP_CENTER[3978]] } });
    viewer.map.updateSize();
    viewer.updateViewPadding();
    viewer.map.renderSync();
  }

  /**
   * Captures actual samples and an independent affine view-geometry oracle.
   *
   * @param viewer - Rendered fixture
   * @returns Snapshot used exclusively for assertions
   */
  static #captureViewportBoundary(viewer: MapViewer): TypeViewportBoundarySnapshot {
    const boundary = viewer.getViewportBoundaryLonLat();
    const repeatedBoundary = viewer.getViewportBoundaryLonLat();
    const view = viewer.getView();
    const [width, height] = viewer.map.getSize()!;
    const [top, padRight, padBottom, left] = view.padding ?? [0, 0, 0, 0];
    const right = width - padRight;
    const bottom = height - padBottom;
    const x = (left + right) / 2;
    const y = (top + bottom) / 2;
    const expectedPixels = [
      [left, top],
      [right, top],
      [right, bottom],
      [left, bottom],
      [x, top],
      [right, y],
      [x, bottom],
      [left, y],
    ];
    const center = view.getCenter()!;
    const resolution = view.getResolution()!;
    const cos = Math.cos(view.getRotation());
    const sin = Math.sin(view.getRotation());
    const expected = expectedPixels.map(([px, py]): Coordinate =>
      viewer.convertCoordinateMapProjToLonLat([
        center[0] + resolution * ((px - x) * cos + (py - y) * sin),
        center[1] + resolution * ((px - x) * sin - (py - y) * cos),
      ])
    );
    const coordinates = [...Object.values(boundary.corners), ...Object.values(boundary.midpoints)];
    const extent = view.calculateExtent();
    return {
      boundary,
      repeatedBoundary,
      expected,
      pixels: coordinates.map((coordinate) => viewer.map.getPixelFromCoordinate(viewer.convertCoordinateLonLatToMapProj(coordinate))),
      expectedPixels,
      bottomPadding: padBottom,
      infoHeight: viewer.mapFeaturesConfig.map.interaction === 'static' ? 0 : DomHelper.getMapInfoOffsetHeight(viewer.mapId),
      canvasSouth: viewer.convertCoordinateMapProjToLonLat(viewer.map.getCoordinateFromPixel([x, height])),
      freshObjects: boundary !== repeatedBoundary && boundary.corners.nw !== repeatedBoundary.corners.nw,
      rotation: view.getRotation(),
      center: viewer.convertCoordinateMapProjToLonLat(center),
      extentSouth: viewer.convertCoordinateMapProjToLonLat([(extent[0] + extent[2]) / 2, extent[1]]),
    };
  }

  /**
   * Verifies exact output shape, finite coordinates, and boundary positions.
   *
   * @param snapshot - Captured API result and independent expectations
   */
  static #assertViewportBoundary(snapshot: TypeViewportBoundarySnapshot): void {
    Test.assertIsArrayEqual(Object.keys(snapshot.boundary), ['corners', 'midpoints', 'midpointWSENCoords']);
    Test.assertIsArrayEqual(Object.keys(snapshot.boundary.corners), ['nw', 'ne', 'se', 'sw']);
    Test.assertIsArrayEqual(Object.keys(snapshot.boundary.midpoints), ['n', 'e', 's', 'w']);
    Test.assertJsonObject(snapshot.boundary, snapshot.repeatedBoundary);
    Test.assertIsEqual(snapshot.freshObjects, true);
    const { w, s, e, n } = snapshot.boundary.midpoints;
    Test.assertIsArrayEqualJsons(snapshot.boundary.midpointWSENCoords, [w, s, e, n]);
    const coordinates = [...Object.values(snapshot.boundary.corners), ...Object.values(snapshot.boundary.midpoints)];
    coordinates.forEach((coordinate, index): void => {
      Test.assertIsArrayLengthEqual(coordinate, 2);
      Test.assertIsEqual(coordinate.every(Number.isFinite), true);
      coordinate.forEach((value, axis): void => Test.assertIsEqualWithinTolerance(value, snapshot.expected[index][axis], 1e-6));
      const pixel = snapshot.pixels[index];
      Test.assertIsDefined('pixel', pixel);
      pixel.forEach((value, axis): void => Test.assertIsEqualWithinTolerance(value, snapshot.expectedPixels[index][axis], 0.5));
    });
  }

  /**
   * Measures fixed-height map layout elements.
   *
   * @param mapId - The map identifier
   * @returns The measured map layout heights
   */
  static #measureMapHeights(mapId: string): TypeMapHeightMeasurements {
    const gvRootElement = DomHelper.getGVRootElement(mapId);
    const tabsContainer = DomHelper.getTabsContainer(mapId);

    Test.assertIsDefined('geoviewMapElement', gvRootElement);

    return {
      geoviewMapHeight: Math.round(gvRootElement.getBoundingClientRect().height),
      footerChromeHeight: tabsContainer ? Math.round(tabsContainer.getBoundingClientRect().height) : 0,
    };
  }

  // #endregion PRIVATE METHODS
}

// #region TYPES AND INTERFACES

/** Query and zoom results from the Ontario/Alberta visibility scenarios. */
type DetailsVisibilityAndZoomResult = Pick<
  DetailsOntarioAlbertaResult,
  | 'resultsOntarioResults'
  | 'resultsOntarioNoResults'
  | 'resultsAlbertaNoResults1'
  | 'resultsAlbertaResults'
  | 'resultsAlbertaNoResults2'
  | 'initialZoom'
  | 'finalZoom'
>;

/** Feature-info query results from the field configuration scenarios. */
type DetailsFeatureInfoConfigurationResult = Pick<DetailsOntarioAlbertaResult, 'nameFieldResults' | 'summaryResults' | 'aliasResults'>;

/** Query and zoom observations for the Ontario/Alberta Details test. */
type DetailsOntarioAlbertaResult = {
  resultsOntarioResults: TypeFeatureInfoEntry[] | undefined;
  resultsOntarioNoResults: TypeFeatureInfoEntry[] | undefined;
  resultsAlbertaNoResults1: TypeFeatureInfoEntry[] | undefined;
  resultsAlbertaResults: TypeFeatureInfoEntry[] | undefined;
  resultsAlbertaNoResults2: TypeFeatureInfoEntry[] | undefined;
  nameFieldResults: TypeFeatureInfoEntry[] | undefined;
  summaryResults: TypeFeatureInfoEntry[] | undefined;
  aliasResults: TypeFeatureInfoEntry[] | undefined;
  initialZoom: number | undefined;
  finalZoom: number | undefined;
};

/** Height measurements for fixed-height map layout tests. */
type TypeMapHeightMeasurements = {
  /** Height of the root GeoView map element. */
  geoviewMapHeight: number;
  /** Height of the rendered collapsed footer chrome. */
  footerChromeHeight: number;
};

/** Captured boundary samples and independent pixel/coordinate expectations. */
interface TypeViewportBoundarySnapshot {
  /** Public viewer result. */
  boundary: TypeViewportBoundaryLonLat;
  /** Second snapshot from the same rendered frame. */
  repeatedBoundary: TypeViewportBoundaryLonLat;
  /** Samples calculated from view center, resolution, rotation, and padding. */
  expected: Coordinate[];
  /** Returned coordinates projected back to viewport pixels. */
  pixels: (number[] | null)[];
  /** Expected screen positions. */
  expectedPixels: number[][];
  /** Bottom padding at sampling time. */
  bottomPadding: number;
  /** Actual map-info bar overlay height (zero for static maps). */
  infoHeight: number;
  /** Southern sample calculated at the full canvas bottom. */
  canvasSouth: Coordinate;
  /** Indicates independent objects were returned by consecutive calls. */
  freshObjects: boolean;
  /** Rendered view rotation in radians. */
  rotation: number;
  /** Rendered logical center in longitude/latitude. */
  center: Coordinate;
  /** Southern midpoint derived from the axis-aligned extent rather than the viewport. */
  extentSouth: Coordinate;
}

/** Fit outcome captured before assertion so operations stay in the execution phase. */
interface TypeViewportMidpointFitResult {
  /** Rendered geometry after fitting. */
  snapshot: TypeViewportBoundarySnapshot;
  /** Original coordinates copied before fitting. */
  original: Coordinate[];
  /** Caller-owned array after fitting. */
  input: Coordinate[];
  /** Original coordinates projected to pixels after fitting. */
  pixels: (number[] | null)[];
  /** Original pixel positions before the view was changed. */
  originalPixels: number[][];
  /** Source rotation to restore when the projection is unchanged. */
  rotation: number;
}

// #endregion TYPES AND INTERFACES
