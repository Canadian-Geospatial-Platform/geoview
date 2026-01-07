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
import type {
  TypeFeatureInfoResultSetEntry,
  TypeHoverFeatureInfo,
} from 'geoview-core/core/stores/store-interface-and-intial-values/feature-info-state';
import { AbstractGVLayer } from 'geoview-core/geo/layer/gv-layers/abstract-gv-layer';
import { LayerWrongTypeError } from 'geoview-core/core/exceptions/layer-exceptions';
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
  testInitialMapState(): Promise<Test<TypeMapState>> {
    // Get the projection
    const { projection } = this.#getMapConfigFromStore().map.viewSettings;

    // The expected map state configuration including the current projection
    const expectedConfig: Record<string, unknown> = {
      currentProjection: projection,
    };

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
   * Note: the map doesn't return to original extent after this test.
   * @param {Extent} extent - The extent to zoom to.
   * @param {Extent} expectedExtent - The expected extent after zooming (due to map restrictions).
   * @returns {Promise<Test<Extent>>} A Promise that resolves with the Test containing the resulting map extent.
   */
  testZoomToExtent(extent: Extent, expectedExtent: Extent): Promise<Test<Extent>> {
    return this.test(
      'Test zoom to lon/lat extent',
      async (test) => {
        // Zoom to extent
        test.addStep(`Zooming to extent ${extent.join(',')}...`);
        await this.getMapViewer().zoomToLonLatExtentOrCoordinate(extent);

        // Transform extent and handle potential undefined return
        return this.getApi().utilities.projection.transformExtentFromProj(
          MapEventProcessor.getMapState(this.getMapId()).mapExtent,
          this.getMapViewer().getProjection(),
          Projection.getProjectionLonLat()
        );
      },
      (test, result) => {
        // The map adjusts extent to fit viewport aspect ratio, compare with tolerance for aspect ratio adjustment
        test.addStep('Verifying map zoomed to extent (with aspect ratio tolerance)...');
        Test.assertIsArrayEqual(result, expectedExtent, 2);
      }
    );
  }

  /**
   * Tests zooming to a lon/lat coordinate using zoomToLonLatExtentOrCoordinate.
   * Note: the map doesn't return to original extent after this test.
   * @param {Coordinate} coordinates - The coordinates to zoom to.
   * @returns {Promise<Test<Extent>>} A Promise that resolves with the Test containing the resulting map extent.
   */
  testZoomToCoordinate(coordinates: Coordinate): Promise<Test<Coordinate>> {
    return this.test(
      'Test zoom to lon/lat coordinate',
      async (test) => {
        test.addStep(`Zooming to coordinates ${coordinates.join(',')}...`);

        // Zoom to coordinate
        await this.getMapViewer().setMapZoomLevel(8);
        await this.getMapViewer().zoomToLonLatExtentOrCoordinate(coordinates);

        // Transform coordinates
        return Promise.resolve(
          Projection.transformCoordinates(
            MapEventProcessor.getMapState(this.getMapId()).mapCenterCoordinates,
            this.getMapViewer().getProjection().getCode(),
            'EPSG:4326'
          ) as Coordinate
        );
      },
      (test, result) => {
        test.addStep('Verifying map centered on coordinate...');
        Test.assertIsArrayEqual(result, coordinates, 0);
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
      },
      () => {
        // TODO: ADD - There should probably be a reset to the original basemap here for the next test run to execute correctly without having to refresh the whole test page
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
        // In LCC projection over BC, the north arrow should match expected rotation
        test.addStep('Verifying north arrow rotation is calculated...');
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
   * 4. Verifies that the layer results does not appear in the details state
   * @returns {Promise<Test<LayerWithBeforeAfterFeature<AbstractGVLayer>>>} A Promise that resolves with the Test containing the number of layers in details state.
   */
  testNonQueryableLayerNotInDetails(layerPath: string, lonlat: Coordinate): Promise<Test<LayerWithBeforeAfterFeature<AbstractGVLayer>>> {
    return this.test(
      'Test non-queryable layer not in details after map click',
      async (test) => {
        // Get the layer
        const layer = this.getLayerApi().getGeoviewLayer(layerPath);

        // If not an AbstractGVLayer (regular layer)
        if (!(layer instanceof AbstractGVLayer)) throw new LayerWrongTypeError(layerPath, layer.getLayerName());

        // The layer should be initially queryable
        if (!layer.getQueryable()) throw new TestError(`False precondition, the layer ${layerPath} wasn't initially queryable.`);

        // Wait for the layer to be loaded after the zoom, a guarantee
        await layer.waitLoadedStatus();

        // Perform a map click using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        const results1 = await this.getLayerApi().featureInfoLayerSet.queryLayers(lonlat);

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOnTemp = results1[layerPath];

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn = layerDataOnTemp ? { ...layerDataOnTemp } : undefined;

        // Set layer non queryable, this will also clear the result set automatically
        test.addStep(`Setting layer '${layerPath}' as non-queryable...`);
        layer.setQueryable(false);

        // Perform a map click using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        const results2 = await this.getLayerApi().featureInfoLayerSet.queryLayers(lonlat);

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOffTemp = results2[layerPath];

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOff = layerDataOffTemp ? { ...layerDataOffTemp } : undefined;

        // Set layer queryable again
        test.addStep(`Setting layer '${layerPath}' as queryable again...`);
        layer.setQueryable(true);

        // Perform a map click using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        const results3 = await this.getLayerApi().featureInfoLayerSet.queryLayers(lonlat);

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOn2Temp = results3[layerPath];

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn2 = layerDataOn2Temp ? { ...layerDataOn2Temp } : undefined;

        // Return the test results
        return { layer, results: [layerDataOn, layerDataOff, layerDataOn2] };
      },
      (test, result) => {
        test.addStep('Verifying layer data features when queryable...');
        Test.assertIsArray(result.results[0]?.features);
        Test.assertIsArrayLengthEqual(result.results[0].features, 2);

        test.addStep('Verifying no layer data features when non-queryable...');
        Test.assertIsArray(result.results[1]?.features);
        Test.assertIsArrayLengthEqual(result.results[1].features, 0);

        test.addStep('Verifying layer data features when queryable again...');
        Test.assertIsArray(result.results[2]?.features);
        Test.assertIsArrayLengthEqual(result.results[2].features, 2);
      },
      (test, result) => {
        // Make sure to turn it back to queryable
        result.layer.setQueryable(true);
      }
    );
  }

  /**
   * Tests that non-hoverable layers do not appear in hover state when hovering on the map.
   * This test performs the following operations:
   * 1. Gets the first layer from the map
   * 2. Sets the layer as non-hoverable
   * 3. Simulates a map hover
   * 4. Verifies that the layer results does not appear in the hover state
   * @param {string} layerPath - The layer path to test
   * @returns {Promise<Test<LayerWithBeforeAfterHover<AbstractGVLayer>>>} A Promise that resolves with the Test containing the hover states.
   */
  testLayerHoverableState(layerPath: string, lonlat: Coordinate): Promise<Test<LayerWithBeforeAfterHover<AbstractGVLayer>>> {
    return this.test(
      'Test layer hoverable state in hoverFeatureInfoLayerSet',
      async (test) => {
        // Get the layer
        const layer = this.getLayerApi().getGeoviewLayer(layerPath);

        // If not an AbstractGVLayer (regular layer)
        if (!(layer instanceof AbstractGVLayer)) throw new LayerWrongTypeError(layerPath, layer.getLayerName());

        // The layer should be initially hoverable
        if (!layer.getHoverable()) throw new TestError(`False precondition, the layer ${layerPath} wasn't initially hoverable.`);

        // Wait for the layer to be loaded after the zoom, a guarantee
        await layer.waitLoadedStatus();

        // Perform a hover query using the hover feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        await this.getLayerApi().hoverFeatureInfoLayerSet.queryLayers(lonlat, 'at_lon_lat');

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOnTemp = MapEventProcessor.getMapHoverFeatureInfo(this.getMapId());

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn = layerDataOnTemp ? { ...layerDataOnTemp } : undefined;

        // Set layer non queryable, this will also clear the result set automatically
        test.addStep(`Setting layer '${layerPath}' as non-hoverable...`);
        layer.setHoverable(false);

        // Perform a hover query using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        await this.getLayerApi().hoverFeatureInfoLayerSet.queryLayers(lonlat, 'at_lon_lat');

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOffTemp = MapEventProcessor.getMapHoverFeatureInfo(this.getMapId());

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOff = layerDataOffTemp ? { ...layerDataOffTemp } : undefined;

        // Set layer hoverable again
        test.addStep(`Setting layer '${layerPath}' as hoverable again...`);
        layer.setHoverable(true);

        // Perform a hover query using the feature info layer set
        test.addStep(`Perform query operation at given coordinates...`);
        await this.getLayerApi().hoverFeatureInfoLayerSet.queryLayers(lonlat, 'at_lon_lat');

        // Check if there is feature selected from the layer
        test.addStep(`Checking for features from layer '${layerPath}'...`);
        const layerDataOn2Temp = MapEventProcessor.getMapHoverFeatureInfo(this.getMapId());

        // Store a deep copy of the data before clearing to preserve it
        const layerDataOn2 = layerDataOn2Temp ? { ...layerDataOn2Temp } : undefined;

        // Return the test results
        return { layer, results: [layerDataOn, layerDataOff, layerDataOn2] };
      },
      (test, result) => {
        test.addStep('Verifying layer data features when hoverable...');
        Test.assertJsonObject(result.results[0], { fieldInfo: { value: 'Ontario' } });

        test.addStep('Verifying layer data features when not hoverable...');
        Test.assertIsUndefined('result.after', result.results[1]);

        test.addStep('Verifying layer data features when hoverable again...');
        Test.assertJsonObject(result.results[2], { fieldInfo: { value: 'Ontario' } });
      },
      (test, result) => {
        // Make sure to turn it back to hoverable
        result.layer.setHoverable(true);
      }
    );
  }

  /**
   * Tests that the selected layer in the details panel persists correctly
   * when clicking on different map locations.
   * Test flow:
   * 1. Clicks on the map at the first location and verifies the auto-selected layer.
   * 2. Manually switches selection to the alternate layer.
   * 3. Clicks on a second map location.
   * 4. Verifies the manually selected layer remains selected and that its
   *    feature count is correct.
   * @param {string} layerPath1 - The path of the first candidate layer that may be auto-selected after the initial click.
   * @param {string} layerPath2 - The path of the second candidate layer used as the alternate manual selection.
   * @param {Coordinate} clickCoordinates1 - The map coordinates used for the first simulated click.
   * @param {Coordinate} clickCoordinates2 - The map coordinates used for the second simulated click.
   * @returns {Promise<Test<LayerDetails>>} A test instance resolving with details about the original selected layer,
   * the persisted alternate layer, and the feature count after the second click.
   */
  testDetailsLayerSelectionPersistence(
    layerPath1: string,
    layerPath2: string,
    clickCoordinates1: Coordinate,
    clickCoordinates2: Coordinate
  ): Promise<Test<LayerDetails>> {
    let originalLayerPath: string;
    let alternateLayerPath: string;

    return this.test(
      'Test details layer selection persistence across map clicks',
      async (test) => {
        // Simulate a map click at first location
        test.addStep(`Performing first map click at [${clickCoordinates1.join(', ')}]...`);
        const simulatedMapClick1 = this.getMapViewer().simulateMapClick(clickCoordinates1);

        // Wait for the UI to be updated
        await simulatedMapClick1.promiseQueryBatched;

        // Check which layer is selected after first click
        test.addStep('Checking selected layer after first click...');
        originalLayerPath = FeatureInfoEventProcessor.getSelectedLayerPath(this.getMapId());
        test.addStep(`First selected layer: ${originalLayerPath}`);

        // The alternate layer
        alternateLayerPath = originalLayerPath === layerPath1 ? layerPath2 : layerPath1;

        // Manually select the alternate layer
        test.addStep(`Manually selecting the other layer '${alternateLayerPath}'...`);
        FeatureInfoEventProcessor.setSelectedLayerPath(this.getMapId(), alternateLayerPath);

        // Simulate a map click at second location
        test.addStep(`Performing second map click at [${clickCoordinates2.join(', ')}]...`);
        const simulatedMapClick2 = this.getMapViewer().simulateMapClick(clickCoordinates2);

        // Wait for the UI to be updated
        await simulatedMapClick2.promiseQueryBatched;

        // Check which layer is still selected after second click
        test.addStep('Checking selected layer after second click...');
        const secondSelectedLayerPath = FeatureInfoEventProcessor.getSelectedLayerPath(this.getMapId());
        test.addStep(`Second selected layer: ${secondSelectedLayerPath}`);

        // Get feature count   for second layer
        const secondLayerData = FeatureInfoEventProcessor.findLayerDataFromLayerDataArray(this.getMapId(), secondSelectedLayerPath);
        const secondFeatureCount = secondLayerData?.features?.length || 0;
        test.addStep(`Second layer feature count: ${secondFeatureCount}`);

        return {
          originalLayerPath,
          alternateLayerPath: secondSelectedLayerPath,
          secondFeatureCount,
        };
      },
      (test, result) => {
        test.addStep('Verifying first and second layers were different...');
        Test.assertIsNotEqual(result.originalLayerPath, result.alternateLayerPath);

        test.addStep('Verifying second selected layer is the alternate layer...');
        Test.assertIsEqual(result.alternateLayerPath, alternateLayerPath);

        test.addStep('Verifying second layer has exactly 1 feature...');
        Test.assertIsEqual(result.secondFeatureCount, 1);
      }
    );
  }
}

/**
 * Represents a layer paired with feature information results
 * collected before and after an operation (e.g., filtering, ordering, or updates).
 */
type LayerWithBeforeAfterFeature<T> = LayerWithResults<T, (TypeFeatureInfoResultSetEntry | undefined)[]>;

/**
 * Represents a layer paired with hover feature information results
 * collected before and after an operation.
 */
type LayerWithBeforeAfterHover<T> = LayerWithResults<T, (TypeHoverFeatureInfo | undefined)[]>;

/**
 * Generic structure associating a layer with a set of related results.
 */
type LayerWithResults<T, U> = {
  /** The layer instance. */
  layer: T;
  /** The results associated with the layer. */
  results: U;
};

/**
 * Describes layer path information and comparison metadata used
 * when evaluating differences between layers.
 */
type LayerDetails = {
  /** The path identifying the original layer.*/
  originalLayerPath: string;
  /** The path identifying the alternate or comparison layer. */
  alternateLayerPath: string;
  /** The number of features found in the alternate layer. */
  secondFeatureCount: number;
};
