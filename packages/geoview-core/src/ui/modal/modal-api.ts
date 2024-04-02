import { generateId } from '@/core/utils/utilities';
import EventHelper, { EventDelegateBase } from '@/api/events/event-helper';

import { TypeModalProps } from './modal';

/**
 * Class used to handle creating a new modal
 *
 * @exports
 * @class ModalApi
 */
export class ModalApi {
  mapId: string;

  modals: Record<string, TypeModalProps> = {};

  // Keep all callback delegates references
  #onModalOpenedHandlers: ModalOpenedDelegate[] = [];

  // Keep all callback delegates references
  #onModalClosedHandlers: ModalClosedDelegate[] = [];

  /**
   * constructor to initiate the map id
   *
   * @param { string } mapId the id of the map where the modal is to be generated
   */
  constructor(mapId: string) {
    this.mapId = mapId;
  }

  /**
   * Function that creates the modal
   *
   * @param { TypeModalProps } modal the modal object of type TypeModalProps
   */
  createModal = (modal: TypeModalProps): string | undefined => {
    if (!modal.content) return undefined;
    const modalId = modal.modalId ? modal.modalId : generateId('');

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
   * @param { string } id of the modal that is to be deleted
   */
  deleteModal = (modalId: string): void => {
    if (!Object.keys(this.modals)) return;
    delete this.modals[modalId];
  };

  openModal = (modalId: string): void => {
    this.modals[modalId].active = true;
    this.#emitModalOpened({ modalId });
  };

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
   * Wires an event handler.
   * @param {ModalOpenedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onModalOpened(callback: ModalOpenedDelegate): void {
    // Wire the event handler
    EventHelper.onEvent(this.#onModalOpenedHandlers, callback);
  }

  /**
   * Unwires an event handler.
   * @param {ModalOpenedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offModalOpened(callback: ModalOpenedDelegate): void {
    // Unwire the event handler
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
   * Wires an event handler.
   * @param {ModalClosedDelegate} callback The callback to be executed whenever the event is emitted
   */
  onModalClosed(callback: ModalClosedDelegate): void {
    // Wire the event handler
    EventHelper.onEvent(this.#onModalClosedHandlers, callback);
  }

  /**
   * Unwires an event handler.
   * @param {ModalClosedDelegate} callback The callback to stop being called whenever the event is emitted
   */
  offModalClosed(callback: ModalClosedDelegate): void {
    // Unwire the event handler
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
type ModalOpenedDelegate = EventDelegateBase<ModalApi, ModalEvent>;

/**
 * Define a delegate for the event handler function signature
 */
type ModalClosedDelegate = EventDelegateBase<ModalApi, ModalEvent>;
