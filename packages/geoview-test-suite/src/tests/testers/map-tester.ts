import { TestError } from '../core/exceptions';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { delay } from 'geoview-core/core/utils/utilities';
import type { TypeMapState } from 'geoview-core/geo/map/map-viewer';
import type { TypeMapFeaturesConfig } from 'geoview-core/core/types/global-types';
import { MapEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/map-event-processor';
import type { Extent, TypeValidMapProjectionCodes } from 'geoview-core/api/types/map-schema-types';

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

        // Update the step
        test.addStep('Performing zoom...');

        // Perform a zoom
        await MapEventProcessor.zoomMap(this.getMapId(), zoomEnd, zoomDuration);

        // Update the step
        test.addStep('Waiting for zoom to finish...');

        // Wait for the zoom to end (1000 for store to update)
        await delay(zoomDuration + 1000);

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

        // Update the step
        test.addStep(`Performing projection switch to ${secondProjection}...`);

        // Perform a projection switch
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
        Test.assertIsArrayEqual<number>(mapExtent, result);
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
        test.addStep('Adding circle to test group...');

        // Add a circle to a new geometry group
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

        test.addStep('Getting initial z-index...');

        // Get the initial z-index
        const initialZIndex = this.getMapViewer().layer.geometry.getGeometryGroupZIndex(testGroupId);

        test.addStep(`Initial z-index: ${initialZIndex}`);

        test.addStep('Setting z-index to 0...');

        // Set z-index to 0
        this.getMapViewer().layer.geometry.setGeometryGroupZIndex(testGroupId, 0);

        test.addStep('Getting final z-index...');

        // Get the z-index again
        const finalZIndex = this.getMapViewer().layer.geometry.getGeometryGroupZIndex(testGroupId);

        test.addStep(`Final z-index: ${finalZIndex}`);

        // Return both values
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
}
