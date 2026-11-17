import type { API } from 'geoview-core/api/api';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import { TestSuiteCannotExecuteError } from '../core/exceptions';
import { SwiperTester } from '../testers/swiper-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';

/**
 * Test Suite for Swiper plugin functionality.
 */
export class GVTestSuiteSwiper extends GVAbstractTestSuite {
  /** The Swiper Tester used in this Test Suite. */
  #swiperTester: SwiperTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry for the map viewer
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);

    // Create the Swiper tester
    this.#swiperTester = new SwiperTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#swiperTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Swiper Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests Swiper layer selection, rendering isolation, and interactive settings:<br/>
      <b>Lifecycle</b> — Layer activation/deactivation, multi-layer assignment and orientation changes<br/>
      <b>Rendering isolation</b> — Per-layer render clipping is isolated to descendants of the selected layer path<br/>
      <b>Interactive customization</b> — Left/right and up/down clipping sides, exported config persistence, settings control visibility, progressive layer registration, and hover suppression over the bar/handle`;
  }

  /**
   * Gets the number of active tests launched by the full suite.
   *
   * @returns The number of active full-suite tester calls, excluding debug-only calls
   */
  override getTestsTotalFinal(): number {
    return 7;
  }

  /**
   * Overrides the check if the Test Suite can be executed.
   *
   * @returns A promise that resolves to true when the Test Suite can be launched for the given map
   */
  protected override onCanExecuteTestSuite(): Promise<boolean> {
    // Check if the swiper plugin is part of the corePackages on the testing map
    const corePackages = this.getMapViewer().mapFeaturesConfig.corePackages || [];
    if (!corePackages.includes('swiper'))
      throw new TestSuiteCannotExecuteError('To run this Test Suite, the swiper plugin has to be loaded in the corePackages array.');

    // Check if the swiper controller is available
    if (!this.getControllersRegistry().swiperController)
      throw new TestSuiteCannotExecuteError('To run this Test Suite, the swiper controller must be initialized.');

    // All good
    return Promise.resolve(true);
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    // Run sequentially because both tests modify shared swiper state
    await this.#swiperTester.testSwiperRenderIsolation();
    await this.#swiperTester.testSwiperLifecycle();

    // TODO: CHECK - This test was omitted from being called, normal?
    // await this.#swiperTester.testSwiperHoverSuppression();

    await this.#swiperTester.testSwiperPerLayerSides();
    await this.#swiperTester.testSwiperProgressiveRegistration();
    await this.#swiperTester.testSwiperConfigPersistence();
    await this.#swiperTester.testSwiperHoverSuppression();
    await this.#swiperTester.testSwiperSettingsGating();

    return;
  }
}
