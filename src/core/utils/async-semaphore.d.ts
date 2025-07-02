/**
 * Implements an asynchronous semaphore.
 */
export declare class AsyncSemaphore {
    #private;
    /**
     * Constructs an AsyncSemaphore.
     * @param {number} workersCount - The number of workers.
     * @throws {Error} Thrown if workersCount is not positive.
     */
    constructor(workersCount: number);
    /**
     * Executes a function with a lock.
     * @param {Function} f - The function to execute.
     * @returns {Promise<A>} A promise resolving the result of the function.
     */
    withLock<A>(f: () => Promise<A>): Promise<A>;
    /**
     * Executes a function with a lock but doesn't await its completion.
     * @param {Function} f - The function to execute.
     * @returns {Promise<void>} A promise resolving when the function has been executed.
     */
    withLockRunAndForget<A>(f: () => Promise<A>): Promise<void>;
    /**
     * Waits for all tasks to terminate.
     * @returns {Promise<void>} A promise resolving when all tasks have terminated.
     */
    awaitTerminate(): Promise<void>;
}
//# sourceMappingURL=async-semaphore.d.ts.map