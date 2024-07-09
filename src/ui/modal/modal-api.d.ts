import { EventDelegateBase } from '@/api/events/event-helper';
import { TypeModalProps } from './modal';
/**
 * Class used to handle creating a new modal
 *
 * @exports
 * @class ModalApi
 */
export declare class ModalApi {
    #private;
    modals: Record<string, TypeModalProps>;
    /**
     * Function that creates the modal
     *
     * @param { TypeModalProps } modal the modal object of type TypeModalProps
     */
    createModal: (modal: TypeModalProps) => string | undefined;
    /**
     * Function that deletes the modal by the id specified
     *
     * @param { string } id of the modal that is to be deleted
     */
    deleteModal: (modalId: string) => void;
    openModal: (modalId: string) => void;
    closeModal: (modalId: string) => void;
    /**
     * Registers a modal opened event handler.
     * @param {ModalOpenedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onModalOpened(callback: ModalOpenedDelegate): void;
    /**
     * Unregisters a modal opened an event handler.
     * @param {ModalOpenedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offModalOpened(callback: ModalOpenedDelegate): void;
    /**
     * Registers a modal closed event handler.
     * @param {ModalClosedDelegate} callback The callback to be executed whenever the event is emitted
     */
    onModalClosed(callback: ModalClosedDelegate): void;
    /**
     * Unregisters a modal closed event handler.
     * @param {ModalClosedDelegate} callback The callback to stop being called whenever the event is emitted
     */
    offModalClosed(callback: ModalClosedDelegate): void;
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
export {};
