import type { ClassType } from 'geoview-core/core/types/global-types';
import {
  TestError,
  AssertionJSONObjectError,
  AssertionUndefinedError,
  AssertionDefinedError,
  AssertionValueError,
  AssertionWrongInstanceError,
  AssertionArrayExcludingError,
  AssertionArrayIncludingError,
  AssertionArrayLengthError,
  AssertionArrayLengthMinimalError,
  AssertionWrongErrorInstanceError,
  AssertionNoErrorThrownError,
  AssertionValueNotAnArrayError,
  AssertionArraysNotEqualError,
  AssertionManualFailError,
  AssertionValueDifferentError,
} from './exceptions';
import type { TestStepLevel } from './test-step';
import { TestStep } from './test-step';
import type { EventDelegateBase } from 'geoview-core/api/events/event-helper';
import EventHelper from 'geoview-core/api/events/event-helper';
import { formatDuration, generateId } from 'geoview-core/core/utils/utilities';

export class Test<T = unknown> {
  /** A unique id for the test */
  id: string;

  /** A title for the test */
  #title: string;

  /** The type of test (regular, true-negative) */
  #type: TestType = 'regular';

  /** The Steps the Test has processed so far */
  #steps: TestStep[] = [];

  /** The step status */
  #status: TestStatus = 'new';

  /** The assertion result when the test has executed its run. */
  #result?: T;

  /** The start time of the test. */
  #timeStart?: Date;

  /** The end time of the test. */
  #timeEnd?: Date;

  /** The start time of the test execution. */
  #timeStartTest?: Date;

  /** The end time of the test execution. */
  #timeEndTest?: Date;

  /** The start time of the assertion phase. */
  #timeStartAssert?: Date;

  /** The end time of the assertion phase. */
  #timeEndAssert?: Date;

  /** The start time of the finalization phase. */
  #timeStartFinalize?: Date;

  /** The end time of the finalization phase. */
  #timeEndFinalize?: Date;

  /** Accumulated estimated starvation time in milliseconds. */
  #estimatedStarvationMs = 0;

  /** The handle for the heartbeat setTimeout, used to cancel on stop. */
  #heartbeatHandle: ReturnType<typeof setTimeout> | undefined;

  /** The last heartbeat timestamp from performance.now(). */
  #lastHeartbeat = 0;

  /** The reason why the test was skipped, if applicable. */
  #skippedReason?: string;

  /** The error which occurred during the test if any. */
  #error?: Error;

  /** Callback delegates for the status changed event */
  #onStatusChangedHandlers: TestChangedDelegate[] = [];

  /** Callback delegates for the step changed event */
  #onStepChangedHandlers: TestChangedDelegate[] = [];

  /**
   * Constructs an {@link Test} instance.
   *
   * @param title - A title describing the test
   */
  constructor(title: string) {
    this.id = generateId();
    this.#title = title;
  }

  /**
   * Gets the current title.
   *
   * @returns The title
   */
  getTitle(): string {
    return this.#title;
  }

  /**
   * Sets the title.
   *
   * @param title - The title to set
   */
  setTitle(title: string): void {
    this.#title = title;
  }

  /**
   * Gets the current type.
   *
   * @returns The type
   */
  getType(): TestType {
    return this.#type;
  }

  /**
   * Sets the type.
   *
   * @param type - The type to set
   */
  setType(type: TestType): void {
    this.#type = type;
  }

  /**
   * Gets the current status of the test.
   *
   * @returns The current status
   */
  getStatus(): TestStatus {
    return this.#status;
  }

  /**
   * Sets the current status of the test.
   *
   * @param status - The status value to set
   */
  setStatus(status: TestStatus): void {
    this.#status = status;
    this.#emitStatusChanged({ status });
  }

  /**
   * Gets the steps processed so far.
   *
   * @returns The steps processed so far
   */
  getSteps(): TestStep[] {
    return this.#steps;
  }

  /**
   * Gets the steps formatted in html <ul> list.
   *
   * @returns The steps formatted in html string
   */
  getStepsAsHtml(): string {
    const steps = this.getSteps();
    if (steps.length === 0) return '';

    let html = '<ul style="font-size: small;">';

    let currentMajorHtml = '';
    let nestedSteps: string[] = [];

    for (const step of steps) {
      if (step.level === 'major') {
        // If there's a previous major step, close it out
        if (currentMajorHtml) {
          if (nestedSteps.length > 0) {
            currentMajorHtml += `<ul>${nestedSteps.join('')}</ul>`;
          }
          html += `<li>${currentMajorHtml}</li>`;
          nestedSteps = [];
        }
        // Start a new major step
        currentMajorHtml = `<strong><font style="color: ${step.color};">${step.message}</font></strong>`;
      } else {
        // Accumulate nested steps
        nestedSteps.push(`<li>${step.message}</li>`);
      }
    }

    // Add the last major step (if any)
    if (currentMajorHtml) {
      if (nestedSteps.length > 0) {
        currentMajorHtml += `<ul>${nestedSteps.join('')}</ul>`;
      }
      html += `<li>${currentMajorHtml}</li>`;
    }

    html += '</ul>';
    return html;
  }

  /**
   * Adds the step and emits a step change event.
   *
   * @param step - The step value to add
   * @param level - The step level
   * @param color - The step color for display purposes
   */
  addStep(step: string, level: TestStepLevel = 'regular', color = 'black'): void {
    this.#steps.push(new TestStep(step, level, color));
    this.#emitStepChanged({ step });
  }

  /**
   * Gets the assertion result associated with this instance.
   *
   * @returns The assertion result, or undefined if not set
   */
  getResult(): T | undefined {
    return this.#result;
  }

  /**
   * Sets the assertion result for this instance.
   *
   * @param result - The result to associate
   */
  setResult(result: T): void {
    this.#result = result;
  }

  /**
   * Gets the error which occurred during the test.
   *
   * @returns The error if any
   */
  getError(): Error | undefined {
    return this.#error;
  }

  /**
   * Sets the error which occurred during the test.
   *
   * @param error - The error
   */
  setError(error: Error): void {
    this.#error = error;
  }

  /**
   * Gets the reason why the test was skipped.
   *
   * @returns The skipped reason, or undefined if the test was not skipped
   */
  getSkippedReason(): string | undefined {
    return this.#skippedReason;
  }

  /**
   * Sets the reason why the test was skipped.
   *
   * @param reason - The reason the test was skipped
   */
  setSkippedReason(reason: string): void {
    this.#skippedReason = reason;
  }

  /**
   * Gets the start time of the test.
   *
   * @returns The start time, or undefined if the test has not started
   */
  getTimeStart(): Date | undefined {
    return this.#timeStart;
  }

  /**
   * Sets the start time of the test.
   *
   * @param date - The start time to set
   */
  setTimeStart(date: Date): void {
    this.#timeStart = date;
  }

  /**
   * Gets the start time of the test execution (right before the callback).
   *
   * @returns The test execution start time, or undefined if not set
   */
  getTimeStartTest(): Date | undefined {
    return this.#timeStartTest;
  }

  /**
   * Sets the start time of the test execution (right before the callback).
   *
   * @param date - The test execution start time to set
   */
  setTimeStartTest(date: Date): void {
    this.#timeStartTest = date;
  }

  /**
   * Gets the end time of the test execution (right after the callback resolves).
   *
   * @returns The test execution end time, or undefined if not set
   */
  getTimeEndTest(): Date | undefined {
    return this.#timeEndTest;
  }

  /**
   * Sets the end time of the test execution (right after the callback resolves).
   *
   * @param date - The test execution end time to set
   */
  setTimeEndTest(date: Date): void {
    this.#timeEndTest = date;
  }

  /**
   * Gets the end time of the test.
   *
   * @returns The end time, or undefined if the test has not ended
   */
  getTimeEnd(): Date | undefined {
    return this.#timeEnd;
  }

  /**
   * Sets the end time of the test.
   *
   * @param date - The end time to set
   */
  setTimeEnd(date: Date): void {
    this.#timeEnd = date;
  }

  /**
   * Gets the duration of the test in milliseconds.
   *
   * @returns The duration in milliseconds, or undefined if the test has not started or ended
   */
  getDurationMs(): number | undefined {
    if (!this.#timeStart || !this.#timeEnd) return undefined;
    return this.#timeEnd.getTime() - this.#timeStart.getTime();
  }

  /**
   * Gets the total test duration as a compact human-readable string.
   *
   * @returns The formatted duration, or an empty string if the test has not completed
   */
  getDurationFormatted(): string {
    // Get the duration
    const duration = this.getDurationMs();
    if (!duration) return '';

    // Return the duration formatted
    return formatDuration(duration);
  }

  /**
   * Gets the duration of the test callback execution in milliseconds.
   *
   * @returns The callback duration in milliseconds, or undefined if timestamps are not set
   */
  getDurationTestMs(): number | undefined {
    if (!this.#timeStartTest || !this.#timeEndTest) return undefined;
    return this.#timeEndTest.getTime() - this.#timeStartTest.getTime();
  }

  /**
   * Gets the start time of the assertion phase.
   *
   * @returns The assertion start time, or undefined if not set
   */
  getTimeStartAssert(): Date | undefined {
    return this.#timeStartAssert;
  }

  /**
   * Sets the start time of the assertion phase.
   *
   * @param date - The assertion start time to set
   */
  setTimeStartAssert(date: Date): void {
    this.#timeStartAssert = date;
  }

  /**
   * Gets the end time of the assertion phase.
   *
   * @returns The assertion end time, or undefined if not set
   */
  getTimeEndAssert(): Date | undefined {
    return this.#timeEndAssert;
  }

  /**
   * Sets the end time of the assertion phase.
   *
   * @param date - The assertion end time to set
   */
  setTimeEndAssert(date: Date): void {
    this.#timeEndAssert = date;
  }

  /**
   * Gets the duration of the assertion phase in milliseconds.
   *
   * @returns The assertion duration in milliseconds, or undefined if timestamps are not set
   */
  getDurationAssertMs(): number | undefined {
    if (!this.#timeStartAssert || !this.#timeEndAssert) return undefined;
    return this.#timeEndAssert.getTime() - this.#timeStartAssert.getTime();
  }

  /**
   * Gets the start time of the finalization phase.
   *
   * @returns The finalization start time, or undefined if not set
   */
  getTimeStartFinalize(): Date | undefined {
    return this.#timeStartFinalize;
  }

  /**
   * Sets the start time of the finalization phase.
   *
   * @param date - The finalization start time to set
   */
  setTimeStartFinalize(date: Date): void {
    this.#timeStartFinalize = date;
  }

  /**
   * Gets the end time of the finalization phase.
   *
   * @returns The finalization end time, or undefined if not set
   */
  getTimeEndFinalize(): Date | undefined {
    return this.#timeEndFinalize;
  }

  /**
   * Sets the end time of the finalization phase.
   *
   * @param date - The finalization end time to set
   */
  setTimeEndFinalize(date: Date): void {
    this.#timeEndFinalize = date;
  }

  /**
   * Gets the duration of the finalization phase in milliseconds.
   *
   * @returns The finalization duration in milliseconds, or undefined if timestamps are not set
   */
  getDurationFinalizeMs(): number | undefined {
    if (!this.#timeStartFinalize || !this.#timeEndFinalize) return undefined;
    return this.#timeEndFinalize.getTime() - this.#timeStartFinalize.getTime();
  }

  /**
   * Gets the estimated net test duration in milliseconds — the wall-clock callback time minus
   * estimated event loop starvation. This approximates how long the test's actual work
   * (network I/O, processing) took without contention.
   *
   * Because the starvation estimate may slightly overcount (see `getDurationStarvationMs()`),
   * this value may underestimate the true network/work time by a small margin.
   *
   * @returns The estimated net duration in milliseconds, or undefined if callback timestamps are not set
   */
  getDurationNetMs(): number | undefined {
    const test = this.getDurationTestMs();
    if (test === undefined) return undefined;
    return Math.max(0, test - this.getDurationStarvationMs());
  }

  /**
   * Gets the estimated event loop starvation duration in milliseconds.
   *
   * This is an approximation based on heartbeat sampling. The heartbeat fires at a fixed interval
   * and measures how long each tick actually took — the excess is accumulated as starvation.
   * Because the heartbeat cannot distinguish between starvation that overlaps with concurrent
   * network I/O and starvation that delays promise continuations, the value may slightly
   * overestimate actual starvation.
   *
   * @returns The estimated starvation duration in milliseconds
   */
  getDurationStarvationMs(): number {
    return this.#estimatedStarvationMs;
  }

  /**
   * Gets the estimated event loop starvation duration as a compact human-readable string.
   *
   * @returns The formatted starvation duration
   */
  getDurationStarvationFormatted(): string {
    // Get the duration
    const duration = this.getDurationStarvationMs();

    // Return the duration formatted
    return formatDuration(duration);
  }

  // #region EVENT LOOP MONITOR

  /** The heartbeat interval in milliseconds used to probe event loop availability. */
  static readonly HEARTBEAT_INTERVAL_MS = 250;

  /** Per-tick jitter threshold in milliseconds below which excess is ignored (normal timer imprecision). */
  static readonly HEARTBEAT_JITTER_THRESHOLD_MS = 100;

  /**
   * Starts the event loop starvation monitor.
   *
   * Schedules recurring heartbeat ticks at a known interval. Each tick measures how
   * long it actually took versus the expected interval — the excess beyond a small
   * jitter threshold is accumulated as starvation time caused by main-thread contention.
   * The threshold filters out normal setTimeout scheduling imprecision (~1-4ms).
   */
  startEventLoopMonitor(): void {
    this.#estimatedStarvationMs = 0;
    this.#lastHeartbeat = performance.now();

    const tick = (): void => {
      const now = performance.now();
      const elapsed = now - this.#lastHeartbeat;
      const excess = Math.max(0, elapsed - Test.HEARTBEAT_INTERVAL_MS - Test.HEARTBEAT_JITTER_THRESHOLD_MS);
      this.#estimatedStarvationMs += excess;
      this.#lastHeartbeat = now;
      this.#heartbeatHandle = setTimeout(tick, Test.HEARTBEAT_INTERVAL_MS);
    };

    this.#heartbeatHandle = setTimeout(tick, Test.HEARTBEAT_INTERVAL_MS);
  }

  /**
   * Stops the event loop starvation monitor and finalizes the accumulated starvation value.
   */
  stopEventLoopMonitor(): void {
    if (this.#heartbeatHandle !== undefined) {
      clearTimeout(this.#heartbeatHandle);
      this.#heartbeatHandle = undefined;
    }
  }

  // #endregion

  // #region PUBLIC STATIC METHODS -  PRIMITIVES

  /**
   * Asserts that two values are strictly equal (`===`).
   *
   * @param actualValue - The actual value being checked
   * @param expectedValue - The expected value to compare against
   * @param [roundToPrecision] - Decimal places to round numeric values: 1 means one, 10 means ten, and 100 means one hundred; this is not a tolerance
   * @throws {AssertionError} When the values are not strictly equal.
   */
  static assertIsEqual<T = unknown>(actualValue: T, expectedValue: T, roundToPrecision?: number): asserts actualValue is T {
    // Redirect
    const equalResult = this.#checkValuesEqual(actualValue, expectedValue, roundToPrecision);

    // If equal
    if (equalResult.equal) return;

    // Throw an error if the values are not equal
    throw new AssertionValueError(equalResult.actualValue, equalResult.expectedValue);
  }

  /**
   * Asserts that two numeric values differ by no more than the specified tolerance.
   *
   * The comparison succeeds when `Math.abs(actualValue - expectedValue) <= tolerance`. A tolerance of `1` allows
   * values up to one unit apart, while a tolerance of `0.01` allows values up to one hundredth apart.
   *
   * @param actualValue - The actual numeric value being checked
   * @param expectedValue - The expected numeric value to compare against
   * @param tolerance - The maximum allowed absolute difference
   * @throws {AssertionValueError} When the absolute difference is greater than the tolerance
   */
  static assertIsEqualWithinTolerance(actualValue: number, expectedValue: number, tolerance: number): void {
    if (Math.abs(actualValue - expectedValue) <= tolerance) return;

    // Throw an error if the values differ by more than the allowed tolerance
    throw new AssertionValueError(actualValue, expectedValue);
  }

  /**
   * Asserts that two values are not equal (`!==`).
   *
   * @param actualValue - The actual value being checked
   * @param expectedValue - The expected value to compare against
   * @param [roundToPrecision] - Optional number of decimal places to round to before comparing (for numbers only)
   * @throws {AssertionValueDifferentError} When the values are equal.
   */
  static assertIsNotEqual<T = unknown>(actualValue: T, expectedValue: T, roundToPrecision?: number): asserts actualValue is T {
    // Redirect
    const equalResult = this.#checkValuesEqual(actualValue, expectedValue, roundToPrecision);

    // If not equal
    if (!equalResult.equal) return;

    // Throw an error if the values are equal
    throw new AssertionValueDifferentError(equalResult.actualValue);
  }

  /**
   * Asserts that a value is defined.
   *
   * @param propertyPath - The name or path of the array being validated
   * @param actualValue - The actual value being checked
   * @throws {AssertionUndefinedError} When the value isn't defined.
   */
  static assertIsDefined<T = unknown>(propertyPath: string, actualValue: T | undefined | null): asserts actualValue is NonNullable<T> {
    // Checks if the value is defined
    if (actualValue !== undefined && actualValue !== null) return;

    // Throw an error if the value is not defined
    throw new AssertionUndefinedError(propertyPath);
  }

  /**
   * Asserts that a value is undefined.
   *
   * @param propertyPath - The name or path of the array being validated
   * @param actualValue - The actual value being checked
   * @throws {AssertionUndefinedError} When the value is defined.
   */
  static assertIsUndefined<T = unknown>(propertyPath: string, actualValue: T | undefined | null): void {
    // Checks if the value is defined
    if (actualValue === undefined || actualValue === null) return;

    // Throw an error if the value is defined
    throw new AssertionDefinedError(propertyPath, actualValue);
  }

  /**
   * Asserts that a value is of the correct instance type.
   *
   * @param actualValue - The actual value being checked
   * @param expectedType - The expected class type
   * @throws {AssertionWrongInstanceError} When the value isn't of the expected type.
   */
  static assertIsInstance<T>(actualValue: unknown, expectedType: ClassType<T>): asserts actualValue is T {
    // Checks if the value is defined, first
    Test.assertIsDefined('Object instance', actualValue);

    // Checks if the value is of the expected instance type
    if (actualValue instanceof expectedType) return;

    // Throw an error if the value is not of the expected instance type
    throw new AssertionWrongInstanceError(actualValue, expectedType);
  }

  /**
   * Asserts that a value is of the correct instance type.
   *
   * @param actualError - The actual error being checked
   * @param expectedType - The expected class type
   * @throws {AssertionWrongInstanceError} When the error isn't of expected type.
   */
  static assertIsErrorInstance<T extends Error>(actualError: T, expectedType: ClassType<T>): asserts actualError is T {
    // Checks if the value is defined, first
    if (!actualError) throw new AssertionNoErrorThrownError(expectedType);

    // Checks if the value is of the expected instance type
    if (actualError instanceof expectedType) return;

    // Throw an error if the error is not of the expected instance type
    throw new AssertionWrongErrorInstanceError(actualError, expectedType);
  }

  /**
   * Manually fails a test with a custom message.
   *
   * This is useful when you need to explicitly fail a test based on custom logic or conditions
   * that cannot be expressed with the other assertion methods.
   *
   * @param message - Custom message explaining why the test is being manually failed
   * @throws {AssertionManualFailError} When invoked (always throws to fail the test)
   */
  static assertFail(message = 'Test manually failed'): never {
    // Throw the manual fail error
    throw new AssertionManualFailError(message);
  }

  /**
   * Compares two values for strict equality, with optional numeric rounding.
   *
   * If `roundToPrecision` is provided and both values are numbers, the values are
   * rounded to the given precision before comparison.
   *
   * @param actualValue - The actual value to compare
   * @param expectedValue - The expected value to compare against
   * @param [roundToPrecision] - Optional number of decimal places to round numeric values to
   * @returns An object describing whether the values are equal and the values used for comparison
   */
  static #checkValuesEqual<T = unknown>(actualValue: T, expectedValue: T, roundToPrecision?: number): EqualHelper<T> {
    // If rounding is specified and both values are numbers, round them first
    if (roundToPrecision !== undefined && typeof actualValue === 'number' && typeof expectedValue === 'number') {
      const roundedActual = this.#roundToPrecision(actualValue, roundToPrecision);
      const roundedExpected = this.#roundToPrecision(expectedValue, roundToPrecision);
      return { equal: roundedActual === roundedExpected, actualValue: roundedActual as T, expectedValue: roundedExpected as T };
    }

    // Checks if the result value is the same as the value provided
    return { equal: actualValue === expectedValue, actualValue, expectedValue };
  }

  // #endregion PUBLIC STATIC METHODS -  PRIMITIVES

  // #region PUBLIC STATIC METHODS -  ARRAYS

  /**
   * Asserts that a value is an array.
   *
   * @param actualValue - The object to check
   * @throws {AssertionValueNotAnArrayError} When the value is not an array.
   */
  static assertIsArray(actualValue: unknown | unknown[] | null | undefined): asserts actualValue is unknown[] {
    if (Array.isArray(actualValue)) return;

    // Throw an error if the value is not an array
    throw new AssertionValueNotAnArrayError(actualValue);
  }

  /**
   * Asserts that a length of a given array is equal to the expected length.
   *
   * @param array - The array to check the length
   * @param expectedValue - The expected length of the array
   * @throws {AssertionArrayLengthError} When the array lengths aren't equal.
   * @throws {AssertionValueNotAnArrayError} When the value is not an array.
   */
  static assertIsArrayLengthEqual(array: unknown[] | undefined, expectedValue: number): void {
    // Test if it is an array
    Test.assertIsArray(array);

    if (array?.length === expectedValue) return;

    // Throw an error if the array length is not equal to the expected length
    throw new AssertionArrayLengthError(array?.length, expectedValue);
  }

  /**
   * Asserts that a length of a given array is at least of minimum length.
   *
   * @param array - The array to check the length
   * @param expectedMinimumLength - The expected minimum length of the array
   * @throws {AssertionArrayLengthMinimalError} When the array length is under the minimum length.
   * @throws {AssertionValueNotAnArrayError} When the value is not an array.
   */
  static assertIsArrayLengthMinimal(array: unknown[] | undefined, expectedMinimumLength: number): void {
    // Test if it is an array
    Test.assertIsArray(array);

    if (array?.length ?? 0 >= expectedMinimumLength) return;

    // Throw an error if the array length is less than the expected minimum length
    throw new AssertionArrayLengthMinimalError(array?.length ?? 0, expectedMinimumLength);
  }

  /**
   * Asserts that the given array includes the expected value.
   *
   * @template T - The type of the elements in the array.
   * @param array - The array to search
   * @param expectedValue - The value expected to be included in the array
   * @throws {AssertionArrayNotIncludingError} When the expected value is not found in the array.
   * @throws {AssertionValueNotAnArrayError} When the value is not an array.
   */
  static assertArrayIncludes<T = unknown>(array: T[], expectedValue: T): void {
    // Test if it is an array
    Test.assertIsArray(array);

    if (array.includes(expectedValue)) return;

    // Throw an error if the expected value is not found in the array
    throw new AssertionArrayIncludingError(array, expectedValue);
  }

  /**
   * Asserts that the given array excludes a particular value.
   *
   * @template T - The type of the elements in the array.
   * @param array - The array to search
   * @param expectedValue - The value expected to be included in the array
   * @throws {AssertionArrayNotIncludingError} When the expected value is found in the array.
   * @throws {AssertionValueNotAnArrayError} When the value is not an array.
   */
  static assertArrayExcludes<T = unknown>(array: T[], expectedValue: T): void {
    // Test if it is an array
    Test.assertIsArray(array);

    if (!array.includes(expectedValue)) return;

    // Throw an error if the expected value is found in the array
    throw new AssertionArrayExcludingError(array, expectedValue);
  }

  /**
   * Asserts that two arrays have equal values and in the same order (primitive comparison).
   *
   * @param actualValue - The actual array being checked
   * @param expectedValue - The expected array to compare against
   * @param [roundToPrecision] - Optional number of decimal places to round to before comparing (for number arrays only)
   * @throws {AssertionValueNotAnArrayError} When one value isn't an array.
   * @throws {AssertionArrayLengthError} When the lengths aren't the same between the 2 arrays.
   * @throws {AssertionArraysNotEqualError} When one object isn't the same as the other object in the other array based on the primitive `===` comparer.
   */
  static assertIsArrayEqual<T = unknown>(actualValue: T[], expectedValue: T[], roundToPrecision?: number): void {
    // Redirect using a primitive comparer with optional rounding
    this.#assertIsArrayEqualComparer(actualValue, expectedValue, (value1: T, value2: T): boolean => {
      // Reuse assertIsEqual which already handles rounding logic
      try {
        this.assertIsEqual(value1, value2, roundToPrecision);
        return true;
      } catch {
        return false;
      }
    });

    // If we get here, arrays have equal primitive values and in the same order
    return;
  }

  /**
   * Asserts that calls `assertJsonObject` for each object of the first array against each object of the second array, in the same order.
   *
   * @param actualValue - The actual array being checked
   * @param expectedValue - The expected array to compare against
   * @throws {AssertionValueNotAnArrayError} When one value isn't an array.
   * @throws {AssertionArrayLengthError} When the lengths aren't the same between the 2 arrays.
   * @throws {AssertionArraysNotEqualError} When one object isn't the same as the other object in the other array based on the `assertJsonObject` comparer.
   * @throws {AssertionJSONObjectError} When one object isn't the same as the other object in the other array based on the `assertJsonObject` comparer.
   */
  static assertIsArrayEqualJsons<T = unknown>(actualValue: T[], expectedValue: T[]): void {
    // Redirect using a json comparer
    this.#assertIsArrayEqualComparer(actualValue, expectedValue, (value1: T, value2: T): boolean => {
      // Use complex assertJsonObject comparer
      // A 'AssertionJSONObjectError' is thrown if `assertJsonObject` is not equal which provides
      // useful information on the json object comparer error - use that exception instead of creating another one.
      this.assertJsonObject(value1, value2);
      return true;
    });

    // If we get here, arrays have equal json object assertions and in the same order
    return;
  }

  /**
   * Asserts that two arrays have equal values and in the same order (deep comparison).
   *
   * @param actualValue - The actual array being checked
   * @param expectedValue - The expected array to compare against
   * @throws {AssertionValueNotAnArrayError} When one value isn't an array.
   * @throws {AssertionArrayLengthError} When the lengths aren't the same between the 2 arrays.
   * @throws {AssertionArraysNotEqualError} When one object isn't the same as the other object in the other array based on the provided comparer mechanism.
   */
  static #assertIsArrayEqualComparer<T = unknown>(actualValue: T[], expectedValue: T[], comparer: ComparerDelegate<T>): void {
    // Check if both are arrays
    Test.assertIsArray(actualValue);
    Test.assertIsArray(expectedValue);

    // Check if lengths are equal
    if (actualValue.length !== expectedValue.length) {
      throw new AssertionArrayLengthError(actualValue.length, expectedValue.length);
    }

    // Compare each element in the same order
    for (let i = 0; i < actualValue.length; i++) {
      if (!comparer(actualValue[i], expectedValue[i])) {
        throw new AssertionArraysNotEqualError(actualValue, expectedValue, i, expectedValue[i], actualValue[i]);
      }
    }

    // If we get here, arrays are equal
    return;
  }

  // #endregion PUBLIC STATIC METHODS -  ARRAYS

  // #region PUBLIC STATIC METHODS -  JSON

  /**
   * Asserts that a JSON object has at least all the properties/values of the expected JSON object.
   *
   * @param actualObject - The JSON object to check
   * @param expectedObject - The JSON object to representing the properties/values the actual value should have
   * @throws {TestError} When the JSON object being verified is actually a Promise (likely a dev issue).
   * @throws {AssertionJSONObjectError} When the JSON object being verified is missing properties or has different values.
   */
  static assertJsonObject(actualObject: unknown, expectedObject: unknown): void {
    // If the object is a promise, throw error
    if (actualObject instanceof Promise)
      throw new TestError('The JSON object to verify is a promise, are you missing an await in your test process?');

    // Compare the 2 json objects
    const result = this.#jsonObjectIsAtLeast(actualObject as Record<string, unknown>, expectedObject as Record<string, unknown>);

    // If not good
    if (!result.ok) {
      // Throw an error if the JSON object does not contain at least all properties and matching values of the expected object
      throw new AssertionJSONObjectError(result.mismatches, actualObject, expectedObject);
    }
  }

  /**
   * Recursively checks that the `actual` object contains at least all properties and matching values
   * from the `expected` object. Supports deeply nested structures and arrays.
   *
   * @param actual - The object being validated
   * @param expected - The minimum required shape and values
   * @param basePath - Internal path tracker for nested mismatches (default: '')
   * @returns An object with:
   *   - `ok`: `true` if target meets/exceeds the reference
   *   - `mismatches`: a list of string paths where mismatches occurred
   * @example
   * const actual = { user: { name: "Alice", roles: ["admin", "editor"] } };
   * const expected = { user: { name: "Alice", roles: ["admin"] } };
   * Returns: { ok: true, mismatches: [] }
   *
   * const actual = { user: { name: "Bob", roles: ["editor"] } };
   * const expected = { user: { name: "Alice", roles: ["admin"] } };
   * Returns:
   * {
   *   ok: false,
   *   mismatches: [
   *     'user.name — actual: "Bob", expected: "Alice"',
   *     'user.roles[0] — actual: "editor", expected: "admin"'
   *   ]
   * }
   */
  static #jsonObjectIsAtLeast(actual: Record<string, unknown>, expected: Record<string, unknown>, basePath = ''): ObjectAssertionResult {
    // Array to collect all the paths where mismatches or missing data occur
    const mismatches: string[] = [];

    // Builds the current path string (e.g., "user.name" or "roles[0]")
    const currentPath = (key: string | number): string => (basePath ? `${basePath}.${key}` : `${key}`);

    // Handle primitive or null values: compare directly
    if (typeof expected !== 'object' || expected === null) {
      if (expected !== actual) {
        // Record mismatch at current path
        mismatches.push(`${basePath} — actual: ${JSON.stringify(actual)}, expected: ${JSON.stringify(expected)}`);
      }
      return {
        ok: mismatches.length === 0,
        mismatches,
      };
    }

    // Handle arrays: ensure each reference item is matched by at least one target item
    if (Array.isArray(expected)) {
      if (!Array.isArray(actual)) {
        // Target is not an array
        mismatches.push(`${basePath} — actual: ${typeof actual}, expected an array`);
        return {
          ok: false,
          mismatches,
        };
      }

      // Each expected item must be matched by at least one item in the actual array
      for (let i = 0; i < expected.length; i++) {
        const expectedItem = expected[i];

        let foundMatch = false;
        let failedMismatches: string[] = [];

        for (const actualItem of actual) {
          const result = this.#jsonObjectIsAtLeast(actualItem, expectedItem, `${basePath}[${i}]`);
          if (result.ok) {
            foundMatch = true;
            break;
          } else if (failedMismatches.length === 0) {
            // Save mismatches from the first failure to report if no match found
            failedMismatches = result.mismatches;
          }
        }

        if (!foundMatch) {
          // Keep next line in case we want it back..
          // mismatches.push(`${basePath}[${i}] — expected item not found: ${JSON.stringify(expectedItem)}`);
          mismatches.push(...failedMismatches);
        }
      }
      return {
        ok: mismatches.length === 0,
        mismatches,
      };
    }

    // At this point, both reference and target are plain objects
    if (typeof actual !== 'object' || actual === null || Array.isArray(actual)) {
      mismatches.push(`${basePath} — actual: ${JSON.stringify(actual)}, expected an object`);
      return { ok: false, mismatches };
    }

    // Recursively check each key in the reference object
    for (const key of Object.keys(expected)) {
      if (!(key in actual)) {
        mismatches.push(`${currentPath(key)} — missing key, expected: ${JSON.stringify(expected[key])}`);
      } else {
        const childResult = this.#jsonObjectIsAtLeast(
          actual[key] as Record<string, unknown>,
          expected[key] as Record<string, unknown>,
          currentPath(key)
        );
        mismatches.push(...childResult.mismatches);
      }
    }

    return {
      ok: mismatches.length === 0,
      mismatches,
    };
  }

  // #endregion PUBLIC STATIC METHODS -  JSON

  // #region PRIVATE STATIC METHODS

  /**
   * Rounds a number to the specified precision.
   *
   * @param value - The number to round
   * @param precision - The number of decimal places
   * @returns The rounded value
   */
  static #roundToPrecision(value: number, precision: number): number {
    const multiplier = Math.pow(10, precision);
    return Math.round(value * multiplier) / multiplier;
  }

  // #endregion PRIVATE STATIC METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitStatusChanged(event: StatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onStatusChangedHandlers, event);
  }

  /**
   * Registers a status changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onStatusChanged(callback: TestChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a status changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offStatusChanged(callback: TestChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onStatusChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitStepChanged(event: StepChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onStepChangedHandlers, event);
  }

  /**
   * Registers a step changed event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onStepChanged(callback: TestChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onStepChangedHandlers, callback);
  }

  /**
   * Unregisters a step changed event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offStepChanged(callback: TestChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onStepChangedHandlers, callback);
  }

  // #endregion EVENTS
}

/** Define a type for the result of a JSON object assertion check. */
export type ObjectAssertionResult = { ok: boolean; mismatches: string[] };

/** Define a base event for the delegates. */
export interface BaseTestChangedEvent {}

/** Define an event for the delegate. */
export interface StepChangedEvent extends BaseTestChangedEvent {
  step: string | undefined;
}

/** Define an event for the delegate. */
export interface StatusChangedEvent extends BaseTestChangedEvent {
  status: TestStatus;
}

/** Define a delegate for the event handler function signature. */
export type TestChangedDelegate = EventDelegateBase<Test, BaseTestChangedEvent, void>;

/** The test types. */
export type TestType = 'regular' | 'true-negative';

/** The test statuses. */
export type TestStatus = 'new' | 'running' | 'verifying' | 'success' | 'failed' | 'skipped';

/** A comparer delegate to compare 2 objects and determine if they are equal. */
export type ComparerDelegate<T> = (array1: T, array2: T) => boolean;

/** Represents the result of an equality comparison between two values. */
type EqualHelper<T> = { equal: boolean; actualValue: T; expectedValue: T };
