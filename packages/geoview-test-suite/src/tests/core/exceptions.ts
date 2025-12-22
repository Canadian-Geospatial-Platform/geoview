/* eslint-disable max-classes-per-file */

import type { ClassType } from 'geoview-core/core/types/global-types';

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
 * Custom error to indicate that a value wasn't as expected.
 * @extends {AssertionError}
 */
export class AssertionValueDifferentError extends AssertionError {
  /**
   * Creates a new AssertionValueError.
   * @param {unknown} actual - Actual value.
   */
  constructor(actual: unknown) {
    // Call the base Error constructor with the provided message
    super(`Value is '${actual}', and was expected to be different.`, actual, actual);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionValueDifferentError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionValueDifferentError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionValueDifferentError.prototype);
  }
}

/**
 * Custom error to indicate that a value is not an array when expected to be.
 * @extends {AssertionError}
 */
export class AssertionValueNotAnArrayError extends AssertionError {
  /**
   * Creates a new AssertionValueNotAnArrayError.
   * @param {unknown} actual - Actual value.
   */
  constructor(actual: unknown) {
    // Call the base Error constructor with the provided message
    super(`Value is not an array, got '${typeof actual}'.`, actual, 'Array');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionValueNotAnArrayError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionValueNotAnArrayError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionValueNotAnArrayError.prototype);
  }
}

/**
 * Custom error to indicate that a test was manually failed by the developer.
 * @extends {AssertionError}
 */
export class AssertionManualFailError extends AssertionError {
  /**
   * Creates a new AssertionManualFailError.
   * @param {string} message - Custom message explaining why the test was manually failed.
   */
  constructor(message: string = 'Test manually failed') {
    // Call the base Error constructor with the provided message
    super(message);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionManualFailError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionManualFailError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionManualFailError.prototype);
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
 * Custom error to indicate that a value was unexpectedly defined.
 * @extends {AssertionError}
 */
export class AssertionDefinedError extends AssertionError {
  /**
   * Creates a new AssertionDefinedError.
   * @param {string} propertyPath - The name or path of the property that was undefined.
   */
  constructor(propertyPath: string, actualValue: unknown) {
    // Call the base Error constructor with the provided message
    super(`Value for '${propertyPath}' was defined.`, actualValue, undefined);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionDefinedError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionDefinedError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionDefinedError.prototype);
  }
}

/**
 * Custom error to indicate that a value was of wrong instance.
 * @extends {AssertionError}
 */
export class AssertionWrongInstanceError<T> extends AssertionError {
  /**
   * Creates a new AssertionWrongInstanceError.
   * @param {any} actualObject - The actual object.
   * @param {Type} expectedClassType - The expected class.
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  constructor(actualObject: any, expectedClassType: ClassType<T>) {
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
 * Custom error to indicate that no Error was thrown when one was expected (true negative tests).
 * @extends {AssertionError}
 */
export class AssertionNoErrorThrownError<T> extends AssertionError {
  /**
   * Creates a new AssertionNoErrorThrownError.
   * @param {Type} expectedClassType - The expected class.
   */
  constructor(expectedClassType: ClassType<T>) {
    // Call the base Error constructor with the provided message
    super(`No error was thrown when an error '${expectedClassType.name}' was expected.`, undefined, expectedClassType);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionNoErrorThrownError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionNoErrorThrownError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionNoErrorThrownError.prototype);
  }
}

/**
 * Custom error to indicate that an error was of wrong instance.
 * @extends {AssertionError}
 */
export class AssertionWrongErrorInstanceError<T> extends AssertionError {
  /**
   * Creates a new AssertionWrongErrorInstanceError.
   * @param {Error} actualError - The actual error object.
   * @param {Type} expectedClassType - The expected class.
   */
  constructor(actualError: Error, expectedClassType: ClassType<T>) {
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
 * Custom error to indicate that an array did not have the minimum expected length.
 * @extends {AssertionError}
 */
export class AssertionArrayLengthMinimalError extends AssertionError {
  /**
   * Creates a new AssertionArrayLengthMinimalError.
   * @param {number | undefined} actualLength - Actual array length.
   * @param {number} expectedLength - Expected array length.
   */
  constructor(actualLength: number | undefined, expectedLength: number) {
    // Call the base Error constructor with the provided message
    super(`Array length is ${actualLength}, expected was at least ${expectedLength}`, actualLength, expectedLength);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionArrayLengthMinimalError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionArrayLengthMinimalError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionArrayLengthMinimalError.prototype);
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
 * Custom error to indicate that two arrays are not equal (they differ at a specific position).
 * @extends {AssertionError}
 */
export class AssertionArraysNotEqualError<T> extends AssertionError {
  /**
   * Creates a new AssertionArraysNotEqualError.
   * @param {T[] | undefined} array1 - First array (expected).
   * @param {T[] | undefined} array2 - Second array (actual).
   * @param {number} index - Index where the arrays differ.
   * @param {T} expectedValue - Expected value at the index.
   * @param {T} actualValue - Actual value at the index.
   */
  constructor(array1: T[] | undefined, array2: T[] | undefined, index: number, expectedValue: T, actualValue: T) {
    // Call the base Error constructor with the provided message
    super(
      `The 2 provided arrays differ at position index ${index}, expected value was '${expectedValue}' but found '${actualValue}'.`,
      array2,
      array1
    );

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'AssertionArraysNotEqualError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AssertionArraysNotEqualError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, AssertionArraysNotEqualError.prototype);
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
