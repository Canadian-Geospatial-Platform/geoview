import type { EventDelegateBase } from 'geoview-core/api/events/event-helper';
import EventHelper from 'geoview-core/api/events/event-helper';
import type { AbstractTester, FailureEvent, SuccessEvent, TestEvent, TestUpdatedEvent } from './abstract-tester';
import { TestSuiteCannotExecuteError, TestSuiteRunningError } from './exceptions';

/**
 * Abstract base class for creating suite of tests.
 */
export abstract class AbstractTestSuite {
  // The Testers in the Test Suite
  #testers: AbstractTester[] = [];

  /** Keep all callback delegate references */
  #onTestersTestStartedHandlers: TesterTestDelegate[] = [];

  /** Keep all callback delegate references */
  #onTestersTestUpdatedHandlers: TesterTestUpdatedDelegate[] = [];

  /** Keep all callback delegate references */
  #onTestersTestSuccessHandlers: TesterSuccessDelegate[] = [];

  /** Keep all callback delegate references */
  #onTestersTestFailureHandlers: TesterFailureDelegate[] = [];

  /**
   * Mustoverride function to provide a name for the Test Suite.
   */
  abstract getName(): string;

  /**
   * Mustoverride function to provide a description, in Html format, for the Test Suite.
   */
  abstract getDescriptionAsHtml(): string;

  /**
   * Gets the total number of tests in the Suite.
   * @returns {number} The total number of tests.
   */
  getTestsTotal(): number {
    // Return the total tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsTotal(), 0);
  }

  /**
   * Gets the total number of currently running tests in the Suite.
   * @returns {number} The total number of running tests.
   */
  getTestsRunning(): number {
    // Return the total running tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsRunning(), 0);
  }

  /**
   * Gets the total number of currently done tests in the Suite.
   * @returns {number} The total number of tests done.
   */
  getTestsDone(): number {
    // Return the total completed tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsDone(), 0);
  }

  /**
   * Gets the total number of currently done successful tests in the Suite.
   * @returns {number} The total number of tests done.
   */
  getTestsDoneSuccess(): number {
    // Return the total completed tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsDoneSuccess(), 0);
  }

  /**
   * Gets the total number of currently done failed tests in the Suite.
   * @returns {number} The total number of tests done.
   */
  getTestsDoneFailed(): number {
    // Return the total completed tests across all testers
    return this.#testers.reduce((total, tester) => total + tester.getTestsDoneFailed(), 0);
  }

  /**
   * Gets if all tests are done.
   * @returns {boolean} Indicate if the tests are all done.
   */
  getTestsDoneAll(): boolean {
    return this.#testers.every((tester) => tester.getTestsDoneAll());
  }

  /**
   * Gets if all the tests are done and successfully.
   * @returns {boolean} Indicate if the tests are all done and finished successfully.
   */
  getTestsDoneAllSuccess(): boolean {
    return this.getTestsDoneAll() && this.#testers.every((tester) => tester.getTestsDoneAllSuccess());
  }

  /**
   * Initializes a tester as part of the Test Suite.
   * @param {AbstractTester} tester - The tester to initialize.
   */
  addTester(tester: AbstractTester): void {
    // Add it
    this.#testers.push(tester);

    // Hook it
    tester.onStarted(this.#handleTesterTestStarted.bind(this));
    tester.onStepUpdated(this.#handleTesterTestStepUpdated.bind(this));
    tester.onSuccess(this.#handleTesterSuccess.bind(this));
    tester.onFailure(this.#handleTesterFailure.bind(this));
  }

  /**
   * Launches the test suite.
   * @returns {Promise<unknown>} Resolves when the tests are over.
   */
  async launchTestSuite(): Promise<unknown> {
    // Validates the Test Suite isn't already running tests
    if (this.getTestsRunning() > 0) throw new TestSuiteRunningError('The Test Suite is already running, please wait to prevent errors.');

    // Validates the Test Suite can execute
    if (!(await this.onCanExecuteTestSuite())) throw new TestSuiteCannotExecuteError();

    // Launching test suite
    return this.onLaunchTestSuite();
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

  /**
   * Overridable function called when the test suite has launched its tests.
   * @returns {Promise<unknown>} Resolves when the tests are over.
   */
  protected abstract onLaunchTestSuite(): Promise<unknown>;

  /**
   * Overridable function called when the test suite is about to launch, to validate if it can be executed on the given map.
   * @returns {Promise<boolean>} A Promise resolving to true if the test suite can execute on the given map.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onCanExecuteTestSuite(): Promise<boolean> {
    return Promise.resolve(true);
  }

  // #region PRIVATE

  /**
   * Handles the event indicating that a tester has started running a test,
   * and re-emits it with additional context.
   * This method allows external consumers to listen for when a test begins
   * execution on a specific tester.
   * @param {AbstractTester} sender - The tester instance that started the test.
   * @param {TestEvent} event - The event containing the test that has started.
   */
  #handleTesterTestStarted(sender: AbstractTester, event: TestEvent): void {
    // Re-emit
    this.#emitTestStarted({ ...event, tester: sender });
  }

  /**
   * Handles an event indicating that a test's step or state has been updated,
   * and re-emits it with additional tester context.
   * @param {AbstractTester} sender - The tester instance that updated the test.
   * @param {TestUpdatedEvent} event - The event containing the updated test and its internal event.
   */
  #handleTesterTestStepUpdated(sender: AbstractTester, event: TestUpdatedEvent): void {
    // Re-emit
    this.#emitTestUpdated({ ...event, tester: sender });
  }

  /**
   * Handles a successful test completion event from a tester,
   * and re-emits it with additional tester context.
   * @param {AbstractTester} sender - The tester instance that completed the test successfully.
   * @param {SuccessEvent} event - The event containing the test and its resulting data.
   */
  #handleTesterSuccess(sender: AbstractTester, event: SuccessEvent): void {
    // Re-emit
    this.#emitSuccess({ ...event, tester: sender });
  }

  /**
   * Handles a test failure event emitted by a tester,
   * and re-emits it with additional tester context.
   * @param {AbstractTester} sender - The tester instance that encountered the failure.
   * @param {FailureEvent} event - The event containing the test and the associated error.
   */
  #handleTesterFailure(sender: AbstractTester, event: FailureEvent): void {
    // Re-emit
    this.#emitFailure({ ...event, tester: sender });
  }

  // #endregion PRIVATE

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {TesterTestEvent} event - The event to emit
   * @private
   */
  #emitTestStarted(event: TesterTestEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestersTestStartedHandlers, event);
  }

  /**
   * Registers a test started event handler.
   * @param {TesterTestDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onTestStarted(callback: TesterTestDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestersTestStartedHandlers, callback);
  }

  /**
   * Unregisters a test started event handler.
   * @param {TesterTestDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offTestStarted(callback: TesterTestDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestersTestStartedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {TesterTestUpdatedEvent} event - The event to emit
   * @private
   */
  #emitTestUpdated(event: TesterTestUpdatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestersTestUpdatedHandlers, event);
  }

  /**
   * Registers a test updated event handler.
   * @param {TesterTestUpdatedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onTestUpdated(callback: TesterTestUpdatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestersTestUpdatedHandlers, callback);
  }

  /**
   * Unregisters a test updateduccess event handler.
   * @param {TesterTestUpdatedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offTestUpdated(callback: TesterTestUpdatedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestersTestUpdatedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {TesterSuccessEvent} event - The event to emit
   * @private
   */
  #emitSuccess(event: TesterSuccessEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestersTestSuccessHandlers, event);
  }

  /**
   * Registers a success event handler.
   * @param {TesterSuccessDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onSuccess(callback: TesterSuccessDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestersTestSuccessHandlers, callback);
  }

  /**
   * Unregisters a success event handler.
   * @param {TesterSuccessDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offSuccess(callback: TesterSuccessDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestersTestSuccessHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {TesterFailureEvent} event - The event to emit
   * @private
   */
  #emitFailure(event: TesterFailureEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onTestersTestFailureHandlers, event);
  }

  /**
   * Registers a failure event handler.
   * @param {TesterFailureDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onFailure(callback: TesterFailureDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onTestersTestFailureHandlers, callback);
  }

  /**
   * Unregisters a failure event handler.
   * @param {TesterFailureDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offFailure(callback: TesterFailureDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onTestersTestFailureHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Define an event for the delegate
 */
export interface TesterTestEvent extends TestEvent {
  tester: AbstractTester;
}

/**
 * Define a delegate for the event handler function signature
 */
export type TesterTestDelegate = EventDelegateBase<AbstractTestSuite, TesterTestEvent, void>;

/**
 * Define an event for the delegate
 */
export interface TesterTestUpdatedEvent extends TestUpdatedEvent {
  tester: AbstractTester;
}

/**
 * Define a delegate for the event handler function signature
 */
export type TesterTestUpdatedDelegate = EventDelegateBase<AbstractTestSuite, TesterTestUpdatedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface TesterSuccessEvent extends SuccessEvent {
  tester: AbstractTester;
}

/**
 * Define a delegate for the event handler function signature
 */
export type TesterSuccessDelegate = EventDelegateBase<AbstractTestSuite, TesterSuccessEvent, void>;

/**
 * Define an event for the delegate
 */
export interface TesterFailureEvent extends FailureEvent {
  tester: AbstractTester;
}

/**
 * Define a delegate for the event handler function signature
 */
export type TesterFailureDelegate = EventDelegateBase<AbstractTestSuite, TesterFailureEvent, void>;
