export declare class NotImplementedError extends Error {
    /**
     * Constructor to initialize the NotImplementedError with an optional message.
     * Default message is "This method is not implemented."
     * @param message - The error message (optional)
     */
    constructor(message?: string);
}
export declare class AbortError extends Error {
    abortSignal: AbortSignal | null;
    /**
     * Constructor to initialize the AbortError with a message and an optional AbortSignal.
     * @param message - The error message
     * @param abortSignal - The optional AbortSignal that caused the error
     */
    constructor(message?: string, abortSignal?: AbortSignal | null);
    /**
     * Utility function to check if an error is an instance of AbortError.
     * This is useful for handling errors thrown by fetch or other asynchronous operations.
     * @param {unknown} error - The error to check
     * @returns {boolean} Returns true if the error is an AbortError, false otherwise
     */
    static isAbortError(error: unknown): boolean;
}
export declare class EmptyResponseError extends Error {
    /**
     * Constructor to initialize the NotImplementedError with an optional message.
     * Default message is "This method is not implemented."
     * @param message - The error message (optional)
     */
    constructor(message?: string);
}
