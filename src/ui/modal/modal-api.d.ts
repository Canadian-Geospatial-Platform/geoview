import type { EventDelegateBase } from '@/api/events/event-helper';
import type { TypeModalProps } from '@/ui/modal/modal';
/**
 * Manages modal instances, handles registration, state changes, and event emissions.
 *
 * Provides APIs to create, open, close, and delete modals. Emits events when modals
 * are opened or closed, allowing listeners to react to modal state changes.
 */
export declare class ModalApi {
    #private;
    modals: Record<string, TypeModalProps>;
    /**
     * Creates a new modal instance with a unique ID and registers it for management.
     *
     * Generates a unique modal ID if not provided and automatically wraps the close
     * handler to ensure proper cleanup. Returns the modal ID for later reference when
     * opening or closing the modal.
     *
     * @param modal - Modal configuration (see TypeModalProps interface)
     * @returns Unique modal ID, or undefined if modal has no content
     */
    createModal: (modal: TypeModalProps) => string | undefined;
    /**
     * Deletes a modal instance by ID and removes it from the registry.
     *
     * Unregisters the modal from management and cleans up references. Should be called
     * when the modal is no longer needed to free resources.
     *
     * @param modalId - ID of the modal to delete
     */
    deleteModal: (modalId: string) => void;
    /**
     * Opens a modal instance by ID, setting it to active and emitting the opened event.
     *
     * Sets the modal active state to true and triggers onModalOpened listeners.
     * Modal must be created and registered before opening.
     *
     * @param modalId - ID of the modal to open
     */
    openModal: (modalId: string) => void;
    /**
     * Closes a modal instance by ID, setting it to inactive and emitting the closed event.
     *
     * Sets the modal active state to false and triggers onModalClosed listeners.
     * The modal remains registered and can be reopened.
     *
     * @param modalId - ID of the modal to close
     */
    closeModal: (modalId: string) => void;
    /**
     * Registers a handler to be called when a modal is opened.
     *
     * @param callback - Function to execute when modal opened event is triggered
     */
    onModalOpened(callback: ModalOpenedDelegate): void;
    /**
     * Unregisters a handler from modal opened events.
     *
     * @param callback - Previously registered callback to remove
     */
    offModalOpened(callback: ModalOpenedDelegate): void;
    /**
     * Registers a handler to be called when a modal is closed.
     *
     * @param callback - Function to execute when modal closed event is triggered
     */
    onModalClosed(callback: ModalClosedDelegate): void;
    /**
     * Unregisters a handler from modal closed events.
     *
     * @param callback - Previously registered callback to remove
     */
    offModalClosed(callback: ModalClosedDelegate): void;
}
/**
 * Event emitted when a modal's state changes (opened or closed).
 */
export type ModalEvent = {
    modalId: string;
};
/**
 * Handler callback type for modal opened events.
 */
type ModalOpenedDelegate = EventDelegateBase<ModalApi, ModalEvent, void>;
/**
 * Handler callback type for modal closed events.
 */
type ModalClosedDelegate = EventDelegateBase<ModalApi, ModalEvent, void>;
export {};
//# sourceMappingURL=modal-api.d.ts.map