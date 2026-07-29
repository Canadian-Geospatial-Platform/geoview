import type { TypeGeoviewLayerType } from 'geoview-core/api/types/layer-schema-types';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { delay } from 'geoview-core/core/utils/utilities';
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
import { getStoreLayerBounds, getStoreLayerControls, getStoreLayerLegendLayerByPath } from 'geoview-core/core/stores/states/layer-state';
import {
  getStoreMapPointMarkers,
  getStoreMapConfigOverviewMap,
  getStoreMapConfigComponents,
  getStoreMapStateJson,
  getStoreMapNorthArrow,
} from 'geoview-core/core/stores/states/map-state';
import { Projection } from 'geoview-core/geo/utils/projection';

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
        await this.#helperCreateMapConfig(test, mapId, [['footerBar', footerBarConfig]]);

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
        await this.#helperCreateMapConfig(test, mapId, [['appBar', appBarConfig]]);

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
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [
          ['footerBar', null],
          ['appBar', null],
        ]);

        return mapViewer;
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
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [
          ['footerBar', emptyTabsConfig],
          ['appBar', emptyTabsConfig],
        ]);

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
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['navBar', null]]);

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
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['navBar', []]]);

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

        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['map.viewSettings.initialView', initialViewConfig]]);

        // GV The zoom on layers happens asynchronously and is not awaited during the map creation processing.
        // GV Therefore, we have to wait a short while here to let the zoom on layer extent happen.
        // TODO: Add a promise on the zoom on layer extent, upon map creation processing, so that we can properly await on that promise instead of using a delay here
        await delay(2000);

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
        test.addStep(`Verifying layer is horizontally centered in map extent... ${Math.round(leftBuffer)} vs ${Math.round(rightBuffer)}`);
        Test.assertIsEqual(Math.round(leftBuffer), Math.round(rightBuffer));

        // Verify vertical centering accounts for the map-info bar.
        // zoomToExtent applies padding = [paddingHeight, paddingWidth, paddingHeight + mapInfoHeight, paddingWidth],
        // so the bottom buffer (index 2) includes the map-info bar pixel height converted to map units.
        const mapInfoHeightMapUnits = newMapViewer.getHTMLElementMapInfoHeightInMapUnits();

        // The bottomBuffer should equal topBuffer + mapInfoHeightMapUnits
        test.addStep(`Verifying vertical centering with map-info bar offset (${Math.round(mapInfoHeightMapUnits)} map units)...`);
        Test.assertIsEqual(Math.round(bottomBuffer), Math.round(topBuffer + mapInfoHeightMapUnits));
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

        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['map.overlayObjects', overlayObjectsConfig]]);
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

        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['map.viewSettings', viewSettingsConfig]]);
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
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['components', ['overview-map', 'north-arrow']]]);
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
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['components', ['north-arrow']]]);
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
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['components', ['north-arrow']]]);
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
        const northArrowEl = document.querySelector(`#mapTargetElement-${mapId} #northarrow`);
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
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['components', []]]);
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
        const northArrowEl = document.querySelector(`#mapTargetElement-${mapId} #northarrow`);
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
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [
          ['components', ['overview-map', 'north-arrow']],
          ['overviewMap', { hideOnZoom: 7 }],
        ]);
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
        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [
          ['components', ['overview-map', 'north-arrow']],
          ['overviewMap', { hideOnZoom: 7 }],
        ]);
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

  // #region View Settings Tests

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

        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['map.viewSettings', viewSettingsConfig]]);
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

        const mapViewer = await this.#helperCreateMapConfig(test, mapId, [['map.viewSettings', viewSettingsConfig]]);

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

  // #endregion

  // #region Initial Settings Controls Tests

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

  // #endregion

  // #region Initial Settings Opacity Cascading Tests

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

  // #endregion

  // #region Initial Settings Controls + States Combo Tests

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

  // #endregion

  // #region Initial Settings Legend Collapsed Tests

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

  // #endregion

  // #region Initial Settings Controls Cascading Tests

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

  // #endregion

  // #region Initial Filters Tests

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
        test.addStep('Creating map with GeoJSON layer having layerFilter...');
        await this.#helperCreateMapConfig(test, mapId, [
          [
            'map.listOfGeoviewLayerConfig',
            [
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
          ],
        ]);
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
        test.addStep('Creating map with OGC Feature layer having layerFilter...');
        await this.#helperCreateMapConfig(test, mapId, [
          [
            'map.listOfGeoviewLayerConfig',
            [
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
          ],
        ]);
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
        test.addStep('Creating map with WFS layer having layerFilter...');
        await this.#helperCreateMapConfig(test, mapId, [
          [
            'map.listOfGeoviewLayerConfig',
            [
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
          ],
        ]);
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
    const LAYER_PATH = `${GV_LAYER_ID}/${GVAbstractTester.HISTORICAL_FLOOD_URL_LAYER_ID}`;
    const FILTER_EXPRESSION = "event_type = 'freshet'";

    return this.test(
      'Test Esri Dynamic layerFilter is stored and accessible after loading...',
      async (test) => {
        test.addStep('Creating map with Esri Dynamic layer having layerFilter...');
        await this.#helperCreateMapConfig(test, mapId, [
          [
            'map.listOfGeoviewLayerConfig',
            [
              {
                geoviewLayerId: GV_LAYER_ID,
                geoviewLayerName: 'Historical Flood Events',
                metadataAccessPath: GVAbstractTester.HISTORICAL_FLOOD_URL_MAP_SERVER,
                geoviewLayerType: 'esriDynamic' as TypeGeoviewLayerType,
                listOfLayerEntryConfig: [
                  {
                    layerId: GVAbstractTester.HISTORICAL_FLOOD_URL_LAYER_ID,
                    layerFilter: FILTER_EXPRESSION,
                  },
                ],
              },
            ],
          ],
        ]);
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
        test.addStep('Creating map with Esri Feature layer having layerFilter...');
        await this.#helperCreateMapConfig(test, mapId, [
          [
            'map.listOfGeoviewLayerConfig',
            [
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
          ],
        ]);
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

  // #endregion

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

    return this.#helperCreateMapConfig(test, mapId, [
      [
        'map.listOfGeoviewLayerConfig',
        [
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
      ],
    ]);
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

    return this.#helperCreateMapConfig(test, mapId, [
      [
        'map.listOfGeoviewLayerConfig',
        [
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
      ],
    ]);
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
    return this.#helperCreateMapConfig(test, mapId, [
      [
        'map.listOfGeoviewLayerConfig',
        [
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
      ],
    ]);
  }

  /**
   * Helper function to create a basic map configuration with optional overrides.
   *
   * @param test - The test instance used to log steps
   * @param mapId - The map identifier
   * @param overrides - Optional configuration overrides as path-value pairs
   *  - Array of [path, value] pairs:
   *     [['footerBar', { tabs: { core: ['data-table'] }, selectedTab: 'data-table' }]]
   *   - Single [path, value] pair:
   *     ['map.viewSettings.initialView', { layerIds: ['geojsonLYR5/polygons.json'] }]
   * @returns A promise that resolves to the created map viewer
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

    // Apply overrides - normalize to array format then apply each path-value pair
    const overridesArray = Array.isArray(overrides[0]) ? (overrides as [string, unknown][]) : [overrides as [string, unknown]];
    overridesArray.forEach(([path, value]) => {
      MapConfigTester.#setValueByPath(baseConfig, path, value);
    });

    // Delete current map
    test.addStep('Deleting current map...');
    await this.getApi().deleteMapViewer(mapId, false);

    // Wait for layer to load and data table to initialize
    test.addStep('Creating the map from config...');
    const mapViewer = await this.getApi().createMapFromConfigFast(mapId, JSON.stringify(baseConfig), 500);

    // Replace the map viewer and the controller registry in the tester with the new one created from config
    this.reassignMapViewerAndControllers(mapViewer, mapViewer.controllers);

    // Wait for layer to load and data table to initialize
    test.addStep('Waiting for layers to get loaded...');
    const loadedLayersCount = await this.getControllersRegistry().layerController.waitForLayersLoaded();

    test.addStep(`Layers loaded (${loadedLayersCount})`);
    return mapViewer;
  }

  /**
   * Sets a value in an object using a dot-notation path. If value is null or undefined, removes the key.
   *
   * @param obj - The object to modify
   * @param path - Dot-notation path like 'map.viewSettings.initialView'
   * @param value - The value to set, or null/undefined to remove
   */
  static #setValueByPath(obj: Record<string, unknown>, path: string, value: unknown): void {
    const keys = path.split('.');
    let current = obj;

    // Validate against prototype pollution
    const dangerousKeys = ['__proto__', 'constructor', 'prototype'];
    if (keys.some((key) => dangerousKeys.includes(key))) {
      throw new Error(`Invalid path: "${path}" contains dangerous keys that could lead to prototype pollution`);
    }

    // Navigate to the parent of the final key
    for (let i = 0; i < keys.length - 1; i++) {
      const key = keys[i];
      if (!Object.prototype.hasOwnProperty.call(current, key) || typeof current[key] !== 'object' || current[key] === null) {
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
