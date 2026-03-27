/**
 * Implements an asynchronous semaphore.
 */
export class AsyncSemaphore {
  /** Number of available resources. */
  #available: number;

  /** Total number of workers. */
  #workersCount: number;

  /** Queue of upcoming tasks. */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  #upcoming: Function[];

  /** Queue of tasks currently executing. */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  #heads: Function[];

  /** Completion callback function. */
  #completeFn!: () => void;

  /** Promise to await for termination. */
  #completePr!: Promise<void>;

  /**
   * Constructs an AsyncSemaphore.
   *
   * @param workersCount - The number of workers
   * @throws {Error} When workersCount is not positive
   */
  constructor(workersCount: number) {
    if (workersCount <= 0) throw new Error('workersCount must be positive');
    this.#workersCount = workersCount;
    this.#available = workersCount;
    this.#upcoming = [];
    this.#heads = [];
    this.#refreshComplete();
  }

  /**
   * Executes a function with a lock.
   *
   * @param f - The function to execute
   * @returns A promise that resolves to the result of the function
   */
  async withLock<A>(f: () => Promise<A>): Promise<A> {
    await this.#acquire();
    return this.#execWithRelease(f);
  }

  /**
   * Executes a function with a lock but doesn't await its completion.
   *
   * @param f - The function to execute
   * @returns A promise that resolves when the function has been queued for execution
   */
  async withLockRunAndForget<A>(f: () => Promise<A>): Promise<void> {
    await this.#acquire();
    // Ignoring returned promise intentionally!
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    this.#execWithRelease(f);
  }

  /**
   * Waits for all tasks to terminate.
   *
   * @returns A promise that resolves when all tasks have terminated
   */
  awaitTerminate(): Promise<void> {
    if (this.#available < this.#workersCount) {
      return this.#completePr;
    }
    return Promise.resolve();
  }

  /**
   * Executes a function and releases the lock afterward.
   *
   * @param f - The function to execute
   * @returns A promise that resolves to the result of the function
   */
  async #execWithRelease<A>(f: () => Promise<A>): Promise<A> {
    try {
      return await f();
    } finally {
      this.#release();
    }
  }

  /**
   * Retrieves the upcoming queue.
   *
   * @returns The upcoming queue
   */
  // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
  #queue(): Function[] {
    if (!this.#heads.length) {
      this.#heads = this.#upcoming.reverse();
      this.#upcoming = [];
    }
    return this.#heads;
  }

  /**
   * Acquires a lock.
   *
   * @returns A promise that resolves when a lock is available, or undefined if immediately acquired
   */
  #acquire(): void | Promise<void> {
    if (this.#available > 0) {
      this.#available -= 1;
      return undefined;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-function-type
    let fn: Function = () => {
      /***/
    };
    const p = new Promise<void>((ref) => {
      fn = ref;
    });
    this.#upcoming.push(fn);
    return p;
  }

  /**
   * Releases a lock.
   */
  #release(): void {
    const queue = this.#queue();
    if (queue.length) {
      const fn = queue.pop();
      if (fn) fn();
    } else {
      this.#available += 1;

      if (this.#available >= this.#workersCount) {
        const fn = this.#completeFn;
        this.#refreshComplete();
        fn();
      }
    }
  }

  /**
   * Refreshes the completion function and promise.
   */
  #refreshComplete(): void {
    let fn: () => void = () => {
      /***/
    };
    this.#completePr = new Promise<void>((r) => {
      fn = r;
    });
    this.#completeFn = fn;
  }
}
