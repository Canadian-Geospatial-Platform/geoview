import React from 'react'; // GV This import is to validate that we're on the right React at the end of the file
import { AbstractPlugin } from 'geoview-core/api/plugin/abstract-plugin';
import { PluginConfigNotFoundError, TestSuiteInitializationError } from 'geoview-core/core/exceptions/geoview-exceptions';
import type { EventDelegateBase } from 'geoview-core/api/events/event-helper';
import EventHelper from 'geoview-core/api/events/event-helper';
import type { TesterFailureEvent, TesterSuccessEvent, TesterTestEvent, TesterTestUpdatedEvent } from './tests/core/abstract-test-suite';
import { TestSuiteRunningError } from './tests/core/exceptions';
import type { GVAbstractTestSuite } from './tests/suites/abstract-gv-test-suite';
import { GVTestSuiteMapVaria } from './tests/suites/suite-map-varia';
import { GVTestSuiteConfig } from './tests/suites/suite-config';
import { GVTestSuiteGeochart } from './tests/suites/suite-geochart';
import { GVTestSuiteLayer } from './tests/suites/suite-layer';

/**
 * Create a class for the plugin instance
 */
class TestSuitePlugin extends AbstractPlugin {
  /** The Test Suites for the plugin */
  testSuites: GVAbstractTestSuite[] = [];

  /** Indicates the number of suites that completed their tests (the suites are run synchronously) */
  #suitesCompleted: number = 0;

  /** Keep all callback delegate references */
  #onSuiteTestersTestStartedHandlers: SuiteTesterTestDelegate[] = [];

  /** Keep all callback delegate references */
  #onSuiteTestersTestUpdatedHandlers: SuiteTesterTestUpdatedDelegate[] = [];

  /** Keep all callback delegate references */
  #onSuiteTestersTestSuccessHandlers: SuiteTesterSuccessDelegate[] = [];

  /** Keep all callback delegate references */
  #onSuiteTestersTestFailureHandlers: SuiteTesterFailureDelegate[] = [];

  /**
   * Returns the package schema
   *
   * @returns {unknown} the package schema
   */
  override schema(): unknown {
    return {};
  }

  /**
   * Returns the default config for this package
   *
   * @returns {unknown} the default config
   */
  override defaultConfig(): unknown {
    return {};
  }

  /**
   * Overrides the default translations for the Plugin.
   * @returns {Record<string, unknown>} - The translations object for the particular Plugin.
   */
  override defaultTranslations(): Record<string, unknown> {
    return {};
  }

  /**
   * Overrides the get config
   * @override
   * @returns {TestSuitePluginConfig} The config
   */
  override getConfig(): TestSuitePluginConfig {
    return super.getConfig() as TestSuitePluginConfig;
  }

  /**
   * Overrides the addition of the Test Suite Plugin.
   */
  override onAdd(): void {
    // If the plugin has no configured test-suites, throw error
    if (!this.getConfig().suites || this.getConfig().suites.length === 0)
      throw new PluginConfigNotFoundError(this.pluginId, this.mapViewer.mapId, 'corePackagesConfig');

    // For each defined suite
    this.getConfig().suites.forEach((suite) => {
      if (suite === 'suite-config') {
        // Instanciate the GeoView Test Suite
        this.addTestSuite(new GVTestSuiteConfig(window.cgpv.api, this.mapViewer));
      } else if (suite === 'suite-map') {
        // Instanciate the GeoView Test Suite
        this.addTestSuite(new GVTestSuiteMapVaria(window.cgpv.api, this.mapViewer));
      } else if (suite === 'suite-layer') {
        // Instanciate the GeoView Test Suite
        this.addTestSuite(new GVTestSuiteLayer(window.cgpv.api, this.mapViewer));
      } else if (suite === 'suite-geochart') {
        // Instanciate the GeoView Test Suite
        this.addTestSuite(new GVTestSuiteGeochart(window.cgpv.api, this.mapViewer));
      } else {
        // Throw
        throw new TestSuiteInitializationError(suite, this.mapViewer.mapId);
      }
    });
  }

  /**
   * Overrides the removal of the Test Suite Plugin.
   */
  override onRemove(): void {} // Nothing to do

  /**
   * Adds a test suite to the manager and registers event handlers to track its lifecycle.
   * When the test suite emits events such as test start, update, success, or failure,
   * this method attaches listeners that re-emit those events through the manager's own system,
   * augmenting them with the originating suite as additional context.
   * @param {GVAbstractTestSuite} testSuite - The test suite instance to add and monitor.
   */
  addTestSuite(testSuite: GVAbstractTestSuite): void {
    this.testSuites.push(testSuite);

    // Register handlers when the a test has started
    testSuite.onTestStarted((sender, event) => {
      // Re-emit
      this.#emitTestStarted({ ...event, suite: sender as GVAbstractTestSuite });
    });

    // Register handlers when the a test has updated
    testSuite.onTestUpdated((sender, event) => {
      // Re-emit
      this.#emitTestUpdated({ ...event, suite: sender as GVAbstractTestSuite });
    });

    // Register handlers when the a test has succeeded
    testSuite.onSuccess((sender, event) => {
      // Re-emit
      this.#emitSuccess({ ...event, suite: sender as GVAbstractTestSuite });
    });

    // Register handlers when the a test has failed
    testSuite.onFailure((sender, event) => {
      // Re-emit
      this.#emitFailure({ ...event, suite: sender as GVAbstractTestSuite });
    });
  }

  /**
   * Launches all test suites sequentially.
   * This method resets the completed suite counter, then executes each test suite
   * one after the other (not in parallel). Awaits each suite to ensure sequential execution.
   * @returns {Promise<void>} A promise that resolves once all test suites have completed.
   */
  async launchTestSuites(): Promise<void> {
    // Make sure no test suite is currently running
    if (this.getTestsRunning() > 0) throw new TestSuiteRunningError();

    // Reset the test suites
    this.resetTestSuites();

    // For each test suite, launch them one by one and awaiting on them so they don't run in parallel
    for (const testSuite of this.testSuites) {
      // We do want to await in a loop so the test suites are launched sequencially
      // eslint-disable-next-line no-await-in-loop
      await testSuite.launchTestSuite();
      // Increment the completed suites
      this.#suitesCompleted++;
    }
  }

  /**
   * Resets all test suites and the internal completed suites counter.
   * This is typically called to prepare for a new test run.
   */
  resetTestSuites(): void {
    // Make sure no test suite is currently running
    if (this.getTestsRunning() > 0) throw new TestSuiteRunningError();

    // Reset the completed suites
    this.#suitesCompleted = 0;

    // Reset each test suite
    this.testSuites.forEach((testSuite) => {
      // Reset the test suite
      testSuite.resetTestSuite();
    });
  }

  /**
   * Gets the description, in html format, for all the Test Suites part of this Plugin.
   * @returns {string} The description of all test suites.
   */
  getDescriptionAsHtml(): string {
    // For each Test Suite
    return this.testSuites.map((suite) => suite.getDescriptionAsHtml()).join('<br/>');
  }

  /**
   * Gets the number of test suites that have been completed.
   * Caution, a test suite can be completed even though some tests are still running, depending
   * on the promises management in the suite.
   * @returns {number} The number of completed test suites.
   */
  getSuitesCompleted(): number {
    return this.#suitesCompleted;
  }

  /**
   * Gets the total number of test suites.
   *@returns {number} The total count of test suites.
   */
  getSuitesTotal(): number {
    return this.testSuites.length;
  }

  /**
   * Gets if the test suite is done its launch.
   * Caution, a test suite can be done even though some tests are still running, depending
   * on the promises management in the suite.
   * @returns {number} The number of completed test suites.
   */
  getSuitesDone(): boolean {
    return this.getSuitesCompleted() === this.getSuitesTotal();
  }

  /**
   * Gets the total number of tests currently running across all test suites.
   * @returns {number} The number of tests that are currently running.
   */
  getTestsRunning(): number {
    // For each test suite
    return this.testSuites.reduce((total, testSuite) => {
      return total + testSuite.getTestsRunning();
    }, 0);
  }

  /**
   * Gets the total number of tests completed across all test suites.
   * @returns {number} The number of completed tests.
   */
  getTestsDone(): number {
    // For each test suite
    return this.testSuites.reduce((total, testSuite) => {
      return total + testSuite.getTestsDone();
    }, 0);
  }

  /**
   * Gets the total number of currently done successfully across all test suites.
   * @returns {number} The total number of tests done.
   */
  getTestsDoneSuccess(): number {
    // For each test suite
    return this.testSuites.reduce((total, testSuite) => {
      return total + testSuite.getTestsDoneSuccess();
    }, 0);
  }

  /**
   * Gets the total number of currently done failed across all test suites
   * @returns {number} The total number of tests done.
   */
  getTestsDoneFailed(): number {
    // For each test suite
    return this.testSuites.reduce((total, testSuite) => {
      return total + testSuite.getTestsDoneFailed();
    }, 0);
  }

  /**
   * Gets the total number of tests across all test suites.
   * @returns {number} The total number of tests.
   */
  getTestsTotal(): number {
    // For each test suite
    return this.testSuites.reduce((total, testSuite) => {
      return total + testSuite.getTestsTotal();
    }, 0);
  }

  /**
   * Gets if all tests are done.
   * @returns {boolean} Indicate if the tests are all done across all test suites.
   */
  getTestsDoneAll(): boolean {
    return this.testSuites.every((suite) => suite.getTestsDoneAll());
  }

  /**
   * Gets if all the tests are done across all test suites.
   * @returns {boolean} Indicate if the tests are all done across all test suites.
   */
  getTestsDoneAllAndSuiteDone(): boolean {
    return this.getSuitesDone() && this.getTestsDoneAll();
  }

  /**
   * Gets if all the tests are done and successfully.
   * @returns {boolean} Indicate if the tests are all done and finished successfully.
   */
  getTestsDoneAllSuccess(): boolean {
    return this.getTestsDoneAll() && this.testSuites.every((suite) => suite.getTestsDoneAllSuccess());
  }

  /**
   * Gets if all the tests are done and successfully and the test suite is done.
   * @returns {boolean} Indicate if the tests are all done and finished successfully and the test suite is done.
   */
  getTestsDoneAllSuccessAndSuiteDone(): boolean {
    return this.getSuitesDone() && this.getTestsDoneAllSuccess();
  }

  // #region EVENTS

  /**
   * Emits an event to all handlers.
   * @param {SuiteTesterTestEvent} event - The event to emit
   * @private
   */
  #emitTestStarted(event: SuiteTesterTestEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onSuiteTestersTestStartedHandlers, event);
  }

  /**
   * Registers a test started event handler.
   * @param {SuiteTesterTestDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onTestStarted(callback: SuiteTesterTestDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onSuiteTestersTestStartedHandlers, callback);
  }

  /**
   * Unregisters a test started event handler.
   * @param {SuiteTesterTestDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offTestStarted(callback: SuiteTesterTestDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onSuiteTestersTestStartedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {SuiteTesterTestUpdatedEvent} event - The event to emit
   * @private
   */
  #emitTestUpdated(event: SuiteTesterTestUpdatedEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onSuiteTestersTestUpdatedHandlers, event);
  }

  /**
   * Registers a test updated event handler.
   * @param {SuiteTesterTestUpdatedDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onTestUpdated(callback: SuiteTesterTestUpdatedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onSuiteTestersTestUpdatedHandlers, callback);
  }

  /**
   * Unregisters a test updated event handler.
   * @param {SuiteTesterTestUpdatedDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offTestUpdated(callback: SuiteTesterTestUpdatedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onSuiteTestersTestUpdatedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {SuiteTesterSuccessEvent} event - The event to emit
   * @private
   */
  #emitSuccess(event: SuiteTesterSuccessEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onSuiteTestersTestSuccessHandlers, event);
  }

  /**
   * Registers a success event handler.
   * @param {SuiteTesterSuccessDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onSuccess(callback: SuiteTesterSuccessDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onSuiteTestersTestSuccessHandlers, callback);
  }

  /**
   * Unregisters a success event handler.
   * @param {SuiteTesterSuccessDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offSuccess(callback: SuiteTesterSuccessDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onSuiteTestersTestSuccessHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {SuiteTesterFailureEvent} event - The event to emit
   * @private
   */
  #emitFailure(event: SuiteTesterFailureEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onSuiteTestersTestFailureHandlers, event);
  }

  /**
   * Registers a failure event handler.
   * @param {SuiteTesterFailureDelegate} callback - The callback to be executed whenever the event is emitted
   */
  onFailure(callback: SuiteTesterFailureDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onSuiteTestersTestFailureHandlers, callback);
  }

  /**
   * Unregisters a failure event handler.
   * @param {SuiteTesterFailureDelegate} callback - The callback to stop being called whenever the event is emitted
   */
  offFailure(callback: SuiteTesterFailureDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onSuiteTestersTestFailureHandlers, callback);
  }

  // #endregion EVENTS
}

/**
 * Define an event for the delegate
 */
export interface SuiteTesterTestEvent extends TesterTestEvent {
  suite: GVAbstractTestSuite;
}

/**
 * Define a delegate for the event handler function signature
 */
export type SuiteTesterTestDelegate = EventDelegateBase<TestSuitePlugin, SuiteTesterTestEvent, void>;

/**
 * Define an event for the delegate
 */
export interface SuiteTesterTestUpdatedEvent extends TesterTestUpdatedEvent {
  suite: GVAbstractTestSuite;
}

/**
 * Define a delegate for the event handler function signature
 */
export type SuiteTesterTestUpdatedDelegate = EventDelegateBase<TestSuitePlugin, SuiteTesterTestUpdatedEvent, void>;

/**
 * Define an event for the delegate
 */
export interface SuiteTesterSuccessEvent extends TesterSuccessEvent {
  suite: GVAbstractTestSuite;
}

/**
 * Define a delegate for the event handler function signature
 */
export type SuiteTesterSuccessDelegate = EventDelegateBase<TestSuitePlugin, SuiteTesterSuccessEvent, void>;

/**
 * Define an event for the delegate
 */
export interface SuiteTesterFailureEvent extends TesterFailureEvent {
  suite: GVAbstractTestSuite;
}

/**
 * Define a delegate for the event handler function signature
 */
export type SuiteTesterFailureDelegate = EventDelegateBase<TestSuitePlugin, SuiteTesterFailureEvent, void>;

export type TestSuitePluginConfig = {
  suites: string[];
};

export default TestSuitePlugin;

// GV This if condition took over 3 days to investigate. It was giving errors on the app.geo.ca website with
// GV some conflicting reacts being loaded on the page for some obscure reason.
// Check if we're on the right react
if (React === window.cgpv.reactUtilities.react) {
  // Keep a reference to the GeoChartPlugin as part of the geoviewPlugins property stored in the window object
  window.geoviewPlugins = window.geoviewPlugins || {};
  window.geoviewPlugins['test-suite'] = TestSuitePlugin;
} // Else ignore, don't keep it on the window, wait for the right react load
