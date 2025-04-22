/* eslint-disable max-classes-per-file */
// We want more than 1 Error class here to save files

// Classes in this file mostly inherit Error.

/**
 * Custom error to indicate that a method or functionality has not been implemented.
 * This is typically used as a placeholder in abstract classes or stub methods.
 * @extends {Error}
 */
export class NotImplementedError extends Error {
  /**
   * Creates a new NotImplementedError.
   * @param {string} message - Optional error message.
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
 * Error thrown to indicate that an operation was explicitly cancelled.
 * This is useful in scenarios where cancellation is part of expected control flow.
 * @extends {Error}
 */
export class CancelledError extends Error {
  /**
   * Creates an instance of CancelledError.
   *
   * @param {string} message - A custom error message explaining the cancellation.
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
 * Useful for returning contextual information (like a config or source object) alongside the error in a rejection handler.
 * @template T - The type of the associated object.
 * @extends {Error}
 */
export class PromiseRejectErrorWrapper<T> extends Error {
  /** The original error associated with the Promise rejection. */
  error: Error;

  /** The associated object providing context about the rejection. */
  object: T;

  /**
   * Constructor to initialize the PromiseRejectErrorWrapper with the Error and the related object.
   * @param {Error} error - The real Error associated with the promise rejection.
   * @param {T} object - An object of interest associated with the rejection Error.
   */
  constructor(error: Error, object: T) {
    super('Wraps the error with an object for a Promise rejection');

    // Set a custom name for the error type to differentiate it from other error types
    this.name = 'PromiseRejectErrorWrapper';

    // Keep the error and the object associated with it
    this.error = error;
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
   * Useful for unwrapping errors uniformly in catch blocks without manually checking types.
   * @param {Error} error - The error to check and potentially unwrap.
   * @returns {Error} The inner wrapped error or the original error as-is.
   */
  static checkAndUnwrapError(error: Error): Error {
    return error instanceof PromiseRejectErrorWrapper ? error.error : error;
  }
}

/**
 * Custom error class for handling fetch response errors when the fetch request fails
 * due to a non-success HTTP status.
 * @extends {Error}
 */
export class ResponseError extends Error {
  /**
   * Constructor to initialize the ResponseError with the response details.
   * The default message includes the HTTP status and status text from the failed fetch response.
   * @param {Response} response - The fetch `Response` object that caused the error, including status code and status text.
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
 * This is typically used when a fetch request returns a successful status but no content.
 * @extends {Error}
 */
export class ResponseEmptyError extends Error {
  /**
   * Constructor to initialize the ResponseEmptyError with an optional message.
   * The default message is "Empty response." to indicate that the response body was empty.
   * @param {string} message - The optional error message.
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
 * Custom error class for abort-related errors, typically used in fetch or async operations
 * where an operation is aborted due to an `AbortSignal`.
 * @extends {Error}
 */
export class RequestAbortedError extends Error {
  /** The AbortSignal that triggered the error (optional) */
  abortSignal: AbortSignal;

  /**
   * Constructor to initialize the AbortError with a message and an optional AbortSignal.
   * @param {AbortSignal} abortSignal - The optional AbortSignal that caused the error
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
 * This error is typically used to indicate that an asynchronous operation (such as a network request)
 * did not complete within the allowed time limit and was aborted or failed due to timeout.
 * @extends {Error}
 */
export class RequestTimeoutError extends Error {
  /**
   * Creates an instance of RequestTimeoutError.
   * @param {number} timeoutMs - The timeout duration in milliseconds that was exceeded.
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
