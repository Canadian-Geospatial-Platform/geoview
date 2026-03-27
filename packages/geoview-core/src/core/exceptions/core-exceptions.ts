/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files

// Classes in this file mostly inherit Error.

/**
 * Normalizes any thrown value to a standard `Error` instance.
 *
 * This is useful in `try/catch` blocks where the caught value might not be
 * an instance of `Error` (e.g., a string, number, or object).
 *
 * @param error - The caught value or error-like object
 * @returns A valid `Error` instance for consistent error handling
 */
export function formatError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Custom error to indicate that a method or functionality has not been implemented.
 *
 * This is typically used as a placeholder in abstract classes or stub methods.
 */
export class NotImplementedError extends Error {
  /**
   * Creates a new NotImplementedError.
   *
   * @param message - Optional error message
   */
  constructor(message: string = 'This method is not implemented.') {
    // Call the base Error constructor with the provided message
    super(message);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'NotImplementedError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotImplementedError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}

/**
 * Error thrown when an operation or feature is not supported in the current context.
 *
 * This is typically used when the code is reaching outside the scope for which it was defined.
 */
export class NotSupportedError extends Error {
  /**
   * Creates a new NotSupportedError.
   *
   * @param message - Optional error message
   */
  constructor(message: string = 'This operation is not supported.') {
    super(message);

    this.name = 'NotSupportedError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotImplementedError);
    }

    // Ensure correct prototype chain
    Object.setPrototypeOf(this, NotSupportedError.prototype);
  }
}

/**
 * Error thrown to indicate that an operation was explicitly cancelled.
 *
 * This is useful in scenarios where cancellation is part of expected control flow.
 */
export class CancelledError extends Error {
  /**
   * Creates an instance of CancelledError.
   *
   * @param message - A custom error message explaining the cancellation
   */
  constructor(message: string = 'This has been cancelled.') {
    // Call the base Error constructor with the provided message
    super(message);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'CancelledError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, CancelledError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, CancelledError.prototype);
  }
}

/**
 * A wrapper class for Promise rejection errors that associates an additional object with the error.
 *
 * Useful for returning contextual information (like a config or source object) alongside the error in a rejection handler.
 *
 * @template T - The type of the associated object
 */
export class PromiseRejectErrorWrapper<T> extends Error {
  /** The original error associated with the Promise rejection. */
  readonly error: Error;

  /** The associated object providing context about the rejection. */
  readonly object: T;

  /**
   * Creates an instance of PromiseRejectErrorWrapper.
   *
   * @param error - The real error (will be formatted to Error if not Error already) associated with the promise rejection
   * @param object - An object of interest associated with the rejection Error
   */
  constructor(error: unknown, object: T) {
    super('Wraps the error with an object for a Promise rejection');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'PromiseRejectErrorWrapper';

    // Keep the error and the object associated with it
    this.error = formatError(error);
    this.object = object;

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PromiseRejectErrorWrapper);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, PromiseRejectErrorWrapper.prototype);
  }

  /**
   * Returns the inner error if the given error is an instance of PromiseRejectErrorWrapper; otherwise returns the error itself.
   *
   * Useful for unwrapping errors uniformly in catch blocks without manually checking types.
   *
   * @param error - The error to check and potentially unwrap
   * @returns The inner wrapped error or the original error as-is
   */
  static checkAndUnwrapError(error: Error): Error {
    return error instanceof PromiseRejectErrorWrapper ? error.error : error;
  }
}

/**
 * A custom error class to represent network-related errors.
 */
export class NetworkError extends Error {
  /** The network error code */
  readonly code: string;

  /**
   * Creates an instance of NetworkError.
   *
   * @param message - The message of the network error
   * @param code - The http code of the network error
   * @param cause - Optional, the inner cause of the error
   */
  constructor(message: string, code: string, cause?: Error) {
    super(message, { cause });

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'NetworkError';

    // Keep the error code and cause
    this.code = code;

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NetworkError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, NetworkError.prototype);
  }
}

/**
 * Custom error class for abort-related errors, typically used in fetch or async operations
 * where an operation is aborted due to an `AbortSignal`.
 */
export class RequestAbortedError extends Error {
  /** The AbortSignal that triggered the error (optional) */
  readonly abortSignal: AbortSignal;

  /**
   * Creates an instance of RequestAbortedError.
   *
   * @param abortSignal - The AbortSignal that caused the error
   */
  constructor(abortSignal: AbortSignal) {
    super('Aborted');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'RequestAbortedError';

    // Store the AbortSignal if provided; it can be useful for debugging or handling specific abort scenarios
    this.abortSignal = abortSignal;

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestAbortedError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, RequestAbortedError.prototype);
  }
}

/**
 * Error thrown when a request exceeds the configured timeout duration.
 *
 * This error is typically used to indicate that an asynchronous operation (such as a network request)
 * did not complete within the allowed time limit and was aborted or failed due to timeout.
 */
export class RequestTimeoutError extends Error {
  /**
   * Creates an instance of RequestTimeoutError.
   *
   * @param timeoutMs - The timeout duration in milliseconds that was exceeded
   */
  constructor(timeoutMs: number) {
    super(`Request timed out after ${timeoutMs}ms`);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'RequestTimeoutError';

    // Capture the stack trace (V8-specific, e.g., Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, RequestTimeoutError);
    }

    // Ensure the prototype chain is correct (required in some transpilation targets)
    Object.setPrototypeOf(this, RequestTimeoutError.prototype);
  }
}

/**
 * Custom error class for handling fetch response errors when the fetch request fails
 * due to a non-success HTTP status.
 */
export class ResponseError extends Error {
  /**
   * Creates an instance of ResponseError.
   *
   * The default message includes the HTTP status and status text from the failed fetch response.
   *
   * @param response - The fetch `Response` object that caused the error, including status code and status text
   */
  constructor(response: Response) {
    // Generate an error message using the response's status and statusText
    super(`Fetch error, status was: ${response.status} and status text was: ${response.statusText}`);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'ResponseError';

    // Capture the stack trace (V8-specific engines like Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResponseError);
    }

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, ResponseError.prototype);
  }
}

/**
 * Custom error class for handling fetch response errors where the response body is empty.
 *
 * This is typically used when a fetch request returns a successful status but no content.
 */
export class ResponseEmptyError extends Error {
  /**
   * Creates an instance of ResponseEmptyError.
   *
   * The default message indicates that the response was empty, but a custom message can be provided for more context.
   *
   * @param message - Optional error message
   */
  constructor(message: string = 'Empty response.') {
    // Pass the provided message (or default message) to the parent Error class
    super(message);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'ResponseEmptyError';

    // Capture the stack trace (V8-specific engines like Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResponseEmptyError);
    }

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, ResponseEmptyError.prototype);
  }
}

/**
 * Custom error class for handling fetch response errors where the response body has an error inside of it.
 *
 * This is typically used when a fetch request returns a successful status but with error in the content itself.
 */
export class ResponseContentError extends Error {
  /**
   * Creates an instance of ResponseContentError.
   *
   * The default message indicates that the response contained an error in its content, but a custom message can be provided for more context.
   *
   * @param message - Optional error message
   */
  constructor(message: string = 'Response contained an error in its content.') {
    // Pass the provided message (or default message) to the parent Error class
    super(message);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'ResponseContentError';

    // Capture the stack trace (V8-specific engines like Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResponseContentError);
    }

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, ResponseContentError.prototype);
  }
}

/**
 * Error thrown when a response does not match the expected type.
 */
export class ResponseTypeError extends Error {
  /** The expected type description */
  readonly expectedType: string;

  /** The actual value that was received and caused the mismatch. */
  readonly receivedContent: unknown;

  /**
   * Creates an instance of ResponseTypeError.
   *
   * @param expectedType - The expected type description
   * @param receivedContent - The actual value that was received
   * @param message - Optional error message
   */
  constructor(
    expectedType: string,
    receivedContent: unknown,
    message: string = `Expected response type invalid, was expecting '${expectedType}'.`
  ) {
    // Pass the provided message (or default message) to the parent Error class
    super(message);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'ResponseTypeError';

    // Keep attributes
    this.expectedType = expectedType;
    this.receivedContent = receivedContent;

    // Capture the stack trace (V8-specific engines like Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, ResponseTypeError);
    }

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, ResponseTypeError.prototype);
  }
}

/**
 * Custom error class for handling invalid dates.
 */
export class InvalidDateError extends Error {
  /**
   * Creates an instance of InvalidDateError.
   *
   * The default message indicates that the date is invalid, but a custom message can be provided for more context.
   *
   * @param date - The invalid date
   */
  constructor(date: string) {
    // Pass the provided message (or default message) to the parent Error class
    super(`Invalid date ${date}`);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'InvalidDateError';

    // Capture the stack trace (V8-specific engines like Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidDateError);
    }

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, InvalidDateError.prototype);
  }
}

/**
 * Custom error class for handling invalid time IANA formats.
 */
export class InvalidTimezoneError extends Error {
  /**
   * Creates an instance of InvalidTimezoneError.
   *
   * The default message indicates that the timezone is invalid, but a custom message can be provided for more context.
   *
   * @param timezone - The invalid timezone
   */
  constructor(timezone: string) {
    // Pass the provided message (or default message) to the parent Error class
    super(`Invalid timezone ${timezone}`);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'InvalidTimezoneError';

    // Capture the stack trace (V8-specific engines like Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidTimezoneError);
    }

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, InvalidTimezoneError.prototype);
  }
}

/**
 * Custom error class for handling invalid time dimensions.
 */
export class InvalidTimeDimensionError extends Error {
  /**
   * Creates an instance of InvalidTimeDimensionError.
   *
   * The default message indicates that the time dimension is invalid, but a custom message can be provided for more context.
   *
   * @param dimension - The invalid time dimension
   */
  constructor(dimension: string) {
    // Pass the provided message (or default message) to the parent Error class
    super(`Invalid time dimension ${dimension}`);

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'InvalidTimeDimensionError';

    // Capture the stack trace (V8-specific engines like Chrome and Node.js)
    // Omits the constructor call from the trace for cleaner debugging
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, InvalidTimeDimensionError);
    }

    // Ensure correct inheritance (important for transpilation targets)
    Object.setPrototypeOf(this, InvalidTimeDimensionError.prototype);
  }
}
