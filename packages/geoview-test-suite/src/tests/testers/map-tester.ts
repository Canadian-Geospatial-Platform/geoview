import { TestError } from '../core/exceptions';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { delay } from 'geoview-core/core/utils/utilities';
import type { TypeMapState } from 'geoview-core/geo/map/map-viewer';
import type { TypeMapFeaturesConfig } from 'geoview-core/core/types/global-types';
import { MapEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/map-event-processor';
import type { Extent, TypeBasemapId, TypeValidMapProjectionCodes } from 'geoview-core/api/types/map-schema-types';
import { AppEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/app-event-processor';
import { UIEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/ui-event-processor';
import type { Coordinate } from 'ol/coordinate';
import { FeatureInfoEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/feature-info-event-processor';
import type { TypeFeatureInfoResultSetEntry } from 'geoview-core/core/stores/store-interface-and-intial-values/feature-info-state';
import { Projection } from 'geoview-core/geo/utils/projection';

/**
 * Main Map testing class.
 * @extends {GVAbstractTester}
 */
export class MapTester extends GVAbstractTester {
  /**
   * Returns the name of the Tester.
   * @returns {string} The name of the Tester.
   */
  override getName(): string {
    return 'MapTester';
  }

  /**
   * Tests the map state upon initial loading.
   * @returns {Promise<Test<TypeMapState>>} A Promise that resolves with the Test containing the map state.
   */
  testMapState(): Promise<Test<TypeMapState>> {
    // Get the projection
    const { projection } = this.#getMapConfigFromStore().map.viewSettings;

    // The expected map state configuration including the current projection
    const expectedConfig: Record<string, unknown> = {
      currentProjection: projection,
    };

    // GV Hard to test the zoom, because of other factors like view extent and such affecting the zoom compared to the config.
    // // If the initial view had a specific zoom
    // const zoom = this.getMapConfigFromStore().map.viewSettings.initialView?.zoomAndCenter?.[0];
    // if (zoom) {
    //   expectedConfig.currentZoom = zoom;
    // }

    // Test the map state
    return this.test(
      'Test projection',
      () => {
        // Return the map state
        return MapEventProcessor.getMapState(this.getMapId());
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected projection config...');
        Test.assertJsonObject(result, expectedConfig);
      }
    );
  }

  /**
   * Tests a zoom operation on the map.
   * @param {number} zoomEnd - The zoom target
   * @param {number} zoomDuration - The duration for the zoom
   * @returns {Promise<Test<number>>} A Promise that resolves with the Test containing the zoom destination.
   */
  testMapZoom(zoomEnd: number, zoomDuration: number): Promise<Test<number>> {
    // Get the current zoom
    const { currentZoom } = MapEventProcessor.getMapState(this.getMapId());

    // Test the projection
    return this.test(
      'Test zoom',
      async (test) => {
        // Test the zoom value
        if (currentZoom === zoomEnd) throw new TestError(`False precondition, map zoom was already at zoom destination ${zoomEnd}`);

        // Perform a zoom
        test.addStep('Performing zoom...');
        await MapEventProcessor.zoomMap(this.getMapId(), zoomEnd, zoomDuration);

        // Return the result
        return zoomEnd;
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected zoom in the store...');
        Test.assertIsEqual(MapEventProcessor.getMapState(this.getMapId()).currentZoom, result);
      },
      async (test) => {
        // Unzooms to original position
        test.addStep('Unzooms to the original zoom...');
        await MapEventProcessor.zoomMap(this.getMapId(), currentZoom, zoomDuration);
      }
    );
  }

  /**
   * Tests switching between projections, zooming, and returning to initial extent.
   * This test performs the following operations:
   * 1. Switches projection to the second projection
   * 2. Zooms to a specified level
   * 3. Switches back to the initial projection
   * 4. Zooms back to the initial extent
   * 5. Verifies the map extent matches the original extent
   *
   * @param {TypeValidMapProjectionCodes} initialProjection - The initial projection code.
   * @param {TypeValidMapProjectionCodes} secondProjection - The target projection code to switch to.
   * @param {number} zoomLevel - The zoom level to test during projection switch.
   * @returns {Promise<Test<Extent>>} A Promise that resolves with the Test containing the final map extent.
   */
  async testSwitchProjectionAndExtent(
    initialProjection: TypeValidMapProjectionCodes,
    secondProjection: TypeValidMapProjectionCodes,
    zoomLevel: number
  ): Promise<Test<Extent>> {
    // Zoom to initial extent
    await MapEventProcessor.zoomToInitialExtent(this.getMapId());

    // Get the current init extent
    const { mapExtent, currentProjection } = MapEventProcessor.getMapState(this.getMapId());

    // Test the projection/initial extent
    return this.test(
      'Test switch projection back and forth, zoom and zoom to initial extent',
      async (test) => {
        // Test the projection value
        if (currentProjection === secondProjection)
          throw new TestError(`False precondition, map projection was already at projection destination ${secondProjection}`);

        // Perform a projection switch
        test.addStep(`Performing projection switch to ${secondProjection}...`);
        await MapEventProcessor.setProjection(this.getMapId(), secondProjection);

        // Update the step
        test.addStep(`Performing zoom to level ${zoomLevel}...`);

        // Perform a zoom
        await MapEventProcessor.zoomMap(this.getMapId(), zoomLevel, 1000);

        // Update the step
        test.addStep('Performing projection switch to original...');

        // Perform a projection switch
        await MapEventProcessor.setProjection(this.getMapId(), initialProjection);

        // Update the step
        test.addStep('Performing zomm to inital extent...');

        // Zoom to initial extent
        await MapEventProcessor.zoomToInitialExtent(this.getMapId());

        // Return the result
        return MapEventProcessor.getMapState(this.getMapId()).mapExtent;
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying expected map extent in the store...');
        Test.assertIsArrayEqual<number>(mapExtent, result, 0);
      }
    );
  }

  /**
   * Tests geometry group z-index operations.
   * This test performs the following operations:
   * 1. Creates a circle geometry in a new test group
   * 2. Gets the initial z-index value
   * 3. Sets the z-index to 0
   * 4. Gets the z-index again
   * 5. Verifies both values match expectations
   *
   * @returns {Promise<Test<{ initialZIndex: number | undefined; finalZIndex: number | undefined }>>} A Promise that resolves with the Test containing the z-index values.
   */
  testGeometryGroupZIndex(): Promise<Test<{ initialZIndex: number | undefined; finalZIndex: number | undefined }>> {
    const testGroupId = 'testZIndexGroup';
    const circleCoords: [number, number] = [-75.6972, 45.4215]; // Ottawa

    return this.test(
      'Test geometry group z-index get/set operations',
      (test) => {
        // Add a circle to a new geometry group
        test.addStep('Adding circle to test group...');
        this.getMapViewer().layer.geometry.addCircle(
          circleCoords,
          {
            projection: 4326,
            style: {
              radius: 5,
              fillColor: '#ff0000',
              fillOpacity: 0.3,
              strokeColor: '#ff0000',
              strokeWidth: 2,
            },
          },
          'testCircle',
          testGroupId
        );

        // Get the initial z-index
        test.addStep('Getting initial z-index...');
        const initialZIndex = this.getMapViewer().layer.geometry.getGeometryGroupZIndex(testGroupId);

        // Set z-index to 0
        test.addStep(`Initial z-index: ${initialZIndex}`);
        test.addStep('Setting z-index to 0...');
        this.getMapViewer().layer.geometry.setGeometryGroupZIndex(testGroupId, 0);

        // Get the z-index again
        test.addStep('Getting final z-index...');
        const finalZIndex = this.getMapViewer().layer.geometry.getGeometryGroupZIndex(testGroupId);

        // Return both values
        test.addStep(`Final z-index: ${finalZIndex}`);
        return { initialZIndex, finalZIndex };
      },
      (test, result) => {
        // Perform assertions
        test.addStep('Verifying initial z-index is 9999...');
        Test.assertIsEqual(result.initialZIndex, 9999);

        test.addStep('Verifying final z-index is 0...');
        Test.assertIsEqual(result.finalZIndex, 0);
      },
      (test) => {
        // Cleanup: remove the test group
        test.addStep('Cleaning up test geometry group...');
        this.getMapViewer().layer.geometry.deleteGeometryGroup(testGroupId);
      }
    );
  }

  /**
   * Gets the map config from the store.
   * @returns {TypeMapFeaturesConfig} The map config as read from the store.
   */
  #getMapConfigFromStore(): TypeMapFeaturesConfig {
    // Redirect
    const mapConfig = MapEventProcessor.getGeoViewMapConfig(this.getMapId());
    if (!mapConfig) throw new TestError(`Map config for map id ${this.getMapId()} couldn't be read from store`);
    return mapConfig;
  }

  /**
   * Tests zooming to a lon/lat extent using zoomToLonLatExtentOrCoordinate.
   * @returns {Promise<Test<Extent>>} A Promise that resolves with the Test containing the resulting map extent.
   */
  testZoomToExtent(): Promise<Test<Extent>> {
    // Target extent will be adjusted by the map to fit viewport
    const targetExtent: Extent = [-87, 51, -84, 53];
    const expectedExtent: Extent = [-88.584, 50.227, -82.142, 53.726];

    return this.test(
      'Test zoom to lon/lat extent',
      async (test) => {
        test.addStep('Zooming to extent...');

        // Zoom to extent
        await this.getMapViewer().zoomToLonLatExtentOrCoordinate(targetExtent);

        // Transform extent and handle potential undefined return
        const transformedExtent = this.getApi().utilities.projection.transformExtentFromProj(
          MapEventProcessor.getMapState(this.getMapId()).mapExtent,
          this.getApi().utilities.projection.getProjectionFromString('EPSG:3978'),
          this.getApi().utilities.projection.getProjectionLonLat()
        );

        // Ensure we return a valid Extent
        Test.assertIsArrayLengthEqual(transformedExtent as [], 4);

        // Return the resulting extent
        return transformedExtent;
      },
      (test, result) => {
        test.addStep('Verifying map zoomed to extent (with aspect ratio tolerance)...');
        // The map adjusts extent to fit viewport aspect ratio, compare with tolerance for aspect ratio adjustment
        Test.assertIsArrayEqual(result, expectedExtent, 2);
      }
    );
  }

  /**
   * Tests zooming to a lon/lat coordinate using zoomToLonLatExtentOrCoordinate.
   * @returns {Promise<Test<Extent>>} A Promise that resolves with the Test containing the resulting map extent.
   */
  testZoomToCoordinate(): Promise<Test<Coordinate>> {
    const targetCoordinate: Coordinate = [-80, 50];

    return this.test(
      'Test zoom to lon/lat coordinate',
      async (test) => {
        test.addStep('Zooming to coordinate [-80, 50]...');

        // Zoom to coordinate
        await this.getMapViewer().setMapZoomLevel(8);
        await this.getMapViewer().zoomToLonLatExtentOrCoordinate(targetCoordinate);

        // Transform coordinates
        const transformedCoordinates = this.getApi().utilities.projection.transformCoordinates(
          MapEventProcessor.getMapState(this.getMapId()).mapCenterCoordinates,
          'EPSG:3978',
          'EPSG:4326'
        );

        // Ensure we return a valid Coordinate
        Test.assertIsArrayLengthEqual(transformedCoordinates as [], 2);

        // Return as Coordinate type (number array with at least 2 elements)
        return transformedCoordinates as Coordinate;
      },
      (test, result) => {
        test.addStep('Verifying map centered on coordinate...');
        Test.assertIsArrayEqual(result, targetCoordinate, 0);
      }
    );
  }

  /**
   * Tests selecting a footer bar tab.
   * @returns {Promise<Test<string>>} A Promise that resolves with the Test containing the selected tab id.
   */
  testFooterBarSelectTab(): Promise<Test<string>> {
    const targetTab = 'data-table';

    return this.test(
      'Test footer bar select tab',
      async (test) => {
        test.addStep(`Selecting footer bar tab '${targetTab}'...`);

        // Select the tab
        this.getMapViewer().footerBarApi.selectTab(targetTab);

        // Wait for tab selection to complete
        await delay(500);

        return targetTab;
      },
      (test, result) => {
        test.addStep('Verifying tab is selected...');
        const activeTab = UIEventProcessor.getActiveFooterBarTab(this.getMapId());
        Test.assertIsEqual(activeTab, result);
      }
    );
  }

  /**
   * Tests selecting an app bar tab.
   * @returns {Promise<Test<string>>} A Promise that resolves with the Test containing the selected tab id.
   */
  testAppBarSelectTab(): Promise<Test<string>> {
    const targetTab = 'geolocator';

    return this.test(
      'Test app bar select tab',
      async (test) => {
        test.addStep(`Selecting app bar tab '${targetTab}'...`);

        // Select the tab
        this.getMapViewer().appBarApi.selectTab(targetTab);

        // Wait for tab selection to complete
        await delay(500);

        return targetTab;
      },
      (test, result) => {
        test.addStep('Verifying tab is selected...');
        const activeTab = UIEventProcessor.getActiveAppBarTab(this.getMapId());
        Test.assertIsEqual(activeTab?.tabId, result);
      }
    );
  }

  /**
   * Tests creating a custom footer bar tab.
   * @returns {Promise<Test<string>>} A Promise that resolves with the Test containing the created tab id.
   */
  testFooterBarCreateTab(): Promise<Test<string>> {
    const customTabId = 'custom-test-tab';
    const customTabConfig = {
      id: customTabId,
      value: 0,
      label: 'My Custom Tab',
      content: '<br><div><ul><li>How to export map coordinate data to: GeoJSON, or CSV.</li></ul></div>',
    };

    return this.test(
      'Test footer bar create custom tab',
      async (test) => {
        test.addStep('Creating custom footer bar tab...');

        // Create the tab
        this.getMapViewer().footerBarApi.createTab(customTabConfig);

        // Wait for tab creation to complete
        await delay(500);

        return customTabId;
      },
      (test, result) => {
        test.addStep('Verifying custom tab exists...');
        const { tabs } = this.getMapViewer().footerBarApi;
        const customTab = tabs.find((tab) => tab.id === result);
        Test.assertIsDefined('customTab', customTab);

        test.addStep('Verifying custom tab id...');
        Test.assertIsEqual(customTab?.id, result);
      }
    );
  }

  /**
   * Tests changing the language.
   * @returns {Promise<Test<string>>} A Promise that resolves with the Test containing the new language.
   */
  testSetLanguage(): Promise<Test<string>> {
    const targetLanguage = 'fr';
    const originalLanguage = 'en';

    return this.test(
      'Test set language to French',
      async (test) => {
        test.addStep(`Changing language to '${targetLanguage}'...`);

        if (AppEventProcessor.getDisplayLanguage(this.getMapId()) === 'fr') {
          throw new TestError(`False precondition, language is already set to '${targetLanguage}'`);
        }

        // Set language
        await this.getMapViewer().setLanguage(targetLanguage);

        return AppEventProcessor.getDisplayLanguage(this.getMapId());
      },
      (test, result) => {
        test.addStep('Verifying language changed...');
        Test.assertIsEqual(result, targetLanguage);
      },
      async (test) => {
        // Restore original language
        test.addStep(`Restoring language to '${originalLanguage}'...`);
        await this.getMapViewer().setLanguage(originalLanguage);
      }
    );
  }

  /**
   * Tests creating and setting a basemap.
   * @returns {Promise<Test<string>>} A Promise that resolves with the Test containing the basemap id.
   */
  testCreateAndSetBasemap(): Promise<Test<string>> {
    const targetBasemapId: TypeBasemapId = 'simple';
    const originalBasemap = this.getMapViewer().basemap.activeBasemap;

    return this.test(
      'Test create and set basemap',
      async (test) => {
        test.addStep(`Creating basemap with id '${targetBasemapId}'...`);

        if (originalBasemap?.basemapId === targetBasemapId) {
          throw new TestError(`False precondition, basemap is already set to '${targetBasemapId}'`);
        }

        // Create the basemap
        const basemapOptions = { basemapId: targetBasemapId, shaded: false, labeled: false };
        const basemap = await this.getMapViewer().basemap.createCoreBasemap(basemapOptions);

        test.addStep('Setting the new basemap...');

        // Set the basemap
        this.getMapViewer().basemap.setBasemap(basemap);

        const activeBasemapId = this.getMapViewer().basemap.activeBasemap?.basemapId;
        if (!activeBasemapId) {
          throw new TestError('Failed to get active basemap ID after setting basemap');
        }
        return activeBasemapId;
      },
      (test, result) => {
        test.addStep('Verifying basemap changed...');
        Test.assertIsEqual(result, targetBasemapId);
      }
    );
  }

  /**
   * Tests north arrow rotation in LCC projection when zoomed to British Columbia.
   * This test performs the following operations:
   * 1. Switches to LCC projection (3978)
   * 2. Zooms to British Columbia extent
   * 3. Gets the north arrow rotation from DOM element
   * 4. Verifies the rotation matches expected value
   *
   * @returns {Promise<Test<number>>} A Promise that resolves with the Test containing the north arrow angle.
   */
  testNorthArrowRotationLCC(): Promise<Test<number>> {
    // British Columbia approximate extent in lon/lat (EPSG:4326)
    // West: -139°, South: 48°, East: -114°, North: 60°
    const bcExtent: Extent = [-139, 48, -114, 60];
    const expectedArrowAngle = 25; // Expected north arrow angle over BC in LCC

    return this.test(
      'Test north arrow rotation in LCC projection for British Columbia',
      async (test) => {
        // Get current projection
        const { currentProjection } = MapEventProcessor.getMapState(this.getMapId());

        // Switch to LCC projection if not already there
        if (currentProjection !== 3978) {
          test.addStep('Switching to LCC projection (3978)...');
          await MapEventProcessor.setProjection(this.getMapId(), 3978);
        }

        test.addStep('Zooming to British Columbia extent...');
        await this.getMapViewer().zoomToLonLatExtentOrCoordinate(bcExtent);

        test.addStep('Getting north arrow rotation from DOM element...');
        await delay(500); // Wait for DOM to update
        const rotationElement = document.querySelector(`.map-info-rotation-${this.getMapId()}`) as HTMLElement;

        if (!rotationElement) {
          throw new TestError(`North arrow rotation element not found for map ${this.getMapId()}`);
        }

        // Extract rotation angle from transform style (e.g., "rotate(45deg)")
        const transformStyle = window.getComputedStyle(rotationElement).transform;
        let angleValue = 0;

        if (transformStyle && transformStyle !== 'none') {
          // Parse matrix transform to get rotation angle
          const values = transformStyle.match(/matrix\(([^)]+)\)/);
          if (values && values[1]) {
            const matrixValues = values[1].split(', ');
            const a = parseFloat(matrixValues[0]);
            const b = parseFloat(matrixValues[1]);
            angleValue = Math.round(Math.atan2(b, a) * (180 / Math.PI) * 10) / 10;
          }
        }

        test.addStep(`North arrow rotation: ${angleValue}°`);

        return angleValue;
      },
      (test, result) => {
        test.addStep('Verifying north arrow rotation is calculated...');
        // In LCC projection over BC, the north arrow should match expected rotation
        Test.assertIsEqual(result, expectedArrowAngle, 0);
      }
    );
  }

  /**
   * Tests that non-queryable layers do not appear in details state when clicking on the map.
   * This test performs the following operations:
   * 1. Gets the first layer from the map
   * 2. Sets the layer as non-queryable
   * 3. Simulates a map click
   * 4. Verifies that the layer does not appear in the details state
   *
   * @returns {Promise<Test<number>>} A Promise that resolves with the Test containing the number of layers in details state.
   */
  testNonQueryableLayerNotInDetails(layerPath: string, lonlat: Coordinate): Promise<Test<TypeFeatureInfoResultSetEntry[]>> {
    return this.test(
      'Test non-queryable layer not in details after map click',
      async (test) => {
        // Check if the layer exists in the feature info layer set
        const { featureInfoLayerSet } = this.getMapViewer().layer;
        if (!featureInfoLayerSet.resultSet[layerPath]) {
          throw new TestError(
            `Layer '${layerPath}' not found in featureInfoLayerSet. Available layers: ${Object.keys(featureInfoLayerSet.resultSet).join(', ')}`
          );
        }

        // If listener not enabled, enable it
        test.addStep(`Enabling click listener for layer '${layerPath}'...`);
        if (!featureInfoLayerSet.isClickListenerEnabled(layerPath)) {
          featureInfoLayerSet.enableClickListener(layerPath);
        }

        // Perform a map click using the feature info layer set
        // GV: The layer needs to be visible (in viewport) for the query to work
        test.addStep(`Perform query operation at given coordinates...`);
        await MapEventProcessor.zoomToInitialExtent(this.getMapId());
        await featureInfoLayerSet.queryLayers(lonlat);

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOnTemp = FeatureInfoEventProcessor.findLayerDataFromLayerDataArray(this.getMapId(), layerPath);

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn = layerDataOnTemp ? { ...layerDataOnTemp } : undefined;

        // Clear result set then set layer non queryable
        test.addStep(`Clearing feature info results and setting layer '${layerPath}' as non-queryable...`);
        FeatureInfoEventProcessor.resetResultSet(this.getMapId(), layerPath);
        featureInfoLayerSet.disableClickListener(layerPath);

        // Perform a map click using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        await featureInfoLayerSet.queryLayers(lonlat);

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOff = FeatureInfoEventProcessor.findLayerDataFromLayerDataArray(this.getMapId(), layerPath);

        return [layerDataOn!, layerDataOff!];
      },
      (test, result) => {
        const [layerDataOn, layerDataOff] = result;

        test.addStep('Verifying layer data features when queryable...');
        Test.assertIsArray(layerDataOn.features);
        Test.assertIsArrayLengthEqual(layerDataOn.features, 2);

        test.addStep('Verifying no layer data features when non-queryable...');
        Test.assertIsArray(layerDataOff.features);
        Test.assertIsArrayLengthEqual(layerDataOff.features, 0);

        // Set back the enable state on layer
        test.addStep(`Enabling click listener for layer '${layerPath}'...`);
        this.getMapViewer().layer.featureInfoLayerSet.enableClickListener(layerPath);
      }
    );
  }

  /**
   * Tests that layer hoverable state is properly reflected in hoverFeatureInfoLayerSet.
   * This test performs the following operations:
   * 1. Verifies the layer is hoverable in the hoverFeatureInfoLayerSet
   * 2. Disables hoverable on the layer
   * 3. Verifies the layer is now disabled in the hoverFeatureInfoLayerSet resultSet
   *
   * @param {string} layerPath - The layer path to test
   * @returns {Promise<Test<{enabledBefore: boolean | undefined, enabledAfter: boolean | undefined}>>} A Promise that resolves with the Test containing the hover states.
   */
  testLayerHoverableState(layerPath: string): Promise<Test<{ enabledBefore: boolean | undefined; enabledAfter: boolean | undefined }>> {
    return this.test(
      'Test layer hoverable state in hoverFeatureInfoLayerSet',
      (test) => {
        // Check if the layer exists in the hover feature info layer set
        const { hoverFeatureInfoLayerSet } = this.getMapViewer().layer;
        if (!hoverFeatureInfoLayerSet.resultSet[layerPath]) {
          throw new TestError(
            `Layer '${layerPath}' not found in hoverFeatureInfoLayerSet. Available layers: ${Object.keys(hoverFeatureInfoLayerSet.resultSet).join(', ')}`
          );
        }

        // If listener not enabled, enable it
        test.addStep(`Enabling hover listener for layer '${layerPath}'...`);
        if (!hoverFeatureInfoLayerSet.isHoverListenerEnabled(layerPath)) {
          hoverFeatureInfoLayerSet.enableHoverListener(layerPath);
        }

        // Get initial hoverable state from result set
        test.addStep(`Checking initial hoverable state for layer '${layerPath}'...`);
        const enabledBefore = hoverFeatureInfoLayerSet.resultSet[layerPath].eventListenerEnabled;
        test.addStep(`Layer hoverable state before: ${enabledBefore}`);

        // Disable hoverable on the layer
        test.addStep(`Disabling hoverable for layer '${layerPath}'...`);
        hoverFeatureInfoLayerSet.disableHoverListener(layerPath);

        // Get hoverable state after disabling
        test.addStep(`Checking hoverable state after disabling for layer '${layerPath}'...`);
        const enabledAfter = hoverFeatureInfoLayerSet.resultSet[layerPath].eventListenerEnabled;
        test.addStep(`Layer hoverable state after: ${enabledAfter}`);

        return { enabledBefore, enabledAfter };
      },
      (test, result) => {
        test.addStep('Verifying layer was initially hoverable...');
        Test.assertIsEqual(result.enabledBefore, true);

        test.addStep('Verifying layer is now not hoverable...');
        Test.assertIsEqual(result.enabledAfter, false);
      }
    );
  }

  /**
   * Tests that the selected layer in details persists correctly when clicking on different map locations.
   * This test performs the following operations:
   * 1. Clicks on the map and verifies the first layer (polygons) is auto-selected
   * 2. Manually selects a different layer (Top Projects)
   * 3. Clicks on a different location
   * 4. Verifies the manually selected layer remains selected with the correct feature count
   *
   * @returns {Promise<Test<{firstLayerPath: string, firstFeatureCount: number, secondLayerPath: string, secondFeatureCount: number}>>}
   */
  testDetailsLayerSelectionPersistence(): Promise<Test<{ firstLayerPath: string; secondLayerPath: string; secondFeatureCount: number }>> {
    const firstClickCoords: Coordinate = [-87.4, 52.9];
    const secondClickCoords: Coordinate = [-73.9, 46.5];
    const expectedFirstLayer = 'geojsonLYR5/polygons.json';
    const expectedSecondLayer = 'esriFeatureLYR5/0';

    return this.test(
      'Test details layer selection persistence across map clicks',
      async (test) => {
        // Helper function to simulate a complete map click and wait for query completion
        // TODO: This should return a Promise and be awaited. emitMapSingleClick AND MapEventProcess setMapSingleCLcik should be Promisses waiting on queryLayers
        const simulateMapClick = (coords: Coordinate): Promise<void> => {
          return new Promise((resolve) => {
            // Transform lonlat to map projection
            const projCode = this.getMapViewer().getProjection().getCode();
            const projected = Projection.transformPoints([coords], Projection.PROJECTION_NAMES.LONLAT, projCode)[0];

            // Register one-time listener for query completion
            const handleQueryEnded = (): void => {
              // Cleanup - unregister the handler
              this.getMapViewer().layer.featureInfoLayerSet.offQueryEnded(handleQueryEnded);
              resolve();
            };

            // Register the handler before clicking
            this.getMapViewer().layer.featureInfoLayerSet.onQueryEnded(handleQueryEnded);

            // emitMapSingleClick now handles both store update and event emission
            this.getMapViewer().simulateMapClick({
              lonlat: coords,
              pixel: [0, 0],
              projected,
              dragging: false,
            });
          });
        };

        // TODO: Need to wait before calling the first map click return empty features
        await delay(2000);

        // First click
        test.addStep(`Performing first map click at [${firstClickCoords.join(', ')}]...`);
        await simulateMapClick(firstClickCoords);
        await delay(1000); // TODO: Something weird with the first test, even with the click await it does not work

        // Check which layer is selected after first click
        test.addStep('Checking selected layer after first click...');
        const firstSelectedLayerPath = FeatureInfoEventProcessor.getSelectedLayerPath(this.getMapId());
        test.addStep(`First selected layer: ${firstSelectedLayerPath}`);

        // Manually select the second layer (Top Projects)
        test.addStep(`Manually selecting layer '${expectedSecondLayer}'...`);
        FeatureInfoEventProcessor.setSelectedLayerPath(this.getMapId(), expectedSecondLayer);

        // Second click at different location
        test.addStep(`Performing second map click at [${secondClickCoords.join(', ')}]...`);
        await simulateMapClick(secondClickCoords);

        // Check which layer is still selected after second click
        test.addStep('Checking selected layer after second click...');
        const secondSelectedLayerPath = FeatureInfoEventProcessor.getSelectedLayerPath(this.getMapId());
        test.addStep(`Second selected layer: ${secondSelectedLayerPath}`);

        // Get feature count   for second layer
        const secondLayerData = FeatureInfoEventProcessor.findLayerDataFromLayerDataArray(this.getMapId(), secondSelectedLayerPath);
        const secondFeatureCount = secondLayerData?.features?.length || 0;
        test.addStep(`Second layer feature count: ${secondFeatureCount}`);

        return {
          firstLayerPath: firstSelectedLayerPath,
          secondLayerPath: secondSelectedLayerPath,
          secondFeatureCount,
        };
      },
      (test, result) => {
        test.addStep('Verifying first selected layer is polygons...');
        Test.assertIsEqual(result.firstLayerPath, expectedFirstLayer);

        test.addStep('Verifying second selected layer is still Top Projects...');
        Test.assertIsEqual(result.secondLayerPath, expectedSecondLayer);

        test.addStep('Verifying second layer has exactly 1 feature...');
        Test.assertIsEqual(result.secondFeatureCount, 1);
      }
    );
  }
}
