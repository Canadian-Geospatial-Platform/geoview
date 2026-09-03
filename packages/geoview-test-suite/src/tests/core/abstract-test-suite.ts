import type { EventDelegateBase } from 'geoview-core/api/events/event-helper';
import EventHelper from 'geoview-core/api/events/event-helper';
import { formatDuration } from 'geoview-core/core/utils/utilities';
import type { AbstractTester, FailureEvent, SkippedEvent, SuccessEvent, TestEvent, TestUpdatedEvent } from './abstract-tester';
import { TestSuiteCannotExecuteError, TestSuiteRunningError } from './exceptions';

/**
 * Abstract base class for creating suite of tests.
 */
export abstract class AbstractTestSuite {
  /** The Testers in the Test Suite */
  #testers: AbstractTester[] = [];

  /** Callback delegates for the test started event */
  #onTestersTestStartedHandlers: TesterTestDelegate[] = [];

  /** Callback delegates for the test updated event */
  #onTestersTestUpdatedHandlers: TesterTestUpdatedDelegate[] = [];

  /** Callback delegates for the test success event */
  #onTestersTestSuccessHandlers: TesterSuccessDelegate[] = [];

  /** Callback delegates for the test failure event */
  #onTestersTestFailureHandlers: TesterFailureDelegate[] = [];

  /** Callback delegates for the test skipped event */
  #onTestersTestSkippedHandlers: TesterSkippedDelegate[] = [];

  /** Indicates whether the plugin is running on a VPN */
  #isRunningOnVPN = false;

  /** Indicates whether the plugin is running the heavy tests */
  #isRunningHeavyTests = false;

  /** Indicates whether the test suite should force sequential execution of tests */
  #isRunningSequentially = false;

  /** Indicates if the test suite should only run the DEBUG tests */
  DEBUG_RUN_ONLY_DEBUG_FUNCTION = false; // true or false or isLocalhost()

  /** Datetime when the latest test suite launch started. */
  #launchStartedAt?: Date;

  /** Datetime when the latest test suite launch ended. */
  #launchEndedAt?: Date;

  // #region OVERRIDES

  /**
   * Mustoverride function to provide a name for the Test Suite.
   */
  abstract getName(): string;

  /**
   * Mustoverride function to provide a description, in Html format, for the Test Suite.
   */
  abstract getDescriptionAsHtml(): string;

  /** Mustoverride function to provide the exact number of tester test calls in the full onLaunchTestSuite implementation; debug-only calls are excluded. */
  abstract getTestsTotalFinal(): number;

  /**
   * Overridable function called when the test suite is about to launch, to validate if it can be executed on the given map.
   *
   * @returns A promise that resolves to true if the test suite can execute on the given map
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onCanExecuteTestSuite(): Promise<boolean> {
    return Promise.resolve(true);
  }

  /**
   * Performs setup tasks before the test suite launches.
   *
   * Override this method in a subclass to run initialization logic (e.g., forcing a map render)
   * that must complete before any tests execute.
   *
   * @returns A promise that resolves when preparation is complete
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onPrepareLaunchTestSuite(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Provides a debug hook for running a subset of tests during development.
   *
   * Override this method in a concrete suite to temporarily run only specific tests
   * without modifying the main `onLaunchTestSuite` method. When the override returns
   * a non-resolving promise, the framework skips the main test suite.
   *
   * GV DEBUG SECTION TO NOT HAVE TO TEST EVERYTHING EVERYTIME
   *
   * @returns A promise that resolves immediately by default (no debug tests to run)
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onLaunchTestSuiteDEBUG(): Promise<unknown> {
    // Nothing here
    return Promise.resolve();
  }

  /**
   * Overridable function called when the test suite has launched its tests.
   *
   * @returns A promise that resolves when the tests are over
   */
  protected abstract onLaunchTestSuite(): Promise<unknown>;

  // #endregion OVERRIDES

  // #region PUBLIC METHODS

  /**
   * Gets the total number of tests in the Suite.
   *
   * @returns The total number of tests
   */
  getTestsTotal(): number {
    // Return the total tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsTotal(), 0);
  }

  /**
   * Gets the total number of currently running tests in the Suite.
   *
   * @returns The total number of running tests
   */
  getTestsRunning(): number {
    // Return the total running tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsRunning(), 0);
  }

  /**
   * Gets the total number of currently done tests in the Suite.
   *
   * @returns The total number of tests done
   */
  getTestsDone(): number {
    // Return the total completed tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsDone(), 0);
  }

  /**
   * Gets the total number of currently done successful tests in the Suite.
   *
   * @returns The total number of tests done
   */
  getTestsDoneSuccess(): number {
    // Return the total completed tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsDoneSuccess(), 0);
  }

  /**
   * Gets the total number of currently done successful tests in the Suite.
   *
   * @returns The total number of tests done
   */
  getTestsDoneSkipped(): number {
    // Return the total completed tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsDoneSkipped(), 0);
  }

  /**
   * Gets the total number of currently done failed tests in the Suite.
   *
   * @returns The total number of tests done
   */
  getTestsDoneFailed(): number {
    // Return the total completed tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsDoneFailed(), 0);
  }

  /**
   * Gets if all tests are done.
   *
   * @returns Indicate if the tests are all done
   */
  getTestsDoneAll(): boolean {
    return this.#testers.every((tester) => tester.getTestsDoneAll());
  }

  /**
   * Gets if all the tests are done and successfully or skipped.
   *
   * @returns Indicate if the tests are all done and finished successfully
   */
  getTestsDoneAllSuccess(): boolean {
    return this.getTestsDoneAll() && this.#testers.every((tester) => tester.getTestsDoneAllSuccess());
  }

  /**
   * Gets whether the test suite is running on a VPN.
   *
   * @returns Whether the environment is running on VPN
   */
  getIsRunningOnVPN(): boolean {
    return this.#isRunningOnVPN;
  }

  /**
   * Sets whether the test suite is running on a VPN.
   *
   * @param isRunningOnVPN - Whether the environment is running on VPN
   */
  setIsRunningOnVPN(isRunningOnVPN: boolean): void {
    this.#isRunningOnVPN = isRunningOnVPN;
  }

  /**
   * Gets whether the test suite is running heavy tests.
   *
   * @returns Whether the environment is running heavy tests
   */
  getIsRunningHeavyTests(): boolean {
    return this.#isRunningHeavyTests;
  }

  /**
   * Sets whether the test suite is running heavy tests.
   *
   * @param isHeavyTests - Whether the environment is running heavy tests
   */
  setIsRunningHeavyTests(isRunningHeavyTests: boolean): void {
    this.#isRunningHeavyTests = isRunningHeavyTests;
  }

  /**
   * Gets whether sequential execution is forced for tests in this suite.
   *
   * @returns Whether tests in this suite are forced to run sequentially
   */
  getIsRunningSequentially(): boolean {
    return this.#isRunningSequentially;
  }

  /**
   * Sets whether sequential execution is forced for tests in this suite.
   *
   * @param isRunningSequentially - Whether tests in this suite should be forced to run sequentially
   */
  setIsRunningSequentially(isRunningSequentially: boolean): void {
    this.#isRunningSequentially = isRunningSequentially;
  }

  /**
   * Gets the datetime when the latest test suite launch started.
   *
   * @returns The latest launch start datetime, or undefined if never launched
   */
  getLaunchStartedAt(): Date | undefined {
    return this.#launchStartedAt;
  }

  /**
   * Gets the datetime when the latest test suite launch ended.
   *
   * @returns The latest launch end datetime, or undefined if launch is in progress or never launched
   */
  getLaunchEndedAt(): Date | undefined {
    return this.#launchEndedAt;
  }

  /**
   * Gets the duration of the latest test suite launch in milliseconds.
   *
   * @returns The latest launch duration in milliseconds, or undefined if start or end time is unavailable
   */
  getDurationMs(): number {
    if (this.#launchStartedAt && this.#launchEndedAt) {
      return this.#launchEndedAt.getTime() - this.#launchStartedAt.getTime();
    }
    return 0;
  }

  /**
   * Gets the formatted duration of the latest test suite launch.
   *
   * @returns The latest launch duration formatted as a string, or an empty string if start or end time is unavailable
   */
  getDurationFormatted(): string {
    // Get the duration
    const duration = this.getDurationMs();
    if (!duration) return '';

    // Return the duration formatted
    return formatDuration(duration);
  }

  /**
   * Initializes a tester as part of the Test Suite.
   *
   * @param tester - The tester to initialize
   */
  addTester(tester: AbstractTester): void {
    // Add it
    this.#testers.push(tester);

    // Hook it
    tester.onStarted(this.#handleTesterTestStarted.bind(this));
    tester.onStepUpdated(this.#handleTesterTestStepUpdated.bind(this));
    tester.onSuccess(this.#handleTesterSuccess.bind(this));
    tester.onFailure(this.#handleTesterFailure.bind(this));
    tester.onSkipped(this.#handleTesterSkipped.bind(this));
  }

  /**
   * Launches the test suite.
   *
   * When `DEBUG_RUN_ONLY_DEBUG_FUNCTION` is `true` and the environment is localhost,
   * only the debug subset (`onLaunchTestSuiteDEBUG`) is executed instead of the full suite.
   *
   * @returns A promise that resolves when the tests are over
   * @throws {TestSuiteRunningError} When the test suite is already running
   * @throws {TestSuiteCannotExecuteError} When `onCanExecuteTestSuite()` resolves to false
   */
  async launchTestSuite(): Promise<unknown> {
    // Validates the Test Suite isn't already running tests
    if (this.getTestsRunning() > 0) throw new TestSuiteRunningError('The Test Suite is already running, please wait to prevent errors.');

    // Validates the Test Suite can execute
    if (!(await this.onCanExecuteTestSuite())) throw new TestSuiteCannotExecuteError();

    // Track launch timing for this execution.
    this.#launchStartedAt = new Date();
    this.#launchEndedAt = undefined;

    try {
      // Prepare to launch the test suite
      await this.onPrepareLaunchTestSuite();

      // If only running the debug tests
      if (this.DEBUG_RUN_ONLY_DEBUG_FUNCTION) {
        // Launching the debug test suite first to see if we proceed with the full tests or not
        return await this.onLaunchTestSuiteDEBUG();
      }

      // Launching full test suite
      return await this.onLaunchTestSuite();
    } finally {
      // Record the end time whether launch succeeded or failed.
      this.#launchEndedAt = new Date();
    }
  }

  /**
   * Resets all the testers in the suite.
   */
  resetTestSuite(): void {
    // Validates the Test Suite isn't already running tests
    if (this.getTestsRunning() > 0) throw new TestSuiteRunningError('The Test Suite is running, please wait to prevent errors.');

    // Resets tests in all testers
    this.#testers.forEach((tester) => tester.resetTests());
  }

  // #endregion PUBLIC METHODS

  // #region PRIVATE METHODS

  /**
   * Handles the event indicating that a tester has started running a test,
   * and re-emits it with additional context.
   *
   * This method allows external consumers to listen for when a test begins
   * execution on a specific tester.
   *
   * @param sender - The tester instance that started the test
   * @param event - The event containing the test that has started
   */
  #handleTesterTestStarted(sender: AbstractTester, event: TestEvent): void {
    // Re-emit
    this.#emitTestStarted({ ...event, tester: sender });
  }

  /**
   * Handles an event indicating that a test's step or state has been updated,
   * and re-emits it with additional tester context.
   *
   * @param sender - The tester instance that updated the test
   * @param event - The event containing the updated test and its internal event
   */
  #handleTesterTestStepUpdated(sender: AbstractTester, event: TestUpdatedEvent): void {
    // Re-emit
    this.#emitTestUpdated({ ...event, tester: sender });
  }

  /**
   * Handles a successful test completion event from a tester,
   * and re-emits it with additional tester context.
   *
   * @param sender - The tester instance that completed the test successfully
   * @param event - The event containing the test and its resulting data
   */
  #handleTesterSuccess(sender: AbstractTester, event: SuccessEvent): void {
    // Re-emit
    this.#emitSuccess({ ...event, tester: sender });
  }

  /**
   * Handles a test failure event emitted by a tester,
   * and re-emits it with additional tester context.
   *
   * @param sender - The tester instance that encountered the failure
   * @param event - The event containing the test and the associated error
   */
  #handleTesterFailure(sender: AbstractTester, event: FailureEvent): void {
    // Re-emit
    this.#emitFailure({ ...event, tester: sender });
  }

  /**
   * Handles a test skipped event emitted by a tester,
   * and re-emits it with additional tester context.
   *
   * @param sender - The tester instance that encountered the skip
   * @param event - The event containing the test and the associated error
   */
  #handleTesterSkipped(sender: AbstractTester, event: SkippedEvent): void {
    // Re-emit
    this.#emitSkipped({ ...event, tester: sender });
  }

  // #endregion PRIVATE METHODS

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitTestStarted(event: TesterTestEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestersTestStartedHandlers, event);
  }

  /**
   * Registers a test started event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onTestStarted(callback: TesterTestDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestersTestStartedHandlers, callback);
  }

  /**
   * Unregisters a test started event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offTestStarted(callback: TesterTestDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestersTestStartedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitTestUpdated(event: TesterTestUpdatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestersTestUpdatedHandlers, event);
  }

  /**
   * Registers a test updated event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onTestUpdated(callback: TesterTestUpdatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestersTestUpdatedHandlers, callback);
  }

  /**
   * Unregisters a test updated event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offTestUpdated(callback: TesterTestUpdatedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestersTestUpdatedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitSuccess(event: TesterSuccessEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestersTestSuccessHandlers, event);
  }

  /**
   * Registers a success event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onSuccess(callback: TesterSuccessDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestersTestSuccessHandlers, callback);
  }

  /**
   * Unregisters a success event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offSuccess(callback: TesterSuccessDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestersTestSuccessHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitFailure(event: TesterFailureEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestersTestFailureHandlers, event);
  }

  /**
   * Registers a failure event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onFailure(callback: TesterFailureDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestersTestFailureHandlers, callback);
  }

  /**
   * Unregisters a failure event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offFailure(callback: TesterFailureDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestersTestFailureHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   *
   * @param event - The event to emit
   */
  #emitSkipped(event: TesterSkippedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestersTestSkippedHandlers, event);
  }

  /**
   * Registers a skipped event handler.
   *
   * @param callback - The callback to be executed whenever the event is emitted
   */
  onSkipped(callback: TesterSkippedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestersTestSkippedHandlers, callback);
  }

  /**
   * Unregisters a skipped event handler.
   *
   * @param callback - The callback to stop being called whenever the event is emitted
   */
  offSkipped(callback: TesterSkippedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestersTestSkippedHandlers, callback);
  }

  // #endregion EVENTS
}

/** Define an event for the delegate. */
export interface TesterTestEvent extends TestEvent {
  tester: AbstractTester;
}

/** Define a delegate for the event handler function signature. */
export type TesterTestDelegate = EventDelegateBase<AbstractTestSuite, TesterTestEvent, void>;

/** Define an event for the delegate. */
export interface TesterTestUpdatedEvent extends TestUpdatedEvent {
  tester: AbstractTester;
}

/** Define a delegate for the event handler function signature. */
export type TesterTestUpdatedDelegate = EventDelegateBase<AbstractTestSuite, TesterTestUpdatedEvent, void>;

/** Define an event for the delegate. */
export interface TesterSuccessEvent extends SuccessEvent {
  tester: AbstractTester;
}

/** Define a delegate for the event handler function signature. */
export type TesterSuccessDelegate = EventDelegateBase<AbstractTestSuite, TesterSuccessEvent, void>;

/** Define an event for the delegate. */
export interface TesterFailureEvent extends FailureEvent {
  tester: AbstractTester;
}

/** Define a delegate for the event handler function signature. */
export type TesterFailureDelegate = EventDelegateBase<AbstractTestSuite, TesterFailureEvent, void>;

/** Define an event for the delegate. */
export interface TesterSkippedEvent extends SkippedEvent {
  tester: AbstractTester;
}

/** Define a delegate for the event handler function signature. */
export type TesterSkippedDelegate = EventDelegateBase<AbstractTestSuite, TesterSkippedEvent, void>;
