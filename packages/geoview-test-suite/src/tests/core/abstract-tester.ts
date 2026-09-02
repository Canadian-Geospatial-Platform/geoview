import type { BaseTestChangedEvent } from './test';
import type { ClassType } from 'geoview-core/core/types/global-types';
import type { EventDelegateBase } from 'geoview-core/api/events/event-helper';
import EventHelper from 'geoview-core/api/events/event-helper';
import { logger } from 'geoview-core/core/utils/logger';
import { formatError } from 'geoview-core/core/exceptions/core-exceptions';
import { delay, whenThisThen } from 'geoview-core/core/utils/utilities';
import { Test } from './test';
import { TestSkippedError } from './exceptions';

/**
 * Abstract base class for creating custom testers with assertion and event capabilities.
 * Provides utility methods for running tests (sync or async), performing assertions,
 * and emitting test result events (success, failure, testing).
 * Extend this class to implement domain-specific test behaviors.
 */
export abstract class AbstractTester {
  /** Callback delegates for the test started event */
  #onTestStartedHandlers: TestDelegate[] = [];

  /** Callback delegates for the test updated event */
  #onTestUpdatedHandlers: TestUpdatedDelegate[] = [];

  /** Callback delegates for the test success event */
  #onSuccessHandlers: SuccessDelegate[] = [];

  /** Callback delegates for the test failure event */
  #onFailureHandlers: FailureDelegate[] = [];

  /** Callback delegates for the test skipped event */
  #onSkippedHandlers: SkippedDelegate[] = [];

  /** Callback delegates for the test done event */
  #onDoneHandlers: TestDelegate[] = [];

  /** All registered tests */
  #tests: Test[] = [];

  /** Currently running tests */
  #testsRunning: Test[] = [];

  /** Completed tests */
  #testsDone: Test[] = [];

  /**
   * Mustoverride function to provide a name for the Tester.
   */
  abstract getName(): string;

  /**
   * Gets the total number of tests.
   *
   * @returns The total number of tests
   */
  getTestsTotal(): number {
    return this.#tests.length;
  }

  /**
   * Gets the total number of currently running tests.
   *
   * @returns The total number of tests
   */
  getTestsRunning(): number {
    return this.#testsRunning.length;
  }

  /**
   * Gets the total number of currently done tests.
   *
   * @returns The total number of tests
   */
  getTestsDone(): number {
    return this.#testsDone.length;
  }

  /**
   * Gets the total number of currently done successful tests which were successful.
   *
   * @returns The total number of tests
   */
  getTestsDoneSuccess(): number {
    return this.#testsDone.filter((test) => test.getStatus() === 'success').length;
  }

  /**
   * Gets the total number of currently done skipped tests.
   *
   * @returns The total number of tests
   */
  getTestsDoneSkipped(): number {
    return this.#testsDone.filter((test) => test.getStatus() === 'skipped').length;
  }

  /**
   * Gets the total number of currently done failed tests.
   *
   * @returns The total number of tests
   */
  getTestsDoneFailed(): number {
    return this.getTestsDone() - this.getTestsDoneSuccess() - this.getTestsDoneSkipped();
  }

  /**
   * Gets if all tests are done.
   *
   * @returns Indicate if the tests are all done
   */
  getTestsDoneAll(): boolean {
    return this.getTestsDone() === this.getTestsTotal();
  }

  /**
   * Gets if all the tests are done and successfully or skipped.
   *
   * @returns Indicate if the tests are all done and finished successfully
   */
  getTestsDoneAllSuccess(): boolean {
    return this.getTestsDoneAll() && this.#tests.every((test) => test.getStatus() === 'success' || test.getStatus() === 'skipped');
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
   *
   * @template T The type of the result produced by the test.
   * @param title - A title describing the test
   * @param callback - The function to execute to obtain a test result
   * @param callbackAssert - The function to perform assertions on the result
   * @param [callbackFinalize] - Optional function to finalize the test after completion
   * @returns A promise that resolves to the {@link Test} result object
   */
  test<T>(
    title: string,
    callback: BaseTestDelegate<T, T>,
    callbackAssert: BaseAssertionDelegate<T>,
    callbackFinalize?: BaseFinalizeDelegate<T>
  ): Promise<Test<T>> {
    // Redirect
    return this.#testPerformTest(title, callback, callbackAssert, callbackFinalize);
  }

  /**
   * Performs a test which is supposed to throw an error (a true negative) using the provided test callback and assertion callback.
   *
   * @template T The expected error that the test should throw.
   * @param title - A title describing the test
   * @param errorClass - The expected error class that the test should throw
   * @param callback - The function to execute which should be throwing an error
   * @param [callbackAssert] - Optional function to perform assertions on the result
   * @param [callbackFinalize] - Optional function to finalize the test after completion
   * @returns A promise that resolves to the {@link Test} result object
   */
  testError<T extends Error>(
    title: string,
    errorClass: ClassType<T>,
    callback: BaseTestDelegate<T, void>,
    callbackAssert?: BaseAssertionDelegate<T>,
    callbackFinalize?: BaseFinalizeDelegate<T>
  ): Promise<Test<T>> {
    // Redirect
    return this.#testPerformTestError(title, errorClass, callback, callbackAssert, callbackFinalize);
  }

  // #region PROTECTED

  /**
   * Overridable function called when a test is being created for execution.
   *
   * @param title - A title describing the test
   * @returns The test about to be performed
   */
  protected onCreatingTest<T>(title: string): Test<T> {
    // Create the test
    const test = new Test<T>(title);

    // Hook on step changed
    test.onStepChanged(this.#handleTestStepChanged.bind(this));

    // Return the test
    return test;
  }

  /**
   * Overridable function called before any test is executed.
   *
   * @param test - The test about to be performed
   */
  protected onPerformingTest(test: Test): void {
    // Log
    logger.logDebug(`Testing ${test.getTitle()}...`);

    // Add the test to the list
    this.#tests.push(test);

    // Add the test to the running list
    this.#addTestRunning(test);

    // Update the status and step
    test.setTimeStart(new Date());
    test.setStatus('running');
    test.addStep('Running test...', 'major');

    // Emit
    this.#emitStarted({ test });
  }

  /**
   * Overridable function called before any test assertion verification is executed.
   *
   * @param test - The test about to be assertion verified
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onPerformingTestAssertions(test: Test): void {
    // Update the status and step
    test.setStatus('verifying');
    test.addStep('Verifying assertions...', 'major');

    // Emit something?
    // this.#emitTesting({ test });
  }

  /**
   * Emits a test updated event.
   *
   * @param test - The test which updated
   * @param event - The event causing the update
   */
  protected onPerformingTestStepChanged(test: Test, event: BaseTestChangedEvent): void {
    // Emit
    this.#emitStepChanged({ test, event });
  }

  /**
   * Emits a success event.
   *
   * @param test - The test which succeeded
   * @param result - The assertion result
   */
  protected onPerformingTestSuccess<T>(test: Test<T>, result: T): void {
    // Update the step - clearing it
    test.setStatus('success');

    // Emit
    this.#emitSuccess({ test, result });
  }

  /**
   * Emits a failure event with a normalized error object.
   *
   * @param test - The test which failed
   * @param error - The thrown error from the assertion or test logic
   * @param duringFinalization - Indicates if the failure happened during finalization or during the Test regular processing
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
   * Marks a test as skipped and emits the skipped event.
   *
   * @param test - The test being skipped
   * @param reason - The reason the test was skipped
   */
  protected onPerformingTestSkipped<T>(test: Test<T>, reason: string): void {
    // Set status to skipped
    test.setSkippedReason(reason);
    test.setStatus('skipped');

    // Emit
    this.#emitSkipped({ test, reason });
  }

  /**
   * Handles finalization of a test.
   *
   * @param test - The test which is finalizing
   * @param callback - Optional finalization callback
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
   * Handles test completion and emits a done event.
   *
   * @param test - The test which has completed
   */
  protected onPerformingTestDone<T>(test: Test<T>): void {
    // Move the test from the running list and add it to the done list
    this.#moveTestFromRunningToDone(test);

    // Determine the color based on status
    const status = test.getStatus();
    let color = 'red';
    if (status === 'success') color = 'green';
    else if (status === 'skipped') color = 'orange';

    // Add done step
    test.setTimeEnd(new Date());
    test.addStep('Done', 'major', color);

    // Emit
    this.#emitDone({ test });
  }

  // #endregion PROTECTED

  // #region PRIVATE

  /**
   * Executes the full lifecycle of a test, including setup, execution, assertion, success/failure handling, and optional finalization.
   *
   * The lifecycle consists of:
   * - Creating a new test instance
   * - Executing the core test logic via a callback
   * - Storing the result in the test
   * - Running assertions on the result
   * - Handling success or failure states
   * - Optionally finalizing the test (e.g., cleanup or logging)
   *
   * @template T - The type of the result returned by the test.
   * @param title - The title of the test
   * @param callback - Function that performs the main test logic and returns the result
   * @param callbackAssert - Function that asserts the correctness of the test result
   * @param [callbackFinalize] - Optional finalization callback, called after the test completes (regardless of success or failure)
   * @returns A promise that resolves to the fully populated {@link Test} object
   */
  async #testPerformTest<T>(
    title: string,
    callback: BaseTestDelegate<T, T>,
    callbackAssert: BaseAssertionDelegate<T>,
    callbackFinalize?: BaseFinalizeDelegate<T>
  ): Promise<Test<T>> {
    // Create the test
    const test = this.onCreatingTest<T>(title);

    try {
      // Testing
      this.onPerformingTest(test);

      // Start event loop starvation monitor
      test.startEventLoopMonitor();

      // Start the test and await
      test.setTimeStartTest(new Date());
      const result = await callback(test);
      test.setTimeEndTest(new Date());

      // Assign it to the current test
      test.setResult(result);

      // Checking assertions
      this.onPerformingTestAssertions(test);

      // Callback with the result to verify using an assertion check
      test.setTimeStartAssert(new Date());
      await callbackAssert(test, result);
      test.setTimeEndAssert(new Date());

      // All good
      this.onPerformingTestSuccess(test, result);
    } catch (error: unknown) {
      // If the test was skipped via TestSkippedError
      if (error instanceof TestSkippedError) {
        // Skipped
        test.addStep(`Test skipped: ${error.message}`);
        this.onPerformingTestSkipped(test, error.message);
      } else {
        // The execution of the test has failed
        this.onPerformingTestFailure(test, error, false);
      }
    }

    try {
      // Finalizing
      this.onPerformingTestFinalization(test, callbackFinalize);

      // Possibly callback for more
      test.setTimeStartFinalize(new Date());
      await callbackFinalize?.(test, test.getResult()!);
      test.setTimeEndFinalize(new Date());
    } catch (error: unknown) {
      // The execution of the test has failed during finalization
      this.onPerformingTestFailure(test, error, true);
    }

    // Stop event loop starvation monitor
    test.stopEventLoopMonitor();

    // Done
    this.onPerformingTestDone(test);

    // Return the test
    return test;
  }

  /**
   * Executes the full lifecycle of a test when testing for an Error to be thrown, including setup, execution, assertion, success/failure handling, and optional finalization.
   *
   * The lifecycle consists of:
   * - Creating a new test instance
   * - Executing the core test logic via a callback, expecting an error to be thrown
   * - Storing the result in the test
   * - Optionally running additional assertions on the result
   * - Handling success or failure states
   * - Optionally finalizing the test (e.g., cleanup or logging)
   *
   * @template T - The type of the result returned by the test.
   * @param title - A human-readable description of the test
   * @param callback - Function that performs the main test logic and is supposed to throw an Error
   * @param callbackAssert - Function that asserts the correctness of the test result
   * @param [callbackFinalize] - Optional finalization callback, called after the test completes (regardless of success or failure)
   * @returns A promise that resolves to the fully populated {@link Test} object
   */
  async #testPerformTestError<T extends Error>(
    title: string,
    errorClass: ClassType<T>,
    callback: BaseTestDelegate<T, void>,
    callbackAssert?: BaseAssertionDelegate<T>,
    callbackFinalize?: BaseFinalizeDelegate<T>
  ): Promise<Test<T>> {
    // Create the test
    const test = this.onCreatingTest<T>(title);

    // Set the type to a true-negative, because we're testing for an Error.
    test.setType('true-negative');

    try {
      // Testing
      this.onPerformingTest(test);

      // Start event loop starvation monitor
      test.startEventLoopMonitor();

      // Start the test and expect it to fail
      let result: Error | undefined = undefined;
      try {
        test.setTimeStartTest(new Date());
        await callback(test);
      } catch (error: unknown) {
        // An error happened, as expected
        result = formatError(error);

        // Check if the right type
        // Assign it to the current test
        test.setResult(result as T);
      }
      test.setTimeEndTest(new Date());

      // Checking assertions
      this.onPerformingTestAssertions(test);

      // Creating the configuration
      test.addStep(`Verifying if error '${result?.constructor.name}' obtained is of the expected class type...`);

      // Check if the result is instance of the error we're testing for
      test.setTimeStartAssert(new Date());
      Test.assertIsErrorInstance(result as T, errorClass);

      // Callback with the result to verify using an assertion check
      await callbackAssert?.(test, result as T);
      test.setTimeEndAssert(new Date());

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
      test.setTimeStartFinalize(new Date());
      await callbackFinalize?.(test, test.getResult()!);
      test.setTimeEndFinalize(new Date());
    } catch (error: unknown) {
      // The execution of the test has failed during finalization
      this.onPerformingTestFailure(test, error, true);
    }

    // Stop event loop starvation monitor
    test.stopEventLoopMonitor();

    // Done
    this.onPerformingTestDone(test);

    // Return the test
    return test;
  }

  /**
   * Adds a test to the list of currently running tests.
   *
   * @param test - The test instance to add to the running list
   */
  #addTestRunning(test: Test): void {
    this.#testsRunning.push(test);
  }

  /**
   * Moves a test from the list of running tests to the list of completed tests.
   *
   * This method removes the specified test from the `#testsRunning` list (if found by ID)
   * and appends it to the `#testsDone` list.
   *
   * @param test - The test instance to move
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
   *
   * @param sender - The test instance that triggered the change
   * @param event - The event details describing the change
   */
  #handleTestStepChanged(sender: Test, event: BaseTestChangedEvent): void {
    // Performing test has been updated
    this.onPerformingTestStepChanged(sender, event);
  }

  // #endregion PRIVATE

  // #region STATIC METHODS

  /**
   * Returns a promise that resolves when an element matching the given selector exists in the DOM.
   *
   * Resolves immediately if the element already exists. Otherwise, uses a MutationObserver on the parent
   * to wait for the element to appear. Useful for waiting on React to mount a component.
   *
   * @param selector - The CSS selector to query for
   * @param parent - Optional parent element to observe (default: document.body)
   * @param timeout - Optional maximum duration in milliseconds to wait before rejecting. When omitted, waits indefinitely
   * @returns A promise that resolves with the matched element
   */
  static waitForDomElement(selector: string, parent?: Element, timeout?: number): Promise<Element> {
    const root = parent ?? document.body;

    // If the element already exists, resolve immediately
    const existing = root.querySelector(selector);
    if (existing) {
      return Promise.resolve(existing);
    }

    return new Promise<Element>((resolve, reject) => {
      const state = { resolved: false };
      const observer = new MutationObserver(() => {
        if (state.resolved) return;
        const el = root.querySelector(selector);
        if (el) {
          state.resolved = true;
          observer.disconnect();
          resolve(el);
        }
      });
      observer.observe(root, { childList: true, subtree: true });

      // Only set up the timeout when a duration is provided; otherwise wait indefinitely
      if (timeout !== undefined) {
        setTimeout(() => {
          if (state.resolved) return;
          state.resolved = true;
          observer.disconnect();
          reject(new Error(`waitForDomElement timed out after ${timeout}ms waiting for "${selector}"`));
        }, timeout);
      }
    });
  }

  /**
   * Returns a promise that resolves when the given element has non-empty text content.
   *
   * Resolves immediately if the element already has text content. Otherwise, delegates to waitForDomChange
   * with a filter that checks for non-empty text. Useful for waiting on React to render text into a DOM element.
   *
   * @param element - The DOM element to check for text content
   * @param timeout - Optional maximum duration in milliseconds to wait before rejecting. When omitted, waits indefinitely
   * @returns A promise that resolves when the element has text content, or rejects on timeout
   */
  static waitForDomContent(element: Element, timeout?: number): Promise<void> {
    // If the element already has content, resolve immediately
    if (element.textContent?.trim()) {
      return Promise.resolve();
    }

    // Otherwise, wait for a DOM change that results in non-empty text content
    return this.waitForDomChange(element, () => !!element.textContent?.trim(), timeout);
  }

  /**
   * Returns a promise that resolves when a DOM mutation is observed on the given element.
   *
   * Uses a MutationObserver to detect changes (childList, subtree, characterData) without polling.
   * Useful for waiting on React UI updates after a store change.
   * When a filter is provided, the observer keeps listening until the filter returns true.
   *
   * @param element - The DOM element to observe for changes
   * @param filter - Optional predicate evaluated on each mutation. When provided, only resolves when filter returns true
   * @param timeout - Optional maximum duration in milliseconds to wait before rejecting. When omitted, waits indefinitely
   * @returns A promise that resolves when the DOM changes (and passes the filter), or rejects on timeout
   */
  static waitForDomChange(element: Element, filter?: () => boolean, timeout?: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const state = { resolved: false };
      const observer = new MutationObserver(() => {
        if (state.resolved) return;
        if (filter && !filter()) return;
        state.resolved = true;
        observer.disconnect();
        resolve();
      });
      observer.observe(element, { childList: true, subtree: true, characterData: true });

      // Only set up the timeout when a duration is provided; otherwise wait indefinitely
      if (timeout !== undefined) {
        setTimeout(() => {
          if (state.resolved) return;
          state.resolved = true;
          observer.disconnect();
          reject(new Error(`waitForDomChange timed out after ${timeout}ms`));
        }, timeout);
      }
    });
  }

  /**
   * Polls a condition at short intervals until it returns true, then resolves.
   *
   * This is the preferred way to wait for an expected state change (e.g., store update, layer registration)
   * rather than using a fixed delay. Delegates to `whenThisThen` from geoview-core utilities.
   *
   * @param condition - A predicate that returns true when the expected state is reached
   * @param timeout - Optional maximum duration in milliseconds to wait before rejecting
   * @returns A promise that resolves with true when the condition is met, or rejects on timeout
   */
  static waitForCondition(condition: () => boolean, timeout?: number): Promise<boolean> {
    return whenThisThen(condition, timeout);
  }

  /**
   * Waits for React to fully settle after a state change.
   *
   * Uses two nested `requestAnimationFrame` calls followed by a `requestIdleCallback` to ensure
   * that React's commit phase has completed, the browser has painted the updated DOM, and all
   * `useEffect` callbacks and microtasks have run before resolving. This is more reliable than a
   * single `requestIdleCallback` (which can fire between React's render and effect phases) and
   * avoids the arbitrary fixed delays of `waitForFun`.
   *
   * Prefer `waitForCondition` when a specific expected outcome can be checked; use this method
   * when you need a general "wait for React to finish" without knowing the exact condition.
   *
   * @returns A promise that resolves once React has rendered, painted, and executed effects
   */
  static waitForReactIdle(): Promise<void> {
    return new Promise((resolve) => {
      // First rAF: React's commit phase may still be in progress
      requestAnimationFrame(() => {
        // Second rAF: ensures the paint after commit has occurred
        requestAnimationFrame(() => {
          // Idle callback: fires after useEffect and any microtasks settle
          (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(() => resolve());
        });
      });
    });
  }

  /**
   * Waits until the browser's main thread becomes idle using `requestIdleCallback`.
   *
   * This is useful for waiting until React has finished its render and commit phases, since the
   * idle callback fires only after all pending tasks (renders, effects, layout) have completed.
   * Prefer polling with `whenThisThen` for specific expected outcomes; use this when you need a
   * lightweight "wait for React to settle" without knowing the exact condition to check.
   *
   * @returns A promise that resolves when the browser reports an idle period
   */
  static waitForBrowserIdle(): Promise<void> {
    return new Promise((resolve) => {
      (window as unknown as { requestIdleCallback: (cb: () => void) => void }).requestIdleCallback(resolve);
    });
  }

  /**
   * Waits for a purely aesthetic delay to allow the test UI to visually catch up.
   *
   * This should only be used for display purposes (e.g., giving the human observer time to see
   * intermediate state changes in the test runner UI). Never use this for functional synchronization.
   *
   * @param period - Optional delay in milliseconds (default: 5000)
   * @returns A promise that resolves after the delay
   */
  static waitForFun(period = 5000): Promise<void> {
    // Wait for the React UI to actually pick up on the store update
    return delay(period);
  }

  // #endregion STATIC METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitStarted(event: TestEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestStartedHandlers, event);
  }

  /**
   * Registers a test started event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onStarted(callback: TestDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestStartedHandlers, callback);
  }

  /**
   * Unregisters a test started event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offStarted(callback: TestDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestStartedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitStepChanged(event: TestUpdatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestUpdatedHandlers, event);
  }

  /**
   * Registers a step updated event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onStepUpdated(callback: TestUpdatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestUpdatedHandlers, callback);
  }

  /**
   * Unregisters a step updated event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offStepUpdated(callback: TestUpdatedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestUpdatedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitSuccess(event: SuccessEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onSuccessHandlers, event);
  }

  /**
   * Registers a success event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onSuccess(callback: SuccessDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onSuccessHandlers, callback);
  }

  /**
   * Unregisters a success event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offSuccess(callback: SuccessDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onSuccessHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitFailure(event: FailureEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onFailureHandlers, event);
  }

  /**
   * Registers a failure event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onFailure(callback: FailureDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onFailureHandlers, callback);
  }

  /**
   * Unregisters a failure event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offFailure(callback: FailureDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onFailureHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitSkipped(event: SkippedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onSkippedHandlers, event);
  }

  /**
   * Registers a skipped event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onSkipped(callback: SkippedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onSkippedHandlers, callback);
  }

  /**
   * Unregisters a skipped event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offSkipped(callback: SkippedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onSkippedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitDone(event: TestEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onDoneHandlers, event);
  }

  /**
   * Registers a done event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onDone(callback: TestDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onDoneHandlers, callback);
  }

  /**
   * Unregisters a done event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offDone(callback: TestDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onDoneHandlers, callback);
  }

  // #endregion EVENTS
}

/** Define a delegate for the event handler function signature. */
export type BaseTestDelegate<T = unknown, U = unknown> = (test: Test<T>) => U | Promise<U>;

/** Define a delegate for the event handler function signature. */
export type BaseAssertionDelegate<T = unknown> = (test: Test<T>, result: T) => void | Promise<void>;

/** Define a delegate for the event handler function signature. */
export type BaseFinalizeDelegate<T = unknown> = (test: Test<T>, result: T) => void | Promise<void>;

/** Define an event for the delegate. */
export interface TestEvent {
  test: Test;
}

/** Define a delegate for the event handler function signature. */
export type TestDelegate = EventDelegateBase<AbstractTester, TestEvent, void>;

/** Define an event for the delegate. */
export interface TestUpdatedEvent<T = BaseTestChangedEvent> extends TestEvent {
  event: T;
}

/** Define a delegate for the event handler function signature. */
export type TestUpdatedDelegate = EventDelegateBase<AbstractTester, TestUpdatedEvent, void>;

/** Define an event for the delegate. */
export interface SuccessEvent<T = unknown> extends TestEvent {
  result: T;
}

/** Define a delegate for the event handler function signature. */
export type SuccessDelegate = EventDelegateBase<AbstractTester, SuccessEvent, void>;

/** Define an event for the delegate. */
export interface FailureEvent extends TestEvent {
  error: unknown;
}

/** Define a delegate for the event handler function signature. */
export type FailureDelegate = EventDelegateBase<AbstractTester, FailureEvent, void>;

/** Define an event for the delegate. */
export interface SkippedEvent extends TestEvent {
  reason: string;
}

/** Define a delegate for the event handler function signature. */
export type SkippedDelegate = EventDelegateBase<AbstractTester, SkippedEvent, void>;
