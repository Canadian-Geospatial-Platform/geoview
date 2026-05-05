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
   * @param controllerRegistry - The controller registry
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
    return 'Test Suite to perform various Swiper plugin related tests.';
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
  protected override onLaunchTestSuite(): Promise<unknown> {
    // Run the swiper lifecycle test
    return this.#swiperTester.testSwiperLifecycle();
  }
}
