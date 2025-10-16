import { generateId } from '@/core/utils/utilities';
import type { EventDelegateBase } from '@/api/events/event-helper';
import EventHelper from '@/api/events/event-helper';

import type { TypeModalProps } from '@/ui/modal/modal';

/**
 * Class used to handle creating a new modal
 *
 * @exports
 * @class ModalApi
 */
export class ModalApi {
  modals: Record<string, TypeModalProps> = {};

  /** Keep all callback delegates references */
  #onModalOpenedHandlers: ModalOpenedDelegate[] = [];

  /** Keep all callback delegates references */
  #onModalClosedHandlers: ModalClosedDelegate[] = [];

  /**
   * Function that creates the modal
   *
   * @param { TypeModalProps } modal - The modal object of type TypeModalProps
   */
  createModal = (modal: TypeModalProps): string | undefined => {
    if (!modal.content) return undefined;
    const modalId = modal.modalId ? modal.modalId : generateId(18);

    // Make sure we handle the close
    if (!modal.close) {
      // eslint-disable-next-line no-param-reassign
      modal.close = () => {
        // Close it
        this.closeModal(modalId);
      };
    }

    // Keep it
    this.modals[modalId] = modal;

    // Return the id
    return modalId;
  };

  /**
   * Function that deletes the modal by the id specified
   *
   * @param { string } modalId - The id of the modal that is to be deleted
   */
  deleteModal = (modalId: string): void => {
    if (!Object.keys(this.modals)) return;
    delete this.modals[modalId];
  };
  /**
   * Function that open the modal by the id specified
   *
   * @param { string } modalId - The id of the modal that is to be deleted
   */

  openModal = (modalId: string): void => {
    this.modals[modalId].active = true;
    this.#emitModalOpened({ modalId });
  };

  /**
   * Function that close the modal by the id specified
   *
   * @param { string } modalId - The id of the modal that is to be deleted
   */
  closeModal = (modalId: string): void => {
    this.modals[modalId].active = false;
    this.#emitModalClosed({ modalId });
  };

  /**
   * Emits an event to all handlers.
   * @param {ModalEvent} event The event to emit
   * @private
   */
  #emitModalOpened(event: ModalEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onModalOpenedHandlers, event);
  }

  /**
   * Registers a modal opened event handler.
   * @param {ModalOpenedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onModalOpened(callback: ModalOpenedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onModalOpenedHandlers, callback);
  }

  /**
   * Unregisters a modal opened an event handler.
   * @param {ModalOpenedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offModalOpened(callback: ModalOpenedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onModalOpenedHandlers, callback);
  }

  /**
   * Emits an event to all handlers.
   * @param {ModalEvent} event The event to emit
   * @private
   */
  #emitModalClosed(event: ModalEvent): void {
    // Emit the event for all handlers
    EventHelper.emitEvent(this, this.#onModalClosedHandlers, event);
  }

  /**
   * Registers a modal closed event handler.
   * @param {ModalClosedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onModalClosed(callback: ModalClosedDelegate): void {
    // Register the event handler
    EventHelper.onEvent(this.#onModalClosedHandlers, callback);
  }

  /**
   * Unregisters a modal closed event handler.
   * @param {ModalClosedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offModalClosed(callback: ModalClosedDelegate): void {
    // Unregister the event handler
    EventHelper.offEvent(this.#onModalClosedHandlers, callback);
  }
}

/**
 * Event interface for ModalEvent
 */
export type ModalEvent = {
  modalId: string;
};

/**
 * Define a delegate for the event handler function signature
 */
type ModalOpenedDelegate = EventDelegateBase<ModalApi, ModalEvent, void>;

/**
 * Define a delegate for the event handler function signature
 */
type ModalClosedDelegate = EventDelegateBase<ModalApi, ModalEvent, void>;
