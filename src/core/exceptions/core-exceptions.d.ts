/**
 * Normalizes any thrown value to a standard `Error` instance.
 * This is useful in `try/catch` blocks where the caught value might not be
 * an instance of `Error` (e.g., a string, number, or object).
 * @param {unknown} error - The caught value or error-like object.
 * @returns {Error} A valid `Error` instance for consistent error handling.
 */
export declare function formatError(error: unknown): Error;
/**
 * Custom error to indicate that a method or functionality has not been implemented.
 * This is typically used as a placeholder in abstract classes or stub methods.
 * @extends {Error}
 */
export declare class NotImplementedError extends Error {
    /**
     * Creates a new NotImplementedError.
     * @param {string} message - Optional error message.
     */
    constructor(message?: string);
}
/**
 * Error thrown when an operation or feature is not supported in the current context.
 * This is typically used when the code is reaching outside the scope for which it was defined.
 * @extends {Error}
 */
export declare class NotSupportedError extends Error {
    /**
     * Creates a new NotSupportedError.
     * @param {string} message - Optional error message.
     */
    constructor(message?: string);
}
/**
 * Error thrown to indicate that an operation was explicitly cancelled.
 * This is useful in scenarios where cancellation is part of expected control flow.
 * @extends {Error}
 */
export declare class CancelledError extends Error {
    /**
     * Creates an instance of CancelledError.
     *
     * @param {string} message - A custom error message explaining the cancellation.
     */
    constructor(message?: string);
}
/**
 * A wrapper class for Promise rejection errors that associates an additional object with the error.
 * Useful for returning contextual information (like a config or source object) alongside the error in a rejection handler.
 * @template T - The type of the associated object.
 * @extends {Error}
 */
export declare class PromiseRejectErrorWrapper<T> extends Error {
    /** The original error associated with the Promise rejection. */
    readonly error: Error;
    /** The associated object providing context about the rejection. */
    readonly object: T;
    /**
     * Constructor to initialize the PromiseRejectErrorWrapper with the Error and the related object.
     * @param {unknown} error - The real error (will be formatted to Error if not Error already) associated with the promise rejection.
     * @param {T} object - An object of interest associated with the rejection Error.
     */
    constructor(error: unknown, object: T);
    /**
     * Returns the inner error if the given error is an instance of PromiseRejectErrorWrapper; otherwise returns the error itself.
     * Useful for unwrapping errors uniformly in catch blocks without manually checking types.
     * @param {Error} error - The error to check and potentially unwrap.
     * @returns {Error} The inner wrapped error or the original error as-is.
     */
    static checkAndUnwrapError(error: Error): Error;
}
/**
 * A custom error class to represent network-related errors.
 */
export declare class NetworkError extends Error {
    /** The network error code */
    readonly code: string;
    constructor(message: string, code: string, cause?: Error);
}
/**
 * Custom error class for abort-related errors, typically used in fetch or async operations
 * where an operation is aborted due to an `AbortSignal`.
 * @extends {Error}
 */
export declare class RequestAbortedError extends Error {
    /** The AbortSignal that triggered the error (optional) */
    readonly abortSignal: AbortSignal;
    /**
     * Constructor to initialize the AbortError with a message and an optional AbortSignal.
     * @param {AbortSignal} abortSignal - The optional AbortSignal that caused the error
     */
    constructor(abortSignal: AbortSignal);
}
/**
 * Error thrown when a request exceeds the configured timeout duration.
 * This error is typically used to indicate that an asynchronous operation (such as a network request)
 * did not complete within the allowed time limit and was aborted or failed due to timeout.
 * @extends {Error}
 */
export declare class RequestTimeoutError extends Error {
    /**
     * Creates an instance of RequestTimeoutError.
     * @param {number} timeoutMs - The timeout duration in milliseconds that was exceeded.
     */
    constructor(timeoutMs: number);
}
/**
 * Custom error class for handling fetch response errors when the fetch request fails
 * due to a non-success HTTP status.
 * @extends {Error}
 */
export declare class ResponseError extends Error {
    /**
     * Constructor to initialize the ResponseError with the response details.
     * The default message includes the HTTP status and status text from the failed fetch response.
     * @param {Response} response - The fetch `Response` object that caused the error, including status code and status text.
     */
    constructor(response: Response);
}
/**
 * Custom error class for handling fetch response errors where the response body is empty.
 * This is typically used when a fetch request returns a successful status but no content.
 * @extends {Error}
 */
export declare class ResponseEmptyError extends Error {
    /**
     * Constructor to initialize the ResponseEmptyError with an optional message.
     * The default message is "Empty response." to indicate that the response body was empty.
     * @param {string} message - The optional error message.
     */
    constructor(message?: string);
}
/**
 * Custom error class for handling fetch response errors where the response body has an error inside of it.
 * This is typically used when a fetch request returns a successful status but with error in the content itself.
 * @extends {Error}
 */
export declare class ResponseContentError extends Error {
    /**
     * Constructor to initialize the ResponseContentError with an optional message.
     * The default message is "Response contained an error in its content." to indicate that the response body contained an error.
     * @param {string} message - The optional error message.
     */
    constructor(message?: string);
}
/**
 * Error thrown when a response does not match the expected type.
 */
export declare class ResponseTypeError extends Error {
    /** The expected type description */
    readonly expectedType: string;
    /** The actual value that was received and caused the mismatch. */
    readonly receivedContent: unknown;
    constructor(expectedType: string, receivedContent: unknown, message?: string);
}
//# sourceMappingURL=core-exceptions.d.ts.map