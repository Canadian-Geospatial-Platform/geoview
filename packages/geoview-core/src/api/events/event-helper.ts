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
   * @returns {Z[]} Array of results from all handlers
   * @static
   */
  static emitEvent<T, U, Z>(sender: T, handlersList: EventDelegateBase<T, U, Z>[], event: U): Z[] {
    // Trigger all the handlers in the array
    return handlersList.map((handler) => handler(sender, event));
  }

  /**
   * Adds an event handler callback in the provided handlersList.
   * @param {EventDelegateBase<T, U, Z>[]} handlersList - The list of handlers to be called with the event
   * @param {EventDelegateBase<T, U, Z>} callback - The callback to be executed whenever the event is raised
   * @returns {void}
   * @static
   */
  static onEvent<T, U, Z>(handlersList: EventDelegateBase<T, U, Z>[], callback: EventDelegateBase<T, U, Z>): void {
    // Push a new callback handler to the list of handlers
    handlersList.push(callback);
  }

  /**
   * Removes an event handler callback from the provided handlersList.
   * @param {EventDelegateBase<T, U, Z>[]} handlersList - The list of handlers on which to check to remove the handler
   * @param {EventDelegateBase<T, U, Z>} callback - The callback to stop being called whenever the event is emitted
   * @returns {void}
   * @static
   */
  static offEvent<T, U, Z>(handlersList: EventDelegateBase<T, U, Z>[], callback: EventDelegateBase<T, U, Z>): void {
    // Find the callback and remove it
    const index = handlersList.indexOf(callback);
    if (index !== -1) {
      handlersList.splice(index, 1);
    }
  }
}

export type EventDelegateBase<T, U, Z> = (sender: T, event: U) => Z;
