/* eslint-disable max-classes-per-file */

import type { ClassType } from './test';

/**
 * Custom error to indicate that an test execution (not an Assertion) has failed.
 * @extends {Error}
 */
export class TestError extends Error {
  /**
   * Creates a new TestError.
   * @param {string} message - Error message.
   */
  constructor(message: string = 'Test failed') {
    // Call the base Error constructor with the provided message
    super(message);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'TestError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TestError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, TestError.prototype);
  }
}

/**
 * Custom error to indicate that a test suite is currently running and shouldn't be interfered with.
 * @extends {Error}
 */
export class TestSuiteRunningError extends Error {
  /**
   * Creates a new TestSuiteRunningError.
   * @param {string} message - Error message.
   */
  constructor(message: string = 'The Test Suite is currently running.') {
    // Call the base Error constructor with the provided message
    super(message);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'TestSuiteRunningError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TestSuiteRunningError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, TestSuiteRunningError.prototype);
  }
}

/**
 * Custom error to indicate that a test suite cannot execute, failing its preconditions.
 * @extends {Error}
 */
export class TestSuiteCannotExecuteError extends Error {
  /**
   * Creates a new TestSuiteCannotExecuteError.
   */
  constructor(message = 'The Test Suite cannot be executed.') {
    // Call the base Error constructor with the provided message
    super(message);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'TestSuiteCannotExecuteError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TestSuiteCannotExecuteError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, TestSuiteCannotExecuteError.prototype);
  }
}

/**
 * Abstract Assertion Error to indicate that an assertion check has failed.
 * @extends {Error}
 */
export abstract class AssertionError extends Error {
  /**
   * Creates a new AssertionError.
   * @param {string} message - Error message.
   * @param {unknown | undefined} actual - Actual value.
   * @param {unknown | undefined} expected - Expected value.
   */
  protected constructor(
    message: string = 'Assertion failed',
    public actual?: unknown,
    public expected?: unknown
  ) {
    // Call the base Error constructor with the provided message
    super(message);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionError.prototype);
  }
}

/**
 * Custom error to indicate that a value wasn't as expected.
 * @extends {AssertionError}
 */
export class AssertionValueError extends AssertionError {
  /**
   * Creates a new AssertionValueError.
   * @param {unknown} actual - Actual value.
   * @param {unknown} expected - Expected value.
   */
  constructor(actual: unknown, expected: unknown) {
    // Call the base Error constructor with the provided message
    super(`Value is '${actual}', expected was '${expected}'.`, actual, expected);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionValueError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionValueError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionValueError.prototype);
  }
}

/**
 * Custom error to indicate that a value was unexpectedly undefined.
 * @extends {AssertionError}
 */
export class AssertionUndefinedError extends AssertionError {
  /**
   * Creates a new AssertionUndefinedError.
   * @param {string} propertyPath - The name or path of the property that was undefined.
   */
  constructor(propertyPath: string) {
    // Call the base Error constructor with the provided message
    super(`Value for '${propertyPath}' was undefined.`, undefined, undefined);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionUndefinedError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionUndefinedError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionUndefinedError.prototype);
  }
}

/**
 * Custom error to indicate that a value was of wrong instance.
 * @extends {AssertionError}
 */
export class AssertionWrongInstanceError extends AssertionError {
  /**
   * Creates a new AssertionWrongInstanceError.
   * @param {any} actualObject - The actual object.
   * @param {Type} expectedClassType - The expected class.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(actualObject: any, expectedClassType: ClassType) {
    // Call the base Error constructor with the provided message
    super(
      `Value class instance is '${actualObject.constructor.name}', expected was '${expectedClassType.name}'.`,
      actualObject,
      expectedClassType
    );

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionWrongInstanceError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionWrongInstanceError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionWrongInstanceError.prototype);
  }
}

/**
 * Custom error to indicate that an error was of wrong instance.
 * @extends {AssertionError}
 */
export class AssertionWrongErrorInstanceError extends AssertionError {
  /**
   * Creates a new AssertionWrongErrorInstanceError.
   * @param {Error} actualError - The actual error object.
   * @param {Type} expectedClassType - The expected class.
   */
  constructor(actualError: Error, expectedClassType: ClassType) {
    // Call the base Error constructor with the provided message
    super(
      `Error '${actualError.message}' instance is '${actualError.constructor.name}', expected was '${expectedClassType.name}'.`,
      actualError,
      expectedClassType
    );

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionWrongErrorInstanceError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionWrongErrorInstanceError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionWrongErrorInstanceError.prototype);
  }
}

/**
 * Custom error to indicate that an array did not have the expected length.
 * @extends {AssertionError}
 */
export class AssertionArrayLengthError extends AssertionError {
  /**
   * Creates a new AssertionArrayLengthError.
   * @param {number | undefined} actualLength - Actual array length.
   * @param {number} expectedLength - Expected array length.
   */
  constructor(actualLength: number | undefined, expectedLength: number) {
    // Call the base Error constructor with the provided message
    super(`Array length is ${actualLength}, expected was ${expectedLength}`, actualLength, expectedLength);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionArrayLengthError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionArrayLengthError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionArrayLengthError.prototype);
  }
}

/**
 * Custom error to indicate that an array did not include the expected value (so the inclusion failed).
 * @extends {AssertionError}
 */
export class AssertionArrayIncludingError<T> extends AssertionError {
  /**
   * Creates a new AssertionArrayIncludingError.
   * @param {T[] | undefined} array - Actual array.
   * @param {T} expectedValue - Expected value in the array.
   */
  constructor(array: T[] | undefined, expectedValue: T) {
    // Call the base Error constructor with the provided message
    super(`Array does not include ${expectedValue}`, array, expectedValue);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionArrayIncludingError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionArrayIncludingError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionArrayIncludingError.prototype);
  }
}

/**
 * Custom error to indicate that an array did included a particular value (so the exclusion failed).
 * @extends {AssertionError}
 */
export class AssertionArrayExcludingError<T> extends AssertionError {
  /**
   * Creates a new AssertionArrayExcludingError.
   * @param {T[] | undefined} array - Actual array.
   * @param {T} expectedValue - Expected value in the array.
   */
  constructor(array: T[] | undefined, expectedValue: T) {
    // Call the base Error constructor with the provided message
    super(`Array includes ${expectedValue}`, array, expectedValue);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionArrayExcludingError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionArrayExcludingError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionArrayExcludingError.prototype);
  }
}

/**
 * Custom error to indicate that an assertion check has failed.
 * @extends {AssertionError}
 */
export class AssertionJSONObjectError extends AssertionError {
  /**
   * Creates a new AssertionJSONObjectError.
   * @param {string[]} mismatchesPaths - The mismatches.
   * @param {unknown} actual - Actual value.
   * @param {unknown} expected - Expected value.
   */
  constructor(mismatchesPaths: string[], actual: unknown, expected: unknown) {
    // Call the base Error constructor with the provided message
    super('JSON objects have different property/values than expected.', actual, expected);

    // Format
    const mismatches = mismatchesPaths.map((path) => `- ${path}`).join('\n');

    // If actual and expected values
    if (mismatchesPaths) this.message += ` Mismatches are:\n${mismatches}.`;

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionJSONObjectError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionJSONObjectError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionJSONObjectError.prototype);
  }
}
