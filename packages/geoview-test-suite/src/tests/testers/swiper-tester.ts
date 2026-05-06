import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import { delay, whenThisThen } from 'geoview-core/core/utils/utilities';
import { getStoreSwiperLayerPaths, getStoreSwiperOrientation } from 'geoview-core/core/stores/states/swiper-state';

/**
 * Main Swiper testing class.
 */
export class SwiperTester extends GVAbstractTester {
  /** Layer path for WMS layer used in swiper tests. */
  static readonly SWIPER_WMS_LAYER_PATH = 'swiperWms/msi-94-or-more';

  /** Layer path for GeoJSON layer used in swiper tests. */
  static readonly SWIPER_GEOJSON_LAYER_PATH = 'swiperGeojson/polygons.json';

  /** Layer path for OGC Feature layer used in swiper tests. */
  static readonly SWIPER_OGC_FEATURE_LAYER_PATH = 'swiperOgcFeature/lakes';

  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'SwiperTester';
  }

  /**
   * Tests the swiper plugin lifecycle: activate layer, deactivate, re-activate with two layers, change orientation, and deactivate all.
   *
   * @returns A promise that resolves when the test completes
   */
  testSwiperLifecycle(): Promise<Test<void>> {
    return this.test(
      'Test Swiper lifecycle: activate, deactivate, multi-layer, orientation, deactivate all...',
      async (test) => {
        // Step 1: Wait for layers to be registered (not necessarily fully loaded)
        test.addStep('Waiting for layers to be registered on the map...');
        // prettier-ignore
        await whenThisThen(() => !!this.getControllersRegistry().layerController.getGeoviewLayerRegularIfExists(SwiperTester.SWIPER_WMS_LAYER_PATH), GVAbstractTester.LAYER_REGISTRATION_TIMEOUT_MS);
        // prettier-ignore
        await whenThisThen(() => !!this.getControllersRegistry().layerController.getGeoviewLayerRegularIfExists(SwiperTester.SWIPER_GEOJSON_LAYER_PATH), GVAbstractTester.LAYER_REGISTRATION_TIMEOUT_MS);
        // prettier-ignore
        await whenThisThen(() => !!this.getControllersRegistry().layerController.getGeoviewLayerRegularIfExists(SwiperTester.SWIPER_OGC_FEATURE_LAYER_PATH), GVAbstractTester.LAYER_REGISTRATION_TIMEOUT_MS);

        // Step 2: Verify swiper starts with no active layers (config has empty layers array)
        test.addStep('Verifying swiper starts with no active layers...');
        const initialLayerPaths = getStoreSwiperLayerPaths(this.getMapId());
        Test.assertIsArrayLengthEqual(initialLayerPaths, 0);

        // Step 3: Verify initial orientation is vertical (from default config)
        test.addStep('Verifying initial orientation is vertical...');
        const initialOrientation = getStoreSwiperOrientation(this.getMapId());
        Test.assertIsEqual(initialOrientation, 'vertical');

        // Step 4: Activate swiper for WMS layer
        test.addStep('Activating swiper for WMS layer...');
        this.getControllersRegistry().swiperController!.addLayerPath(SwiperTester.SWIPER_WMS_LAYER_PATH);
        await delay(500);

        // Step 5: Assert swiper is active with 1 layer in vertical mode
        test.addStep('Verifying swiper is active with 1 layer...');
        const afterAddOne = getStoreSwiperLayerPaths(this.getMapId());
        Test.assertIsArrayLengthEqual(afterAddOne, 1);
        Test.assertArrayIncludes(afterAddOne, SwiperTester.SWIPER_WMS_LAYER_PATH);
        Test.assertIsEqual(getStoreSwiperOrientation(this.getMapId()), 'vertical');

        // Step 6: Remove the WMS layer from swiper
        test.addStep('Removing WMS layer from swiper...');
        this.getControllersRegistry().swiperController!.removeLayerPath(SwiperTester.SWIPER_WMS_LAYER_PATH);
        await delay(500);

        // Step 7: Assert swiper has no layers
        test.addStep('Verifying swiper has no active layers after removal...');
        const afterRemove = getStoreSwiperLayerPaths(this.getMapId());
        Test.assertIsArrayLengthEqual(afterRemove, 0);

        // Step 8: Add WMS layer back and add GeoJSON layer
        test.addStep('Adding WMS layer back to swiper...');
        this.getControllersRegistry().swiperController!.addLayerPath(SwiperTester.SWIPER_WMS_LAYER_PATH);
        await delay(300);

        test.addStep('Adding GeoJSON layer to swiper...');
        this.getControllersRegistry().swiperController!.addLayerPath(SwiperTester.SWIPER_GEOJSON_LAYER_PATH);
        await delay(500);

        // Step 9: Assert swiper is active with 2 layers
        test.addStep('Verifying swiper is active with 2 layers...');
        const afterAddTwo = getStoreSwiperLayerPaths(this.getMapId());
        Test.assertIsArrayLengthEqual(afterAddTwo, 2);
        Test.assertArrayIncludes(afterAddTwo, SwiperTester.SWIPER_WMS_LAYER_PATH);
        Test.assertArrayIncludes(afterAddTwo, SwiperTester.SWIPER_GEOJSON_LAYER_PATH);

        // Step 10: Set orientation to horizontal
        test.addStep('Setting swiper orientation to horizontal...');
        this.getControllersRegistry().swiperController!.setOrientation('horizontal');
        await delay(300);

        // Step 11: Assert orientation changed
        test.addStep('Verifying orientation is now horizontal...');
        Test.assertIsEqual(getStoreSwiperOrientation(this.getMapId()), 'horizontal');

        // Step 12: Set orientation back to vertical
        test.addStep('Setting swiper orientation back to vertical...');
        this.getControllersRegistry().swiperController!.setOrientation('vertical');
        await delay(300);

        // Step 13: Assert orientation is vertical again
        test.addStep('Verifying orientation is back to vertical...');
        Test.assertIsEqual(getStoreSwiperOrientation(this.getMapId()), 'vertical');

        // Step 14: Deactivate all layers
        test.addStep('Deactivating all layers from swiper...');
        this.getControllersRegistry().swiperController!.removeAllLayerPaths();
        await delay(500);

        // Step 15: Assert swiper has no layers
        test.addStep('Verifying swiper has no active layers after deactivate all...');
        const afterDeactivateAll = getStoreSwiperLayerPaths(this.getMapId());
        Test.assertIsArrayLengthEqual(afterDeactivateAll, 0);
      },
      (test) => {
        // Final assertions - verify clean state
        test.addStep('Final verification: swiper is in clean state...');
        const finalLayerPaths = getStoreSwiperLayerPaths(this.getMapId());
        Test.assertIsArrayLengthEqual(finalLayerPaths, 0);
      }
    );
  }
}
