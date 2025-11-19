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
} from './exceptions';
import type { TestStepLevel } from './test-step';
import { TestStep } from './test-step';
import type { EventDelegateBase } from 'geoview-core/api/events/event-helper';
import EventHelper from 'geoview-core/api/events/event-helper';
import { generateId } from 'geoview-core/core/utils/utilities';

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

  /** The error which occurred during the test if any. */
  #error?: Error;

  /** Keep all callback delegate references */
  #onStatusChangedHandlers: TestChangedDelegate[] = [];

  /** Keep all callback delegate references */
  #onStepChangedHandlers: TestChangedDelegate[] = [];

  /**
   * Constructs an {@link Test} instance.
   * @param message - A message describing the test.
   */
  constructor(title: string) {
    this.id = generateId();
    this.#title = title;
  }

  /**
   * Gets the current title.
   * @returns {string} The title.
   */
  getTitle(): string {
    return this.#title;
  }

  /**
   * Sets the title.
   * @param {string} title - The title to set.
   */
  setTitle(title: string): void {
    this.#title = title;
  }

  /**
   * Gets the current title.
   * @returns {TestType} The title.
   */
  getType(): TestType {
    return this.#type;
  }

  /**
   * Sets the title.
   * @param {TestType} type - The type to set.
   */
  setType(type: TestType): void {
    this.#type = type;
  }

  /**
   * Gets the current status of the test.
   * @returns {string | undefined} The current step, or undefined if none is set.
   */
  getStatus(): TestStatus {
    return this.#status;
  }

  /**
   * Sets the current status of the test.
   * @param {TestStatus} status - The status value to set.
   */
  setStatus(status: TestStatus): void {
    this.#status = status;
    this.#emitStatusChanged({ status });
  }

  /**
   * Gets the step processed so far.
   * @returns {TestStep[]} The steps processed so far.
   */
  getSteps(): TestStep[] {
    return this.#steps;
  }

  /**
   * Gets the steps formatted in html <ul> list.
   * @returns {string} The steps formatted in html string.
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
   * @param {string} step - The step value to add.
   * @param {TypeStepLevel} level - The step level.
   * @param {string} color - The step color for display purposes.
   */
  addStep(step: string, level: TestStepLevel = 'regular', color: string = 'black'): void {
    this.#steps.push(new TestStep(step, level, color));
    this.#emitStepChanged({ step });
  }

  /**
   * Gets the assertion result associated with this instance.
   * @returns {T | undefined} The assertion result, or undefined if not set.
   */
  getResult(): T | undefined {
    return this.#result;
  }

  /**
   * Sets the assertion result for this instance.
   * @param {T} result - The result to associate.
   */
  setResult(result: T): void {
    this.#result = result;
  }

  /**
   * Gets the error which occurred during the test.
   * @returns {Error | undefined} The error if any.
   */
  getError(): Error | undefined {
    return this.#error;
  }

  /**
   * Sets the error which occurred during the test..
   * @param {Error} error - The error.
   */
  setError(error: Error): void {
    this.#error = error;
  }

  // #region STATIC

  /**
   * Asserts that two values are strictly equal (`===`).
   * @param {T} actualValue - The actual value being checked.
   * @param {T} expectedValue - The expected value to compare against.
   * @throws {AssertionError} If the values are not strictly equal.
   * @static
   */
  static assertIsEqual<T = unknown>(actualValue: T, expectedValue: T): asserts actualValue is T {
    // Checks if the result value is the same as the value provided
    if (actualValue === expectedValue) return;

    // Throw
    throw new AssertionValueError(actualValue, expectedValue);
  }

  /**
   * Asserts that two arrays have equal values and in the same order (deep comparison).
   * @param {T[]} actualValue - The actual array being checked.
   * @param {T[]} expectedValue - The expected array to compare against.
   * @throws {AssertionError} If the arrays are not equal.
   * @static
   */
  static assertIsArrayEqual<T = unknown>(actualValue: T[], expectedValue: T[]): void {
    // Check if both are arrays
    if (!Array.isArray(actualValue)) {
      throw new AssertionValueNotAnArrayError(actualValue);
    }
    if (!Array.isArray(expectedValue)) {
      throw new AssertionValueNotAnArrayError(expectedValue);
    }

    // Check if lengths are equal
    if (actualValue.length !== expectedValue.length) {
      throw new AssertionArrayLengthError(actualValue.length, expectedValue.length);
    }

    // Compare each element
    for (let i = 0; i < actualValue.length; i++) {
      if (actualValue[i] !== expectedValue[i]) {
        throw new AssertionArraysNotEqualError(actualValue, expectedValue, i, expectedValue[i], actualValue[i]);
      }
    }

    // If we get here, arrays are equal
    return;
  }

  /**
   * Asserts that a value is defined.
   * @param {string} propertyPath - The name or path of the array being validated.
   * @param {T | undefined} actualValue - The actual value being checked.
   * @throws {AssertionUndefinedError} If the value isn't defined.
   * @static
   */
  static assertIsDefined<T = unknown>(propertyPath: string, actualValue: T | undefined): void {
    // Checks if the value is defined
    if (actualValue !== undefined && actualValue !== null) return;

    // Throw
    throw new AssertionUndefinedError(propertyPath);
  }

  /**
   * Asserts that a value is undefined.
   * @param {string} propertyPath - The name or path of the array being validated.
   * @param {T | undefined} actualValue - The actual value being checked.
   * @throws {AssertionUndefinedError} If the value isn't defined.
   * @static
   */
  static assertIsUndefined<T = unknown>(propertyPath: string, actualValue: T | undefined): void {
    // Checks if the value is defined
    if (actualValue === undefined || actualValue === null) return;

    // Throw
    throw new AssertionDefinedError(propertyPath, actualValue);
  }

  /**
   * Asserts that a value is of the correct instance type.
   * @param {unknown} actualValue - The actual value being checked.
   * @param {Type<T>} expectedType - The expected class type.
   * @throws {AssertionWrongInstanceError} If the value isn't defined.
   * @static
   */
  static assertIsInstance<T>(actualValue: unknown, expectedType: ClassType<T>): asserts actualValue is T {
    // Checks if the value is defined, first
    Test.assertIsDefined('Object instance', actualValue);

    // Checks if the value is of the expected instance type
    if (actualValue instanceof expectedType) return;

    // Throw
    throw new AssertionWrongInstanceError(actualValue, expectedType);
  }

  /**
   * Asserts that a value is of the correct instance type.
   * @param {T} actualError - The actual error being checked.
   * @param {Type<T>} expectedType - The expected class type.
   * @throws {AssertionWrongInstanceError} If the value isn't defined.
   * @static
   */
  static assertIsErrorInstance<T extends Error>(actualError: T, expectedType: ClassType<T>): asserts actualError is T {
    // Checks if the value is defined, first
    if (!actualError) throw new AssertionNoErrorThrownError(expectedType);

    // Checks if the value is of the expected instance type
    if (actualError instanceof expectedType) return;

    // Throw
    throw new AssertionWrongErrorInstanceError(actualError, expectedType);
  }

  /**
   * Asserts that a length of a given array is equal to the expected length.
   * @param {unknown[] | undefined} array - The array to check the length.
   * @param {number} expectedValue - The expected length of the array.
   * @throws {AssertionArrayLengthError} If the values are not strictly equal.
   * @static
   */
  static assertIsArrayLengthEqual(array: unknown[] | undefined, expectedValue: number): void {
    if (array?.length === expectedValue) return;

    // Throw
    throw new AssertionArrayLengthError(array?.length, expectedValue);
  }

  /**
   * Asserts that a length of a given array is equal to the expected length.
   * @param {unknown[] | undefined} array - The array to check the length.
   * @param {number} expectedMinimumLength - The expected minimum length of the array.
   * @throws {AssertionArrayLengthMinimalError} If the values are not strictly equal.
   * @static
   */
  static assertIsArrayLengthMinimal(array: unknown[] | undefined, expectedMinimumLength: number): void {
    if (array?.length ?? 0 >= expectedMinimumLength) return;

    // Throw
    throw new AssertionArrayLengthMinimalError(array?.length ?? 0, expectedMinimumLength);
  }

  /**
   * Asserts that the given array includes the expected value.
   * @template T - The type of the elements in the array.
   * @param {T[]} array - The array to search.
   * @param {T} expectedValue - The value expected to be included in the array.
   * @throws {AssertionArrayNotIncludingError} Throws if the expected value is not found in the array.
   */
  static assertArrayIncludes<T = unknown>(array: T[], expectedValue: T): void {
    if (array.includes(expectedValue)) return;

    // Throw
    throw new AssertionArrayIncludingError(array, expectedValue);
  }

  /**
   * Asserts that the given array excludes a particular value.
   * @template T - The type of the elements in the array.
   * @param {T[]} array - The array to search.
   * @param {T} expectedValue - The value expected to be included in the array.
   * @throws {AssertionArrayNotIncludingError} Throws if the expected value is not found in the array.
   */
  static assertArrayExcludes<T = unknown>(array: T[], expectedValue: T): void {
    if (!array.includes(expectedValue)) return;

    // Throw
    throw new AssertionArrayExcludingError(array, expectedValue);
  }

  /**
   * Asserts that a JSON object has at least all the properties/values of the expected JSON object.
   * @param {unknown} actualObject - The JSON object to check.
   * @param {unknown} expectedObject - The JSON object to representing the properties/values the actual value should have.
   * @throws {TestError} If the JSON object being verified is actually a Promise (likely a dev issue).
   * @throws {AssertionJSONObjectError} If the JSON object being verified is missing properties or has different values.
   * @static
   */
  static assertJsonObject(actualObject: unknown, expectedObject: unknown): void {
    // If the object is a promise, throw error
    if (actualObject instanceof Promise)
      throw new TestError('The JSON object to verify is a promise, are you missing an await in your test process?');

    // Compare the 2 json objects
    const result = this.#jsonObjectIsAtLeast(actualObject as Record<string, unknown>, expectedObject as Record<string, unknown>);

    // If not good
    if (!result.ok) {
      // Throw
      throw new AssertionJSONObjectError(result.mismatches, actualObject, expectedObject);
    }
  }

  /**
   * Recursively checks that the `actual` object contains at least all properties and matching values
   * from the `expected` object. Supports deeply nested structures and arrays.
   * @param {Record<string, unknown>} actual - The object being validated.
   * @param {Record<string, unknown>} expected - The minimum required shape and values.
   * @param {string} basePath - Internal path tracker for nested mismatches (default: '').
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
   * @private
   * @static
   */
  static #jsonObjectIsAtLeast(
    actual: Record<string, unknown>,
    expected: Record<string, unknown>,
    basePath: string = ''
  ): ObjectAssertionResult {
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

  // #endregion

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {StatusChangedEvent} event - The event to emit
   * @private
   */
  #emitStatusChanged(event: StatusChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onStatusChangedHandlers, event);
  }

  /**
   * Registers a success event handler.
   * @param {TestChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onStatusChanged(callback: TestChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onStatusChangedHandlers, callback);
  }

  /**
   * Unregisters a success event handler.
   * @param {TestChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offStatusChanged(callback: TestChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onStatusChangedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {StepChangedEvent} event - The event to emit
   * @private
   */
  #emitStepChanged(event: StepChangedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onStepChangedHandlers, event);
  }

  /**
   * Registers a success event handler.
   * @param {TestChangedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onStepChanged(callback: TestChangedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onStepChangedHandlers, callback);
  }

  /**
   * Unregisters a success event handler.
   * @param {TestChangedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offStepChanged(callback: TestChangedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onStepChangedHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Represents a constructor type that returns an instance of `T`.
 * This is useful when you need to pass around classes (constructors) generically,
 * such as for type assertions, factories, dependency injection, or reflection.
 * @template T - The type of the instance the constructor produces.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type ClassType<T = unknown> = new (...args: any[]) => T;

/**
 * Define a type for the result of a JSON object assertion check
 */
export type ObjectAssertionResult = { ok: boolean; mismatches: string[] };

/**
 * Define a base event for the delegates
 */
export interface BaseTestChangedEvent {}

/**
 * Define an event for the delegate
 */
export interface StepChangedEvent extends BaseTestChangedEvent {
  step: string | undefined;
}

/**
 * Define an event for the delegate
 */
export interface StatusChangedEvent extends BaseTestChangedEvent {
  status: TestStatus;
}

/**
 * Define a delegate for the event handler function signature
 */
export type TestChangedDelegate = EventDelegateBase<Test, BaseTestChangedEvent, void>;

/**
 * The test types
 */
export type TestType = 'regular' | 'true-negative';

/**
 * The test statuses
 */
export type TestStatus = 'new' | 'running' | 'verifying' | 'success' | 'failed';
