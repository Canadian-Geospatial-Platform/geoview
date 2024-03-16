/**
 * Exports an Event Helper class to help doing events management between classes.
 * See examples across the code base for examples of how to implement this.
 */
export default class EventHelper {
  /**
   * Emits an event to all handlers.
   * @param {T} sender The object emitting the event
   * @param {EventDelegateBase<T, U>[]} handlersList The list of handlers to be called with the event
   * @param {U} event The event to emit
   */
  public static emitEvent = <T, U>(sender: T, handlersList: EventDelegateBase<T, U>[], event: U): void => {
    // Trigger all the handlers in the array
    handlersList.forEach((handler) => handler(sender, event));
  };

  /**
   * Wires an event handler.
   * @param {EventDelegateBase<T, U>[]} handlersList The list of handlers to be called with the event
   * @param {EventDelegateBase<T, U>} callback The callback to be executed whenever the event is raised
   */
  public static onEvent = <T, U>(handlersList: EventDelegateBase<T, U>[], callback: EventDelegateBase<T, U>): void => {
    // Push a new callback handler to the list of handlers
    handlersList.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param {EventDelegateBase<T, U>[]} handlersList The list of handlers on which to check to remove the handler
   * @param {EventDelegateBase<T, U>} callback The callback to stop being called whenever the event is emitted
   */
  public static offEvent = <T, U>(handlersList: EventDelegateBase<T, U>[], callback: EventDelegateBase<T, U>): void => {
    // Find the callback and remove it
    const index = handlersList.indexOf(callback);
    if (index !== -1) {
      handlersList.splice(index, 1);
    }
  };
}

export type EventDelegateBase<T, U> = (sender: T, event: U) => void;
