/**
 * Implements an asynchronous semaphore.
 */
export declare class AsyncSemaphore {
    #private;
    /**
     * Constructs an AsyncSemaphore.
     *
     * @param workersCount - The number of workers
     * @throws {Error} When workersCount is not positive
     */
    constructor(workersCount: number);
    /**
     * Executes a function with a lock.
     *
     * @param f - The function to execute
     * @returns A promise that resolves to the result of the function
     */
    withLock<A>(f: () => Promise<A>): Promise<A>;
    /**
     * Executes a function with a lock but doesn't await its completion.
     *
     * @param f - The function to execute
     * @returns A promise that resolves when the function has been queued for execution
     */
    withLockRunAndForget<A>(f: () => Promise<A>): Promise<void>;
    /**
     * Waits for all tasks to terminate.
     *
     * @returns A promise that resolves when all tasks have terminated
     */
    awaitTerminate(): Promise<void>;
}
//# sourceMappingURL=async-semaphore.d.ts.map