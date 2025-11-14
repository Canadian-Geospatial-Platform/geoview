import { TestError } from '../core/exceptions';
import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { delay } from 'geoview-core/core/utils/utilities';
import type { TypeMapState } from 'geoview-core/geo/map/map-viewer';
import type { TypeMapFeaturesConfig } from 'geoview-core/core/types/global-types';
import { MapEventProcessor } from 'geoview-core/api/event-processors/event-processor-children/map-event-processor';
import type { Extent } from 'geoview-core/api/types/map-schema-types';

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
        MapEventProcessor.zoom(this.getMapId(), zoomEnd, zoomDuration);

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
      (test) => {
        // Unzooms to original position
        test.addStep('Unzooms to the original zoom...');
        MapEventProcessor.zoom(this.getMapId(), currentZoom, zoomDuration);
      }
    );
  }

  testSwitchProjectionAndExtent(): Promise<Test<Extent>> {
    // Get the current init extent
    const { mapExtent } = MapEventProcessor.getMapState(this.getMapId());

    // Test the projection/initial extent
    return this.test(
      'Test switch projection back and forth, zoom and zoom to initial extent',
      async (test) => {
        // Update the step
        test.addStep('Performing projection switch to 3857...');

        // Add a delay ensuring anyprevious tester operation is done
        await delay(2000);

        // Perform a projection switch
        await MapEventProcessor.setProjection(this.getMapId(), 3857);

        // Wait for the projection switch to end (1000 for store to update)
        await delay(1000);

        // Update the step
        test.addStep('Performing zoom to level 1...');

        // Perform a zoom
        MapEventProcessor.zoom(this.getMapId(), 1, 1000);

        // Wait for the zoom to end (1000 for store to update)
        await delay(1000);

        // Update the step
        test.addStep('Performing projection switch to original...');

        // Perform a projection switch
        await MapEventProcessor.setProjection(this.getMapId(), 3978);

        // Wait for the zoom to end (1000 for store to update)
        await delay(1000);

        // Update the step
        test.addStep('Performing zomm to inital extent...');
        // Zoom to initial extent
        await MapEventProcessor.zoomToInitialExtent(this.getMapId());

        // Update the step
        test.addStep('Waiting for zoom to finish...');

        // Wait for the zoom to end (1000 for store to update)
        await delay(1000);

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
