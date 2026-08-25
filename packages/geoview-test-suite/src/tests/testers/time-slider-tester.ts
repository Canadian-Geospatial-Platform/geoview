import { Test } from '../core/test';
import { GVAbstractTester } from './abstract-gv-tester';
import {
  addStoreTimeSliderLayer,
  getStoreTimeSliderLayer,
  removeStoreTimeSliderLayer,
  setStoreTimeSliderValues,
  type TypeTimeSliderValues,
} from 'geoview-core/core/stores/states/time-slider-state';

/** Values captured while testing time-slider reset behavior. */
type TimeSliderResetResult = {
  /** Values placed in the store before reset. */
  changedValues: number[];
  /** Defaults captured before reset. */
  defaultValuesBeforeReset: number[];
  /** Defaults remaining after reset. */
  defaultValuesAfterReset: number[];
  /** Current values after reset. */
  valuesAfterReset: number[];
};

/** Constrained values captured for each overlap scenario. */
type TimeSliderConstraintResult = {
  /** Discrete values constrained while moving the left thumb. */
  discreteLeftThumb: number[];
  /** Discrete values constrained while moving the right thumb. */
  discreteRightThumb: number[];
  /** Absolute values constrained while moving the left thumb. */
  absoluteLeftThumb: number[];
  /** Absolute values constrained while moving the right thumb. */
  absoluteRightThumb: number[];
};

/** Main Time Slider testing class. */
export class TimeSliderTester extends GVAbstractTester {
  /** Layer path for the temporal ESRI Dynamic layer used in reset tests. */
  static readonly TIME_SLIDER_LAYER_PATH = 'timeSliderFlood/0';

  /** Synthetic store path for discrete overlap tests. */
  static readonly DISCRETE_LAYER_PATH = 'time-slider-test/discrete';

  /** Synthetic store path for stepped continuous overlap tests. */
  static readonly CONTINUOUS_STEP_LAYER_PATH = 'time-slider-test/continuous-step';

  /** Synthetic store path for fallback continuous overlap tests. */
  static readonly CONTINUOUS_FALLBACK_LAYER_PATH = 'time-slider-test/continuous-fallback';

  /** Discrete timestamps used by overlap tests. */
  static readonly DISCRETE_TIMESTAMPS = [1000, 2000, 3000];

  /** Continuous test range. */
  static readonly CONTINUOUS_MIN_AND_MAX = [0, 1000];

  /** Minimum separation selected for absolute slider tests. */
  static readonly ABSOLUTE_STEP = 100;

  /**
   * Returns the name of the Tester.
   *
   * @returns The name of the Tester
   */
  override getName(): string {
    return 'TimeSliderTester';
  }

  /**
   * Tests resetting current time-slider values to their registered defaults.
   *
   * @returns A promise that resolves when the test completes
   */
  testResetValues(): Promise<Test<TimeSliderResetResult>> {
    let originalValues: number[] | undefined;

    return this.test(
      'Test Time Slider reset restores registered default values...',
      async (test) => {
        test.addStep('Waiting for the temporal layer and time-slider values to be registered...');
        await this.getControllersRegistry().layerController.waitForLayerRegistered(TimeSliderTester.TIME_SLIDER_LAYER_PATH);
        await TimeSliderTester.waitForCondition(
          () => !!getStoreTimeSliderLayer(this.getMapId(), TimeSliderTester.TIME_SLIDER_LAYER_PATH),
          GVAbstractTester.LAYER_REGISTRATION_TIMEOUT_MS
        );
        const registeredValues = getStoreTimeSliderLayer(this.getMapId(), TimeSliderTester.TIME_SLIDER_LAYER_PATH);
        Test.assertIsDefined('registeredValues', registeredValues);

        originalValues = [...registeredValues.values];
        const defaultValuesBeforeReset = [...registeredValues.defaultValues];
        const changedValues = defaultValuesBeforeReset.map((value) => value + 1);

        test.addStep('Replacing the current store values while preserving the registered defaults...');
        setStoreTimeSliderValues(this.getMapId(), TimeSliderTester.TIME_SLIDER_LAYER_PATH, changedValues);

        test.addStep('Resetting values through the time-slider controller...');
        this.getControllersRegistry().timeSliderController!.resetValues(TimeSliderTester.TIME_SLIDER_LAYER_PATH);

        const resetValues = getStoreTimeSliderLayer(this.getMapId(), TimeSliderTester.TIME_SLIDER_LAYER_PATH);
        Test.assertIsDefined('resetValues', resetValues);
        return {
          changedValues,
          defaultValuesBeforeReset,
          defaultValuesAfterReset: [...resetValues.defaultValues],
          valuesAfterReset: [...resetValues.values],
        };
      },
      (test, result) => {
        test.addStep('Verifying reset restored values without changing defaultValues...');
        Test.assertIsNotEqual(JSON.stringify(result.changedValues), JSON.stringify(result.valuesAfterReset));
        Test.assertIsArrayEqual(result.valuesAfterReset, result.defaultValuesBeforeReset);
        Test.assertIsArrayEqual(result.defaultValuesAfterReset, result.defaultValuesBeforeReset);
      },
      (test) => {
        if (originalValues) {
          test.addStep('Restoring the original time-slider values...');
          this.getControllersRegistry().timeSliderController!.updateTimeSliderValues(
            TimeSliderTester.TIME_SLIDER_LAYER_PATH,
            originalValues
          );
        }
      }
    );
  }

  /**
   * Tests discrete and continuous dual-handle overlap constraints in both thumb directions.
   *
   * @returns A promise that resolves when the test completes
   */
  testConstrainValues(): Promise<Test<TimeSliderConstraintResult>> {
    const baseValues: TypeTimeSliderValues = {
      delay: 1000,
      defaultValues: [0, 1000],
      discreteValues: false,
      field: 'date',
      fieldAlias: 'Date',
      filtering: true,
      isMainLayerPath: true,
      minAndMax: TimeSliderTester.CONTINUOUS_MIN_AND_MAX,
      range: ['1970-01-01T00:00:00.000Z', '1970-01-01T00:00:01.000Z'],
      singleHandle: false,
      values: [0, 1000],
    };

    return this.test(
      'Test Time Slider prevents dual-handle overlap for discrete and continuous ranges...',
      (test) => {
        test.addStep('Registering deterministic discrete and continuous slider values in the store...');
        addStoreTimeSliderLayer(this.getMapId(), TimeSliderTester.DISCRETE_LAYER_PATH, {
          ...baseValues,
          defaultValues: [1000, 3000],
          discreteValues: true,
          minAndMax: [1000, 3000],
          range: TimeSliderTester.DISCRETE_TIMESTAMPS.map((value) => new Date(value).toISOString()),
          values: [1000, 3000],
        });
        addStoreTimeSliderLayer(this.getMapId(), TimeSliderTester.CONTINUOUS_STEP_LAYER_PATH, {
          ...baseValues,
          step: TimeSliderTester.ABSOLUTE_STEP,
        });
        addStoreTimeSliderLayer(this.getMapId(), TimeSliderTester.CONTINUOUS_FALLBACK_LAYER_PATH, baseValues);

        const timeSliderController = this.getControllersRegistry().timeSliderController!;
        test.addStep('Constraining overlapping values from both active thumb directions...');
        return {
          discreteLeftThumb: timeSliderController.constrainValues(TimeSliderTester.DISCRETE_LAYER_PATH, [2000, 2000], 0),
          discreteRightThumb: timeSliderController.constrainValues(TimeSliderTester.DISCRETE_LAYER_PATH, [2000, 2000], 1),
          absoluteLeftThumb: timeSliderController.constrainValues(TimeSliderTester.CONTINUOUS_STEP_LAYER_PATH, [450, 500], 0),
          absoluteRightThumb: timeSliderController.constrainValues(TimeSliderTester.CONTINUOUS_STEP_LAYER_PATH, [500, 550], 1),
        };
      },
      (test, result) => {
        test.addStep('Verifying discrete overlaps move to adjacent distinct timestamps...');
        Test.assertIsArrayEqual(result.discreteLeftThumb, [1000, 2000]);
        Test.assertIsArrayEqual(result.discreteRightThumb, [2000, 3000]);

        test.addStep('Verifying absolute values are retained without a minimum step constraint...');
        Test.assertIsArrayEqual(result.absoluteLeftThumb, [400, 500]);
        Test.assertIsArrayEqual(result.absoluteRightThumb, [500, 600]);
      },
      (test) => {
        test.addStep('Removing synthetic time-slider values from the store...');
        removeStoreTimeSliderLayer(this.getMapId(), TimeSliderTester.DISCRETE_LAYER_PATH, (): void => {});
        removeStoreTimeSliderLayer(this.getMapId(), TimeSliderTester.CONTINUOUS_STEP_LAYER_PATH, (): void => {});
        removeStoreTimeSliderLayer(this.getMapId(), TimeSliderTester.CONTINUOUS_FALLBACK_LAYER_PATH, (): void => {});
      }
    );
  }
}
