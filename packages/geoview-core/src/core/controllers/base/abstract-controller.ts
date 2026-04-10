/**
 * Base class for all controllers.
 *
 * Provides a minimal lifecycle via `hook()` and `unhook()` that subclasses
 * override through the `onHook()` and `onUnhook()` template methods to
 * attach and detach event subscriptions.
 */
export class AbstractController {
  //#region PUBLIC METHODS

  /**
   * Activates the controller by calling the `onHook()` template method.
   *
   * Called by `ControllerRegistry.hookControllers()` during map initialization.
   */
  hook(): void {
    this.onHook();
  }

  /**
   * Deactivates the controller by calling the `onUnhook()` template method.
   *
   * Called by `ControllerRegistry.unhookControllers()` during map cleanup.
   */
  unhook(): void {
    this.onUnhook();
  }

  //#endregion PUBLIC METHODS

  //#region PROTECTED METHODS

  /**
   * Template method for subclasses to attach event subscriptions.
   *
   * Override this to subscribe to domain events, map events, or store changes.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onHook(): void {
    // To be implemented by subclasses
  }

  /**
   * Template method for subclasses to detach event subscriptions.
   *
   * Override this to unsubscribe from domain events, map events, or store
   * changes. Subscriptions should be removed in reverse order of attachment.
   */
  // eslint-disable-next-line @typescript-eslint/class-methods-use-this
  protected onUnhook(): void {
    // To be implemented by subclasses
  }

  //#endregion PROTECTED METHODS
}
