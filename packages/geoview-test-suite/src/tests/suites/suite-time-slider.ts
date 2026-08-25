import type { API } from 'geoview-core/api/api';
import type { ControllerRegistry } from 'geoview-core/core/controllers/base/controller-registry';
import type { MapViewer } from 'geoview-core/geo/map/map-viewer';
import { TestSuiteCannotExecuteError } from '../core/exceptions';
import { TimeSliderTester } from '../testers/time-slider-tester';
import { GVAbstractTestSuite } from './abstract-gv-test-suite';

/** Test Suite for Time Slider plugin functionality. */
export class GVTestSuiteTimeSlider extends GVAbstractTestSuite {
  /** The Time Slider Tester used in this Test Suite. */
  #timeSliderTester: TimeSliderTester;

  /**
   * Constructs the Test Suite.
   *
   * @param api - The shared api
   * @param mapViewer - The map viewer
   * @param controllerRegistry - The controller registry
   */
  constructor(api: API, mapViewer: MapViewer, controllerRegistry: ControllerRegistry) {
    super(api, mapViewer, controllerRegistry);
    this.#timeSliderTester = new TimeSliderTester(api, mapViewer, controllerRegistry);
    this.addTester(this.#timeSliderTester);
  }

  /**
   * Returns the name of the Test Suite.
   *
   * @returns The name of the Test Suite
   */
  override getName(): string {
    return 'Time Slider Test Suite';
  }

  /**
   * Returns the description of the Test Suite.
   *
   * @returns The description of the Test Suite
   */
  override getDescriptionAsHtml(): string {
    return `Tests Time Slider controller behavior:<br/>
      <b>Reset</b> — Registered defaults are restored through the controller<br/>
      <b>Overlap constraints</b> — Discrete and continuous dual handles remain separated`;
  }

  /**
   * Overrides the check if the Test Suite can be executed.
   *
   * @returns A promise that resolves to true when the Test Suite can be launched for the given map
   */
  protected override onCanExecuteTestSuite(): Promise<boolean> {
    const plugins = this.getMapViewer().mapFeaturesConfig.footerBar?.tabs?.core || [];
    if (!plugins.includes('time-slider'))
      throw new TestSuiteCannotExecuteError(
        'To run this Test Suite, the time-slider plugin has to be loaded in the footerBar tabs core array.'
      );

    if (!this.getControllersRegistry().timeSliderController)
      throw new TestSuiteCannotExecuteError('To run this Test Suite, the time-slider controller must be initialized.');

    return Promise.resolve(true);
  }

  /**
   * Overrides the implementation to perform the tests for this Test Suite.
   *
   * @returns A promise that resolves when tests are completed
   */
  protected override async onLaunchTestSuite(): Promise<unknown> {
    await this.#timeSliderTester.testResetValues();
    return this.#timeSliderTester.testConstrainValues();
  }
}
