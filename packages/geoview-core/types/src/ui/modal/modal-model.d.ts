import { modalHeader, modalFooter, TypeModalProps, ModalActionsType } from './modal-api';
/**
 * Class used to create a template (model) of a modal
 *
 * @class ModalModel
 */
export declare class ModalModel {
    id?: string;
    header?: modalHeader;
    content: string;
    footer?: modalFooter;
    active?: boolean;
    mapId?: string;
    width?: string | number;
    height?: string | number;
    /**
     * constructor to initiate the modal properties
     *
     * @param { string } content is the body copy (description) of the modal
     */
    constructor(content: string);
    /**
     * Trigger an event to open the modal
     */
    open: () => void;
    /**
     * Trigger an event to close the modal
     */
    close: () => void;
    /**
     * Function to update the content of currently existing modal. Only the
     * passed properties will replace the old ones
     *
     * @param { TypeModalProps } modal must be an object with the above defined (TypeModalProps) properties
     */
    update: (modal: TypeModalProps) => void;
    /**
     * Function to add more actions to header e.g. close button, back button etc.
     *
     * @param { ModalActionsType } action must be an object with id and content
     */
    addHeaderActions: (action: ModalActionsType) => void;
    /**
     * Function to add more actions to footer
     *
     * @param { ModalActionsType } action must be an object with id and content
     */
    addFooterActions: (action: ModalActionsType) => void;
    /**
     * Function to remove actions from header
     *
     * @param { string } id of the action to be deleted
     */
    removeHeaderActions: (id: string) => void;
    /**
     * Function to remove actions from footer
     *
     * @param { string } id of the action to be deleted
     */
    removeFooterActions: (id: string) => void;
    /**
     * to update the modal as soon as a change is made to any content
     */
    reRender: () => void;
}
