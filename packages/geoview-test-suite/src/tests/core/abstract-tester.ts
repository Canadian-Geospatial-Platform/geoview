import type { BaseTestChangedEvent, ClassType } from './test';
import type { EventDelegateBase } from 'geoview-core/api/events/event-helper';
import EventHelper from 'geoview-core/api/events/event-helper';
import { logger } from 'geoview-core/core/utils/logger';
import { Test } from './test';
import { formatError } from 'geoview-core/core/exceptions/core-exceptions';

/**
 * Abstract base class for creating custom testers with assertion and event capabilities.
 * Provides utility methods for running tests (sync or async), performing assertions,
 * and emitting test result events (success, failure, testing).
 * Extend this class to implement domain-specific test behaviors.
 */
export abstract class AbstractTester {
  /** Keep all callback delegate references */
  #onTestStartedHandlers: TestDelegate[] = [];

  /** Keep all callback delegate references */
  #onTestUpdatedHandlers: TestUpdatedDelegate[] = [];

  /** Keep all callback delegate references */
  #onSuccessHandlers: SuccessDelegate[] = [];

  /** Keep all callback delegate references */
  #onFailureHandlers: FailureDelegate[] = [];

  /** Keep all callback delegate references */
  #onDoneHandlers: TestDelegate[] = [];

  /** Keep all tests */
  #tests: Test[] = [];

  /** Keep the running tests */
  #testsRunning: Test[] = [];

  /** Keep the done tests */
  #testsDone: Test[] = [];

  /**
   * Constructs a Tester.
   */
  protected constructor(public name: string) {}

  /**
   * Gets the total number of tests.
   * @returns {number} The total number of tests.
   */
  getTestsTotal(): number {
    return this.#tests.length;
  }

  /**
   * Gets the total number of currently running tests.
   * @returns {number} The total number of tests.
   */
  getTestsRunning(): number {
    return this.#testsRunning.length;
  }

  /**
   * Gets the total number of currently done tests.
   * @returns {number} The total number of tests.
   */
  getTestsDone(): number {
    return this.#testsDone.length;
  }

  /**
   * Gets if all tests are done.
   * @returns {boolean} Indicate if the tests are all done.
   */
  getTestsDoneAll(): boolean {
    return this.getTestsDone() === this.getTestsTotal();
  }

  /**
   * Gets if all the tests are done and successfully.
   * @returns {boolean} Indicate if the tests are all done and finished successfully.
   */
  getTestsDoneAllSuccess(): boolean {
    return this.getTestsDoneAll() && this.#tests.every((test) => test.getStatus() === 'success');
  }

  /**
   * Resets all the tests
   */
  resetTests(): void {
    this.#tests = [];
    this.#testsRunning = [];
    this.#testsDone = [];
  }

  /**
   * Performs a test using the provided test callback and assertion callback.
   * @template T The type of the result produced by the test.
   * @param {string} message - A message describing the test.
   * @param {BaseTestDelegate<T>} callback - The function to execute to obtain a test result.
   * @param {BaseAssertionDelegate<T>} callbackAssert - The function to perform assertions on the result.
   * @param {BaseFinalizeDelegate<T>?} [callbackFinalize] - Optional function to finalize the test after completion.
   * @returns {Promise<TestResult<T>>} The result wrapped in an {@link TestResult} object.
   */
  test<T>(
    message: string,
    callback: BaseTestDelegate<T, T>,
    callbackAssert: BaseAssertionDelegate<T>,
    callbackFinalize?: BaseFinalizeDelegate<T>
  ): Promise<Test<T>> {
    // Redirect
    return this.#testPerformTest(message, callback, callbackAssert, callbackFinalize);
  }

  testError<T extends Error>(
    message: string,
    errorClass: ClassType<T>,
    callback: BaseTestDelegate<T, void>,
    callbackAssert?: BaseAssertionDelegate<T>,
    callbackFinalize?: BaseFinalizeDelegate<T>
  ): Promise<Test<T>> {
    // Redirect
    return this.#testPerformTestError(message, errorClass, callback, callbackAssert, callbackFinalize);
  }

  // #region PROTECTED

  /**
   * Overridable function called when a test is being created for execution.
   * @returns {Test} test - The test about to be performed.
   * @protected
   */
  protected onCreatingTest<T>(message: string): Test<T> {
    // Create the test
    const test = new Test<T>(message);

    // Hook on step changed
    test.onStepChanged(this.#handleTestStepChanged.bind(this));

    // Return the test
    return test;
  }

  /**
   * Overridable function called before any test is executed.
   * @param {Test} test - The test about to be performed.
   * @protected
   */
  protected onPerformingTest(test: Test): void {
    // Log
    logger.logDebug(`Testing ${test.getTitle()}...`);

    // Add the test to the list
    this.#tests.push(test);

    // Add the test to the running list
    this.#addTestRunning(test);

    // Update the status and step
    test.setStatus('running');
    test.addStep('Running test...', 'major');

    // Emit
    this.#emitStarted({ test });
  }

  /**
   * Overridable function called before any test assertion verification is executed.
   * @param {Test} test - The test about to be assertion verified.
   * @protected
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onPerformingTestAssertions(test: Test): void {
    // Update the status and step
    test.setStatus('verifying');
    test.addStep('Verifying assertions...', 'major');

    // TODO: Emit something?
    // this.#emitTesting({ test });
  }

  /**
   * Emits a test updated event.
   * @param {Test} test - The test which updated.
   * @param {BaseTestChangedEvent} event - The event causing the update.
   * @protected
   */
  protected onPerformingTestStepChanged(test: Test, event: BaseTestChangedEvent): void {
    // Emit
    this.#emitStepChanged({ test, event });
  }

  /**
   * Emits a success event.
   * @param {Test} test - The test which succeeded.
   * @param {T} result - The assertion result.
   * @protected
   */
  protected onPerformingTestSuccess<T>(test: Test<T>, result: T): void {
    // Update the step - clearing it
    test.setStatus('success');

    // Emit
    this.#emitSuccess({ test, result });
  }

  /**
   * Emits a failure event with a normalized error object.
   * @param {Test} test - The test which failed.
   * @param {unknown} error - The thrown error from the assertion or test logic.
   * @param {boolean} duringFinalization - Indicates if the failure happened during finalization or during the Test regular processing.
   * @protected
   */
  protected onPerformingTestFailure<T>(test: Test<T>, error: unknown, duringFinalization: boolean): void {
    // The original status
    const originalStatus = test.getStatus();

    // Marshall the error
    const normalizedError = error instanceof Error ? error : new Error(String(error));

    // Set status to failed
    test.setStatus('failed');

    // Determine whether to override the error and emit
    // This makes sure we don't override with the finalization error as the original error is more important.
    const shouldSetError = !duringFinalization || originalStatus !== 'failed';

    // If setting the error
    if (shouldSetError) {
      // Set the error
      test.setError(normalizedError);
      // Emit
      this.#emitFailure({ test, error: normalizedError });
    }
  }

  /**
   * Emits a finalize event.
   * @param {Test} test - The test which is finalizing.
   * @protected
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onPerformingTestFinalization<T>(test: Test<T>, callback?: BaseFinalizeDelegate<T>): void {
    // If we do have a callback for finalization
    if (callback) {
      // Add done step
      test.addStep('Cleaning up...', 'major');
    }
  }

  /**
   * Emits a done event.
   * @param {Test} test - The test which is finalizing.
   * @protected
   */
  protected onPerformingTestDone<T>(test: Test<T>): void {
    // Move the test from the running list and add it to the done list
    this.#moveTestFromRunningToDone(test);

    // Add done step
    test.addStep('Done', 'major', test.getStatus() === 'success' ? 'green' : 'red');

    // Emit
    this.#emitDone({ test });
  }

  // #endregion PROTECTED

  // #region PRIVATE

  /**
   * Executes the full lifecycle of a test, including setup, execution, assertion, success/failure handling, and optional finalization.
   * The lifecycle consists of:
   * - Creating a new test instance
   * - Executing the core test logic via a callback
   * - Storing the result in the test
   * - Running assertions on the result
   * - Handling success or failure states
   * - Optionally finalizing the test (e.g., cleanup or logging)
   * @template T - The type of the result returned by the test.
   * @param {string} message - A human-readable description of the test.
   * @param {BaseTestDelegate<T>} callback - Function that performs the main test logic and returns the result.
   * @param {BaseAssertionDelegate<T>} callbackAssert - Function that asserts the correctness of the test result.
   * @param {BaseFinalizeDelegate<T>} [callbackFinalize] - Optional finalization callback, called after the test completes (regardless of success or failure).
   * @returns {Promise<Test<T>>} A promise that resolves to the fully populated {@link Test} object.
   * @private
   */
  async #testPerformTest<T>(
    message: string,
    callback: BaseTestDelegate<T, T>,
    callbackAssert: BaseAssertionDelegate<T>,
    callbackFinalize?: BaseFinalizeDelegate<T>
  ): Promise<Test<T>> {
    // Create the test
    const test = this.onCreatingTest<T>(message);

    try {
      // Testing
      this.onPerformingTest(test);

      // Start the test and await
      const result = await callback(test);

      // Assign it to the current test
      test.setResult(result);

      // Checking assertions
      this.onPerformingTestAssertions(test);

      // Callback with the result to verify using an assertion check
      await callbackAssert(test, result);

      // All good
      this.onPerformingTestSuccess(test, result);
    } catch (error: unknown) {
      // The execution of the test has failed
      this.onPerformingTestFailure(test, error, false);
    }

    try {
      // Finalizing
      this.onPerformingTestFinalization(test, callbackFinalize);

      // Possibly callback for more
      await callbackFinalize?.(test);
    } catch (error: unknown) {
      // The execution of the test has failed during finalization
      this.onPerformingTestFailure(test, error, true);
    }

    // Done
    this.onPerformingTestDone(test);

    // Return the test
    return test;
  }

  /**
   * Executes the full lifecycle of a test when testing for an Error to be thrown, including setup, execution, assertion, success/failure handling, and optional finalization.
   * The lifecycle consists of:
   * - Creating a new test instance
   * - Executing the core test logic via a callback, expecting an error to be thrown
   * - Storing the result in the test
   * - Optionally running additional assertions on the result
   * - Handling success or failure states
   * - Optionally finalizing the test (e.g., cleanup or logging)
   * @template T - The type of the result returned by the test.
   * @param {string} message - A human-readable description of the test.
   * @param {BaseTestDelegate<T>} callback - Function that performs the main test logic and is supposed to throw an Error.
   * @param {BaseAssertionDelegate<T>} callbackAssert - Function that asserts the correctness of the test result.
   * @param {BaseFinalizeDelegate<T>} [callbackFinalize] - Optional finalization callback, called after the test completes (regardless of success or failure).
   * @returns {Promise<Test<T>>} A promise that resolves to the fully populated {@link Test} object.
   * @private
   */
  async #testPerformTestError<T extends Error>(
    message: string,
    errorClass: ClassType<T>,
    callback: BaseTestDelegate<T, void>,
    callbackAssert?: BaseAssertionDelegate<T>,
    callbackFinalize?: BaseFinalizeDelegate<T>
  ): Promise<Test<T>> {
    // Create the test
    const test = this.onCreatingTest<T>(message);

    // Set the type to a true-negative, because we're testing for an Error.
    test.setType('true-negative');

    try {
      // Testing
      this.onPerformingTest(test);

      // Start the test and expect it to fail
      let result: Error | undefined = undefined;
      try {
        await callback(test);
      } catch (error: unknown) {
        // An error happened, as expected
        result = formatError(error);

        // Check if the right type
        // Assign it to the current test
        test.setResult(result as T);
      }

      // Checking assertions
      this.onPerformingTestAssertions(test);

      // Creating the configuration
      test.addStep(`Verifying the Error obtained is '${errorClass.name}'...`);

      // Check if the result is instance of the error we're testing for
      Test.assertIsErrorInstance(result as T, errorClass);

      // Callback with the result to verify using an assertion check
      await callbackAssert?.(test, result as T);

      // All good
      this.onPerformingTestSuccess(test, result);
    } catch (error: unknown) {
      // The execution of the test has failed
      this.onPerformingTestFailure(test, error, false);
    }

    try {
      // Finalizing
      this.onPerformingTestFinalization(test, callbackFinalize);

      // Possibly callback for more
      await callbackFinalize?.(test);
    } catch (error: unknown) {
      // The execution of the test has failed during finalization
      this.onPerformingTestFailure(test, error, true);
    }

    // Done
    this.onPerformingTestDone(test);

    // Return the test
    return test;
  }

  /**
   * Adds a test to the list of currently running tests.
   * @param {Test} test - The test instance to add to the running list.
   */
  #addTestRunning(test: Test): void {
    this.#testsRunning.push(test);
  }

  /**
   * Moves a test from the list of running tests to the list of completed tests.
   * This method removes the specified test from the `#testsRunning` list (if found by ID)
   * and appends it to the `#testsDone` list.
   * @param {Test} test - The test instance to move.
   */
  #moveTestFromRunningToDone(test: Test): void {
    // Find it
    const index = this.#testsRunning.findIndex((t) => t.id === test.id);
    if (index !== -1) {
      this.#testsRunning.splice(index, 1);
    }

    // Add to done
    this.#testsDone.push(test);
  }

  /**
   * Handles updates to a test by invoking the relevant change handler.
   * @param {Test} sender - The test instance that triggered the change.
   * @param {BaseTestChangedEvent} event - The event details describing the change.
   */
  #handleTestStepChanged(sender: Test, event: BaseTestChangedEvent): void {
    // Performing test has been updated
    this.onPerformingTestStepChanged(sender, event);
  }

  // #endregion

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {TestEvent} event - The event to emit
   * @private
   */
  #emitStarted(event: TestEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestStartedHandlers, event);
  }

  /**
   * Registers a test started event handler.
   * @param {TestDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onStarted(callback: TestDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestStartedHandlers, callback);
  }

  /**
   * Unregisters a test started event handler.
   * @param {TestDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offStarted(callback: TestDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestStartedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {TestUpdatedEvent} event - The event to emit
   * @private
   */
  #emitStepChanged(event: TestUpdatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestUpdatedHandlers, event);
  }

  /**
   * Registers a step updated event handler.
   * @param {TestUpdatedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onStepUpdated(callback: TestUpdatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestUpdatedHandlers, callback);
  }

  /**
   * Unregisters a step updated event handler.
   * @param {TestUpdatedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offStepUpdated(callback: TestUpdatedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestUpdatedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {SuccessEvent} event - The event to emit
   * @private
   */
  #emitSuccess(event: SuccessEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onSuccessHandlers, event);
  }

  /**
   * Registers a success event handler.
   * @param {SuccessDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onSuccess(callback: SuccessDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onSuccessHandlers, callback);
  }

  /**
   * Unregisters a success event handler.
   * @param {SuccessDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offSuccess(callback: SuccessDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onSuccessHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {FailureEvent} event - The event to emit
   * @private
   */
  #emitFailure(event: FailureEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onFailureHandlers, event);
  }

  /**
   * Registers a failure event handler.
   * @param {FailureDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onFailure(callback: FailureDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onFailureHandlers, callback);
  }

  /**
   * Unregisters a failure event handler.
   * @param {FailureDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offFailure(callback: FailureDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onFailureHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {TestEvent} event - The event to emit
   * @private
   */
  #emitDone(event: TestEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onDoneHandlers, event);
  }

  /**
   * Registers a done event handler.
   * @param {TestDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onDone(callback: TestDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onDoneHandlers, callback);
  }

  /**
   * Unregisters a done event handler.
   * @param {TestDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offDone(callback: TestDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onDoneHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Define a delegate for the event handler function signature
 */
export type BaseTestDelegate<T = unknown, U = unknown> = (test: Test<T>) => U | Promise<U>;

/**
 * Define a delegate for the event handler function signature
 */
export type BaseAssertionDelegate<T = unknown> = (test: Test<T>, result: T) => void | Promise<void>;

/**
 * Define a delegate for the event handler function signature
 */
export type BaseFinalizeDelegate<T = unknown> = (test: Test<T>) => void | Promise<void>;

/**
 * Define an event for the delegate
 */
export interface TestEvent {
  test: Test;
}

/**
 * Define a delegate for the event handler function signature
 */
export type TestDelegate = EventDelegateBase<AbstractTester, TestEvent, void>;

/**
 * Define an event for the delegate
 */
export interface TestUpdatedEvent<T = BaseTestChangedEvent> {
  test: Test;
  event: T;
}

/**
 * Define a delegate for the event handler function signature
 */
export type TestUpdatedDelegate = EventDelegateBase<AbstractTester, TestUpdatedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface SuccessEvent<T = unknown> {
  test: Test;
  result: T;
}

/**
 * Define a delegate for the event handler function signature
 */
export type SuccessDelegate = EventDelegateBase<AbstractTester, SuccessEvent, void>;

/**
 * Define an event for the delegate
 */
export interface FailureEvent {
  test: Test;
  error: unknown;
}

/**
 * Define a delegate for the event handler function signature
 */
export type FailureDelegate = EventDelegateBase<AbstractTester, FailureEvent, void>;
