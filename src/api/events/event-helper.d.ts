/**
 * Exports an Event Helper class to help doing events management between classes.
 * See examples across the code base for examples of how to implement this.
 */
export default class EventHelper {
    /**
     * Emits an event to all handlers.
     * @param {T} sender - The object emitting the event
     * @param {EventDelegateBase<T, U, Z>[]} handlersList - The list of handlers to be called with the event
     * @param {U} event - The event to emit
     */
    static emitEvent<T, U, Z>(sender: T, handlersList: EventDelegateBase<T, U, Z>[], event: U): Z[];
    /**
     * Adds an event handler callback in the provided handlersList.
     * @param {EventDelegateBase<T, U, Z>[]} handlersList - The list of handlers to be called with the event
     * @param {EventDelegateBase<T, U, Z>} callback - The callback to be executed whenever the event is raised
     */
    static onEvent<T, U, Z>(handlersList: EventDelegateBase<T, U, Z>[], callback: EventDelegateBase<T, U, Z>): void;
    /**
     * Removes an event handler callback from the provided handlersList.
     * @param {EventDelegateBase<T, U, Z>[]} handlersList - The list of handlers on which to check to remove the handler
     * @param {EventDelegateBase<T, U, Z>} callback - The callback to stop being called whenever the event is emitted
     */
    static offEvent<T, U, Z>(handlersList: EventDelegateBase<T, U, Z>[], callback: EventDelegateBase<T, U, Z>): void;
}
export type EventDelegateBase<T, U, Z> = (sender: T, event: U) => Z;
//# sourceMappingURL=event-helper.d.ts.map