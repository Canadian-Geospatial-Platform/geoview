/**
 * Base class for all controllers.
 *
 * Provides a minimal lifecycle via `hook()` and `unhook()` that subclasses
 * override through the `onHook()` and `onUnhook()` template methods to
 * attach and detach event subscriptions.
 */
export declare class AbstractController {
    /**
     * Activates the controller by calling the `onHook()` template method.
     *
     * Called by `ControllerRegistry.hookControllers()` during map initialization.
     */
    hook(): void;
    /**
     * Deactivates the controller by calling the `onUnhook()` template method.
     *
     * Called by `ControllerRegistry.unhookControllers()` during map cleanup.
     */
    unhook(): void;
    /**
     * Template method for subclasses to attach event subscriptions.
     *
     * Override this to subscribe to domain events, map events, or store changes.
     */
    protected onHook(): void;
    /**
     * Template method for subclasses to detach event subscriptions.
     *
     * Override this to unsubscribe from domain events, map events, or store
     * changes. Subscriptions should be removed in reverse order of attachment.
     */
    protected onUnhook(): void;
}
//# sourceMappingURL=abstract-controller.d.ts.map