import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import {
  getStoreSwiperInteractive,
  getStoreSwiperLayerPaths,
  getStoreSwiperOrientation,
  getStoreSwiperPosition,
} from 'geoview-core/core/stores/states/swiper-state';
import { getGVRootElement } from 'geoview-core/core/utils/dom-helper';
import type { SwipeSide } from 'geoview-core/core/stores/states/swiper-state';

/** Listener counts and renderer state captured during the swiper render-isolation test. */
type SwiperRenderIsolationResult = {
  /** Target prerender listener count before swiper activation. */
  targetPreRenderBaseline: number;
  /** Target postrender listener count before swiper activation. */
  targetPostRenderBaseline: number;
  /** Non-target prerender listener count before swiper activation. */
  nonTargetPreRenderBaseline: number;
  /** Non-target postrender listener count before swiper activation. */
  nonTargetPostRenderBaseline: number;
  /** Target prerender listener count while swiper is active. */
  targetPreRenderActive: number;
  /** Target postrender listener count while swiper is active. */
  targetPostRenderActive: number;
  /** Non-target prerender listener count while swiper is active. */
  nonTargetPreRenderActive: number;
  /** Non-target postrender listener count while swiper is active. */
  nonTargetPostRenderActive: number;
  /** Target renderer container CSS clip-path while swiper is active. */
  targetClipPath: string;
  /** Target prerender listener count after swiper cleanup. */
  targetPreRenderClean: number;
  /** Target postrender listener count after swiper cleanup. */
  targetPostRenderClean: number;
  /** Non-target prerender listener count after swiper cleanup. */
  nonTargetPreRenderClean: number;
  /** Non-target postrender listener count after swiper cleanup. */
  nonTargetPostRenderClean: number;
};

/** Results captured while testing per-side Swiper query semantics. */
type SwiperSideResult = {
  /** Whether the left-side layer accepts a left-side query. */
  leftVisible: boolean;
  /** Whether the left-side layer rejects a right-side query. */
  leftHidden: boolean;
  /** Whether the right-side layer accepts a right-side query. */
  rightVisible: boolean;
  /** Whether the right-side layer rejects a left-side query. */
  rightHidden: boolean;
  /** Whether the up-side layer accepts an upper query. */
  upVisible: boolean;
  /** Whether the down-side layer accepts a lower query. */
  downVisible: boolean;
};

/** Results captured while testing Swiper configuration persistence. */
type SwiperPersistenceResult = {
  /** Persisted interactive flag. */
  interactive: boolean;
  /** Persisted layer entries. */
  layers: { layerPath: string; side: SwipeSide }[];
};

/**
 * Main Swiper testing class.
 */
export class SwiperTester extends GVAbstractTester {
  /** Maximum time to wait for swiper render handlers to attach or detach. */
  static readonly SWIPER_RENDER_HANDLER_TIMEOUT = 10000;

  /** Higher-level WMS layer selector used to verify descendant path resolution. */
  static readonly SWIPER_WMS_ROOT_LAYER_PATH = 'swiperWms';

  /** Layer path for WMS layer used in swiper tests. */
  static readonly SWIPER_WMS_LAYER_PATH = 'swiperWms/msi-94-or-more';

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
   * Tests that each configured Swiper side clips and queries its own visible half.
   *
   * @returns A promise that resolves when the test completes
   */
  testSwiperPerLayerSides(): Promise<Test<SwiperSideResult>> {
    return this.test(
      'Test Swiper per-layer side semantics...',
      (test) => {
        const controller = this.getControllersRegistry().swiperController!;
        const mapSize = this.getMapViewer().map.getSize()!;
        const verticalPath = SwiperTester.SWIPER_WMS_LAYER_PATH;
        const horizontalPath = SwiperTester.SWIPER_OGC_FEATURE_LAYER_PATH;
        const entries = [
          { layerPath: verticalPath, side: 'left' as SwipeSide },
          { layerPath: horizontalPath, side: 'right' as SwipeSide },
        ];

        test.addStep('Configuring left and right Swiper layers...');
        controller.setOrientation('vertical');
        controller.setLayers(entries);
        const verticalPosition = (mapSize[0] * getStoreSwiperPosition(this.getMapId())) / 100;
        const leftVisible = controller.shouldQueryAtPixel(verticalPath, [verticalPosition - 1, mapSize[1] / 2], mapSize);
        const leftHidden = controller.shouldQueryAtPixel(verticalPath, [verticalPosition + 1, mapSize[1] / 2], mapSize);
        const rightVisible = controller.shouldQueryAtPixel(horizontalPath, [verticalPosition + 1, mapSize[1] / 2], mapSize);
        const rightHidden = controller.shouldQueryAtPixel(horizontalPath, [verticalPosition - 1, mapSize[1] / 2], mapSize);

        test.addStep('Configuring up and down Swiper layers...');
        controller.setOrientation('horizontal');
        controller.setLayerSide(verticalPath, 'up');
        controller.setLayerSide(horizontalPath, 'down');
        const horizontalPosition = mapSize[1] / 2;
        const upVisible = controller.shouldQueryAtPixel(verticalPath, [mapSize[0] / 2, horizontalPosition - 1], mapSize);
        const downVisible = controller.shouldQueryAtPixel(horizontalPath, [mapSize[0] / 2, horizontalPosition + 1], mapSize);

        return { leftVisible, leftHidden, rightVisible, rightHidden, upVisible, downVisible };
      },
      (test, result) => {
        test.addStep('Verifying each layer uses its configured visible side...');
        Test.assertIsEqual(result.leftVisible, true);
        Test.assertIsEqual(result.leftHidden, false);
        Test.assertIsEqual(result.rightVisible, true);
        Test.assertIsEqual(result.rightHidden, false);
        Test.assertIsEqual(result.upVisible, true);
        Test.assertIsEqual(result.downVisible, true);
      },
      () => {
        this.getControllersRegistry().swiperController!.removeAllLayerPaths();
        this.getControllersRegistry().swiperController!.setOrientation('vertical');
      }
    );
  }

  /**
   * Tests that runtime Swiper state is included in an exported map configuration.
   *
   * @returns A promise that resolves when the test completes
   */
  testSwiperConfigPersistence(): Promise<Test<SwiperPersistenceResult>> {
    return this.test(
      'Test Swiper interactive configuration persistence...',
      (test) => {
        const controller = this.getControllersRegistry().swiperController!;
        const layers = [{ layerPath: SwiperTester.SWIPER_WMS_LAYER_PATH, side: 'right' as SwipeSide }];

        test.addStep('Setting interactive Swiper state and per-layer side...');
        controller.setInteractive(true);
        controller.setOrientation('vertical');
        controller.setLayers(layers);

        test.addStep('Creating a map configuration from current map state...');
        const mapConfig = this.getControllersRegistry().mapController.createMapConfigFromMapState();
        const swiperConfig = mapConfig?.corePackagesConfig?.find((entry) => 'swiper' in entry)?.swiper as {
          interactive: boolean;
          layers: { layerPath: string; side: SwipeSide }[];
        };
        Test.assertIsDefined('swiperConfig', swiperConfig);
        return { interactive: swiperConfig.interactive, layers: swiperConfig.layers };
      },
      (test, result) => {
        test.addStep('Verifying interactive mode and layer sides were persisted...');
        Test.assertIsEqual(result.interactive, true);
        Test.assertIsArrayLengthEqual(result.layers, 1);
        Test.assertIsEqual(result.layers[0].layerPath, SwiperTester.SWIPER_WMS_LAYER_PATH);
        Test.assertIsEqual(result.layers[0].side, 'right');
      },
      () => {
        this.getControllersRegistry().swiperController!.removeAllLayerPaths();
        this.getControllersRegistry().swiperController!.setInteractive(false);
      }
    );
  }

  /**
   * Tests that selected layers attach render handlers independently as they become registered.
   *
   * @returns A promise that resolves when the test completes
   */
  testSwiperProgressiveRegistration(): Promise<Test<{ wmsHandlers: number; nonTargetHandlers: number }>> {
    return this.test(
      'Test Swiper progressive layer registration...',
      async (test) => {
        const controller = this.getControllersRegistry().swiperController!;
        const targetPaths = [SwiperTester.SWIPER_WMS_LAYER_PATH, SwiperTester.SWIPER_OGC_FEATURE_LAYER_PATH];
        const wmsLayer = await controller.getControllersRegistry().layerController.waitForLayerRegistered(targetPaths[0]);
        const nonTargetLayer = await controller.getControllersRegistry().layerController.waitForLayerRegistered(targetPaths[1]);
        const wmsOLLayer = wmsLayer.getOLLayer();
        const nonTargetOLLayer = nonTargetLayer.getOLLayer();
        const wmsBaseline = wmsOLLayer.getListeners('prerender')?.length ?? 0;
        const nonTargetBaseline = nonTargetOLLayer.getListeners('prerender')?.length ?? 0;

        test.addStep('Selecting both layers for the Swiper...');
        controller.setLayerPaths(targetPaths);
        await SwiperTester.waitForCondition(
          () => (wmsOLLayer.getListeners('prerender')?.length ?? 0) === wmsBaseline + 1,
          SwiperTester.SWIPER_RENDER_HANDLER_TIMEOUT
        );
        const wmsHandlers = wmsOLLayer.getListeners('prerender')?.length ?? 0;

        await SwiperTester.waitForCondition(
          () => (nonTargetOLLayer.getListeners('prerender')?.length ?? 0) === nonTargetBaseline + 1,
          SwiperTester.SWIPER_RENDER_HANDLER_TIMEOUT
        );
        const nonTargetHandlers = nonTargetOLLayer.getListeners('prerender')?.length ?? 0;
        return { wmsHandlers, nonTargetHandlers };
      },
      (test, result) => {
        test.addStep('Verifying each selected layer received its own render handler...');
        Test.assertIsEqual(result.wmsHandlers > 0, true);
        Test.assertIsEqual(result.nonTargetHandlers > 0, true);
      },
      () => {
        this.getControllersRegistry().swiperController!.removeAllLayerPaths();
      }
    );
  }

  /**
   * Tests that the layer settings panel exposes Swiper controls only in interactive mode.
   *
   * @returns A promise that resolves when the test completes
   */
  testSwiperSettingsGating(): Promise<Test<{ interactive: boolean; settingsButtonVisible: boolean }>> {
    return this.test(
      'Test Swiper settings-panel gating...',
      async (test) => {
        const mapRoot = getGVRootElement(this.getMapId());
        const { layerController } = this.getControllersRegistry();
        const layerPath = SwiperTester.SWIPER_WMS_LAYER_PATH;

        test.addStep('Enabling interactive Swiper mode and selecting a layer...');
        this.getControllersRegistry().swiperController!.setInteractive(true);
        layerController.setSelectedLayerPath(layerPath);
        await SwiperTester.waitForCondition(() => !!mapRoot?.querySelector('[aria-label="Layer settings"]'));

        const settingsButton = mapRoot?.querySelector('[aria-label="Layer settings"]') as HTMLElement | null;
        settingsButton?.click();
        await SwiperTester.waitForCondition(() => mapRoot?.textContent?.includes('Show in Swiper') ?? false);

        return {
          interactive: getStoreSwiperInteractive(this.getMapId()),
          settingsButtonVisible: !!settingsButton,
        };
      },
      (test, result) => {
        test.addStep('Verifying interactive mode exposes the layer settings control...');
        Test.assertIsEqual(result.interactive, true);
        Test.assertIsEqual(result.settingsButtonVisible, true);
      },
      () => {
        this.getControllersRegistry().swiperController!.setInteractive(false);
        this.getControllersRegistry().layerController.setSelectedLayerPath('');
      }
    );
  }

  /**
   * Tests that hover queries are suppressed over the Swiper bar and handle bands.
   *
   * @returns A promise that resolves when the test completes
   */
  testSwiperHoverSuppression(): Promise<Test<{ overBar: boolean; overHandle: boolean; away: boolean }>> {
    return this.test(
      'Test Swiper hover-query suppression over the bar and handle...',
      (test) => {
        const controller = this.getControllersRegistry().swiperController!;
        const mapSize = this.getMapViewer().map.getSize()!;
        const dividerX = mapSize[0] / 2;

        test.addStep('Activating a Swiper layer and checking the bar band...');
        controller.addLayerPath(SwiperTester.SWIPER_WMS_LAYER_PATH);
        const overBar = controller.isPointerOverSwiper([dividerX, 10], mapSize);
        const overHandle = controller.isPointerOverSwiper([dividerX + 20, mapSize[1] / 2 + 20], mapSize);
        const away = controller.isPointerOverSwiper([dividerX + 40, 10], mapSize);
        return { overBar, overHandle, away };
      },
      (test, result) => {
        test.addStep('Verifying only the bar and handle regions suppress hover queries...');
        Test.assertIsEqual(result.overBar, true);
        Test.assertIsEqual(result.overHandle, true);
        Test.assertIsEqual(result.away, false);
      },
      () => {
        this.getControllersRegistry().swiperController!.removeAllLayerPaths();
      }
    );
  }

  /**
   * Tests that swiper rendering handlers and clipping are isolated to descendant layers of the selected path.
   *
   * @returns A promise that resolves when the test completes
   */
  testSwiperRenderIsolation(): Promise<Test<SwiperRenderIsolationResult>> {
    return this.test(
      'Test Swiper rendering isolation with a higher-level layer selector...',
      async (test) => {
        test.addStep('Waiting for target and non-target layers to be registered on the map...');
        const [targetLayer, nonTargetLayer] = await Promise.all([
          this.getControllersRegistry().layerController.waitForLayerRegistered(SwiperTester.SWIPER_WMS_LAYER_PATH),
          this.getControllersRegistry().layerController.waitForLayerRegistered(SwiperTester.SWIPER_OGC_FEATURE_LAYER_PATH),
        ]);
        const targetOLLayer = targetLayer.getOLLayer();
        const nonTargetOLLayer = nonTargetLayer.getOLLayer();

        test.addStep('Capturing render listener baselines...');
        const targetPreRenderBaseline = targetOLLayer.getListeners('prerender')?.length ?? 0;
        const targetPostRenderBaseline = targetOLLayer.getListeners('postrender')?.length ?? 0;
        const nonTargetPreRenderBaseline = nonTargetOLLayer.getListeners('prerender')?.length ?? 0;
        const nonTargetPostRenderBaseline = nonTargetOLLayer.getListeners('postrender')?.length ?? 0;

        test.addStep('Activating swiper with the higher-level WMS selector...');
        this.getControllersRegistry().swiperController!.setLayerPaths([SwiperTester.SWIPER_WMS_ROOT_LAYER_PATH]);

        test.addStep('Waiting for React to attach render handlers to the target descendant...');
        await SwiperTester.waitForCondition(() => {
          return (
            (targetOLLayer.getListeners('prerender')?.length ?? 0) === targetPreRenderBaseline + 1 &&
            (targetOLLayer.getListeners('postrender')?.length ?? 0) === targetPostRenderBaseline + 1
          );
        }, SwiperTester.SWIPER_RENDER_HANDLER_TIMEOUT);

        const targetPreRenderActive = targetOLLayer.getListeners('prerender')?.length ?? 0;
        const targetPostRenderActive = targetOLLayer.getListeners('postrender')?.length ?? 0;
        const nonTargetPreRenderActive = nonTargetOLLayer.getListeners('prerender')?.length ?? 0;
        const nonTargetPostRenderActive = nonTargetOLLayer.getListeners('postrender')?.length ?? 0;

        test.addStep('Forcing a map render and inspecting the target renderer container...');
        await this.getMapViewer().waitForRender();
        const targetRendererContainer = targetLayer.getRendererContainer();
        Test.assertIsDefined('targetRendererContainer', targetRendererContainer);
        const targetClipPath = targetRendererContainer.style.clipPath;

        test.addStep('Removing swiper paths and waiting for target render handlers to detach...');
        this.getControllersRegistry().swiperController!.removeAllLayerPaths();
        await SwiperTester.waitForCondition(() => {
          return (
            (targetOLLayer.getListeners('prerender')?.length ?? 0) === targetPreRenderBaseline &&
            (targetOLLayer.getListeners('postrender')?.length ?? 0) === targetPostRenderBaseline
          );
        }, SwiperTester.SWIPER_RENDER_HANDLER_TIMEOUT);

        return {
          targetPreRenderBaseline,
          targetPostRenderBaseline,
          nonTargetPreRenderBaseline,
          nonTargetPostRenderBaseline,
          targetPreRenderActive,
          targetPostRenderActive,
          nonTargetPreRenderActive,
          nonTargetPostRenderActive,
          targetClipPath,
          targetPreRenderClean: targetOLLayer.getListeners('prerender')?.length ?? 0,
          targetPostRenderClean: targetOLLayer.getListeners('postrender')?.length ?? 0,
          nonTargetPreRenderClean: nonTargetOLLayer.getListeners('prerender')?.length ?? 0,
          nonTargetPostRenderClean: nonTargetOLLayer.getListeners('postrender')?.length ?? 0,
        };
      },
      (test, result) => {
        test.addStep('Verifying only the target gained per-layer render handlers...');
        Test.assertIsEqual(result.targetPreRenderActive, result.targetPreRenderBaseline + 1);
        Test.assertIsEqual(result.targetPostRenderActive, result.targetPostRenderBaseline + 1);
        Test.assertIsEqual(result.nonTargetPreRenderActive, result.nonTargetPreRenderBaseline);
        Test.assertIsEqual(result.nonTargetPostRenderActive, result.nonTargetPostRenderBaseline);

        test.addStep('Verifying CSS renderer-container clipping is absent...');
        Test.assertIsEqual(result.targetClipPath, '');

        test.addStep('Verifying target render handlers returned to baseline after cleanup...');
        Test.assertIsEqual(result.targetPreRenderClean, result.targetPreRenderBaseline);
        Test.assertIsEqual(result.targetPostRenderClean, result.targetPostRenderBaseline);
        Test.assertIsEqual(result.nonTargetPreRenderClean, result.nonTargetPreRenderBaseline);
        Test.assertIsEqual(result.nonTargetPostRenderClean, result.nonTargetPostRenderBaseline);
      },
      async () => {
        this.getControllersRegistry().swiperController!.removeAllLayerPaths();
        this.getControllersRegistry().swiperController!.setOrientation('vertical');
        await SwiperTester.waitForCondition(() => {
          return getStoreSwiperLayerPaths(this.getMapId()).length === 0 && getStoreSwiperOrientation(this.getMapId()) === 'vertical';
        });
      }
    );
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
        test.addStep('Waiting for layer configs to be registered on the map...');
        const promiseWMS = this.getControllersRegistry().layerSetController.legendsLayerSet.waitForLayerConfigToGetRegistered(
          SwiperTester.SWIPER_WMS_LAYER_PATH
        );
        const promiseOgcFeature = this.getControllersRegistry().layerSetController.legendsLayerSet.waitForLayerConfigToGetRegistered(
          SwiperTester.SWIPER_OGC_FEATURE_LAYER_PATH
        );
        await Promise.all([promiseWMS, promiseOgcFeature]);

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

        // Step 5: Assert swiper is active with 1 layer in vertical mode
        test.addStep('Verifying swiper is active with 1 layer...');
        const afterAddOne = getStoreSwiperLayerPaths(this.getMapId());
        Test.assertIsArrayLengthEqual(afterAddOne, 1);
        Test.assertArrayIncludes(afterAddOne, SwiperTester.SWIPER_WMS_LAYER_PATH);
        Test.assertIsEqual(getStoreSwiperOrientation(this.getMapId()), 'vertical');

        // Step 6: Remove the WMS layer from swiper
        test.addStep('Removing WMS layer from swiper...');
        this.getControllersRegistry().swiperController!.removeLayerPath(SwiperTester.SWIPER_WMS_LAYER_PATH);

        // Step 7: Assert swiper has no layers
        test.addStep('Verifying swiper has no active layers after removal...');
        const afterRemove = getStoreSwiperLayerPaths(this.getMapId());
        Test.assertIsArrayLengthEqual(afterRemove, 0);

        // Step 8: Add WMS layer back and add OGC Feature layer
        test.addStep('Adding WMS layer back to swiper...');
        this.getControllersRegistry().swiperController!.addLayerPath(SwiperTester.SWIPER_WMS_LAYER_PATH);

        test.addStep('Adding OGC Feature layer to swiper...');
        this.getControllersRegistry().swiperController!.addLayerPath(SwiperTester.SWIPER_OGC_FEATURE_LAYER_PATH);

        // Step 9: Assert swiper is active with 2 layers
        test.addStep('Verifying swiper is active with 2 layers...');
        const afterAddTwo = getStoreSwiperLayerPaths(this.getMapId());
        Test.assertIsArrayLengthEqual(afterAddTwo, 2);
        Test.assertArrayIncludes(afterAddTwo, SwiperTester.SWIPER_WMS_LAYER_PATH);
        Test.assertArrayIncludes(afterAddTwo, SwiperTester.SWIPER_OGC_FEATURE_LAYER_PATH);

        // Step 10: Set orientation to horizontal
        test.addStep('Setting swiper orientation to horizontal...');
        this.getControllersRegistry().swiperController!.setOrientation('horizontal');

        // Step 11: Assert orientation changed
        test.addStep('Verifying orientation is now horizontal...');
        Test.assertIsEqual(getStoreSwiperOrientation(this.getMapId()), 'horizontal');

        // Step 12: Set orientation back to vertical
        test.addStep('Setting swiper orientation back to vertical...');
        this.getControllersRegistry().swiperController!.setOrientation('vertical');

        // Step 13: Assert orientation is vertical again
        test.addStep('Verifying orientation is back to vertical...');
        Test.assertIsEqual(getStoreSwiperOrientation(this.getMapId()), 'vertical');

        // Step 14: Deactivate all layers
        test.addStep('Deactivating all layers from swiper...');
        this.getControllersRegistry().swiperController!.removeAllLayerPaths();

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
