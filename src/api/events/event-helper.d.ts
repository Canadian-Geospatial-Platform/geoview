/**
 * Exports an Event Helper class to help doing events management between classes.
 *
 * See examples across the code base for examples of how to implement this.
 */
export default class EventHelper {
    /**
     * Emits an event to all handlers.
     *
     * @param sender - The object emitting the event
     * @param handlersList - The list of handlers to be called with the event
     * @param event - The event to emit
     * @returns The array of values returned by each handler in execution order
     */
    static emitEvent<T, U, Z>(sender: T, handlersList: EventDelegateBase<T, U, Z>[], event: U): Z[];
    /**
     * Adds an event handler callback in the provided handlersList.
     *
     * @param handlersList - The list of handlers to be called with the event
     * @param callback - The callback to be executed whenever the event is raised
     * @returns The registered callback reference
     */
    static onEvent<T, U, Z>(handlersList: EventDelegateBase<T, U, Z>[], callback: EventDelegateBase<T, U, Z>): EventDelegateBase<T, U, Z>;
    /**
     * Removes an event handler callback from the provided handlersList.
     *
     * @param handlersList - The list of handlers on which to check to remove the handler
     * @param callback - The callback to stop being called whenever the event is emitted
     */
    static offEvent<T, U, Z>(handlersList: EventDelegateBase<T, U, Z>[], callback: EventDelegateBase<T, U, Z> | undefined): void;
    /**
     * Registers a one-shot event handler that automatically unsubscribes after the first invocation.
     *
     * When a filter is provided, the handler keeps listening until the filter returns true.
     *
     * @param handlersList - The list of handlers to register on
     * @param callback - The callback to execute once when the event fires (and passes the filter)
     * @param filter - Optional filter predicate. When provided, only events passing the filter trigger the callback
     * @returns The wrapper callback reference (can be used with offEvent to cancel before it fires)
     */
    static onceEvent<T, U, Z>(handlersList: EventDelegateBase<T, U, Z>[], callback: EventDelegateBase<T, U, Z>, filter?: (event: U) => boolean): EventDelegateBase<T, U, Z>;
    /**
     * Returns a promise that resolves the next time the event fires on the provided handlers list.
     *
     * Registers a one-shot handler internally and resolves with the event payload.
     * When a filter is provided, the handler keeps listening until the filter returns true.
     * If a timeout is provided and expires before the event fires, the handler is removed and the promise rejects.
     *
     * @param handlersList - The list of handlers to listen on
     * @param filter - Optional filter predicate. When provided, only events passing the filter resolve the promise
     * @param timeout - Optional maximum duration in milliseconds to wait before rejecting
     * @returns A promise that resolves with the event payload when the event fires (and passes the filter)
     * @throws {Error} When the timeout expires before a matching event fires
     */
    static onceEventPromise<T, U>(handlersList: EventDelegateBase<T, U, void>[], filter?: (event: U) => boolean, timeout?: number): Promise<U>;
    /**
     * Waits for a delegate-style event to fire, with optional synchronous fast-paths, an optional payload filter
     * and an optional concurrent error event that rejects the promise.
     *
     * Settle order:
     * 1. If `syncRejected` returns an Error, the promise rejects synchronously.
     * 2. Otherwise, if `syncResolved` returns a payload, the promise resolves synchronously with it.
     * 3. Otherwise, the success and (optional) error subscriptions are installed. The first event to fire settles
     *    the promise; both subscriptions are cleaned up regardless of which side won, so no handler ever leaks.
     *
     * A `filter` callback can be supplied for the success event: when it returns `false`, the event is ignored and
     * the waiter keeps listening. This is useful when the same delegate fires for unrelated subjects (e.g. a shared
     * emitter broadcasting per-layer events) or when only certain payload shapes count as a real resolution.
     *
     * The error event is fully optional. When `onError` is not provided, the waiter only ever resolves (it will
     * wait indefinitely for the success event).
     *
     * @param opts - The waiter configuration
     * @param opts.syncResolved - Optional. Returns a payload to resolve with synchronously, or `undefined` to skip
     * @param opts.syncRejected - Optional. Returns an `Error` to reject with synchronously, or `undefined` to skip
     * @param opts.on - Subscribes the supplied callback to the success event
     * @param opts.off - Unsubscribes the supplied callback from the success event
     * @param opts.filter - Optional payload filter. Return `true` to settle, `false` to keep waiting
     * @param opts.onError - Optional. Subscribes the supplied callback to the error event
     * @param opts.offError - Optional. Unsubscribes the supplied callback from the error event
     * @param opts.errorFactory - Optional. Builds the rejection error when the error event fires
     * @returns A promise that resolves with the success event payload
     * @throws {Error} When `syncRejected` returns an Error, or when the error event fires (rejected with `errorFactory()` or a generic error if none provided)
     */
    static waitForEvent<TSender, TEvent, TError>(opts: {
        syncResolved?: () => TEvent | undefined;
        syncRejected?: () => Error | undefined;
        on: (callback: EventDelegateBase<TSender, TEvent, void>) => void;
        off: (callback: EventDelegateBase<TSender, TEvent, void>) => void;
        filter?: (event: TEvent) => boolean;
        onError?: (callback: EventDelegateBase<TSender, TError, void>) => void;
        offError?: (callback: EventDelegateBase<TSender, TError, void>) => void;
        errorFactory?: (event: TError) => Error;
    }): Promise<TEvent>;
}
export type EventDelegateBase<T, U, Z> = (sender: T, event: U) => Z;
//# sourceMappingURL=event-helper.d.ts.map