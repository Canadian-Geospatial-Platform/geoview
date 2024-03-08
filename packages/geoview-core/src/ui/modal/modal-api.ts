import { generateId } from '@/core/utils/utilities';

import { TypeModalProps } from './modal';

/**
 * Event interface for ModalEvent
 */
interface ModalEvent {
  modalId: string;
}

/**
 * Define a delegate for the event handler function signature
 */
type ModalOpenedDelegate = (sender: ModalApi, event: ModalEvent) => void;

/**
 * Define a delegate for the event handler function signature
 */
type ModalClosedDelegate = (sender: ModalApi, event: ModalEvent) => void;

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
  private onModalOpenedHandlers: ModalOpenedDelegate[] = [];

  // Keep all callback delegates references
  private onModalClosedHandlers: ModalClosedDelegate[] = [];

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
  createModal = (modal: TypeModalProps): void => {
    if (!modal.content) return;
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
    this.emitModalOpenedEvent(modalId);
  };

  closeModal = (modalId: string): void => {
    this.modals[modalId].active = false;
    this.emitModalClosedEvent(modalId);
  };

  /**
   * Wires an event handler.
   * @param callback The callback to be executed whenever the event is raised
   */
  onModalOpened = (callback: ModalOpenedDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onModalOpenedHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param callback The callback to stop being called whenever the event is raised
   */
  offModalOpened = (callback: ModalOpenedDelegate): void => {
    const index = this.onModalOpenedHandlers.indexOf(callback);
    if (index !== -1) {
      this.onModalOpenedHandlers.splice(index, 1);
    }
  };

  /**
   * Emits an event to all handlers.
   * @param {string} modalId The modal id being opened
   */
  private emitModalOpenedEvent = (modalId: string) => {
    // Trigger all the handlers in the array
    this.onModalOpenedHandlers.forEach((handler) => handler(this, { modalId }));
  };

  /**
   * Wires an event handler.
   * @param callback The callback to be executed whenever the event is raised
   */
  onModalClosed = (callback: ModalClosedDelegate): void => {
    // Push a new callback handler to the list of handlers
    this.onModalClosedHandlers.push(callback);
  };

  /**
   * Unwires an event handler.
   * @param callback The callback to stop being called whenever the event is raised
   */
  offModalClosed = (callback: ModalClosedDelegate): void => {
    const index = this.onModalClosedHandlers.indexOf(callback);
    if (index !== -1) {
      this.onModalClosedHandlers.splice(index, 1);
    }
  };

  /**
   * Emits an event to all handlers.
   * @param {string} modalId The modal id being closed
   */
  private emitModalClosedEvent = (modalId: string) => {
    // Trigger all the handlers in the array
    this.onModalClosedHandlers.forEach((handler) => handler(this, { modalId }));
  };
}
