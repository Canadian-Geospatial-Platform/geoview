/**
 * Normalizes any thrown value to a standard `Error` instance.
 *
 * This is useful in `try/catch` blocks where the caught value might not be
 * an instance of `Error` (e.g., a string, number, or object).
 *
 * @param error - The caught value or error-like object
 * @returns A valid `Error` instance for consistent error handling
 */
export declare function formatError(error: unknown): Error;
/**
 * Custom error to indicate that a method or functionality has not been implemented.
 *
 * This is typically used as a placeholder in abstract classes or stub methods.
 */
export declare class NotImplementedError extends Error {
    /**
     * Creates a new NotImplementedError.
     *
     * @param message - Optional error message
     */
    constructor(message?: string);
}
/**
 * Error thrown when an operation or feature is not supported in the current context.
 *
 * This is typically used when the code is reaching outside the scope for which it was defined.
 */
export declare class NotSupportedError extends Error {
    /**
     * Creates a new NotSupportedError.
     *
     * @param message - Optional error message
     */
    constructor(message?: string);
}
/**
 * Error thrown to indicate that an operation was explicitly cancelled.
 *
 * This is useful in scenarios where cancellation is part of expected control flow.
 */
export declare class CancelledError extends Error {
    /**
     * Creates an instance of CancelledError.
     *
     * @param message - A custom error message explaining the cancellation
     */
    constructor(message?: string);
}
/**
 * A wrapper class for Promise rejection errors that associates an additional object with the error.
 *
 * Useful for returning contextual information (like a config or source object) alongside the error in a rejection handler.
 *
 * @template T - The type of the associated object
 */
export declare class PromiseRejectErrorWrapper<T> extends Error {
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
    constructor(error: unknown, object: T);
    /**
     * Returns the inner error if the given error is an instance of PromiseRejectErrorWrapper; otherwise returns the error itself.
     *
     * Useful for unwrapping errors uniformly in catch blocks without manually checking types.
     *
     * @param error - The error to check and potentially unwrap
     * @returns The inner wrapped error or the original error as-is
     */
    static checkAndUnwrapError(error: Error): Error;
}
/**
 * A custom error class to represent network-related errors.
 */
export declare class NetworkError extends Error {
    /** The network error code */
    readonly code: string;
    /**
     * Creates an instance of NetworkError.
     *
     * @param message - The message of the network error
     * @param code - The http code of the network error
     * @param cause - Optional, the inner cause of the error
     */
    constructor(message: string, code: string, cause?: Error);
}
/**
 * Custom error class for abort-related errors, typically used in fetch or async operations
 * where an operation is aborted due to an `AbortSignal`.
 */
export declare class RequestAbortedError extends Error {
    /** The AbortSignal that triggered the error (optional) */
    readonly abortSignal: AbortSignal;
    /**
     * Creates an instance of RequestAbortedError.
     *
     * @param abortSignal - The AbortSignal that caused the error
     */
    constructor(abortSignal: AbortSignal);
}
/**
 * Error thrown when a request exceeds the configured timeout duration.
 *
 * This error is typically used to indicate that an asynchronous operation (such as a network request)
 * did not complete within the allowed time limit and was aborted or failed due to timeout.
 */
export declare class RequestTimeoutError extends Error {
    /**
     * Creates an instance of RequestTimeoutError.
     *
     * @param timeoutMs - The timeout duration in milliseconds that was exceeded
     */
    constructor(timeoutMs: number);
}
/**
 * Custom error class for handling fetch response errors when the fetch request fails
 * due to a non-success HTTP status.
 */
export declare class ResponseError extends Error {
    /**
     * Creates an instance of ResponseError.
     *
     * The default message includes the HTTP status and status text from the failed fetch response.
     *
     * @param response - The fetch `Response` object that caused the error, including status code and status text
     */
    constructor(response: Response);
}
/**
 * Custom error class for handling fetch response errors where the response body is empty.
 *
 * This is typically used when a fetch request returns a successful status but no content.
 */
export declare class ResponseEmptyError extends Error {
    /**
     * Creates an instance of ResponseEmptyError.
     *
     * The default message indicates that the response was empty, but a custom message can be provided for more context.
     *
     * @param message - Optional error message
     */
    constructor(message?: string);
}
/**
 * Custom error class for handling fetch response errors where the response body has an error inside of it.
 *
 * This is typically used when a fetch request returns a successful status but with error in the content itself.
 */
export declare class ResponseContentError extends Error {
    /**
     * Creates an instance of ResponseContentError.
     *
     * The default message indicates that the response contained an error in its content, but a custom message can be provided for more context.
     *
     * @param message - Optional error message
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
    /**
     * Creates an instance of ResponseTypeError.
     *
     * @param expectedType - The expected type description
     * @param receivedContent - The actual value that was received
     * @param message - Optional error message
     */
    constructor(expectedType: string, receivedContent: unknown, message?: string);
}
/**
 * Custom error class for handling invalid dates.
 */
export declare class InvalidDateError extends Error {
    /**
     * Creates an instance of InvalidDateError.
     *
     * The default message indicates that the date is invalid, but a custom message can be provided for more context.
     *
     * @param date - The invalid date
     */
    constructor(date: string);
}
/**
 * Custom error class for handling invalid time IANA formats.
 */
export declare class InvalidTimezoneError extends Error {
    /**
     * Creates an instance of InvalidTimezoneError.
     *
     * The default message indicates that the timezone is invalid, but a custom message can be provided for more context.
     *
     * @param timezone - The invalid timezone
     */
    constructor(timezone: string);
}
/**
 * Custom error class for handling invalid time dimensions.
 */
export declare class InvalidTimeDimensionError extends Error {
    /**
     * Creates an instance of InvalidTimeDimensionError.
     *
     * The default message indicates that the time dimension is invalid, but a custom message can be provided for more context.
     *
     * @param dimension - The invalid time dimension
     */
    constructor(dimension: string);
}
//# sourceMappingURL=core-exceptions.d.ts.map