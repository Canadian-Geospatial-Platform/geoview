/* eslint-disable max-classes-per-file */

// Custom error class for methods that are not implemented
export class NotImplementedError extends Error {
  /**
   * Constructor to initialize the NotImplementedError with an optional message.
   * Default message is "This method is not implemented."
   * @param message - The error message (optional)
   */
  constructor(message: string = 'This method is not implemented.') {
    // Pass the message to the parent Error class
    super(message);

    // Set a custom name for this error type
    this.name = 'NotImplementedError';

    // Capture the stack trace for V8 engines (e.g., Chrome, Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, NotImplementedError);
    }

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, NotImplementedError.prototype);
  }
}

// Custom error class for abort-related errors, typically used in fetch or async operations
export class AbortError extends Error {
  // The AbortSignal that triggered the error (optional)
  abortSignal: AbortSignal | null;

  /**
   * Constructor to initialize the AbortError with a message and an optional AbortSignal.
   * @param message - The error message
   * @param abortSignal - The optional AbortSignal that caused the error
   */
  constructor(message: string = 'Aborted', abortSignal: AbortSignal | null = null) {
    // Call the parent constructor with the provided message
    super(message);

    // Set the custom error name
    this.name = 'AbortError';

    // Store the abort signal if provided
    this.abortSignal = abortSignal;

    // Capture the stack trace if supported (e.g., V8 engines)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AbortError);
    }

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, AbortError.prototype);
  }

  /**
   * Utility function to check if an error is an instance of AbortError.
   * This is useful for handling errors thrown by fetch or other asynchronous operations.
   * @param {unknown} error - The error to check
   * @returns {boolean} Returns true if the error is an AbortError, false otherwise
   */
  static isAbortError(error: unknown): boolean {
    return error instanceof Error && error.name === 'AbortError';
  }
}

// Custom error class for fetch responses that turn out to be empty
export class EmptyResponseError extends Error {
  /**
   * Constructor to initialize the NotImplementedError with an optional message.
   * Default message is "This method is not implemented."
   * @param message - The error message (optional)
   */
  constructor(message: string = 'Empty response.') {
    // Pass the message to the parent Error class
    super(message);

    // Set a custom name for this error type
    this.name = 'EmptyResponseError';

    // Capture the stack trace for V8 engines (e.g., Chrome, Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, EmptyResponseError);
    }

    // Set the prototype explicitly to ensure correct inheritance (recommended by TypeScript documentation)
    // This is to handle the prototype chain correctly when extending built-in classes like Error
    Object.setPrototypeOf(this, EmptyResponseError.prototype);
  }
}
